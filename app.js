// ========================================
// Configuration
// ========================================

const CONFIG = {
    cuisine: {
        url: "PASTE_CUISINE_CSV_URL_HERE",
        name: "Cucina"
    },
    bar: {
        url: "PASTE_BAR_CSV_URL_HERE",
        name: "Bar"
    }
};

// ========================================
// Translations
// ========================================

const TRANSLATIONS = {
    it: {
        filters: "Filtri",
        dietPreferences: "Preferenze Alimentari",
        dietAll: "Tutti",
        dietVegetarian: "Vegetariano",
        dietVegan: "Vegano",
        excludeAllergens: "Escludi Allergeni",
        excludeAllergensDesc: "I piatti con questi allergeni verranno nascosti.",
        apply: "Applica",
        clearAll: "Cancella tutto",
        close: "Chiudi",
        loading: "Caricamento menu...",
        empty: "Nessun piatto corrisponde ai filtri.",
        errorMessage: "Menu non disponibile.",
        retry: "Riprova",
        updated: "Menu aggiornato",
        allergenDisclaimer: "Chiedi al personale per ulteriori dettagli sugli allergeni.",
        navCuisine: "Cucina",
        navBar: "Bar",
        switchLang: "Passa a Inglese",
        allergensExcluded: "allergeni esclusi",
        allergens: {
            glutine: "Glutine",
            crostacei: "Crostacei",
            uova: "Uova",
            pesce: "Pesce",
            arachidi: "Arachidi",
            soia: "Soia",
            latte: "Latte",
            frutta_a_guscio: "Frutta a guscio",
            sedano: "Sedano",
            senape: "Senape",
            sesamo: "Sesamo",
            solfiti: "Solfiti",
            lupini: "Lupini",
            molluschi: "Molluschi"
        }
    },
    en: {
        filters: "Filters",
        dietPreferences: "Dietary Preferences",
        dietAll: "All",
        dietVegetarian: "Vegetarian",
        dietVegan: "Vegan",
        excludeAllergens: "Exclude Allergens",
        excludeAllergensDesc: "Dishes with these allergens will be hidden.",
        apply: "Apply",
        clearAll: "Clear all",
        close: "Close",
        loading: "Loading menu...",
        empty: "No dishes match your filters.",
        errorMessage: "Menu unavailable.",
        retry: "Retry",
        updated: "Menu updated",
        allergenDisclaimer: "Ask staff for allergen details.",
        navCuisine: "Kitchen",
        navBar: "Bar",
        switchLang: "Switch to Italian",
        allergensExcluded: "allergens excluded",
        allergens: {
            glutine: "Gluten",
            crostacei: "Shellfish",
            uova: "Eggs",
            pesce: "Fish",
            arachidi: "Peanuts",
            soia: "Soy",
            latte: "Milk",
            frutta_a_guscio: "Tree nuts",
            sedano: "Celery",
            senape: "Mustard",
            sesamo: "Sesame",
            solfiti: "Sulphites",
            lupini: "Lupin",
            molluschi: "Molluscs"
        }
    }
};

const ALLERGENS = {
    'all_1_glutine': { number: 1, key: 'glutine', icon: '🌾' },
    'all_2_crostacei': { number: 2, key: 'crostacei', icon: '🦐' },
    'all_3_uova': { number: 3, key: 'uova', icon: '🥚' },
    'all_4_pesce': { number: 4, key: 'pesce', icon: '🐟' },
    'all_5_arachidi': { number: 5, key: 'arachidi', icon: '🥜' },
    'all_6_soia': { number: 6, key: 'soia', icon: '🫘' },
    'all_7_latte': { number: 7, key: 'latte', icon: '🥛' },
    'all_8_frutta_a_guscio': { number: 8, key: 'frutta_a_guscio', icon: '🌰' },
    'all_9_sedano': { number: 9, key: 'sedano', icon: '🥬' },
    'all_10_senape': { number: 10, key: 'senape', icon: '🟡' },
    'all_11_sesamo': { number: 11, key: 'sesamo', icon: '🫛' },
    'all_12_solfiti': { number: 12, key: 'solfiti', icon: '🍷' },
    'all_13_lupini': { number: 13, key: 'lupini', icon: '🌸' },
    'all_14_molluschi': { number: 14, key: 'molluschi', icon: '🐚' }
};

const FOOD_TYPES = {
    'standard': { labelKey: '', icon: '', class: '' },
    'vegetariano': { labelKey: 'dietVegetarian', icon: '🌿', class: 'vegetariano' },
    'vegano': { labelKey: 'dietVegan', icon: '🌱', class: 'vegano' }
};

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

// Load saved preferences
const savedPrefs = loadPreferences();

let state = {
    currentTab: 'cuisine',
    currentLanguage: savedPrefs?.language || 'it',
    data: { cuisine: null, bar: null },
    lastFetch: { cuisine: null, bar: null },
    filters: {
        diet: savedPrefs?.diet || 'all',
        excludeAllergens: savedPrefs?.excludeAllergens || []
    },
    tempFilters: {
        diet: 'all',
        excludeAllergens: []
    }
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
    loadingState: document.getElementById('loadingState'),
    emptyState: document.getElementById('emptyState'),
    menuContainer: document.getElementById('menuContainer'),
    navItems: document.querySelectorAll('.nav-item'),
    // Filter elements
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
    applyFilters: document.getElementById('applyFilters'),
    // Accessibility
    srAnnounce: document.getElementById('srAnnounce')
};

// ========================================
// Translation Helper
// ========================================

function t(key) {
    const lang = state.currentLanguage;
    return TRANSLATIONS[lang][key] || TRANSLATIONS['it'][key] || key;
}

function tAllergen(key) {
    const lang = state.currentLanguage;
    return TRANSLATIONS[lang].allergens[key] || TRANSLATIONS['it'].allergens[key] || key;
}

function updateUILanguage() {
    const lang = state.currentLanguage;

    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });

    // Update language switch button
    const langSwitch = elements.langSwitch;
    if (lang === 'it') {
        langSwitch.querySelector('.lang-flag').textContent = '🇬🇧';
        langSwitch.setAttribute('aria-label', t('switchLang'));
    } else {
        langSwitch.querySelector('.lang-flag').textContent = '🇮🇹';
        langSwitch.setAttribute('aria-label', t('switchLang'));
    }

    // Update modal close button aria-label
    elements.modalClose.setAttribute('aria-label', t('close'));

    // Update active filter chips
    updateActiveFilterDisplay();

    // Re-render menu with new language
    render();
}

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

    const headers = rows[0].map(h => h.toLowerCase().trim());

    return rows.slice(1)
        .filter(row => row.length > 1)
        .map(row => {
            const rowObj = {};
            headers.forEach((h, i) => {
                rowObj[h] = row[i] || '';
            });
            return rowObj;
        });
}

function isTruthy(val) {
    if (!val) return false;
    const s = String(val).toLowerCase().trim();
    return ['true', '1', 'x', 'si', 'sì', 'yes'].includes(s);
}

function parsePrice(val) {
    if (!val) return '';
    let s = String(val).replace(',', '.');
    let n = parseFloat(s);
    return isNaN(n) ? s : n.toFixed(2).replace('.', ',');
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

function processMenuData(rawData) {
    const activeItems = rawData.filter(row => isTruthy(row.attivo));

    let lastSheetUpdate = null;
    rawData.forEach(r => {
        if (r.ultimo_aggiornamento?.trim()) lastSheetUpdate = r.ultimo_aggiornamento.trim();
    });

    const categories = {};
    activeItems.forEach(row => {
        const catName = row.categoria || 'Altro';
        if (!categories[catName]) {
            categories[catName] = {
                name: catName,
                order: parseFloat(row.ordine_categoria) || 999,
                items: []
            };
        }

        const tipo = (row.tipo || 'standard').toLowerCase().trim();

        categories[catName].items.push({
            nome_it: row.nome_it || '',
            nome_en: row.nome_en || row.nome_it || '',
            desc_it: row.descrizione_it || '',
            desc_en: row.descrizione_en || row.descrizione_it || '',
            price: parsePrice(row.prezzo),
            order: parseFloat(row.ordine_prodotto) || 999,
            allergens: getAllergens(row),
            allergenKeys: getAllergenKeys(row),
            tipo: tipo
        });
    });

    Object.values(categories).forEach(c => c.items.sort((a, b) => a.order - b.order));

    return {
        categories: Object.values(categories).sort((a, b) => a.order - b.order),
        lastSheetUpdate
    };
}

// ========================================
// Filtering Logic
// ========================================

function applyFiltersToData(categories) {
    const { diet, excludeAllergens } = state.filters;

    return categories
        .map(cat => {
            const filteredItems = cat.items.filter(item => {
                // Diet filter
                if (diet === 'vegan' && item.tipo !== 'vegano') {
                    return false;
                }
                if (diet === 'vegetarian' && item.tipo !== 'vegetariano' && item.tipo !== 'vegano') {
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

async function fetchData(tab) {
    let url = CONFIG[tab].url;
    let usingFallback = false;

    if (!url || url.includes('PASTE_')) {
        usingFallback = true;
    }

    try {
        let response;

        if (!usingFallback) {
            try {
                const fetchUrl = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
                response = await fetch(fetchUrl);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
            } catch (err) {
                console.warn(`Remote fetch failed (${err.message}). Switching to fallback.`);
                usingFallback = true;
            }
        }

        if (usingFallback) {
            response = await fetch(`./${tab}.csv?t=${Date.now()}`);
            if (!response.ok) throw new Error(`Local file not found: ${response.status}`);
        }

        const text = await response.text();
        const data = processMenuData(parseCSV(text));

        state.data[tab] = data;
        state.lastFetch[tab] = new Date();

        if (state.currentTab === tab) {
            render();
            elements.errorBanner.hidden = true;
            if (!elements.loadingState.hidden) elements.loadingState.hidden = true;
            showUpdateIndicator();
        }

    } catch (e) {
        console.error(`Final fetch error for ${tab}:`, e);
        if (state.currentTab === tab) {
            elements.errorBanner.hidden = false;
            elements.loadingState.hidden = true;
            if (!state.data[tab]) elements.menuContainer.hidden = true;
        }
    }
}

function render() {
    const tab = state.currentTab;
    const data = state.data[tab];

    if (data && data.lastSheetUpdate) {
        elements.lastUpdated.textContent = data.lastSheetUpdate;
    } else if (state.lastFetch[tab]) {
        elements.lastUpdated.textContent = state.lastFetch[tab].toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    } else {
        elements.lastUpdated.textContent = '--:--';
    }

    if (!data) {
        elements.menuContainer.hidden = true;
        elements.emptyState.hidden = true;
        elements.loadingState.hidden = false;
        return;
    }

    elements.loadingState.hidden = true;

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

    filteredCategories.forEach(cat => {
        html += `
            <section class="category-section">
                <h2 class="category-title">${escapeHTML(cat.name)}</h2>
                <div class="menu-items">
        `;

        cat.items.forEach(item => {
            const name = lang === 'it' ? item.nome_it : item.nome_en;
            const desc = lang === 'it' ? item.desc_it : item.desc_en;
            const foodType = FOOD_TYPES[item.tipo] || FOOD_TYPES['standard'];
            const foodTypeLabel = foodType.labelKey ? t(foodType.labelKey) : '';

            html += `
                <article class="menu-item">
                    <div class="item-header">
                        <div class="item-name-wrapper">
                            <h3 class="item-name">${escapeHTML(name)}</h3>
                            ${foodTypeLabel ? `
                                <span class="food-type-badge ${foodType.class}" aria-label="${foodTypeLabel}">
                                    <span class="food-type-icon">${foodType.icon}</span>
                                    ${foodTypeLabel}
                                </span>
                            ` : ''}
                        </div>
                        ${item.price ? `<span class="item-price">€ ${item.price}</span>` : ''}
                    </div>
                    ${desc ? `<p class="item-description">${escapeHTML(desc)}</p>` : ''}
                    ${renderAllergens(item.allergens)}
                </article>
            `;
        });

        html += '</div></section>';
    });

    elements.menuContainer.innerHTML = html;
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

    // Update active filters display
    elements.activeFilters.hidden = !hasFilters;

    // Diet chip
    if (diet !== 'all') {
        const dietInfo = diet === 'vegan'
            ? { icon: '🌱', label: t('dietVegan'), class: '' }
            : { icon: '🌿', label: t('dietVegetarian'), class: 'vegetarian' };

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
            `${excludeAllergens.length} ${t('allergensExcluded')}`;
    } else {
        elements.allergenChip.hidden = true;
    }
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

    // Save preferences to localStorage
    savePreferences();

    // Announce to screen readers
    announceToSR(t('filters') + ' ' + t('apply').toLowerCase());
}

function clearAllFilters() {
    state.tempFilters.diet = 'all';
    state.tempFilters.excludeAllergens = [];
    syncModalToState();
}

function announceToSR(message) {
    if (elements.srAnnounce) {
        elements.srAnnounce.textContent = message;
        setTimeout(() => { elements.srAnnounce.textContent = ''; }, 1000);
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

    if (state.data[newTab]) {
        render();
    } else {
        elements.menuContainer.hidden = true;
        elements.loadingState.hidden = false;
        fetchData(newTab);
    }
}

// Tab Navigation
elements.navItems.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.target));
});

// Language Toggle
elements.langSwitch.addEventListener('click', () => {
    state.currentLanguage = state.currentLanguage === 'it' ? 'en' : 'it';
    document.documentElement.lang = state.currentLanguage;
    updateUILanguage();
    savePreferences();
    announceToSR(state.currentLanguage === 'it' ? 'Italiano' : 'English');
});

// Retry Button
elements.retryButton.addEventListener('click', () => fetchData(state.currentTab));

// Filter Modal
elements.filterTrigger.addEventListener('click', openFilterModal);
elements.modalClose.addEventListener('click', closeFilterModal);
elements.applyFilters.addEventListener('click', applyFiltersFromModal);
elements.clearFilters.addEventListener('click', clearAllFilters);

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

// ========================================
// Init
// ========================================

function init() {
    // Set initial language
    updateUILanguage();
    updateActiveFilterDisplay();

    // Fetch data
    fetchData('cuisine');

    // Smart refresh on visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            const now = new Date();
            const last = state.lastFetch[state.currentTab];
            const STALE_THRESHOLD = 5 * 60 * 1000;

            if (!last || (now - last > STALE_THRESHOLD)) {
                fetchData(state.currentTab);
            }
        }
    });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
