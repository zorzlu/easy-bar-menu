/**
 * Build script for generating index.html with dynamic SEO tags.
 * 
 * Usage: node build-index.js
 * 
 * Reads configuration from config/config.json and generates hreflang tags
 * dynamically based on supported languages.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const CONFIG_PATH = path.join(ROOT_DIR, 'config/config.json');
const INDEX_PATH = path.join(ROOT_DIR, 'index.html');
const COLORS_CSS_PATH = path.join(ROOT_DIR, 'assets/css/colors.css');

/**
 * Parse CSS file and extract all CSS variables
 */
function parseCSSVariables(cssContent) {
    const variables = {};
    const regex = /--([\w-]+):\s*([^;]+);/g;
    let match;

    while ((match = regex.exec(cssContent)) !== null) {
        const varName = match[1];
        const varValue = match[2].trim();
        variables[varName] = varValue;
    }

    return variables;
}

/**
 * Resolve a CSS variable to its final value (recursive)
 */
function resolveCSSVariable(varName, variables, depth = 0) {
    if (depth > 10) {
        console.warn(`Warning: Maximum recursion depth reached for variable: ${varName}`);
        return null;
    }

    const value = variables[varName];
    if (!value) {
        console.warn(`Warning: Variable --${varName} not found`);
        return null;
    }

    // If value is a var() reference, resolve it
    const varMatch = value.match(/var\(--([^)]+)\)/);
    if (varMatch) {
        const referencedVar = varMatch[1];
        return resolveCSSVariable(referencedVar, variables, depth + 1);
    }

    // Otherwise, return the value as-is
    return value;
}

/**
 * Get theme color from colors.css
 */
function getThemeColorFromCSS() {
    try {
        const cssContent = fs.readFileSync(COLORS_CSS_PATH, 'utf8');
        const variables = parseCSSVariables(cssContent);
        const themeColor = resolveCSSVariable('color-bg-header', variables);

        if (!themeColor) {
            console.warn('Warning: Could not resolve --color-bg-header, using fallback #1c100f');
            return '#1c100f';
        }

        return themeColor;
    } catch (err) {
        console.warn('Warning: Could not read colors.css, using fallback #1c100f');
        return '#1c100f';
    }
}

function build() {
    try {
        // Read config
        if (!fs.existsSync(CONFIG_PATH)) {
            console.error('Config file not found!');
            process.exit(1);
        }

        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        const baseUrl = config.settings?.baseUrl || 'https://example.com';
        const defaultLanguage = config.settings?.languages?.default || 'it';
        const supportedLanguages = config.settings?.languages?.supported || ['en', 'it'];
        const defaultTab = config.settings?.ui?.defaultTab || 'kitchen';

        console.log(`Generating index.html hreflang tags...`);
        console.log(`Base URL: ${baseUrl}`);
        console.log(`Default language: ${defaultLanguage}`);
        console.log(`Supported languages: ${supportedLanguages.join(', ')}`);
        console.log(`Default tab: ${defaultTab}\n`);

        // Read current index.html
        let html = fs.readFileSync(INDEX_PATH, 'utf8');

        // --- Branding Injection ---
        const barName = config.branding?.barName || 'Bar Menu';
        const navbarLogo = config.branding?.navbarLogo;
        const heroLogo = config.branding?.heroLogo;

        // Inject Bar Name
        if (barName) {
            html = html.replace(/(<h1 class="bar-name" id="storeName">)(.*?)(<\/h1>)/, `$1${barName}$3`);
        }

        // Inject Navbar Logo
        if (navbarLogo) {
            // Replace src and remove hidden attribute if present
            html = html.replace(
                /(<img id="navbarLogo" class="store-logo" alt=")(.*?)(" aria-hidden="true")( hidden)?(>)/,
                `<img id="navbarLogo" class="store-logo" src="${navbarLogo}" alt="${barName}" aria-hidden="true">`
            );
        }

        // Inject Hero Logo
        if (heroLogo) {
            html = html.replace(
                /(<img id="heroLogo" class="hero-logo-big" src=")(.*?)(" alt=")(.*?)(">)/,
                `<img id="heroLogo" class="hero-logo-big" src="${heroLogo}" alt="${barName}">`
            );
        }
        console.log(`✓ Updated: Static Identity (Name: ${barName})`);

        // Update theme-color meta tag from colors.css
        const themeColor = getThemeColorFromCSS();
        html = html.replace(
            /<meta name="theme-color" content="[^"]*">/,
            `<meta name="theme-color" content="${themeColor}">`
        );
        console.log(`✓ Updated: Theme color to ${themeColor} (from --color-bg-header)`);


        // Update Navbar: Order and Active State
        const navRegex = /(<nav class="bottom-nav">)([\s\S]*?)(<\/nav>)/;
        const navMatch = html.match(navRegex);

        if (navMatch) {
            const navContent = navMatch[2];
            const kitchenRegex = /<button[^>]*data-target="kitchen"[\s\S]*?<\/button>/;
            const barRegex = /<button[^>]*data-target="bar"[\s\S]*?<\/button>/;

            const kitchenMatch = navContent.match(kitchenRegex);
            const barMatch = navContent.match(barRegex);

            if (kitchenMatch && barMatch) {
                let kitchenBtn = kitchenMatch[0];
                let barBtn = barMatch[0];

                // Reset Active States
                kitchenBtn = kitchenBtn.replace(/class="nav-item(\s+active)?"/, 'class="nav-item"');
                barBtn = barBtn.replace(/class="nav-item(\s+active)?"/, 'class="nav-item"');

                // Set Active State
                if (defaultTab === 'kitchen') {
                    kitchenBtn = kitchenBtn.replace('class="nav-item"', 'class="nav-item active"');
                } else if (defaultTab === 'bar') {
                    barBtn = barBtn.replace('class="nav-item"', 'class="nav-item active"');
                }

                // Determine Order
                // If bar is default, Bar comes first. Otherwise Kitchen first.
                const firstBtn = (defaultTab === 'bar') ? barBtn : kitchenBtn;
                const secondBtn = (defaultTab === 'bar') ? kitchenBtn : barBtn;

                // Find the range occupied by these two buttons to replace them
                const startIndex = Math.min(kitchenMatch.index, barMatch.index);
                const endIndex = Math.max(kitchenMatch.index + kitchenMatch[0].length, barMatch.index + barMatch[0].length);

                // Reconstruct content
                const buttonsBlock = `${firstBtn}\n        ${secondBtn}`;

                const newNavContent = navContent.slice(0, startIndex) + buttonsBlock + navContent.slice(endIndex);

                html = html.replace(navRegex, `$1${newNavContent}$3`);
                console.log(`✓ Updated: Navbar reordered (First: ${defaultTab})`);
            } else {
                console.warn('! Warning: Could not find Kitchen or Bar buttons to reorder.');
            }
        } else {
            console.warn('! Warning: <nav class="bottom-nav"> not found.');
        }

        // Generate hreflang block
        const hreflangLines = generateHreflangTags(baseUrl, defaultLanguage, supportedLanguages);

        // Replace existing hreflang block or insert after title
        const hreflangBlock = `<!-- Canonical and Hreflang (auto-generated by build-index.js) -->\n${hreflangLines}`;

        // Pattern to match existing hreflang block
        // Pattern to match existing hreflang block including the comment and strictly up to the next link/script/meta tag
        // effectively replacing the whole block and avoiding trailing whitespace buildup
        const hreflangPattern = /<!-- Canonical and Hreflang[\s\S]*?(?=\n\s*<link rel="stylesheet")/i;

        if (hreflangPattern.test(html)) {
            // Replace existing block
            html = html.replace(hreflangPattern, hreflangBlock);
        } else {
            // Insert after title or favicon (looks for last <link rel="icon"...> or </title>)
            const insertPoint = /(<link rel="icon"[^>]*>)/i;
            if (insertPoint.test(html)) {
                html = html.replace(insertPoint, `$1\n\n    ${hreflangBlock}`);
            } else {
                html = html.replace(/(<\/title>)/i, `$1\n\n    ${hreflangBlock}`);
            }
        }

        // Write updated index.html
        fs.writeFileSync(INDEX_PATH, html, 'utf8');
        console.log('✓ Updated: index.html with hreflang tags');
        console.log('\nBuild complete!');

    } catch (e) {
        console.error('Error updating index.html:', e);
        process.exit(1);
    }
}

function generateHreflangTags(baseUrl, defaultLanguage, supportedLanguages) {
    const lines = [];

    // Canonical (always the default language URL, which is just /)
    lines.push(`    <link rel="canonical" href="${baseUrl}/">`);

    // Hreflang for each supported language
    for (const lang of supportedLanguages) {
        const url = lang === defaultLanguage
            ? `${baseUrl}/`
            : `${baseUrl}/?lang=${lang}`;
        lines.push(`    <link rel="alternate" hreflang="${lang}" href="${url}">`);
    }

    // x-default points to the default language
    lines.push(`    <link rel="alternate" hreflang="x-default" href="${baseUrl}/">`);

    return lines.join('\n');
}

// Run build
build();
