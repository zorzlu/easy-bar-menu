/**
 * Build script for generating static HTML pages from markdown documents.
 * 
 * Usage: node build-pages.js
 * 
 * This script reads markdown files from the content/ folder and generates
 * styled HTML pages in the pages/en/ and pages/it/ folders.
 * 
 * Features:
 * - Template variables replaced with config.json values
 * - SEO meta tags from config
 * - Hreflang tags for multilingual support
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
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

// Simple markdown to HTML converter
function markdownToHtml(markdown) {
    let html = markdown;

    // Convert blockquotes (must be before other replacements)
    html = html.replace(/^>\s*\*\*(.+?)\*\*:\s*(.+)$/gm, '<blockquote><strong>$1:</strong> $2</blockquote>');
    html = html.replace(/^>\s*(.+)$/gm, '<blockquote>$1</blockquote>');

    // Convert headers (must preserve emoji icons)
    html = html.replace(/^### (\d+)\.\s*(.+)$/gm, '<h3><span class="allergen-number">$1.</span> $2</h3>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Convert bold and italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Convert links
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // Convert unordered lists
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // Convert horizontal rules
    html = html.replace(/^---$/gm, '<hr>');

    // Convert paragraphs (lines that aren't already HTML)
    const lines = html.split('\n');
    const processedLines = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip empty lines
        if (line === '') {
            processedLines.push('');
            continue;
        }

        // Skip lines that are already HTML tags
        if (line.startsWith('<h') || line.startsWith('<ul') || line.startsWith('</ul') ||
            line.startsWith('<li') || line.startsWith('<hr') || line.startsWith('<blockquote')) {
            processedLines.push(lines[i]);
            continue;
        }

        // Wrap regular text in paragraphs
        if (!line.startsWith('<')) {
            processedLines.push(`<p>${line}</p>`);
        } else {
            processedLines.push(lines[i]);
        }
    }

    html = processedLines.join('\n');

    // Clean up multiple consecutive <ul> tags
    html = html.replace(/<\/ul>\s*<ul>/g, '');

    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '');

    return html;
}

// Replace template placeholders with config values
function replaceTemplateVars(content, config) {
    const replacements = {
        '{{companyName}}': config.legal?.companyName || config.branding?.barName || 'Company Name',
        '{{address}}': config.legal?.address || config.contact?.address || 'Address',
        '{{email}}': config.legal?.email || config.contact?.email || 'email@example.com',
        '{{phone}}': config.legal?.phone || config.contact?.phone || '',
        '{{vatNumber}}': config.legal?.vatNumber || '',
        '{{lastUpdated}}': config.legal?.lastUpdated || new Date().toISOString().split('T')[0],
    };

    let result = content;
    for (const [placeholder, value] of Object.entries(replacements)) {
        result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    }
    return result;
}

// HTML template generator
function generatePageHtml(content, pageConfig, translations, config, themeColor) {
    const { title, description, lang, slug, baseUrl } = pageConfig;
    const isEnglish = lang === 'en';
    const backLabel = translations?.[lang]?.staticPages?.backToMenu || (isEnglish ? 'Back to Menu' : 'Torna al Menu');
    // Determine other language (cycle to next)
    const supported = config?.settings?.languages?.supported || ['en', 'it'];
    const definitions = config?.settings?.languages?.definitions || {};

    const currentIndex = supported.indexOf(lang);
    const nextIndex = (currentIndex + 1) % supported.length;
    const nextLang = supported[nextIndex];
    const nextLangDef = definitions[nextLang] || {};

    // For static pages, we need relative path to assets, so we fix the path from the definition
    // Definition is like "assets/icons/..." but we are in "pages/lang/", so we need "../../assets/icons/..."
    let flagPath = nextLangDef.flag ? `../../${nextLangDef.flag}` : '';

    const langLabel = flagPath
        ? `<span class="lang-flag"><img src="${flagPath}" alt="${nextLangDef.name || nextLang}" class="flag-icon"></span>`
        : (nextLangDef.name || nextLang).toUpperCase();

    const otherLang = nextLang;
    const pageFile = `${slug}`;

    // Generate hreflang URLs
    const itUrl = `${baseUrl}/pages/it/${pageFile}`;
    const enUrl = `${baseUrl}/pages/en/${pageFile}`;
    const canonicalUrl = isEnglish ? enUrl : itUrl;

    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta name="description" content="${description}">
    <meta name="theme-color" content="${themeColor}">
    <title>${title}</title>
    <link rel="icon" type="image/png" href="../../assets/images/iltuobar_favicon.png">
    
    <!-- Canonical and Hreflang -->
    <link rel="canonical" href="${canonicalUrl}">
    <link rel="alternate" hreflang="it" href="${itUrl}">
    <link rel="alternate" hreflang="en" href="${enUrl}">
    <link rel="alternate" hreflang="x-default" href="${enUrl}">
    
    <link rel="stylesheet" href="../../assets/css/colors.css">
    <link rel="stylesheet" href="../../assets/css/styles.css">
    <link rel="stylesheet" href="../../assets/css/pages.css">
</head>
<body>
    <header class="page-header">
        <div class="page-header-content">
            <a href="../../?lang=${lang}" class="back-button">
                <span class="back-arrow">←</span>
                ${backLabel}
            </a>
            <a href="../${otherLang}/${pageFile}" class="lang-switch" aria-label="Switch language">
                ${langLabel}
            </a>
        </div>
    </header>
    
    <main class="page-container">
        <article class="page-content">
            ${content}
        </article>
        
        <div class="footer-cta">
            <a href="../../?lang=${lang}" class="cta-button">
                <span>←</span>
                ${backLabel}
            </a>
        </div>
    </main>
</body>
</html>`;
}

// Main build function
function build() {
    const rootDir = path.join(__dirname, '..');
    const contentDir = path.join(rootDir, 'content');
    const configPath = path.join(rootDir, 'config/config.json');
    const translationsDir = path.join(rootDir, 'config/translations');
    const pagesDir = path.join(rootDir, 'pages');
    const enDir = path.join(pagesDir, 'en');
    const itDir = path.join(pagesDir, 'it');

    // Get theme color from CSS
    const themeColor = getThemeColorFromCSS();
    console.log(`Theme color resolved to: ${themeColor}`);

    // Load config
    let config = {};
    try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log('Loaded config from config/config.json');
    } catch (e) {
        console.warn('Could not load config.json, using defaults');
    }

    // Load translations (separate files per language)
    let translations = {};
    try {
        const enPath = path.join(translationsDir, 'en.json');
        const itPath = path.join(translationsDir, 'it.json');

        if (fs.existsSync(enPath)) {
            translations.en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
        }
        if (fs.existsSync(itPath)) {
            translations.it = JSON.parse(fs.readFileSync(itPath, 'utf8'));
        }
        console.log('Loaded translations from config/translations/');
    } catch (e) {
        console.warn('Could not load translations, using defaults');
    }

    const baseUrl = config.settings?.baseUrl || 'https://example.com';
    const supportedLanguages = config.settings?.languages?.supported || ['en', 'it'];
    const staticPages = config.pages?.staticPages || [];

    // Ensure output directories exist
    if (!fs.existsSync(pagesDir)) fs.mkdirSync(pagesDir);

    // Create language directories dynamically
    for (const lang of supportedLanguages) {
        const langDir = path.join(pagesDir, lang);
        if (!fs.existsSync(langDir)) fs.mkdirSync(langDir);
    }

    console.log('Building static pages from markdown...');
    console.log(`Languages: ${supportedLanguages.join(', ')}`);
    console.log(`Static pages: ${staticPages.map(p => p.id).join(', ')}\n`);

    // Dynamically generate pages for each static page and language
    for (const pageConfig of staticPages) {
        const slug = pageConfig.slug;
        const templatePath = pageConfig.template; // e.g., "content/privacy-policy.{lang}.md"

        for (const lang of supportedLanguages) {
            // Build source path from template (replace {lang} placeholder)
            const sourceFile = templatePath.replace('{lang}', lang);
            const sourcePath = path.join(rootDir, sourceFile);
            const outputPath = path.join(pagesDir, lang, `${slug}.html`);

            // Get localized title and description
            const title = pageConfig.title?.[lang] || pageConfig.title?.en || pageConfig.id;
            const description = pageConfig.description?.[lang] || pageConfig.description?.en || '';

            try {
                // Check if source file exists
                if (!fs.existsSync(sourcePath)) {
                    console.warn(`⚠ Skipping: ${sourceFile} (file not found)`);
                    continue;
                }

                // Read markdown
                let markdown = fs.readFileSync(sourcePath, 'utf8');

                // Replace template variables with config values
                markdown = replaceTemplateVars(markdown, config);

                // Convert to HTML
                const contentHtml = markdownToHtml(markdown);

                // Generate full page with SEO meta
                const pageData = {
                    title,
                    description,
                    lang,
                    slug,
                    baseUrl
                };
                const pageHtml = generatePageHtml(contentHtml, pageData, translations, config, themeColor);

                // Write output
                fs.writeFileSync(outputPath, pageHtml, 'utf8');

                console.log(`✓ Generated: pages/${lang}/${slug}.html`);
            } catch (err) {
                console.error(`✗ Error processing ${sourceFile}:`, err.message);
            }
        }
    }

    console.log('\nBuild complete!');
}

// Run build
build();
