// ========================================
// Configuration (loaded from external files)
// ========================================

let TRANSLATIONS = {};
let ALLERGENS = {};
let FOOD_TYPES = {};

// URL config (populated from config.json)
let CONFIG = {
    kitchen: { url: '', name: 'Cucina' },
    bar: { url: '', name: 'Bar' },
    info: { url: '', name: 'Info' }
};

async function loadTranslations() {
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

// ========================================
// Preferences Storage
// ========================================

const STORAGE_KEY = 'menuPreferences';

function loadPreferences() {
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

function savePreferences() {
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

// ========================================
// State
// ========================================

// Get language from URL param first, then saved preferences, then default
function getInitialLanguage() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    if (urlLang && ['en', 'it'].includes(urlLang)) return urlLang;

    const prefs = loadPreferences();
    if (prefs?.language) return prefs.language;

    return 'it'; // Default to Italian
}

// Load saved preferences
const savedPrefs = loadPreferences();

let state = {
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
    lastScrollY: 0
};

// ========================================
// DOM Elements
// ========================================

const elements = {
    lastUpdated: document.getElementById('lastUpdated'),
    langSwitch: document.getElementById('langSwitch'),
    updateIndicator: document.getElementById('updateIndicator'),
    errorBanner: document.getElementById('errorBanner'),
    retryButton: document.getElementById('retryButton'),
    staleDataBanner: document.getElementById('staleDataBanner'),
    staleRetryButton: document.getElementById('staleRetryButton'),
    loadingState: document.getElementById('loadingState'),
    emptyState: document.getElementById('emptyState'),
    menuContainer: document.getElementById('menuContainer'),
    infoContainer: document.getElementById('infoContainer'),
    navbarLogo: document.getElementById('navbarLogo'),
    storeName: document.getElementById('storeName'),
    navItems: document.querySelectorAll('.nav-item'),
    // Welcome hero elements (background layer)
    welcomeHero: document.getElementById('welcomeHero'),
    welcomeHeroContent: document.querySelector('.welcome-hero-content'),
    heroLogo: document.getElementById('heroLogo'),
    heroTitle: document.getElementById('heroTitle'),
    heroClaim: document.getElementById('heroClaim'),
    heroText: document.getElementById('heroText'),
    kitchenStatus: document.getElementById('kitchenStatus'),
    // App container (floating above hero)
    appContainer: document.getElementById('appContainer'),
    mainHeader: document.getElementById('mainHeader'),
    headerCollapseToggle: document.getElementById('headerCollapseToggle'),
    // Filter elements
    filterBar: document.getElementById('filterBar'),
    filterTrigger: document.getElementById('filterTrigger'),
    activeFilters: document.getElementById('activeFilters'),
    dietChip: document.getElementById('dietChip'),
    allergenChip: document.getElementById('allergenChip'),
    // Modal elements
    filterModal: document.getElementById('filterModal'),
    modalClose: document.getElementById('modalClose'),
    dietOptions: document.querySelectorAll('.diet-option'),
    allergenGrid: document.getElementById('allergenGrid'),
    clearFilters: document.getElementById('clearFilters'),
    inlineClearFilters: document.getElementById('inlineClearFilters'),
    applyFilters: document.getElementById('applyFilters'),
    // Accessibility
    srAnnounce: document.getElementById('srAnnounce')
};

// ========================================
// Translation Helper
// ========================================

// Helper to get nested value from object using dot notation
function getNestedValue(obj, path) {
    if (!obj || !path) return undefined;
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
        result = result?.[key];
        if (result === undefined) return undefined;
    }
    return result;
}

function t(key) {
    const lang = state.currentLanguage;
    const fallback = state.config?.i18n?.fallbackLanguage || 'en';

    return getNestedValue(TRANSLATIONS[lang], key)
        || getNestedValue(TRANSLATIONS[fallback], key)
        || key;
}

function tAllergen(key) {
    const lang = state.currentLanguage;
    const fallback = state.config?.i18n?.fallbackLanguage || 'en';

    // Allergens are in the 'allergens' category
    return TRANSLATIONS[lang]?.allergens?.[key]
        || TRANSLATIONS[fallback]?.allergens?.[key]
        || key;
}

// Helper to get localized value from config objects like { "it": "...", "en": "..." }
function tConfig(obj, defaultValue = '') {
    if (!obj || typeof obj !== 'object') return obj || defaultValue;
    const lang = state.currentLanguage;
    const fallback = state.config?.i18n?.fallbackLanguage || 'en';
    return obj[lang] || obj[fallback] || defaultValue;
}

function formatPrice(price) {
    if (!price) return '';
    const config = state.config;
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

function updateUILanguage() {
    const lang = state.currentLanguage;
    const config = state.config;

    // Update page title (from config.page.title)
    const pageTitle = tConfig(config?.page?.title, 'Menu');
    document.title = pageTitle;

    // Update meta description (from config.page.description)
    const pageDesc = tConfig(config?.page?.description, '');
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && pageDesc) {
        metaDesc.setAttribute('content', pageDesc);
    }

    // Update hero claim (from config.app.claim)
    const claim = tConfig(config?.app?.claim, '');
    if (elements.heroClaim && claim) {
        elements.heroClaim.textContent = claim;
    }

    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });

    // Update language switch button
    const langSwitch = elements.langSwitch;
    if (lang === 'it') {
        langSwitch.querySelector('.lang-flag').textContent = '🇬🇧';
        langSwitch.setAttribute('aria-label', t('nav.switchLang'));
    } else {
        langSwitch.querySelector('.lang-flag').textContent = '🇮🇹';
        langSwitch.setAttribute('aria-label', t('nav.switchLang'));
    }

    // Update modal close button aria-label
    elements.modalClose.setAttribute('aria-label', t('ui.close'));

    // Update active filter chips
    updateActiveFilterDisplay();

    // Re-render menu with new language
    render();

    // Update theme color (in case language change affects theme/colors)
    updateThemeColor();
}

// Switch language using History API (no page refresh)
function switchLanguage(newLang) {
    const defaultLang = state.config?.i18n?.defaultLanguage || 'en';
    const supportedLangs = state.config?.i18n?.supportedLanguages || ['en'];

    // Validate language
    if (!supportedLangs.includes(newLang)) {
        console.warn(`Unsupported language: ${newLang}`);
        return;
    }

    // Update URL using History API (no refresh)
    const newUrl = newLang === defaultLang ? '/' : `/?lang=${newLang}`;
    history.pushState({ lang: newLang }, '', newUrl);

    // Update state and save
    state.currentLanguage = newLang;
    savePreferences();

    // Update UI
    updateUILanguage();
}

// Handle browser back/forward button
window.addEventListener('popstate', (event) => {
    // Read language from URL after navigation
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    const defaultLang = state.config?.i18n?.defaultLanguage || 'en';
    const supportedLangs = state.config?.i18n?.supportedLanguages || ['en'];

    // Determine language: URL param or default
    let newLang = defaultLang;
    if (urlLang && supportedLangs.includes(urlLang)) {
        newLang = urlLang;
    }

    // Update state and UI if changed
    if (state.currentLanguage !== newLang) {
        state.currentLanguage = newLang;
        updateUILanguage();
    }
});

// ========================================
// CSV Parser & Utilities
// ========================================

function parseCSV(text) {
    const cleanText = text.replace(/^\uFEFF/, '');
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuote = false;

    for (let i = 0; i < cleanText.length; i++) {
        const char = cleanText[i];
        const nextChar = cleanText[i + 1];

        if (char === '"') {
            if (inQuote && nextChar === '"') {
                currentField += '"';
                i++;
            } else {
                inQuote = !inQuote;
            }
        } else if (char === ',' && !inQuote) {
            currentRow.push(currentField.trim());
            currentField = '';
        } else if ((char === '\r' || char === '\n') && !inQuote) {
            if (char === '\r' && nextChar === '\n') i++;
            currentRow.push(currentField.trim());
            rows.push(currentRow);
            currentRow = [];
            currentField = '';
        } else {
            currentField += char;
        }
    }

    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
    }

    if (rows.length === 0) return [];

    // Get CSV language setting
    const csvLang = state.config?.app?.csvLanguage || 'en';
    const csvKeywords = translations?.csvKeywords || {};

    // Translate headers if Italian CSV
    let headers = rows[0].map(h => h.toLowerCase().trim());
    if (csvLang === 'it' && csvKeywords.columns) {
        headers = headers.map(h => csvKeywords.columns[h] || h);
    }

    return rows.slice(1)
        .filter(row => row.length > 1)
        .map(row => {
            const rowObj = {};
            headers.forEach((h, i) => {
                let value = row[i] || '';

                // Translate Italian values if needed
                if (csvLang === 'it') {
                    const lowerVal = value.toLowerCase().trim();

                    // Translate boolean values
                    if (csvKeywords.values && csvKeywords.values[lowerVal]) {
                        value = csvKeywords.values[lowerVal];
                    }

                    // Translate type column
                    if (h === 'type' && csvKeywords.types && csvKeywords.types[lowerVal]) {
                        value = csvKeywords.types[lowerVal];
                    }

                    // Translate day column
                    if (h === 'day' && csvKeywords.days && csvKeywords.days[lowerVal]) {
                        value = csvKeywords.days[lowerVal];
                    }
                }

                rowObj[h] = value;
            });
            return rowObj;
        });
}

// Parse unified CSV with horizontal marker row structure
function parseUnifiedCSV(text) {
    const cleanText = text.replace(/^\uFEFF/, '');
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuote = false;

    // Parse CSV into 2D array
    for (let i = 0; i < cleanText.length; i++) {
        const char = cleanText[i];
        const nextChar = cleanText[i + 1];

        if (char === '"') {
            if (inQuote && nextChar === '"') {
                currentField += '"';
                i++;
            } else {
                inQuote = !inQuote;
            }
        } else if (char === ',' && !inQuote) {
            currentRow.push(currentField.trim());
            currentField = '';
        } else if ((char === '\r' || char === '\n') && !inQuote) {
            if (char === '\r' && nextChar === '\n') i++;
            currentRow.push(currentField.trim());
            rows.push(currentRow);
            currentRow = [];
            currentField = '';
        } else {
            currentField += char;
        }
    }

    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
    }

    if (rows.length < 3) return { bar: [], kitchen: [], timeslots: [], content: [], categories: [] };

    const csvLang = state.config?.app?.csvLanguage || 'en';
    const csvKeywords = TRANSLATIONS?.csvKeywords || {};

    // Row 0: Table markers (bar, kitchen, timeslots, content, categories)
    // Row 1: Column headers for each table
    // Row 2+: Data

    const markerRow = rows[0].map(m => m.toLowerCase().trim());
    let headerRow = rows[1].map(h => h.toLowerCase().trim());

    // Find table boundaries by detecting changes in marker row
    const tableBoundaries = [];
    let currentTable = null;
    let startCol = 0;

    for (let col = 0; col < markerRow.length; col++) {
        const tableId = markerRow[col];

        if (tableId !== currentTable) {
            if (currentTable !== null) {
                tableBoundaries.push({ table: currentTable, startCol, endCol: col - 1 });
            }
            currentTable = tableId;
            startCol = col;
        }
    }
    if (currentTable !== null) {
        tableBoundaries.push({ table: currentTable, startCol, endCol: markerRow.length - 1 });
    }

    // Build reverse lookup maps (Italian → English) from translations (English → Italian)
    const reverseColumns = {};
    const reverseTypes = {};
    const reverseValues = {};
    const reverseDays = {};

    if (csvLang === 'it' && csvKeywords) {
        // Invert the mappings for lookup
        if (csvKeywords.columns) {
            Object.entries(csvKeywords.columns).forEach(([en, it]) => {
                reverseColumns[it] = en;
            });
        }
        if (csvKeywords.types) {
            Object.entries(csvKeywords.types).forEach(([en, it]) => {
                reverseTypes[it] = en;
            });
        }
        if (csvKeywords.values) {
            Object.entries(csvKeywords.values).forEach(([en, it]) => {
                reverseValues[it] = en;
            });
        }
        if (csvKeywords.days) {
            Object.entries(csvKeywords.days).forEach(([en, it]) => {
                reverseDays[it] = en;
            });
        }
    }

    // Translate column headers if Italian (use reverse lookup)
    if (csvLang === 'it') {
        headerRow = headerRow.map(h => reverseColumns[h] || h);
    }

    // Extract data for each table
    const result = { bar: [], kitchen: [], timeslots: [], content: [], categories: [] };

    tableBoundaries.forEach(({ table, startCol, endCol }) => {
        if (!result.hasOwnProperty(table)) return;

        const tableHeaders = headerRow.slice(startCol, endCol + 1);

        for (let r = 2; r < rows.length; r++) {
            const row = rows[r];
            const rowObj = {};
            let hasData = false;

            tableHeaders.forEach((h, i) => {
                const colIdx = startCol + i;
                let value = row[colIdx] || '';

                if (value.trim()) hasData = true;

                // Translate Italian values if needed (use reverse lookup)
                if (csvLang === 'it' && value) {
                    const lowerVal = value.toLowerCase().trim();

                    // Translate value columns (vegan, vegetarian, etc.) using reverse lookups
                    if (reverseValues[lowerVal]) {
                        value = reverseValues[lowerVal];
                    }

                    // Translate type column (content types like menu_header_kitchen)
                    if (h === 'type' && reverseTypes[lowerVal]) {
                        value = reverseTypes[lowerVal];
                    }

                    // Translate day column
                    if (h === 'day' && reverseDays[lowerVal]) {
                        value = reverseDays[lowerVal];
                    }
                }

                rowObj[h] = value;
            });

            // Only add rows with actual data
            if (hasData) {
                result[table].push(rowObj);
            }
        }
    });

    return result;
}

function isTruthy(val) {
    if (!val) return false;
    const s = String(val).toLowerCase().trim();
    return ['true', '1', 'x', 'si', 'sì', 'yes', 'vero'].includes(s);
}

// Parse number from CSV, handling Italian (comma) or US (dot) decimal format
function parseNumber(val) {
    if (!val) return NaN;
    const format = state.config?.app?.csvNumberFormat || 'us';
    let s = String(val).trim();
    if (format === 'it') {
        // Italian format: comma is decimal separator
        s = s.replace(',', '.');
    }
    return parseFloat(s);
}

// Parse time from CSV - handles both HH:MM format and decimal fractions (0.29166667 = 7:00)
function parseTimeValue(val) {
    if (!val) return '';
    let s = String(val).trim();

    // If it looks like HH:MM format, return as-is
    if (s.includes(':')) return s;

    // Convert Italian decimal format (comma → dot) if needed
    const format = state.config?.app?.csvNumberFormat || 'us';
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

function parsePrice(val) {
    if (!val) return '';
    const n = parseNumber(val);
    return isNaN(n) ? String(val).trim() : n.toFixed(2).replace('.', ',');
}

function getAllergens(row) {
    return Object.entries(ALLERGENS)
        .filter(([col]) => isTruthy(row[col]))
        .map(([colKey, info]) => ({ ...info, colKey }))
        .sort((a, b) => a.number - b.number);
}

function getAllergenKeys(row) {
    return Object.keys(ALLERGENS).filter(col => isTruthy(row[col]));
}

function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ========================================
// Data Processing
// ========================================

function processMenuData(rawData, categoryData = []) {
    // Column names are now English (translated from Italian in parseCSV if needed)
    // Item order is determined by row position in CSV (index)
    // Category order comes from categories table

    // Build category order lookup from categories table
    const categoryOrderMap = {};
    categoryData.forEach(cat => {
        categoryOrderMap[cat.id] = parseFloat(cat.order) || 999;
    });

    const activeItems = rawData.filter(row => isTruthy(row.active));

    let lastSheetUpdate = null;
    rawData.forEach(r => {
        if (r.last_updated?.trim()) lastSheetUpdate = r.last_updated.trim();
    });

    // Build category label lookup from categories table
    const categoryLabelMap = {};
    categoryData.forEach(cat => {
        const catId = (cat.category_id || cat.id || '').toLowerCase().trim();
        categoryLabelMap[catId] = {
            label_it: cat.label_it || catId,
            label_en: cat.label_en || catId
        };
    });

    const categories = {};
    activeItems.forEach((row, index) => {
        const catId = (row.category || 'other').toLowerCase().trim();
        const catLabels = categoryLabelMap[catId] || { label_it: catId, label_en: catId };

        if (!categories[catId]) {
            categories[catId] = {
                id: catId,
                name_it: catLabels.label_it,
                name_en: catLabels.label_en,
                order: categoryOrderMap[catId] || 999,
                items: []
            };
        }

        const tipo = (row.type || 'standard').toLowerCase().trim();

        categories[catId].items.push({
            nome_it: row.name_it || '',
            nome_en: row.name_en || row.name_it || '',
            desc_it: row.description_it || '',
            desc_en: row.description_en || row.description_it || '',
            price: parsePrice(row.price),
            order: index, // Use row index for ordering (preserves CSV order)
            allergens: getAllergens(row),
            allergenKeys: getAllergenKeys(row),
            tipo: tipo
        });
    });

    // Items already in CSV order, just sort categories by their order
    return {
        categories: Object.values(categories).sort((a, b) => a.order - b.order),
        lastSheetUpdate
    };
}

// Day order for sorting and collapse logic
const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function collapseAdjacentDays(entries) {
    if (entries.length === 0) return [];

    // Sort by day order
    entries.sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));

    const groups = [];
    let currentGroup = null;

    entries.forEach(entry => {
        const signature = `${entry.slot1}|${entry.slot2}`;
        if (currentGroup && currentGroup.signature === signature) {
            currentGroup.endEntry = entry;
        } else {
            if (currentGroup) groups.push(currentGroup);
            currentGroup = {
                startEntry: entry,
                endEntry: entry,
                signature,
                slot1: entry.slot1,
                slot2: entry.slot2
            };
        }
    });
    if (currentGroup) groups.push(currentGroup);

    return groups.map(g => ({
        days_it: g.startEntry === g.endEntry
            ? g.startEntry.label_it
            : `${g.startEntry.label_it} - ${g.endEntry.label_it}`,
        days_en: g.startEntry === g.endEntry
            ? g.startEntry.label_en
            : `${g.startEntry.label_en} - ${g.endEntry.label_en}`,
        slot1: g.slot1,
        slot2: g.slot2
    }));
}

function processInfoData(rawData) {
    const sections = {
        timeSlots: [], // Unified: all time-based periods
        timeSlotsForHero: [], // Filtered: show_in_hero === true
        timeSlotsForInfo: [], // Filtered: show_in_info === true (grouped for display)
        menuHeaderKitchen: null,
        menuHeaderBar: null,
        contentItems: [] // Preserves order of texts and CTAs
    };

    // Map to collect time slots by slot_id
    const timeSlotsMap = new Map();

    // Day name to number mapping (1=Mon...7=Sun)
    const dayToNum = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 };

    rawData.forEach(row => {
        const type = (row.type || '').toLowerCase().trim();
        const day = (row.day || '').toLowerCase().trim();

        if (type === 'time_slot' && day && row.slot_id) {
            // Parse unified time_slot rows
            const slotId = row.slot_id.toLowerCase().trim();
            const dayNum = dayToNum[day];
            if (!dayNum) return;

            if (!timeSlotsMap.has(slotId)) {
                timeSlotsMap.set(slotId, {
                    id: slotId,
                    label_it: row.label_it || slotId,
                    label_en: row.label_en || slotId,
                    isKitchen: row.is_kitchen === 'true',
                    showInHero: row.show_in_hero === 'true',
                    showInInfo: row.show_in_info === 'true',
                    schedule: []
                });
            }

            const slot = timeSlotsMap.get(slotId);
            // Add schedule entry for this day
            if (row.slot1_open && row.slot1_close) {
                slot.schedule.push({
                    day: dayNum,
                    dayLabel_it: row.label_it || '',
                    dayLabel_en: row.label_en || '',
                    open: row.slot1_open,
                    close: row.slot1_close
                });
            }
        } else if (type === 'menu_header_kitchen') {
            sections.menuHeaderKitchen = {
                title_it: row.label_it || '',
                title_en: row.label_en || '',
                text_it: row.text_it || '',
                text_en: row.text_en || '',
                style: row.style || 'card'
            };
        } else if (type === 'menu_header_bar') {
            sections.menuHeaderBar = {
                title_it: row.label_it || '',
                title_en: row.label_en || '',
                text_it: row.text_it || '',
                text_en: row.text_en || '',
                style: row.style || 'card'
            };
        } else if (type === 'text') {
            sections.contentItems.push({
                type: 'text',
                label_it: row.label_it || '',
                label_en: row.label_en || '',
                text_it: row.text_it || '',
                text_en: row.text_en || '',
                style: row.style || 'plain'
            });
        } else if (type === 'cta') {
            sections.contentItems.push({
                type: 'cta',
                label_it: row.label_it || '',
                label_en: row.label_en || '',
                link: row.link || '',
                style: row.style || 'secondary'
            });
        }
    });

    // Convert timeSlots map to array
    sections.timeSlots = Array.from(timeSlotsMap.values());

    // Filter for hero display
    sections.timeSlotsForHero = sections.timeSlots.filter(s => s.showInHero);

    // Filter for info page display and collapse adjacent days
    sections.timeSlotsForInfo = sections.timeSlots
        .filter(s => s.showInInfo)
        .map(slot => ({
            ...slot,
            collapsedSchedule: collapseTimeSlotDays(slot.schedule)
        }));

    return sections;
}

// Helper: Collapse adjacent days with same open/close times for info page display
function collapseTimeSlotDays(schedule) {
    if (!schedule || schedule.length === 0) return [];

    // Sort by day
    const sorted = [...schedule].sort((a, b) => a.day - b.day);

    const dayNames_it = ['', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
    const dayNames_en = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const collapsed = [];
    let current = null;

    for (const sched of sorted) {
        const key = `${sched.open}-${sched.close}`;

        if (current && current.key === key && current.endDay === sched.day - 1) {
            // Extend current range
            current.endDay = sched.day;
        } else {
            // Start new range
            if (current) collapsed.push(current);
            current = {
                key,
                startDay: sched.day,
                endDay: sched.day,
                open: sched.open,
                close: sched.close
            };
        }
    }
    if (current) collapsed.push(current);

    // Format day ranges
    return collapsed.map(c => {
        const start_it = dayNames_it[c.startDay];
        const end_it = dayNames_it[c.endDay];
        const start_en = dayNames_en[c.startDay];
        const end_en = dayNames_en[c.endDay];

        return {
            days_it: c.startDay === c.endDay ? start_it : `${start_it} - ${end_it}`,
            days_en: c.startDay === c.endDay ? start_en : `${start_en} - ${end_en}`,
            times: `${c.open} - ${c.close}`
        };
    });
}



// ========================================
// Filtering Logic
// ========================================

function applyFiltersToData(categories) {
    const { diet, excludeAllergens } = state.filters;

    return categories
        .map(cat => {
            const filteredItems = cat.items.filter(item => {
                // Diet filter (item.tipo is in English after translation: vegan, vegetarian, standard)
                if (diet === 'vegan' && item.tipo !== 'vegan') {
                    return false;
                }
                if (diet === 'vegetarian' && item.tipo !== 'vegetarian' && item.tipo !== 'vegan') {
                    return false;
                }

                // Allergen exclusion filter
                if (excludeAllergens.length > 0) {
                    const hasExcludedAllergen = item.allergenKeys.some(key => excludeAllergens.includes(key));
                    if (hasExcludedAllergen) return false;
                }

                return true;
            });

            return { ...cat, items: filteredItems };
        })
        .filter(cat => cat.items.length > 0);
}

// ========================================
// Core Logic
// ========================================

async function loadConfig() {
    try {
        const response = await fetch('config/config.json?t=' + Date.now());
        if (!response.ok) throw new Error('Config load failed');
        state.config = await response.json();
        applyConfig();
    } catch (e) {
        console.error('Failed to load config:', e);
        // Fallback or critical error handling
        elements.storeName.textContent = 'Configuration Error';
    }
}

function applyConfig() {
    if (!state.config) return;

    const { app, urls, allergens, foodTypes } = state.config;

    // Apply branding
    if (app?.name) elements.storeName.textContent = app.name;
    // Color is now handled via generate-theme and colors.css

    if (app?.logoUrl) {
        elements.storeLogo.src = app.logoUrl;
        elements.storeLogo.hidden = false;
    }

    // Update CONFIG URLs
    if (urls) {
        CONFIG.kitchen.url = urls.kitchen;
        CONFIG.bar.url = urls.bar;
        CONFIG.info = { url: urls.info, name: 'Info' };
    }

    // Set ALLERGENS from config
    if (allergens) {
        ALLERGENS = allergens;
    }

    // Set FOOD_TYPES from config
    if (foodTypes) {
        FOOD_TYPES = foodTypes;
    }
}

// Fetch and process unified menu.csv (single file with all tables)
async function fetchUnifiedData(isRefresh = true) {
    try {
        const menuUrl = state.config?.urls?.menu;
        let response;
        let text;
        let usingFallback = false;

        // Try remote URL first if configured
        if (menuUrl) {
            try {
                const fetchUrl = menuUrl + (menuUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
                response = await fetch(fetchUrl);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                text = await response.text();
            } catch (err) {
                console.warn(`Remote menu fetch failed (${err.message}). Falling back to local file.`);
                response = null;
                usingFallback = true;
            }
        } else {
            usingFallback = true;
        }

        // Fallback to local fallback_data.csv
        if (!text) {
            response = await fetch(`./config/fallback_data.csv?t=${Date.now()}`);
            if (!response.ok) throw new Error(`Fallback file not found: ${response.status}`);
            text = await response.text();
        }

        // Track fallback state and show/hide warning
        state.usingFallback = usingFallback;
        if (elements.staleDataBanner) {
            elements.staleDataBanner.hidden = !usingFallback;
        }


        const parsed = parseUnifiedCSV(text);

        // Process each table (pass categories for order lookup)
        state.data.bar = processMenuData(parsed.bar, parsed.categories);
        state.data.kitchen = processMenuData(parsed.kitchen, parsed.categories);
        state.data.timeslots = processTimeslotsData(parsed.timeslots);
        state.data.content = processContentData(parsed.content);
        state.data.categories = parsed.categories;

        console.log('Timeslots raw (first 3):', parsed.timeslots?.slice(0, 3));
        console.log('Processed timeslots:', state.data.timeslots);

        // Create info object for compatibility with existing hero/info page logic
        state.data.info = {
            timeSlots: state.data.timeslots.timeSlots || [],
            timeSlotsForHero: state.data.timeslots.timeSlotsForHero || [],
            timeSlotsForInfo: state.data.timeslots.timeSlotsForInfo || [],
            menuHeaderKitchen: state.data.content.menuHeaderKitchen,
            menuHeaderBar: state.data.content.menuHeaderBar,
            contentItems: state.data.content.contentItems
        };

        state.lastFetch.unified = new Date();

        if (isRefresh) {
            render();
            elements.errorBanner.hidden = true;
            if (!elements.loadingState.hidden) elements.loadingState.hidden = true;
            showUpdateIndicator();
        }

    } catch (e) {
        console.error('Unified fetch error:', e);
        if (isRefresh) {
            elements.errorBanner.hidden = false;
            elements.loadingState.hidden = true;
        }
    }
}

// Process timeslots data (from unified CSV)
function processTimeslotsData(rawData) {
    const timeSlotsMap = new Map();
    const dayToNum = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 };

    rawData.forEach(row => {
        const slotId = (row.slot_id || '').toLowerCase().trim();
        const day = (row.day || '').toLowerCase().trim();
        const dayNum = dayToNum[day];

        if (!slotId || !dayNum) return;

        if (!timeSlotsMap.has(slotId)) {
            timeSlotsMap.set(slotId, {
                id: slotId,
                label_it: row.label_it || slotId,
                label_en: row.label_en || slotId,
                isKitchen: isTruthy(row.is_kitchen),
                showInHero: isTruthy(row.show_in_hero),
                showInInfo: isTruthy(row.show_in_info),
                schedule: []
            });
        }

        const slot = timeSlotsMap.get(slotId);
        if (row.open && row.close) {
            slot.schedule.push({
                day: dayNum,
                open: parseTimeValue(row.open),
                close: parseTimeValue(row.close)
            });
        }
    });

    const timeSlots = Array.from(timeSlotsMap.values());

    return {
        timeSlots,
        timeSlotsForHero: timeSlots.filter(s => s.showInHero),
        timeSlotsForInfo: timeSlots
            .filter(s => s.showInInfo)
            .map(slot => ({
                ...slot,
                collapsedSchedule: collapseTimeSlotDays(slot.schedule)
            }))
    };
}

// Process content data (texts, CTAs, headers from unified CSV)
function processContentData(rawData) {
    const result = {
        menuHeaderKitchen: null,
        menuHeaderBar: null,
        contentItems: []
    };

    rawData.forEach(row => {
        const type = (row.type || '').toLowerCase().trim();

        if (type === 'menu_header_kitchen') {
            result.menuHeaderKitchen = {
                title_it: row.label_it || '',
                title_en: row.label_en || '',
                text_it: row.text_it || '',
                text_en: row.text_en || '',
                style: row.style || 'card'
            };
        } else if (type === 'menu_header_bar') {
            result.menuHeaderBar = {
                title_it: row.label_it || '',
                title_en: row.label_en || '',
                text_it: row.text_it || '',
                text_en: row.text_en || '',
                style: row.style || 'card'
            };
        } else if (type === 'text') {
            result.contentItems.push({
                type: 'text',
                label_it: row.label_it || '',
                label_en: row.label_en || '',
                text_it: row.text_it || '',
                text_en: row.text_en || '',
                style: row.style || 'plain'
            });
        } else if (type === 'cta') {
            result.contentItems.push({
                type: 'cta',
                label_it: row.label_it || '',
                label_en: row.label_en || '',
                link: row.link || '',
                style: row.style || 'secondary'
            });
        }
    });

    return result;
}

async function fetchData(tab, isRefresh = true) {
    if (!CONFIG[tab]) return;

    let url = CONFIG[tab].url;
    let usingFallback = false;

    if (!url || url.includes('PASTE_')) {
        usingFallback = true;
    }

    try {
        let response;
        let text;

        if (!usingFallback) {
            try {
                const fetchUrl = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
                response = await fetch(fetchUrl);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                text = await response.text();
            } catch (err) {
                console.warn(`Remote fetch failed (${err.message}). Switching to fallback.`);
                usingFallback = true;
            }
        }

        if (usingFallback) {
            // Load correct language version of CSV
            const csvLang = state.config?.app?.csvLanguage || 'en';
            const suffix = csvLang === 'it' ? '_it' : '';
            response = await fetch(`./${tab}${suffix}.csv?t=${Date.now()}`);
            if (!response.ok) throw new Error(`Local file not found: ${response.status}`);
            text = await response.text();
        }

        const parsed = parseCSV(text);
        const data = tab === 'info' ? processInfoData(parsed) : processMenuData(parsed);

        state.data[tab] = data;
        state.lastFetch[tab] = new Date();

        // Only render/update UI during refresh (not initial load)
        if (isRefresh && state.currentTab === tab) {
            render();
            elements.errorBanner.hidden = true;
            if (!elements.loadingState.hidden) elements.loadingState.hidden = true;
            showUpdateIndicator();
            window.scrollTo({ top: 0, behavior: 'instant' });
        }

    } catch (e) {
        console.error(`Final fetch error for ${tab}:`, e);
        if (isRefresh && state.currentTab === tab) {
            elements.errorBanner.hidden = false;
            elements.loadingState.hidden = true;
            if (state.currentTab === 'info') {
                elements.infoContainer.hidden = true;
            } else if (!state.data[tab]) {
                elements.menuContainer.hidden = true;
            }
        }
    }
}

function render() {
    const tab = state.currentTab;
    const data = state.data[tab];
    // Last updated logic removed

    if (!data) {
        elements.menuContainer.hidden = true;
        elements.emptyState.hidden = true;
        elements.loadingState.hidden = false;
        return;
    }

    elements.loadingState.hidden = true;

    if (tab === 'info') {
        // Hide filter bar on Info tab (but show hero)
        document.querySelector('.filter-bar').hidden = true;
        updateHeroContent();
        renderInfoPage();
        elements.menuContainer.hidden = true;
        elements.infoContainer.hidden = false;
        elements.emptyState.hidden = true;
        return;
    }

    // Show filter bar on menu tabs
    document.querySelector('.filter-bar').hidden = false;

    // Update collapsible header hero content
    updateHeroContent();

    elements.infoContainer.hidden = true;
    const filteredCategories = applyFiltersToData(data.categories);

    if (filteredCategories.length === 0) {
        elements.menuContainer.hidden = true;
        elements.emptyState.hidden = false;
        return;
    }

    elements.emptyState.hidden = true;
    elements.menuContainer.hidden = false;

    const lang = state.currentLanguage;
    let html = '';

    // Menu header card (if available from info.csv) - displayed inline in menu
    const infoData = state.data.info;
    if (infoData) {
        const header = tab === 'kitchen' ? infoData.menuHeaderKitchen : infoData.menuHeaderBar;
        if (header) {
            const title = lang === 'it' ? header.title_it : header.title_en;
            const text = lang === 'it' ? header.text_it : header.text_en;
            if (text || title) {
                const isCard = header.style === 'card';
                html += `
                    <div class="menu-header ${isCard ? 'menu-header-card' : 'menu-header-plain'}">
                        ${title ? `<h2 class="menu-header-title">${escapeHTML(title)}</h2>` : ''}
                        ${text ? `<p class="menu-header-text">${escapeHTML(text)}</p>` : ''}
                    </div>
                `;
            }
        }
    }

    filteredCategories.forEach(cat => {
        const categoryName = lang === 'it' ? cat.name_it : cat.name_en;
        html += `
            <section class="category-section">
                <h2 class="category-title">${escapeHTML(categoryName)}</h2>
                <div class="menu-items">
        `;

        cat.items.forEach(item => {
            const name = lang === 'it' ? item.nome_it : item.nome_en;
            const desc = lang === 'it' ? item.desc_it : item.desc_en;
            const foodType = FOOD_TYPES[item.tipo] || FOOD_TYPES['standard'];
            const foodTypeLabel = foodType.labelKey ? t(foodType.labelKey) : '';
            const priceFormatted = formatPrice(item.price);

            // Build footer row with diet badge and allergens
            let footerHtml = '';
            const hasDietBadge = foodTypeLabel;
            const hasAllergens = item.allergens && item.allergens.length > 0;

            if (hasDietBadge || hasAllergens) {
                footerHtml = '<div class="item-footer">';
                if (hasDietBadge) {
                    footerHtml += `
                        <span class="food-type-badge ${foodType.class}">
                            <span class="food-type-icon">${foodType.icon}</span>
                            ${foodTypeLabel}
                        </span>
                    `;
                }
                if (hasAllergens) {
                    footerHtml += renderAllergens(item.allergens);
                }
                footerHtml += '</div>';
            }

            html += `
                <article class="menu-item">
                    <div class="item-header">
                        <h3 class="item-name">${escapeHTML(name)}</h3>
                        ${priceFormatted ? `<span class="item-price">${priceFormatted}</span>` : ''}
                    </div>
                    ${desc ? `<p class="item-description">${escapeHTML(desc)}</p>` : ''}
                    ${footerHtml}
                </article>
            `;
        });

        html += '</div></section>';
    });

    // Add allergen info footer
    const allergensSlug = state.config?.pages?.allergens?.slug || 'allergens';
    const allergensPage = `pages/${lang}/${allergensSlug}.html`;
    html += `
        <div class="allergen-info-footer">
            <p>${t('menu.allergenFooter')}</p>
            <a href="${allergensPage}" class="allergen-info-link">${t('menu.allergenMoreInfo')}</a>
        </div>
    `;

    elements.menuContainer.innerHTML = html;
}

function renderInfoPage() {
    const data = state.data.info;
    const config = state.config;
    if (!data || !config) return;

    const lang = state.currentLanguage;
    let html = '';

    // 1. Content Items (texts and CTAs in CSV order)
    data.contentItems.forEach(item => {
        if (item.type === 'text') {
            const label = lang === 'it' ? item.label_it : item.label_en;
            const text = lang === 'it' ? item.text_it : item.text_en;
            const isCard = item.style === 'card';
            html += `
                <section class="info-section ${isCard ? 'info-section-card' : 'info-section-plain'}">
                    ${label ? `<h2 class="info-title">${escapeHTML(label)}</h2>` : ''}
                    <p class="info-text">${escapeHTML(text)}</p>
                </section>
            `;
        } else if (item.type === 'cta') {
            const label = lang === 'it' ? item.label_it : item.label_en;
            const isPrimary = item.style === 'primary';
            html += `
                <a href="${item.link}" class="cta-btn ${isPrimary ? 'primary' : 'secondary'}">
                    ${escapeHTML(label)}
                </a>
            `;
        }
    });

    html += `<div _ngcontent-hlg-c24="" class="squiggle"><svg _ngcontent-hlg-c24="" aria-hidden="true" width="100%" height="8" fill="none" xmlns="http://www.w3.org/2000/svg"><pattern _ngcontent-hlg-c24="" id="a" width="91" height="8" patternUnits="userSpaceOnUse"><g _ngcontent-hlg-c24="" clip-path="url(#clip0_2426_11367)"><path _ngcontent-hlg-c24="" d="M114 4c-5.067 4.667-10.133 4.667-15.2 0S88.667-.667 83.6 4 73.467 8.667 68.4 4 58.267-.667 53.2 4 43.067 8.667 38 4 27.867-.667 22.8 4 12.667 8.667 7.6 4-2.533-.667-7.6 4s-10.133 4.667-15.2 0S-32.933-.667-38 4s-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0" stroke="#E1E3E1" stroke-linecap="square"></path></g></pattern><rect _ngcontent-hlg-c24="" width="100%" height="100%" fill="url(#a)"></rect></svg></div>`;

    // 2. Timetables (from unified time_slot rows in CSV)
    if (data.timeSlotsForInfo && data.timeSlotsForInfo.length > 0) {
        html += `<section class="info-card">`;

        data.timeSlotsForInfo.forEach((slot, index) => {
            const title = lang === 'it' ? slot.label_it : slot.label_en;
            const marginTop = index > 0 ? 'margin-top: 16px;' : '';

            if (slot.collapsedSchedule && slot.collapsedSchedule.length > 0) {
                html += `<h3 class="info-title" style="${marginTop}">${escapeHTML(title)}</h3><div class="timetable-grid">`;
                slot.collapsedSchedule.forEach(sched => {
                    const days = lang === 'it' ? sched.days_it : sched.days_en;
                    html += `
                        <div class="time-row">
                            <span class="time-days">${escapeHTML(days)}</span>
                            <span class="time-hours">${escapeHTML(sched.times)}</span>
                        </div>`;
                });
                html += `</div>`;
            }
        });

        html += `</section>`;
    }

    // 3. Contacts Section (at the end, flat style)
    const hasAddress = config.contact?.address;
    const hasPhone = config.contact?.phone;
    const hasEmail = config.contact?.email;
    const hasSocials = config.contact?.socials && config.contact.socials.length > 0;
    const hasWebsites = config.contact?.websites && config.contact.websites.length > 0;

    if (hasAddress || hasPhone || hasEmail || hasSocials || hasWebsites) {
        const contactsTitle = lang === 'it' ? 'Contatti' : 'Contacts';
        html += `<section class="info-section contacts-section">`;
        html += `<h2 class="info-title">${contactsTitle}</h2>`;

        if (hasAddress) {
            html += `
                <div class="contact-row">
                    <span class="fluent-icon" aria-hidden="true">&#xf481;</span>
                    ${escapeHTML(config.contact.address)}
                </div>
            `;
        }
        if (hasPhone) {
            html += `
                <a href="tel:${config.contact.phone.replace(/\s/g, '')}" class="contact-row">
                    <span class="fluent-icon" aria-hidden="true">&#xe271;</span>
                    ${escapeHTML(config.contact.phone)}
                </a>
            `;
        }
        if (hasEmail) {
            html += `
                <a href="mailto:${config.contact.email}" class="contact-row">
                    <span class="fluent-icon" aria-hidden="true">&#xf507;</span>
                    ${escapeHTML(config.contact.email)}
                </a>
            `;
        }

        // Social links
        if (hasSocials) {
            config.contact.socials.forEach(social => {
                let iconHtml = '';
                if (social.name.toLowerCase() === 'instagram') {
                    iconHtml = `<img src="assets/icons/Instagram_Glyph_Black.svg" alt="" class="social-icon" aria-hidden="true">`;
                } else {
                    iconHtml = `<span class="fluent-icon" aria-hidden="true">&#xf583;</span>`;
                }
                html += `
                    <a href="${social.url}" target="_blank" rel="noopener" class="contact-row">
                        ${iconHtml}
                        <span class="link-name">${escapeHTML(social.name)}</span>
                        <span class="link-label">${escapeHTML(social.label)}</span>
                    </a>
                `;
            });
        }

        // Website links
        if (hasWebsites) {
            config.contact.websites.forEach(site => {
                html += `
                    <a href="${site.url}" target="_blank" rel="noopener" class="contact-row">
                        <span class="fluent-icon" aria-hidden="true">&#xf45b;</span>
                        <span class="link-label">${escapeHTML(site.label)}</span>
                    </a>
                `;
            });
        }

        html += `</section>`;
    }

    elements.infoContainer.innerHTML = html;
}

function renderAllergens(list) {
    if (!list || list.length === 0) return '';

    let html = '<div class="allergen-chips">';
    list.forEach(a => {
        const name = tAllergen(a.key);
        html += `
            <span class="allergen-chip">
                <span class="allergen-icon">${a.icon}</span>
                ${escapeHTML(name)}
            </span>
        `;
    });
    html += '</div>';
    return html;
}

function showUpdateIndicator() {
    if (!elements.updateIndicator) return;
    elements.updateIndicator.classList.add('visible');
    setTimeout(() => elements.updateIndicator.classList.remove('visible'), 2000);
}

// ========================================
// Filter UI
// ========================================

function updateActiveFilterDisplay() {
    const { diet, excludeAllergens } = state.filters;
    const hasFilters = diet !== 'all' || excludeAllergens.length > 0;

    // Update trigger button
    elements.filterTrigger.classList.toggle('has-filters', hasFilters);

    // Update inline clear button visibility
    if (elements.inlineClearFilters) {
        elements.inlineClearFilters.hidden = !hasFilters;
    }

    // Update active filters display
    elements.activeFilters.hidden = !hasFilters;

    // Diet chip
    if (diet !== 'all') {
        const dietInfo = diet === 'vegan'
            ? { icon: '🌱', label: t('filters.dietVegan'), class: '' }
            : { icon: '🌿', label: t('filters.dietVegetarian'), class: 'vegetarian' };

        elements.dietChip.hidden = false;
        elements.dietChip.className = `filter-chip diet-chip ${dietInfo.class}`;
        elements.dietChip.querySelector('.chip-icon').textContent = dietInfo.icon;
        elements.dietChip.querySelector('.chip-label').textContent = dietInfo.label;
    } else {
        elements.dietChip.hidden = true;
    }

    // Allergen count chip
    if (excludeAllergens.length > 0) {
        elements.allergenChip.hidden = false;
        elements.allergenChip.querySelector('.chip-label').textContent =
            `${excludeAllergens.length} ${t('filters.allergensExcluded')}`;
    } else {
        elements.allergenChip.hidden = true;
    }
}

function updateThemeColor() {
    // Get the computed background color from CSS variable
    const computedStyle = getComputedStyle(document.documentElement);
    let themeColor = computedStyle.getPropertyValue('--color-bg').trim();
    if (!themeColor) themeColor = '#ffffff'; // Fallback if variable not found

    // Update or create meta tag
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.name = 'theme-color';
        document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.content = themeColor;
}

function buildAllergenGrid() {
    let html = '';
    Object.entries(ALLERGENS).forEach(([colKey, allergen]) => {
        const isChecked = state.tempFilters.excludeAllergens.includes(colKey);
        const name = tAllergen(allergen.key);
        html += `
            <label class="allergen-checkbox ${isChecked ? 'checked' : ''}" data-key="${colKey}">
                <input type="checkbox" ${isChecked ? 'checked' : ''} aria-label="${name}">
                <span class="allergen-checkbox-icon">${allergen.icon}</span>
                <span class="allergen-checkbox-label">${name}</span>
            </label>
        `;
    });
    elements.allergenGrid.innerHTML = html;

    // Add change handlers
    elements.allergenGrid.querySelectorAll('.allergen-checkbox input').forEach(input => {
        input.addEventListener('change', (e) => {
            const label = e.target.closest('.allergen-checkbox');
            label.classList.toggle('checked', e.target.checked);
        });
    });
}

function syncModalToState() {
    // Sync diet options
    elements.dietOptions.forEach(btn => {
        const isActive = btn.dataset.diet === state.tempFilters.diet;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-checked', isActive);
    });

    // Build allergen grid with current temp state
    buildAllergenGrid();
}

function openFilterModal() {
    // Copy current filters to temp
    state.tempFilters = {
        diet: state.filters.diet,
        excludeAllergens: [...state.filters.excludeAllergens]
    };

    syncModalToState();
    elements.filterModal.hidden = false;
    elements.filterTrigger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';

    // Focus trap - focus first interactive element
    elements.modalClose.focus();
}

function closeFilterModal() {
    elements.filterModal.hidden = true;
    elements.filterTrigger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    elements.filterTrigger.focus();
}

function applyFiltersFromModal() {
    // Get diet from active button
    const activeDiet = document.querySelector('.diet-option.active');
    state.filters.diet = activeDiet ? activeDiet.dataset.diet : 'all';

    // Get allergens from checked boxes
    const checkedBoxes = elements.allergenGrid.querySelectorAll('input:checked');
    state.filters.excludeAllergens = Array.from(checkedBoxes).map(cb =>
        cb.closest('.allergen-checkbox').dataset.key
    );

    updateActiveFilterDisplay();
    closeFilterModal();
    render();

    // Scroll to top to show filtered results from beginning
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Save preferences to localStorage
    savePreferences();

    // Announce to screen readers
    announceToSR(t('filters.filters') + ' ' + t('ui.apply').toLowerCase());
}

function clearAllFilters() {
    // Clear temp filters (for modal)
    state.tempFilters.diet = 'all';
    state.tempFilters.excludeAllergens = [];
    syncModalToState();

    // Also clear actual filters and re-render (for inline button use)
    state.filters.diet = 'all';
    state.filters.excludeAllergens = [];
    updateActiveFilterDisplay();
    render();
    savePreferences();
}

function announceToSR(message) {
    if (elements.srAnnounce) {
        elements.srAnnounce.textContent = message;
        setTimeout(() => { elements.srAnnounce.textContent = ''; }, 1000);
    }
}

// ========================================
// Collapsible Header (Parallax Hero)
// ========================================

const SCROLL_THRESHOLD = 50; // Pixels to scroll before collapsing
let isInitialized = false; // Flag to prevent collapse during page load

function setHeaderExpanded(expanded, scrollToTop = false) {
    state.headerExpanded = expanded;

    if (expanded) {
        elements.appContainer.classList.remove('collapsed');
        elements.filterBar.classList.remove('collapsed');
    } else {
        elements.appContainer.classList.add('collapsed');
        elements.filterBar.classList.add('collapsed');
    }

    // Update aria-expanded
    elements.headerCollapseToggle.setAttribute('aria-expanded', String(expanded));

    // Scroll to top if requested (when expanding via button)
    if (scrollToTop && expanded) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function toggleHeader() {
    const newState = !state.headerExpanded;
    // When expanding, also scroll to top so user can see the content
    setHeaderExpanded(newState, newState);
}

function updateHeroContent() {
    const config = state.config;
    const lang = state.currentLanguage;

    // App name (used for alt text, not displayed as title)
    const appName = config?.app?.name || 'Menu';

    // Localized claim
    const claim = tConfig(config?.app?.claim, '');
    if (elements.heroClaim && claim) {
        elements.heroClaim.textContent = claim;
    }

    // Hero logo with proper alt text (bar name)
    const heroLogoUrl = config?.app?.heroLogo;
    if (heroLogoUrl) {
        elements.heroLogo.src = heroLogoUrl;
        elements.heroLogo.alt = appName; // a11y: alt = bar name
        elements.heroLogo.hidden = false;
    } else {
        elements.heroLogo.hidden = true;
    }

    // Navbar logo (decorative, alt="" since text is adjacent)
    const navbarLogoUrl = config?.app?.navbarLogo;
    if (elements.navbarLogo && navbarLogoUrl) {
        elements.navbarLogo.src = navbarLogoUrl;
        elements.navbarLogo.hidden = false;
    }

    // Update store name in navbar
    if (elements.storeName) {
        elements.storeName.textContent = appName;
    }

    elements.welcomeHero.classList.remove('hidden');

    // Apply current expanded/collapsed state (persist across tabs)
    if (state.headerExpanded) {
        elements.appContainer.classList.remove('collapsed');
    } else {
        elements.appContainer.classList.add('collapsed');
    }

    // Update kitchen status card
    updateKitchenStatus();
}

function handleScroll() {
    // Don't process scroll during initialization
    if (!isInitialized) return;

    const currentScrollY = window.scrollY;
    const scrollDelta = currentScrollY - state.lastScrollY;

    // Scrolling down - collapse header
    if (scrollDelta > 0 && currentScrollY > SCROLL_THRESHOLD && state.headerExpanded) {
        setHeaderExpanded(false);
    }

    state.lastScrollY = currentScrollY;
}

// Handle wheel event for overscroll expand (when already at top)
function handleWheel(e) {
    // Only trigger if at top, scrolling up (negative deltaY), and collapsed
    if (window.scrollY <= 0 && e.deltaY < 0 && !state.headerExpanded) {
        setHeaderExpanded(true, true);
    }
}

// Handle touch events for mobile overscroll expand
let touchStartY = 0;
function handleTouchStart(e) {
    touchStartY = e.touches[0].clientY;
}

function handleTouchMove(e) {
    // Only trigger if at top, swiping down, and collapsed
    if (window.scrollY <= 0 && !state.headerExpanded) {
        const touchY = e.touches[0].clientY;
        const deltaY = touchY - touchStartY;
        // Swiping down (positive deltaY = finger moving down = scroll up gesture)
        if (deltaY > 30) {
            setHeaderExpanded(true, true);
            touchStartY = touchY; // Reset to prevent repeated triggers
        }
    }
}

// ========================================
// Events
// ========================================

function switchTab(newTab) {
    if (state.currentTab === newTab) return;

    elements.navItems.forEach(btn => {
        if (btn.dataset.target === newTab) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    state.currentTab = newTab;

    // Announce page change for screen readers
    const announceName = t(`tab${newTab.charAt(0).toUpperCase() + newTab.slice(1)}`);
    announceToSR(announceName);

    if (state.data[newTab]) {
        render();
        // Scroll to top of content (header state persists)
        window.scrollTo({ top: 0, behavior: 'instant' });
    } else {
        if (newTab === 'info') {
            elements.menuContainer.hidden = true;
            elements.infoContainer.hidden = true; // wait for data
        } else {
            elements.infoContainer.hidden = true;
            elements.menuContainer.hidden = true;
        }
        elements.loadingState.hidden = false;
        fetchData(newTab);
    }
}

// ========================================
// Time Slots & Hero Status Logic
// ========================================

// Parse time string "HH:MM" to minutes since midnight
function parseTimeToMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

// Get upcoming time slots for today
function getUpcomingSlots(now) {
    // Use only slots marked for hero display
    const timeSlots = state.data?.info?.timeSlotsForHero;
    if (!timeSlots || !Array.isArray(timeSlots)) return [];

    const lang = state.currentLanguage;
    // JavaScript getDay(): 0=Sun, 1=Mon...6=Sat. Convert to 1=Mon...7=Sun
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const upcoming = [];

    for (const slot of timeSlots) {
        const label = slot[`label_${lang}`] || slot.label_en || slot.id;

        for (const sched of slot.schedule || []) {
            // CSV structure has single day per row (sched.day is a number)
            if (sched.day !== dayOfWeek) continue;

            const openMinutes = parseTimeToMinutes(sched.open);
            const closeMinutes = parseTimeToMinutes(sched.close);

            // Only show slots that haven't ended yet
            if (closeMinutes > currentMinutes || closeMinutes < openMinutes) {
                // Currently active
                if (openMinutes <= currentMinutes && currentMinutes < closeMinutes) {
                    upcoming.push({
                        label,
                        status: 'active',
                        isKitchen: slot.isKitchen,
                        minutesUntil: 0
                    });
                }
                // Opening later today
                else if (openMinutes > currentMinutes) {
                    upcoming.push({
                        label,
                        status: 'upcoming',
                        isKitchen: slot.isKitchen,
                        minutesUntil: openMinutes - currentMinutes
                    });
                }
            }
        }
    }

    // Sort by status (active first) then by minutesUntil
    upcoming.sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        return a.minutesUntil - b.minutesUntil;
    });

    return upcoming.slice(0, 3); // Max 3 items
}

// Format duration nicely
function formatDuration(minutes) {
    if (minutes < 60) {
        return t('kitchen.inMinutes').replace('{minutes}', minutes);
    } else {
        const hours = Math.round(minutes / 60);
        return t('kitchen.inHours').replace('{hours}', hours);
    }
}

// Update hero status display
function updateKitchenStatus() {
    if (!elements.kitchenStatus) return;

    // Time slots come from unified CSV parsed data
    const timeSlots = state.data?.info?.timeSlotsForHero;
    if (!timeSlots || timeSlots.length === 0) {
        elements.kitchenStatus.hidden = true;
        return;
    }

    const now = new Date();
    const upcomingSlots = getUpcomingSlots(now);

    if (upcomingSlots.length === 0) {
        elements.kitchenStatus.hidden = true;
        return;
    }

    // Build status text
    const parts = [];

    for (const slot of upcomingSlots) {
        if (slot.status === 'active') {
            // Currently active - show as "Pranzo ✓" or just the label
            parts.push(`${slot.label} ✓`);
        } else {
            // Upcoming - show as "Cena tra 2h"
            parts.push(`${slot.label} ${formatDuration(slot.minutesUntil)}`);
        }
    }

    if (parts.length > 0) {
        // Show "Prossimo oggi: X, Y" or just the active ones
        const hasActive = upcomingSlots.some(s => s.status === 'active');
        const prefix = hasActive ? '' : t('kitchen.nextToday') + ': ';
        elements.kitchenStatus.textContent = prefix + parts.join(' · ');
        elements.kitchenStatus.hidden = false;
    } else {
        elements.kitchenStatus.hidden = true;
    }
}


// Tab Navigation
elements.navItems.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.target));
});

// Retry Button (error banner)
elements.retryButton.addEventListener('click', () => fetchUnifiedData(true));

// Stale Data Retry Button
if (elements.staleRetryButton) {
    elements.staleRetryButton.addEventListener('click', () => fetchUnifiedData(true));
}

// Filter Modal
elements.filterTrigger.addEventListener('click', openFilterModal);
elements.modalClose.addEventListener('click', closeFilterModal);
elements.applyFilters.addEventListener('click', applyFiltersFromModal);
elements.clearFilters.addEventListener('click', clearAllFilters);
if (elements.inlineClearFilters) {
    elements.inlineClearFilters.addEventListener('click', clearAllFilters);
}

// Diet options in modal
elements.dietOptions.forEach(btn => {
    btn.addEventListener('click', () => {
        state.tempFilters.diet = btn.dataset.diet;
        elements.dietOptions.forEach(b => {
            const isActive = b === btn;
            b.classList.toggle('active', isActive);
            b.setAttribute('aria-checked', isActive);
        });
    });
});

// Close modal on overlay click
elements.filterModal.addEventListener('click', (e) => {
    if (e.target === elements.filterModal) closeFilterModal();
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !elements.filterModal.hidden) {
        closeFilterModal();
    }
});

// Header collapse toggle
elements.headerCollapseToggle.addEventListener('click', toggleHeader);

// Scroll handler for header collapse (throttled)
let scrollTicking = false;
window.addEventListener('scroll', () => {
    if (!scrollTicking) {
        requestAnimationFrame(() => {
            handleScroll();
            scrollTicking = false;
        });
        scrollTicking = true;
    }
}, { passive: true });

// Wheel handler for overscroll expand (when already at top)
window.addEventListener('wheel', handleWheel, { passive: true });

// Touch handlers for mobile overscroll expand
window.addEventListener('touchstart', handleTouchStart, { passive: true });
window.addEventListener('touchmove', handleTouchMove, { passive: true });

// ========================================
// Init
// ========================================

async function init() {
    try {
        // Load config first (needed for i18n.fallbackLanguage)
        await loadConfig();
        // Then load translations (uses config for fallback language)
        await loadTranslations();

        // Update UI with translations while loading data
        updateUILanguage();
        updateActiveFilterDisplay();

        // Initialize kitchen status interval
        updateKitchenStatus();
        setInterval(updateKitchenStatus, 60000);

        // --- DYNAMIC HERO HEIGHT OBSERVER ---
        const heroObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                if (elements.welcomeHero) {
                    const totalHeight = elements.welcomeHero.offsetHeight;
                    // Set variable to Total Height minus header height approx (60px) to ensure calc work
                    // Margin top = Header + HeroVar + SA
                    // HeroElement = Header + SA + Content
                    // Content = HeroElement - Header - SA
                    // So we want HeroVar to be approx Content.
                    const val = Math.max(0, totalHeight - 64);
                    document.documentElement.style.setProperty('--header-hero-height', `${val}px`);
                }
            }
        });
        if (elements.welcomeHero) {
            heroObserver.observe(elements.welcomeHero);
            // Also observe content changes if possible, but hero outer height change covers it
            if (elements.welcomeHeroContent) heroObserver.observe(elements.welcomeHeroContent);
        }

        // Initial load logic...
        if (!state.currentTab) state.currentTab = 'kitchen';

        // Load all data from unified menu.csv (single fetch)
        await fetchUnifiedData(false);

        // All data loaded - now render
        render();
        elements.loadingState.hidden = true;
        elements.errorBanner.hidden = true;


        // Scroll to top after render (with small delay for reliability)
        requestAnimationFrame(() => {
            window.scrollTo({ top: 0, behavior: 'instant' });
            // Mark initialization complete - allow scroll handlers to work
            isInitialized = true;
        });

    } catch (e) {
        console.error('Initialization error:', e);
        elements.errorBanner.hidden = false;
        elements.loadingState.hidden = true;
    }

    // Smart refresh on visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            const now = new Date();
            const last = state.lastFetch.unified;
            const STALE_THRESHOLD = 5 * 60 * 1000;

            if (!last || (now - last > STALE_THRESHOLD)) {
                // Refresh data using unified fetcher
                fetchUnifiedData(true);
            }
        }
    });
}

// Language switch click handler
elements.langSwitch.addEventListener('click', () => {
    const defaultLang = state.config?.i18n?.defaultLanguage || 'it';
    const newLang = state.currentLanguage === 'en' ? defaultLang : 'en';
    switchLanguage(newLang);
});

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

