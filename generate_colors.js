const fs = require('fs');
const { Hct, SchemeTonalSpot, argbFromHex, hexFromArgb, TonalPalette } = require('@material/material-color-utilities');

const CONFIG_PATH = './config.json';
const OUTPUT_CSS_PATH = './colors.css';

// MD3 Token mapping
const TOKENS = {
    'primary': (scheme) => scheme.primary,
    'on-primary': (scheme) => scheme.onPrimary,
    'primary-container': (scheme) => scheme.primaryContainer,
    'on-primary-container': (scheme) => scheme.onPrimaryContainer,
    'secondary': (scheme) => scheme.secondary,
    'on-secondary': (scheme) => scheme.onSecondary,
    'secondary-container': (scheme) => scheme.secondaryContainer,
    'on-secondary-container': (scheme) => scheme.onSecondaryContainer,
    'tertiary': (scheme) => scheme.tertiary,
    'on-tertiary': (scheme) => scheme.onTertiary,
    'tertiary-container': (scheme) => scheme.tertiaryContainer,
    'on-tertiary-container': (scheme) => scheme.onTertiaryContainer,
    'error': (scheme) => scheme.error,
    'on-error': (scheme) => scheme.onError,
    'error-container': (scheme) => scheme.errorContainer,
    'on-error-container': (scheme) => scheme.onErrorContainer,
    'background': (scheme) => scheme.background,
    'on-background': (scheme) => scheme.onBackground,
    'surface': (scheme) => scheme.surface,
    'on-surface': (scheme) => scheme.onSurface,
    'surface-variant': (scheme) => scheme.surfaceVariant,
    'on-surface-variant': (scheme) => scheme.onSurfaceVariant,
    'outline': (scheme) => scheme.outline,
    'outline-variant': (scheme) => scheme.outlineVariant,
    'shadow': (scheme) => scheme.shadow,
    'scrim': (scheme) => scheme.scrim,
    'inverse-surface': (scheme) => scheme.inverseSurface,
    'inverse-on-surface': (scheme) => scheme.inverseOnSurface,
    'inverse-primary': (scheme) => scheme.inversePrimary,
    'surface-dim': (scheme) => scheme.surfaceDim,
    'surface-bright': (scheme) => scheme.surfaceBright,
    'surface-container-lowest': (scheme) => scheme.surfaceContainerLowest,
    'surface-container-low': (scheme) => scheme.surfaceContainerLow,
    'surface-container': (scheme) => scheme.surfaceContainer,
    'surface-container-high': (scheme) => scheme.surfaceContainerHigh,
    'surface-container-highest': (scheme) => scheme.surfaceContainerHighest,
};

function generateColors() {
    try {
        if (!fs.existsSync(CONFIG_PATH)) {
            console.error('Config file not found!');
            process.exit(1);
        }

        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        const accentColor = config.app?.accentColor || '#007aff';
        const isDark = config.app?.theme === 'dark';

        console.log(`Generating theme for accent: ${accentColor}, mode: ${isDark ? 'dark' : 'light'}`);

        const argb = argbFromHex(accentColor);
        const sourceColorHct = Hct.fromInt(argb);
        const scheme = new SchemeTonalSpot(sourceColorHct, isDark, 0.0);

        let cssContent = ':root {\n';

        // 1. Generate MD3 System Tokens
        Object.entries(TOKENS).forEach(([name, getter]) => {
            const colorInt = getter(scheme);
            const hex = hexFromArgb(colorInt);
            cssContent += `    --md-sys-color-${name}: ${hex};\n`;
        });

        // 2. Map generic tokens to MD3 tokens for backward compatibility/simplicity
        // We use the generated variables for these mappings
        cssContent += '\n    /* Semantic Mappings */\n';
        cssContent += `    --color-bg: var(--md-sys-color-surface);\n`; /* MD3 Surface */
        cssContent += `    --color-surface: var(--md-sys-color-surface-container-lowest);\n`; /* White cards */
        cssContent += `    --color-primary: var(--md-sys-color-on-surface);\n`; // Text primary
        cssContent += `    --color-secondary: var(--md-sys-color-on-surface-variant);\n`; // Text secondary
        cssContent += `    --color-tertiary: var(--md-sys-color-outline);\n`;
        cssContent += `    --color-accent: var(--md-sys-color-primary);\n`;
        cssContent += `    --color-border: var(--md-sys-color-outline-variant);\n`;
        cssContent += `    --color-separator: var(--md-sys-color-surface-variant);\n`;
        cssContent += `    --color-active-bg: var(--md-sys-color-secondary-container);\n`;

        // Static colors that don't change with theme usually, or we can map them too if needed
        // For now preventing them from breaking if configured elsewhere
        cssContent += `    --color-success: #34c759;\n`; // Could map to custom green scheme if needed
        cssContent += `    --color-error: var(--md-sys-color-error);\n`;
        cssContent += `    --color-error-bg: var(--md-sys-color-error-container);\n`;

        // Diet colors (static for now)
        cssContent += `    --color-vegetarian: #4caf50;\n`;
        cssContent += `    --color-vegetarian-bg: #e8f5e9;\n`;
        cssContent += `    --color-vegan: #2e7d32;\n`;
        cssContent += `    --color-vegan-bg: #c8e6c9;\n`;

        cssContent += '}\n';

        fs.writeFileSync(OUTPUT_CSS_PATH, cssContent);
        console.log(`Successfully generated ${OUTPUT_CSS_PATH}`);

    } catch (e) {
        console.error('Error generating colors:', e);
        process.exit(1);
    }
}

generateColors();
