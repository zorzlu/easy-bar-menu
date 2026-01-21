# Google Sheets Integration Guide

This guide explains how to set up and use Google Sheets as the data source for Easy Bar Menu.

---

## Overview

The application uses Google Sheets as a dynamic content management system. Menu updates made in the spreadsheet are automatically reflected in the application without any deployment or build process.

---

## Step-by-Step Setup

### 1. Copy the Template

1. Open the template Google Sheet: **[Easy Bar Menu Template](https://docs.google.com/spreadsheets/d/15OwloYGgx9OTKt9dtR9erWvJbgVeTTwtxUuiM92e75E/edit?usp=sharing)**  
*Note: This template is in Italian. If you want to create the English version, you should use the translations of the keys available in the [csv-schema.json](../config/csv-schema.json) file.*

2. Click **File** > **Make a copy**
3. Choose a location in your Google Drive
4. Rename the copy to something meaningful (e.g., "Restaurant Menu - Live")

The template contains the complete structure with sample data for reference.

### 2. Edit Your Menu Data

Update the spreadsheet with your actual menu items. Replace the sample data with your own content.

The file is structured as follows:
- **Bar Menu**: Items available at the bar.
- **Kitchen Menu**: Items available from the kitchen.
- **Categories**: Categories of the menu (both bar and kitchen).
- **Timeslots**: Opening times for the bar, kitchen, and special hours (e.g., happy hour/aperitivo).
- **Content**: Content for the menu (textual info on the 'Info' page, button links, and banners in the bar and kitchen menus).
- **Settings**: DO NOT MODIFY (Required for category dropdowns in bar/kitchen menus).
- **Export**: DO NOT MODIFY (Required for CSV export).

The structure is explained in detail in the [Data Structure Guide](DATA_STRUCTURE.md#table-specifications-valid-also-for-googlesheets).

**Important**: Do not modify Row 1 (section markers) as it defines the table boundaries. Do NOT edit "settings" and "export" sheets.

![Google Sheets Example](gsheets_table_example.png)
*Example of the unified Google Sheets structure with multiple tables side by side*

### 3. Publish as CSV

1. In your copied Google Sheet, go to **File** > **Share** > **Publish to web**
2. In the **Link** tab, select the "Export" sheet
3. Change the format dropdown from "Web page" to **Comma-separated values (.csv)**
4. Check "Automatically republish when changes are made" for instant updates
5. Click **Publish**
6. Copy the generated URL (it will look like: `https://docs.google.com/spreadsheets/d/e/...output=csv`)

### 4. Configure the Application

Open `config/config.json` and paste your CSV URL:

```json
{
  "inputData": {
    "menuUrl": "YOUR_GOOGLE_SHEETS_CSV_URL_HERE",
    "fallbackFile": "data/fallback_menu.csv",
    "csvLanguage": "it",
    "csvNumberFormat": "it"
  }
}
```

**Configuration Options:**
- `menuUrl`: The published Google Sheets CSV URL
- `fallbackFile`: Local CSV file used if Google Sheets is unavailable
- `csvLanguage`: Language used in the CSV file (`it` or `en`)
- `csvNumberFormat`: Number format in CSV (`it` uses comma for decimals, `en` uses period)

---

## Tips and Best Practices

### Update Frequency

Changes to your Google Sheet are typically reflected within a few minutes, but Google's caching may delay updates. For immediate updates during testing, you can:
1. Clear your browser cache
2. Use an incognito/private window
3. Add a cache-busting parameter to your URL requests

### Data Validation

The example sheet is configured to ensure each value has the proper type, ensuring data consistency and preventing issues while modifying it. Checkboxes and dropdowns are configured to have the proper values, so you don't have to worry about typing the wrong value.

---

## Troubleshooting

### Menu Not Updating

**Problem**: Changes in Google Sheets don't appear in the app.

**Solutions**:
- Wait a few minutes for Google's cache to expire
- Verify the CSV URL is correct in `config.json`
- Check browser console for errors
- Confirm the sheet is published with "Automatically republish" enabled

### Items Not Showing

**Problem**: Menu items don't display even though they're in the sheet.

**Solutions**:
- Verify `active` is set to `true`
- Check that the `category` matches a `category_id` in the Categories table
- Ensure the category's `menu` field is either `bar` or `kitchen`

### Formatting Issues

**Problem**: Prices or special characters display incorrectly.

**Solutions**:
- Avoid special formatting in Google Sheets (keep it plain text)

---

## Related Documentation

- [Data Structure Guide](DATA_STRUCTURE.md) - Complete CSV structure reference
- [Configuration Guide](CONFIGURATION.md) - Application configuration details
- [Main README](../README.md) - Project overview
