# Customization Guide

Guide for customizing the look, feel, and behavior of Easy Bar Menu.

---

## Color Theme

### Changing the Accent Color

The application uses Material Design 3 color system with automatic palette generation.

**Steps:**

1. Edit `config/config.json`:
```json
{
  "settings": {
    "theme": {
      "accentColor": "#YOUR_COLOR_HERE"
    }
  }
}
```

2. Run the theme generator:
```bash
npm run generate-theme
```

This automatically generates a complete Material Design 3 color palette in `assets/css/colors.css` including:
- Primary, secondary, and tertiary color schemes
- Surface and background colors
- Error and success colors
- Light and dark mode variants

### Manual Color Customization

For advanced users, you can manually edit `assets/css/colors.css`:

```css
:root {
  --color-primary: #a6507e;
  --color-on-primary: #ffffff;
  --color-primary-container: #ffd7ef;
  /* ... more color tokens */
}
```

---

## Typography

### Font Selection

The default font is specified in `config/config.json`:

```json
{
  "settings": {
    "fonts": {
      "primary": "Inter, sans-serif"
    }
  }
}
```

### Adding Custom Fonts

1. **Google Fonts**: Add font files to `assets/fonts/` and create `@font-face` rules in `assets/css/_base.css`

2. **Update configuration**: Change the `primary` font in `config.json`

3. **Rebuild**: Run `npm run build-index` to apply changes

**Example for DM Sans:**

```css
@font-face {
  font-family: 'DM Sans';
  src: url('../fonts/DMSans-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

---

## Translations

### UI Text Strings

Fixed UI strings are located in `config/translations.json`.

**Structure:**
```json
{
  "en": {
    "menu.kitchen": "Kitchen",
    "menu.bar": "Bar",
    "filters.title": "Filters"
  },
  "it": {
    "menu.kitchen": "Cucina",
    "menu.bar": "Bar",
    "filters.title": "Filtri"
  }
}
```

### Adding a New Language

1. Add language code to `config/config.json`:
```json
{
  "settings": {
    "languages": {
      "supported": ["en", "it", "fr"]
    }
  }
}
```

2. Add translations to `config/translations.json`:
```json
{
  "fr": {
    "menu.kitchen": "Cuisine",
    "menu.bar": "Bar"
  }
}
```

3. Create language-specific flag icon: `assets/icons/flag_fr.svg`

4. Add language definition in `config.json`:
```json
{
  "definitions": {
    "fr": {
      "name": "Français",
      "flag": "assets/icons/flag_fr.svg"
    }
  }
}
```

---

## Static Pages

### Creating a New Page

Static pages are markdown files with multilingual support.

**Steps:**

1. Create markdown files:
   - `content/about.it.md`
   - `content/about.en.md`

2. Add page configuration to `config/config.json`:
```json
{
  "pages": {
    "staticPages": [
      {
        "id": "about",
        "slug": "about",
        "template": "content/about.{lang}.md",
        "title": {
          "it": "Chi Siamo",
          "en": "About Us"
        },
        "description": {
          "it": "Scopri la nostra storia",
          "en": "Discover our story"
        }
      }
    ]
  }
}
```

3. Run the build script:
```bash
npm run build-pages
```

This generates `pages/about.it.html` and `pages/about.en.html`.

---

## Styling

### Custom CSS

Add custom styles to `assets/css/styles.css`. The application uses a layered CSS structure:

- `_base.css` - Base styles, fonts, and resets
- `_layout.css` - Layout and grid system
- `_components.css` - Reusable components
- `colors.css` - Color tokens
- `pages.css` - Page-specific styles
- `styles.css` - Main entry point

### Component Styling

To customize specific components, target their CSS classes:

```css
/* Custom navbar styling */
.navbar {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Custom card styling */
.card {
  border-radius: 16px;
}

/* Custom button styling */
.btn-primary {
  font-weight: 600;
  text-transform: uppercase;
}
```

---

## Icons and Images

### Allergen Icons

Customize allergen icons in `config/config.json`:

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

### Diet Icons

Customize vegetarian/vegan icons:

```json
{
  "foodTypes": {
    "vegetarian": {
      "labelKey": "filters.dietVegetarian",
      "icon": "🌿",
      "class": "vegetarian"
    }
  }
}
```

### Logo Images

Replace images in `assets/images/`:
- `iltuobarlogo.png` - Home page hero logo
- `iltuobar_navbar_icon.png` - Navigation bar icon
- `favicon.png` - Browser favicon

Update paths in `config/config.json`:

```json
{
  "branding": {
    "heroLogo": "assets/images/your-logo.png",
    "navbarLogo": "assets/images/your-icon.png",
    "favicon": "assets/images/your-favicon.png"
  }
}
```

---

## Advanced Customizations

### Custom JavaScript

Application logic is in the `js/` folder:

- `main.js` - Application initialization and routing
- `render.js` - UI rendering functions
- `app.js` - Core application logic

To add custom behavior, create a new file and import it in `index.html`:

```html
<script type="module" src="js/custom.js"></script>
```

### Menu Behavior

Customize menu filtering and display logic in `js/app.js`:

```javascript
// Custom filter function
function customFilter(items, criteria) {
  // Your custom filtering logic
  return items.filter(item => /* your condition */);
}
```

### Responsive Breakpoints

Modify responsive breakpoints in `assets/css/_layout.css`:

```css
/* Custom mobile breakpoint */
@media (max-width: 768px) {
  /* Mobile styles */
}

/* Custom tablet breakpoint */
@media (min-width: 769px) and (max-width: 1024px) {
  /* Tablet styles */
}
```

---

## Build Configuration

### Custom Build Scripts

You can add custom build steps to `package.json`:

```json
{
  "scripts": {
    "custom-build": "node scripts/your-custom-script.js",
    "build": "npm run generate-theme && npm run build-pages && npm run custom-build"
  }
}
```

---

## Related Documentation

- [Configuration Guide](CONFIGURATION.md) - Complete config reference
- [Data Structure](DATA_STRUCTURE.md) - CSV structure
- [Main README](../README.md) - Project overview
