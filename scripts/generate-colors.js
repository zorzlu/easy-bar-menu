const fs = require('fs');
const path = require('path');
const { Hct, SchemeContent, SchemeTonalSpot, argbFromHex, hexFromArgb, TonalPalette } = require('@material/material-color-utilities');

const ROOT_DIR = path.join(__dirname, '..');
const CONFIG_PATH = path.join(ROOT_DIR, 'config/config.json');
const OUTPUT_CSS_PATH = path.join(ROOT_DIR, 'assets/css/colors.css');

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
        const accentColor = config.settings?.theme?.accentColor || '#007aff';
        const isDark = config.settings?.theme?.mode === 'dark';

        console.log(`Generating theme for accent: ${accentColor}, mode: ${isDark ? 'dark' : 'light'}`);

        const argb = argbFromHex(accentColor);
        const sourceColorHct = Hct.fromInt(argb);
        const scheme = new SchemeContent(sourceColorHct, isDark, 0.0);

        let cssContent = ':root {\n';

        // 1. Generate MD3 System Tokens
        Object.entries(TOKENS).forEach(([name, getter]) => {
            const colorInt = getter(scheme);
            const hex = hexFromArgb(colorInt);
            cssContent += `    --md-sys-color-${name}: ${hex};\n`;
        });

        // 2. Map domain-specific tokens to MD3 tokens
        cssContent += '\n    /* ==============================================\n';
        cssContent += '       Semantic Application Mappings\n';
        cssContent += '       ============================================== */\n\n';

        cssContent += '    /* Typography */\n';
        cssContent += `    --color-text-main: var(--md-sys-color-on-surface);\n`;
        cssContent += `    --color-text-dim: var(--md-sys-color-on-surface-variant);\n`;
        cssContent += `    --color-text-muted: var(--md-sys-color-tertiary);\n`;
        cssContent += `    --color-text-brand: var(--md-sys-color-primary);\n`;
        cssContent += `    --color-text-inverse: var(--md-sys-color-on-primary-container);\n`;
        cssContent += `    --color-text-on-info: var(--md-sys-color-tertiary);\n`;
        cssContent += `    --color-text-accent-alt: var(--md-sys-color-tertiary);\n`;

        cssContent += '\n    /* Backgrounds: App & Structure */\n';
        cssContent += `    --color-bg-body: var(--md-sys-color-surface-container);\n`;
        cssContent += `    --color-bg-header: var(--md-sys-color-surface-container);\n`;
        cssContent += `    --color-bg-app-sheet: var(--md-sys-color-surface);\n`;

        cssContent += '\n    /* Backgrounds: Surfaces & Components */\n';
        cssContent += `    --color-bg-card: var(--md-sys-color-surface-container-lowest);\n`;
        cssContent += `    --color-bg-surface-subtle: var(--md-sys-color-surface-container-low);\n`;
        cssContent += `    --color-bg-surface-hover: var(--md-sys-color-surface-container-highest);\n`;
        cssContent += `    --color-bg-segment: var(--md-sys-color-surface-container-high);\n`;

        cssContent += '\n    /* Chrome & Features */\n';
        cssContent += `    --color-bg-nav: var(--md-sys-color-primary-container);\n`;
        cssContent += `    --color-bg-scrim: var(--md-sys-color-surface-container);\n`;

        cssContent += '\n    /* Chips & Feedback */\n';
        cssContent += `    --color-bg-chip: var(--md-sys-color-surface-variant);\n`;
        cssContent += `    --color-text-on-chip: var(--md-sys-color-on-surface-variant);\n`;
        cssContent += `    --color-extra-text-on-product-card: var(--md-sys-color-tertiary);\n`;
        cssContent += `    --color-bg-chip-info: var(--md-sys-color-tertiary-container);\n`;

        cssContent += '\n    /* Interactive & States */\n';
        cssContent += `    --color-bg-cta-primary: var(--md-sys-color-primary);\n`;
        cssContent += `    --color-text-cta-primary: var(--md-sys-color-on-primary);\n`;
        cssContent += `    --color-nav-item-active-bg: var(--md-sys-color-on-primary-container);\n`;
        cssContent += `    --color-nav-item-active-fg: var(--md-sys-color-primary-container);\n`;
        cssContent += `    --color-nav-text: var(--md-sys-color-on-primary-container);\n`;

        cssContent += '\n    /* Decorative */\n';
        cssContent += `    --color-gradient-start: var(--md-sys-color-secondary-container);\n`;
        cssContent += `    --color-gradient-end: var(--md-sys-color-primary-container);\n`;

        cssContent += '\n    /* Borders & Dividers */\n';
        cssContent += `    --color-border-subtle: var(--md-sys-color-outline-variant);\n`;
        cssContent += `    --color-border-strong: var(--md-sys-color-outline);\n`;
        cssContent += `    --color-divider: var(--md-sys-color-surface-variant);\n`;

        cssContent += '\n    /* Status & Domain */\n';
        cssContent += `    --color-status-success: #34c759;\n`;
        cssContent += `    --color-status-error: var(--md-sys-color-error);\n`;
        cssContent += `    --color-bg-error: var(--md-sys-color-error-container);\n`;

        cssContent += `    --color-veg-text: var(--md-sys-color-on-secondary-container);\n`;
        cssContent += `    --color-veg-bg: var(--md-sys-color-secondary-container);\n`;
        cssContent += `    --color-veg-vegan-text: var(--md-sys-color-on-tertiary-container);\n`;
        cssContent += `    --color-veg-vegan-bg: var(--md-sys-color-tertiary-container);\n`;

        cssContent += '\n    /* Shadows */\n';
        cssContent += `    --color-shadow: var(--md-sys-color-shadow);\n`;
        cssContent += `    --color-scrim: var(--md-sys-color-scrim);\n`;

        cssContent += '}\n';

        fs.writeFileSync(OUTPUT_CSS_PATH, cssContent);
        console.log(`Successfully generated ${OUTPUT_CSS_PATH}`);

    } catch (e) {
        console.error('Error generating colors:', e);
        process.exit(1);
    }
}

generateColors();
