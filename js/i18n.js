// ========================================
// Internationalization (i18n)
// ========================================

import { state } from './state.js';
import { getNestedValue } from './utils.js';

export let TRANSLATIONS = {};
export let ALLERGENS = {};
export let FOOD_TYPES = {};

export function setAllergens(allergens) {
    ALLERGENS = allergens;
}

export function setFoodTypes(foodTypes) {
    FOOD_TYPES = foodTypes;
}

/**
 * Load translations and CSV schema
 */
export async function loadTranslations() {
    const lang = state.currentLanguage;
    const fallbackLang = state.config?.i18n?.fallbackLanguage || 'en';

    try {
        // Load current language
        const response = await fetch(`config/translations/${lang}.json?t=${Date.now()}`);
        TRANSLATIONS[lang] = await response.json();

        // Load fallback language if different
        if (fallbackLang !== lang) {
            const fallbackResponse = await fetch(`config/translations/${fallbackLang}.json?t=${Date.now()}`);
            TRANSLATIONS[fallbackLang] = await fallbackResponse.json();
        }

        // Load CSV schema
        const schemaResponse = await fetch(`config/csv-schema.json?t=${Date.now()}`);
        const csvSchema = await schemaResponse.json();
        const csvLang = state.config?.app?.csvLanguage || 'it';
        // Store the CSV keywords for the configured CSV language
        TRANSLATIONS.csvKeywords = csvSchema[csvLang] || csvSchema['it'];

    } catch (e) {
        console.error('Could not load translations:', e);
        // Fallback minimal translations
        TRANSLATIONS[lang] = { loading: 'Loading...', errorMessage: 'Error', allergens: {} };
        TRANSLATIONS[fallbackLang] = { loading: 'Loading...', errorMessage: 'Error', allergens: {} };
    }
}

/**
 * Get localized string
 */
export function t(key) {
    const lang = state.currentLanguage;
    const fallback = state.config?.i18n?.fallbackLanguage || 'en';

    return getNestedValue(TRANSLATIONS[lang], key)
        || getNestedValue(TRANSLATIONS[fallback], key)
        || key;
}

/**
 * Get localized allergen name
 */
export function tAllergen(key) {
    const lang = state.currentLanguage;
    const fallback = state.config?.i18n?.fallbackLanguage || 'en';

    // Allergens are in the 'allergens' category
    return TRANSLATIONS[lang]?.allergens?.[key]
        || TRANSLATIONS[fallback]?.allergens?.[key]
        || key;
}

/**
 * Helper to get localized value from config objects like { "it": "...", "en": "..." }
 */
export function tConfig(obj, defaultValue = '') {
    if (!obj || typeof obj !== 'object') return obj || defaultValue;
    const lang = state.currentLanguage;
    const fallback = state.config?.i18n?.fallbackLanguage || 'en';
    return obj[lang] || obj[fallback] || defaultValue;
}
