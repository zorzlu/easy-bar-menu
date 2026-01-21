# Configuration Guide

Complete reference for configuring Easy Bar Menu via `config/config.json`.

---

## Configuration File Structure

The `config/config.json` file is organized into several main sections:

1. **Settings** - Application-wide settings
2. **Branding** - Visual identity and naming
3. **SEO** - Search engine optimization
4. **Input Data** - Data source configuration
5. **Pages** - Page metadata and static pages
6. **Legal** - Legal information
7. **Contact** - Contact information
8. **Allergens** - Allergen definitions
9. **Food Types** - Diet type definitions

---

## Settings

### Language Configuration

```json
{
  "settings": {
    "baseUrl": "https://yourdomain.com",
    "languages": {
      "default": "it",
      "supported": ["en", "it"],
      "fallback": "en",
      "locale": "it-IT",
      "definitions": {
        "it": {
          "name": "Italiano",
          "flag": "assets/icons/flag_it.svg"
        },
        "en": {
          "name": "English",
          "flag": "assets/icons/flag_en.svg"
        }
      }
    }
  }
}
```

**Options:**
- `default` - Default language for first-time visitors
- `supported` - Array of language codes available
- `fallback` - Language to use if translation is missing
- `locale` - Browser locale code
- `definitions` - Language display names and flag icons

### Theme Configuration

```json
{
  "settings": {
    "theme": {
      "mode": "light",
      "accentColor": "#A6507E",
      "themeColor": "#A6507E"
    }
  }
}
```

**Options:**
- `mode` - `light` or `dark` (currently only light is fully supported)
- `accentColor` - Primary brand color (hex format)
- `themeColor` - Browser theme color for mobile

**Note**: After changing `accentColor`, run `npm run generate-theme` to generate the full Material Design 3 color palette.

### Format Configuration

```json
{
  "settings": {
    "formats": {
      "currency": "EUR",
      "currencySymbol": "€",
      "timeFormat": "24h"
    }
  }
}
```

**Options:**
- `currency` - ISO currency code
- `currencySymbol` - Symbol to display for prices
- `timeFormat` - `24h` or `12h`

---

## Branding

```json
{
  "branding": {
    "barName": "Your Restaurant Name",
    "heroLogo": "assets/images/logo.png",
    "navbarLogo": "assets/images/navbar_icon.png",
    "favicon": "assets/images/favicon.png",
    "claim": {
      "it": "Il tuo slogan in italiano",
      "en": "Your slogan in English"
    }
  }
}
```

**Image Specifications:**
- `heroLogo` - Main logo on home page (recommended: 200-300px height, transparent PNG)
- `navbarLogo` - Small icon in navigation bar (recommended: 32x32px or 48x48px)
- `favicon` - Browser tab icon (recommended: 32x32px or 16x16px)

---

## SEO Configuration

```json
{
  "seo": {
    "searchEngineIndexing": false
  }
}
```

**Options:**
- `searchEngineIndexing` - Set to `true` to allow search engine crawling

Run `npm run build-seo` after changes to regenerate `sitemap.xml` and `robots.txt`.

---

## Input Data

```json
{
  "inputData": {
    "menuUrl": "https://docs.google.com/spreadsheets/.../output=csv",
    "fallbackFile": "data/fallback_menu.csv",
    "csvLanguage": "it",
    "csvNumberFormat": "it"
  }
}
```

**Options:**
- `menuUrl` - Google Sheets published CSV URL
- `fallbackFile` - Local CSV file used if remote URL fails
- `csvLanguage` - Language used in CSV (`it` or `en`)
- `csvNumberFormat` - Number format (`it` = comma decimal, `en` = period decimal)

---

## Pages Configuration

### Menu Page

```json
{
  "pages": {
    "menuPage": {
      "title": {
        "it": "Menu del Giorno",
        "en": "Daily Menu"
      },
      "description": {
        "it": "Menu del giorno - Scopri i nostri piatti",
        "en": "Daily menu - Discover our dishes"
      }
    }
  }
}
```

### Static Pages

```json
{
  "pages": {
    "staticPages": [
      {
        "id": "privacyCookiePolicy",
        "slug": "privacy-cookie-policy",
        "template": "content/privacy-policy.{lang}.md",
        "title": {
          "it": "Privacy e Cookie Policy",
          "en": "Privacy and Cookie Policy"
        },
        "description": {
          "it": "Informativa sulla privacy",
          "en": "Privacy policy"
        }
      }
    ]
  }
}
```

**Options:**
- `id` - Unique page identifier
- `slug` - URL path (e.g., `/privacy-cookie-policy`)
- `template` - Path to markdown file (use `{lang}` for language substitution)
- `title` - Page title for each language
- `description` - Meta description for SEO

---

## Legal Information

```json
{
  "legal": {
    "companyName": "Your Company Name",
    "vatNumber": "IT12345678901",
    "address": "Via Roma 123, 00100 Roma",
    "email": "privacy@yourcompany.com",
    "phone": "+39 06 12345678",
    "lastUpdated": "2025-12-17"
  }
}
```

Used in privacy policy and legal pages.

---

## Contact Information

```json
{
  "contact": {
    "address": "Via Roma 123, 00100 Roma",
    "phone": "+39 06 12345678",
    "email": "info@yourrestaurant.com",
    "socials": [
      {
        "name": "Instagram",
        "label": "@yourrestaurant",
        "url": "https://instagram.com/yourrestaurant"
      }
    ],
    "websites": [
      {
        "label": "www.yourrestaurant.com",
        "url": "https://www.yourrestaurant.com"
      }
    ]
  }
}
```

**Supported Social Networks:**
The `name` field should match common social network names for proper icon display:
- Instagram
- Facebook
- Twitter
- LinkedIn
- TikTok

---

## Allergens

```json
{
  "allergens": {
    "all_1_gluten": {
      "number": 1,
      "key": "gluten",
      "icon": "🌾"
    }
  }
}
```

Defines the 14 EU allergens. Each entry includes:
- `number` - Official allergen number (1-14)
- `key` - Translation key for allergen name
- `icon` - Emoji icon for display

**Note**: Do not modify the allergen IDs (e.g., `all_1_gluten`) as they must match CSV column names.

---

## Food Types

```json
{
  "foodTypes": {
    "standard": {
      "labelKey": "",
      "icon": "",
      "class": ""
    },
    "vegetarian": {
      "labelKey": "filters.dietVegetarian",
      "icon": "🌿",
      "class": "vegetarian"
    },
    "vegan": {
      "labelKey": "filters.dietVegan",
      "icon": "🌱",
      "class": "vegan"
    }
  }
}
```

Defines dietary restriction types matching the `type` column in menu data.

---

## Build Scripts

After modifying configuration, you may need to run build scripts:

```bash
npm run generate-theme  # After changing accentColor
npm run build-pages     # After changing static pages
npm run build-index     # After changing branding or page titles
npm run build-seo       # After changing SEO settings or baseUrl
npm run build           # Run all build scripts
```

---

## Related Documentation

- [Google Sheets Setup](GOOGLE_SHEETS_SETUP.md) - Data source configuration
- [Data Structure](DATA_STRUCTURE.md) - CSV structure reference
- [Customization Guide](CUSTOMIZATION.md) - Advanced customization
- [Main README](../README.md) - Project overview
