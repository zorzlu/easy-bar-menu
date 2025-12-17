// ========================================
// State Management
// ========================================

const STORAGE_KEY = 'menuPreferences';

/**
 * Load saved preferences from localStorage
 */
export function loadPreferences() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.warn('Could not load preferences:', e);
    }
    return null;
}

/**
 * Save current preferences to localStorage
 */
export function savePreferences(state) {
    try {
        const prefs = {
            language: state.currentLanguage,
            diet: state.filters.diet,
            excludeAllergens: state.filters.excludeAllergens
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) {
        console.warn('Could not save preferences:', e);
    }
}

/**
 * Get initial language from URL or preferences
 */
export function getInitialLanguage() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    if (urlLang && ['en', 'it'].includes(urlLang)) return urlLang;

    const prefs = loadPreferences();
    if (prefs?.language) return prefs.language;

    return 'it'; // Default to Italian
}

// Initial state object
const savedPrefs = loadPreferences();

export const state = {
    currentTab: 'kitchen',
    currentLanguage: getInitialLanguage(),
    config: null,
    data: { kitchen: null, bar: null, info: null },
    lastFetch: { kitchen: null, bar: null, info: null },
    filters: {
        diet: savedPrefs?.diet || 'all',
        excludeAllergens: savedPrefs?.excludeAllergens || []
    },
    tempFilters: {
        diet: 'all',
        excludeAllergens: []
    },
    headerExpanded: true,
    lastScrollY: 0,
    usingFallback: false
};
