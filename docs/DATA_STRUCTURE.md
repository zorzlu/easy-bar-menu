# Data Structure Reference

Complete reference for the unified CSV data structure used by Easy Bar Menu.

---

## Tech Overview

The system uses a unified CSV structure where multiple tables are placed horizontally (side by side) in a single sheet. Each table is identified by section markers in the first row.
Example of the CSV file: [example_csv_menu.csv](fallback_data.csv)

---

## Section Markers (Row 1)

The first row contains section identifiers that define which table each column belongs to:
- `bar` - Bar menu items (drinks, cocktails, etc.)
- `kitchen` - Kitchen menu items (food dishes)
- `categories` - Category definitions and ordering
- `timeslots` - Opening hours and service periods
- `content` - Custom content blocks for info page

**Important**: All five tables must be present in your CSV file, stacked horizontally.

---

## Table Specifications (valid also for GoogleSheets)

### Table 1: Bar Menu (`bar`)

Contains all beverage items and bar snacks.

**Columns:**
- `category` - Category ID (must match a category_id from Categories table)
- `name_it` - Item name in Italian
- `active` - `true` to show item, `false` to hide
- `price` - Price in decimal format (e.g., `6.00`)
- `description_it` - Description in Italian
- `type` - Diet type: `not_specified` (for drinks and similar), `standard` (not vegan/vegetarian), `vegetarian`, or `vegan`
- `name_en` - Item name in English
- `description_en` - Description in English
- `all_1_gluten` through `all_14_mollusks` - Allergen flags (`true` if present, `false` otherwise)
- `no_gluten_option`, `plant_based_milk_option` - flags for marking the availability of gluten-free and dairy-free options (they are ordered in between the allergens, just after the corresponding allergen)


---

### Table 2: Kitchen Menu (`kitchen`)

Contains all food items from the kitchen.

**Columns:**
Same structure as the Bar Menu table.

- `category` - Category ID (must match a category_id from Categories table)
- `name_it` - Item name in Italian
- `active` - `true` to show item, `false` to hide
- `price` - Price in decimal format (e.g., `6.00`)
- `description_it` - Description in Italian
- `type` - Diet type: `not_specified` (for drinks and similar), `standard` (not vegan/vegetarian), `vegetarian`, or `vegan`
- `name_en` - Item name in English
- `description_en` - Description in English
- `all_1_gluten` through `all_14_mollusks` - Allergen flags (`true` if present, `false` otherwise)
- `no_gluten_option`, `plant_based_milk_option` - flags for marking the availability of gluten-free and dairy-free options (they are ordered in between the allergens, just after the corresponding allergen)


---

### Table 3: Categories (`categories`)

Defines the categories and their display order in the menu.

**Columns:**
- `category_id` - Unique category identifier (referenced by menu items)
- `label_it` - Category name in Italian
- `label_en` - Category name in English
- `order` - Display order within the menu (lower numbers appear first)
- `menu` - Which menu this category belongs to: `bar` or `kitchen`


**Notes:**
- `category_id` must be unique across all categories
- `order` determines the sequence (1 appears before 2, etc.)
- `menu` must be exactly `bar` or `kitchen` (never translated)

---

### Table 4: Time Slots (`timeslots`)

Defines opening hours and service periods that appear on the home page and info page.

**Columns:**
- `slot_id` - Unique identifier (e.g., `lunch`, `dinner`, `aperitivo`, `breakfast`, `brunch`)
- `label_it` - Label in Italian
- `label_en` - Label in English
- `day` - Day of week: `mon`, `tue`, `wed`, `thu`, `fri`, `sat`, `sun`
- `open` - Opening time in 24h format (e.g., `12:00`)
- `close` - Closing time in 24h format (e.g., `15:00`)
- `is_kitchen` - `true` if kitchen is open during this slot, `false` for bar-only service
- `show_in_hero` - `true` to show in bar/kitchen status cards
- `show_in_info` - `true` to show in info page hours section


**Notes:**
- Create one row per time slot per day
- its possible to have multiple timeslots for the same day
- Times spanning midnight can use hours like `24:00` or `01:00`
- Use `is_kitchen: true` for food service periods

---

### Table 5: Content Blocks (`content`)

Custom content sections displayed on the info page and menu headers. 
- `menu_header_kitchen` and `menu_header_bar` are used to display the content on the menu headers. All other blocks are displayed on the info page. The blocks for the info page could be of type `text` or `cta` (buttons with links).

**Columns:**
- `type` - Content type: `text`, `cta`, `menu_header_kitchen`, `menu_header_bar`
- `label_it` - Title in Italian
- `label_en` - Title in English
- `text_it` - Content text in Italian (for `text` and `menu_header` type only)
- `text_en` - Content text in English (for `text` and `menu_header` type only)
- `link` - URL for buttons (`cta` type only)
- `style` - Style variant: `card`/`plain` for text and menu headers, `primary`/`secondary` for buttons

**Menu Headers**
How to fill the row:
- `type` - Content type: `menu_header_kitchen`, `menu_header_bar`
- `label_it` - Title in Italian
- `label_en` - Title in English
- `text_it` - Content text in Italian
- `text_en` - Content text in English
- `link` - EMPTY
- `style` - Style variant: `card`/`plain`. Card: Displayed with card background. Plain has no background.

**Info Page**
**Text blocks**
How to fill the row:
- `type` - Content type: `text`
- `label_it` - Title in Italian
- `label_en` - Title in English
- `text_it` - Content text in Italian
- `text_en` - Content text in English
- `link` - EMPTY
- `style` - Style variant: `card`/`plain`. Card: Displayed with card background. Plain has no background.

**CTA blocks**
How to fill the row:
- `type` - Content type: `cta`
- `label_it` - Title in Italian
- `label_en` - Title in English
- `text_it` - EMPTY
- `text_en` - EMPTY
- `link` - url of the CTA
- `style` - Style variant: `primary`/`secondary`. 

---

## Related Documentation

- [Google Sheets Setup](GOOGLE_SHEETS_SETUP.md) - Setting up your data source
- [Configuration Guide](CONFIGURATION.md) - Application configuration
- [Main README](../README.md) - Project overview
