// ========================================
// Main Entry Point
// ========================================

import { state, savePreferences } from './state.js';
import { loadTranslations, t, setAllergens, setFoodTypes } from './i18n.js';
import { parseUnifiedCSV, processMenuData, processContentData, processTimeslotsData } from './parser.js';
import {
    elements,
    render,
    updateUILanguage,
    updateActiveFilterDisplay,
    updateKitchenStatus,
    showUpdateIndicator,
    applyConfig,
    setHeaderExpanded,
    toggleHeader,
    openFilterModal,
    closeFilterModal,
    announceToSR,
    updateThemeColor
} from './render.js';

// Scroll threshold for header collapse
const SCROLL_THRESHOLD = 50;
let isInitialized = false;
let scrollTicking = false;
let touchStartY = 0;

// Load Config
async function loadConfig() {
    try {
        const response = await fetch('config/config.json?t=' + Date.now());
        if (!response.ok) throw new Error('Config load failed');
        state.config = await response.json();

        // Setup shared data from config
        if (state.config.allergens) setAllergens(state.config.allergens);
        if (state.config.foodTypes) setFoodTypes(state.config.foodTypes);

        applyConfig();
    } catch (e) {
        console.error('Failed to load config:', e);
        if (elements.storeName) elements.storeName.textContent = 'Configuration Error';
    }
}

// Fetch Unified Data
async function fetchUnifiedData(isRefresh = true) {
    try {
        const menuUrl = state.config?.urls?.menu;
        let response;
        let text;
        let usingFallback = false;

        // Try remote URL first
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

        // Fallback to local
        if (!text) {
            response = await fetch(`./config/fallback_data.csv?t=${Date.now()}`);
            if (!response.ok) throw new Error(`Fallback file not found: ${response.status}`);
            text = await response.text();
        }

        state.usingFallback = usingFallback;
        if (elements.staleDataBanner) {
            elements.staleDataBanner.hidden = !usingFallback;
        }

        const parsed = parseUnifiedCSV(text);

        // Process data
        state.data.bar = processMenuData(parsed.bar, parsed.categories);
        state.data.kitchen = processMenuData(parsed.kitchen, parsed.categories);
        state.data.timeslots = processTimeslotsData(parsed.timeslots);
        state.data.content = processContentData(parsed.content);
        state.data.categories = parsed.categories;

        // Info Compatibility
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

// Event Logic
function switchTab(newTab) {
    if (state.currentTab === newTab) return;

    elements.navItems.forEach(btn => {
        if (btn.dataset.target === newTab) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    state.currentTab = newTab;

    const announceName = t(`tab${newTab.charAt(0).toUpperCase() + newTab.slice(1)}`);
    announceToSR(announceName);

    // We assume unified data is already loaded so we don't need to fetch per tab anymore
    // unless we want to refetch everything.
    // For now, simpler to just render.
    if (state.data[newTab] || newTab === 'info') {
        render();
        window.scrollTo({ top: 0, behavior: 'instant' });
    } else {
        // Should not happen if unified fetch works
        fetchUnifiedData(true);
    }
}

function handleScroll() {
    if (!isInitialized) return;

    const currentScrollY = window.scrollY;
    const scrollDelta = currentScrollY - state.lastScrollY;

    if (scrollDelta > 0 && currentScrollY > SCROLL_THRESHOLD && state.headerExpanded) {
        setHeaderExpanded(false);
    }

    state.lastScrollY = currentScrollY;
}

function handleWheel(e) {
    if (window.scrollY <= 0 && e.deltaY < 0 && !state.headerExpanded) {
        setHeaderExpanded(true, true);
    }
}

function handleTouchStart(e) {
    touchStartY = e.touches[0].clientY;
}

function handleTouchMove(e) {
    if (window.scrollY <= 0 && !state.headerExpanded) {
        const touchY = e.touches[0].clientY;
        const deltaY = touchY - touchStartY;
        if (deltaY > 30) {
            setHeaderExpanded(true, true);
            touchStartY = touchY;
        }
    }
}

function switchLanguage(newLang) {
    const defaultLang = state.config?.i18n?.defaultLanguage || 'en';
    const supportedLangs = state.config?.i18n?.supportedLanguages || ['en'];

    if (!supportedLangs.includes(newLang)) {
        console.warn(`Unsupported language: ${newLang}`);
        return;
    }

    const newUrl = newLang === defaultLang ? '/' : `/?lang=${newLang}`;
    history.pushState({ lang: newLang }, '', newUrl);

    state.currentLanguage = newLang;
    savePreferences(state);
    updateUILanguage();
}

// Handlers for Modal Actions (needs access to render)
function applyFiltersFromModal() {
    const activeDiet = document.querySelector('.diet-option.active');
    state.filters.diet = activeDiet ? activeDiet.dataset.diet : 'all';

    const checkedBoxes = elements.allergenGrid.querySelectorAll('input:checked');
    state.filters.excludeAllergens = Array.from(checkedBoxes).map(cb =>
        cb.closest('.allergen-checkbox').dataset.key
    );

    updateActiveFilterDisplay();
    closeFilterModal();
    render();
    window.scrollTo({ top: 0, behavior: 'instant' });
    savePreferences(state);
    announceToSR(t('filters.filters') + ' ' + t('ui.apply').toLowerCase());
}

function clearAllFilters() {
    state.tempFilters.diet = 'all';
    state.tempFilters.excludeAllergens = [];
    // syncModalToState is inside render.js but we need to call it if modal is open, 
    // but usually clearAllFilters is called from inline button or modal button.
    // If called from modal, we should update UI.

    // We'll reset both temp and actual to be safe for both contexts
    state.filters.diet = 'all';
    state.filters.excludeAllergens = [];

    updateActiveFilterDisplay();
    render();
    savePreferences(state);
}

// Initialization
async function init() {
    try {
        await loadConfig();
        await loadTranslations();

        updateUILanguage();
        updateThemeColor();
        updateActiveFilterDisplay();

        updateKitchenStatus();
        setInterval(updateKitchenStatus, 60000);

        // Dynamic Hero Height
        const heroObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                if (elements.welcomeHero) {
                    const totalHeight = elements.welcomeHero.offsetHeight;
                    const val = Math.max(0, totalHeight - 64);
                    document.documentElement.style.setProperty('--header-hero-height', `${val}px`);
                }
            }
        });
        if (elements.welcomeHero) heroObserver.observe(elements.welcomeHero);
        if (elements.welcomeHeroContent) heroObserver.observe(elements.welcomeHeroContent);

        if (!state.currentTab) state.currentTab = 'kitchen';

        await fetchUnifiedData(false);

        render();
        elements.loadingState.hidden = true;
        elements.errorBanner.hidden = true;

        requestAnimationFrame(() => {
            window.scrollTo({ top: 0, behavior: 'instant' });
            isInitialized = true;
        });

    } catch (e) {
        console.error('Initialization error:', e);
        elements.errorBanner.hidden = false;
        elements.loadingState.hidden = true;
    }

    // Refresh on visibility
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            const now = new Date();
            const last = state.lastFetch.unified;
            const STALE_THRESHOLD = 5 * 60 * 1000;

            if (!last || (now - last > STALE_THRESHOLD)) {
                fetchUnifiedData(true);
            }
        }
    });
}

// Attach Event Listeners
elements.navItems.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.target));
});

elements.retryButton.addEventListener('click', () => fetchUnifiedData(true));
if (elements.staleRetryButton) {
    elements.staleRetryButton.addEventListener('click', () => fetchUnifiedData(true));
}

elements.filterTrigger.addEventListener('click', openFilterModal);
elements.modalClose.addEventListener('click', closeFilterModal);
elements.applyFilters.addEventListener('click', applyFiltersFromModal);
elements.clearFilters.addEventListener('click', clearAllFilters);
if (elements.inlineClearFilters) {
    elements.inlineClearFilters.addEventListener('click', clearAllFilters);
}

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

elements.filterModal.addEventListener('click', (e) => {
    if (e.target === elements.filterModal) closeFilterModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !elements.filterModal.hidden) {
        closeFilterModal();
    }
});

elements.headerCollapseToggle.addEventListener('click', toggleHeader);

window.addEventListener('scroll', () => {
    if (!scrollTicking) {
        requestAnimationFrame(() => {
            handleScroll();
            scrollTicking = false;
        });
        scrollTicking = true;
    }
}, { passive: true });

window.addEventListener('wheel', handleWheel, { passive: true });
window.addEventListener('touchstart', handleTouchStart, { passive: true });
window.addEventListener('touchmove', handleTouchMove, { passive: true });

elements.langSwitch.addEventListener('click', () => {
    const defaultLang = state.config?.i18n?.defaultLanguage || 'it';
    const newLang = state.currentLanguage === 'en' ? defaultLang : 'en';
    switchLanguage(newLang);
});

// Popstate for history support
window.addEventListener('popstate', (event) => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    const defaultLang = state.config?.i18n?.defaultLanguage || 'en';
    const supportedLangs = state.config?.i18n?.supportedLanguages || ['en'];

    let newLang = defaultLang;
    if (urlLang && supportedLangs.includes(urlLang)) {
        newLang = urlLang;
    }

    if (state.currentLanguage !== newLang) {
        state.currentLanguage = newLang;
        updateUILanguage();
    }
});

// Bootstrap
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
