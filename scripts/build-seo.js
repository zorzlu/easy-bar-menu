/**
 * Build script for generating SEO files (robots.txt and sitemap.xml).
 * 
 * Usage: node build-seo.js
 * 
 * Reads configuration from config/config.json and generates:
 * - robots.txt: Controls search engine crawler access
 * - sitemap.xml: Lists all public pages for search engines
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const CONFIG_PATH = path.join(ROOT_DIR, 'config/config.json');
const ROBOTS_PATH = path.join(ROOT_DIR, 'robots.txt');
const SITEMAP_PATH = path.join(ROOT_DIR, 'sitemap.xml');

function build() {
    try {
        // Read config
        if (!fs.existsSync(CONFIG_PATH)) {
            console.error('Config file not found!');
            process.exit(1);
        }

        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        const baseUrl = config.seo?.baseUrl || 'https://example.com';
        const allowIndexing = config.seo?.searchEngineIndexing ?? false;

        // Get current date for lastmod
        const today = new Date().toISOString().split('T')[0];

        console.log(`Generating SEO files for: ${baseUrl}`);
        console.log(`Search engine indexing: ${allowIndexing ? 'ENABLED' : 'DISABLED'}\n`);

        // Generate robots.txt
        const robotsContent = generateRobotsTxt(baseUrl, allowIndexing);
        fs.writeFileSync(ROBOTS_PATH, robotsContent, 'utf8');
        console.log('✓ Generated: robots.txt');

        // Generate sitemap.xml
        const sitemapContent = generateSitemapXml(baseUrl, today, config);
        fs.writeFileSync(SITEMAP_PATH, sitemapContent, 'utf8');
        console.log('✓ Generated: sitemap.xml');

        console.log('\nBuild complete!');

    } catch (e) {
        console.error('Error generating SEO files:', e);
        process.exit(1);
    }
}

function generateRobotsTxt(baseUrl, allowIndexing) {
    const lines = [
        '# Robots.txt for ScomodoMenu',
        `# ${baseUrl}`,
        '#',
        `# Search engine indexing: ${allowIndexing ? 'ENABLED' : 'DISABLED'}`,
        '# To change this, edit config/config.json -> seo.searchEngineIndexing',
        '',
        'User-agent: *',
    ];

    if (allowIndexing) {
        lines.push('Allow: /');
        lines.push('');
        lines.push('# Disallow config and build files');
        lines.push('Disallow: /config/');
        lines.push('Disallow: /scripts/');
        lines.push('Disallow: /examples/');
        lines.push('Disallow: /content/');
        lines.push('Disallow: /node_modules/');
        lines.push('');
        lines.push('# Prevent indexing of tab states (duplicate content)');
        lines.push('Disallow: /*?tab=');
        lines.push('Disallow: /*&tab=');
    } else {
        lines.push('Disallow: /');
    }

    lines.push('');
    lines.push('# Sitemap location');
    lines.push(`Sitemap: ${baseUrl}/sitemap.xml`);
    lines.push('');

    return lines.join('\n');
}

function generateSitemapXml(baseUrl, lastmod, config) {
    const privacySlug = config.pages?.privacyCookiePolicy?.slug || 'privacy-cookie-policy';
    const allergensSlug = config.pages?.allergens?.slug || 'allergens';
    const defaultLang = config.i18n?.defaultLanguage || 'it';
    const supportedLangs = config.i18n?.supportedLanguages || ['en', 'it'];

    // Define page groups (pages with language variants)
    const pageGroups = [
        {
            type: 'main',
            urls: {
                'it': '/',
                'en': '/?lang=en'
            },
            priority: '1.0',
            changefreq: 'daily'
        },
        {
            type: 'static',
            urls: {
                'it': `/pages/it/${privacySlug}.html`,
                'en': `/pages/en/${privacySlug}.html`
            },
            priority: '0.5',
            changefreq: 'monthly'
        },
        {
            type: 'static',
            urls: {
                'it': `/pages/it/${allergensSlug}.html`,
                'en': `/pages/en/${allergensSlug}.html`
            },
            priority: '0.6',
            changefreq: 'monthly'
        }
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

    for (const group of pageGroups) {
        // Generate a <url> entry for each language variant
        for (const lang of supportedLangs) {
            if (!group.urls[lang]) continue;

            const fullUrl = baseUrl + group.urls[lang];
            xml += '  <url>\n';
            xml += `    <loc>${fullUrl}</loc>\n`;
            xml += `    <lastmod>${lastmod}</lastmod>\n`;
            xml += `    <changefreq>${group.changefreq}</changefreq>\n`;
            xml += `    <priority>${group.priority}</priority>\n`;

            // Add hreflang links for all language variants
            for (const altLang of supportedLangs) {
                if (group.urls[altLang]) {
                    const altUrl = baseUrl + group.urls[altLang];
                    xml += `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${altUrl}"/>\n`;
                }
            }
            // Add x-default pointing to default language
            const defaultUrl = baseUrl + group.urls[defaultLang];
            xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${defaultUrl}"/>\n`;

            xml += '  </url>\n';
        }
    }

    xml += '</urlset>\n';
    return xml;
}

// Run build
build();
