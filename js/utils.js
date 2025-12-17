// ========================================
// Utilities & Helpers
// ========================================

/**
 * Check if a value is truthy (handles various string formats)
 */
export function isTruthy(val) {
    if (!val) return false;
    const s = String(val).toLowerCase().trim();
    return ['true', '1', 'x', 'si', 'sì', 'yes', 'vero'].includes(s);
}

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Get nested value from object using dot notation
 */
export function getNestedValue(obj, path) {
    if (!obj || !path) return undefined;
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
        result = result?.[key];
        if (result === undefined) return undefined;
    }
    return result;
}

/**
 * Parse number from CSV, handling Italian (comma) or US (dot) decimal format
 */
export function parseNumber(val, format = 'us') {
    if (!val) return NaN;
    let s = String(val).trim();
    if (format === 'it') {
        // Italian format: comma is decimal separator
        s = s.replace(',', '.');
    }
    return parseFloat(s);
}

/**
 * Parse time from CSV - handles both HH:MM format and decimal fractions
 */
export function parseTimeValue(val, format = 'us') {
    if (!val) return '';
    let s = String(val).trim();

    // If it looks like HH:MM format, return as-is
    if (s.includes(':')) return s;

    // Convert Italian decimal format (comma -> dot) if needed
    if (format === 'it') {
        s = s.replace(',', '.');
    }

    // Parse as decimal fraction of day (Google Sheets time format)
    const decimalDays = parseFloat(s);
    if (isNaN(decimalDays)) return s;

    // Convert to hours and minutes
    const totalMinutes = Math.round(decimalDays * 24 * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Format price string
 */
export function parsePrice(val, format = 'us') {
    if (!val) return '';
    const n = parseNumber(val, format);
    return isNaN(n) ? String(val).trim() : n.toFixed(2).replace('.', ',');
}

/**
 * Format price for display using Intl
 */
export function formatPrice(price, config) {
    if (!price) return '';
    const locale = config?.regional?.locale || 'it-IT';
    const currency = config?.regional?.currency || 'EUR';

    // Parse the price (handle both number and string with comma/dot)
    let numPrice = typeof price === 'number' ? price : parseFloat(String(price).replace(',', '.'));
    if (isNaN(numPrice)) return price; // Return as-is if not parseable

    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(numPrice);
    } catch (e) {
        // Fallback if Intl fails
        const symbol = config?.regional?.currencySymbol || '€';
        return `${symbol} ${numPrice.toFixed(2)}`;
    }
}
