// ========================================
// UI Rendering
// ========================================

import { state, savePreferences } from './state.js';
import { TRANSLATIONS, t, tAllergen, tConfig, FOOD_TYPES, ALLERGENS } from './i18n.js';
import { formatPrice, escapeHTML } from './utils.js';

// DOM Elements
export const elements = {
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
    storeLogo: document.querySelector('.store-logo'), // Added explicit selection if id missing
    navItems: document.querySelectorAll('.nav-item'),
    // Welcome hero elements
    welcomeHero: document.getElementById('welcomeHero'),
    welcomeHeroContent: document.querySelector('.welcome-hero-content'),
    heroLogo: document.getElementById('heroLogo'),
    heroTitle: document.getElementById('heroTitle'),
    heroClaim: document.getElementById('heroClaim'),
    heroText: document.getElementById('heroText'),
    kitchenStatus: document.getElementById('kitchenStatus'),
    // App container
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

/**
 * Filter logic applied to categories
 */
function applyFiltersToData(categories) {
    const { diet, excludeAllergens } = state.filters;

    return categories
        .map(cat => {
            const filteredItems = cat.items.filter(item => {
                // Diet filter
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

export function updateUILanguage() {
    const lang = state.currentLanguage;
    const config = state.config;

    // Update page title
    const pageTitle = tConfig(config?.page?.title, 'Menu');
    document.title = pageTitle;

    // Update meta description
    const pageDesc = tConfig(config?.page?.description, '');
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && pageDesc) {
        metaDesc.setAttribute('content', pageDesc);
    }

    // Update hero claim
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

    // Update theme color
    updateThemeColor();
}

export function updateThemeColor() {
    const computedStyle = getComputedStyle(document.documentElement);
    let themeColor = computedStyle.getPropertyValue('--color-bg').trim();
    if (!themeColor) themeColor = '#ffffff';

    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.name = 'theme-color';
        document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.content = themeColor;
}

export function render() {
    const tab = state.currentTab;
    const data = state.data[tab];

    // Always render static hero content (logos, etc.) regardless of data state
    updateHeroContent();
    // Ensure filter bar visibility logic is correct per tab
    document.querySelector('.filter-bar').hidden = (tab === 'info');

    if (!data) {
        elements.menuContainer.hidden = true;
        elements.emptyState.hidden = true;
        elements.loadingState.hidden = false;
        return;
    }

    elements.loadingState.hidden = true;

    if (tab === 'info') {
        renderInfoPage();
        elements.menuContainer.hidden = true;
        elements.infoContainer.hidden = false;
        elements.emptyState.hidden = true;
        return;
    }

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

    // Menu header card
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
            const priceFormatted = formatPrice(item.price, state.config);

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

function renderInfoPage() {
    const data = state.data.info;
    const config = state.config;
    if (!data || !config) return;

    const lang = state.currentLanguage;
    let html = '';

    // 1. Content Items
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

    html += `<div class="squiggle"><svg aria-hidden="true" width="100%" height="8" fill="none" xmlns="http://www.w3.org/2000/svg"><pattern id="a" width="91" height="8" patternUnits="userSpaceOnUse"><g clip-path="url(#clip0_2426_11367)"><path d="M114 4c-5.067 4.667-10.133 4.667-15.2 0S88.667-.667 83.6 4 73.467 8.667 68.4 4 58.267-.667 53.2 4 43.067 8.667 38 4 27.867-.667 22.8 4 12.667 8.667 7.6 4-2.533-.667-7.6 4s-10.133 4.667-15.2 0S-32.933-.667-38 4s-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133 4.667-15.2 0" stroke="#E1E3E1" stroke-linecap="square"></path></g></pattern><rect width="100%" height="100%" fill="url(#a)"></rect></svg></div>`;

    // 2. Opening Times (if separate section)
    const timeSlots = data.timeSlotsForInfo || data.timeSlots;
    if (timeSlots && timeSlots.length > 0) {
        html += `<section class="info-section timeslot-section">`;
        html += `<h2 class="info-title">${t('info.openingHours')}</h2>`;
        html += `<div class="menu-items">`; // Start card container

        timeSlots.forEach(slot => {
            const label = lang === 'it' ? slot.label_it : slot.label_en;

            // Render as a "menu item" card
            html += `
                <article class="menu-item timeslot-card">
                    <div class="item-header">
                        <h3 class="item-name">${escapeHTML(label)}</h3>
                    </div>
            `;

            if (slot.collapsedSchedule) {
                html += `<div class="timetable-grid" style="margin-top: 8px;">`;
                slot.collapsedSchedule.forEach(range => {
                    const days = lang === 'it' ? range.days_it : range.days_en;
                    html += `
                        <div class="time-row">
                            <span class="time-days">${escapeHTML(days)}</span>
                            <span class="time-hours">${escapeHTML(range.times)}</span>
                        </div>
                    `;
                });
                html += `</div>`;
            }

            html += `</article>`;
        });

        html += `</div>`; // End card container
        html += `</section>`;
    }

    // 3. Contacts
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

        if (hasSocials) {
            config.contact.socials.forEach(social => {
                let iconHtml = '';
                if (social.name.toLowerCase() === 'instagram') {
                    // Assuming we have this icon or it was in original code
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

    html += `<div class="squiggle"><svg aria-hidden="true" width="100%" height="8" fill="none" xmlns="http://www.w3.org/2000/svg"><pattern id="a" width="91" height="8" patternUnits="userSpaceOnUse"><g clip-path="url(#clip0_2426_11367)"><path d="M114 4c-5.067 4.667-10.133 4.667-15.2 0S88.667-.667 83.6 4 73.467 8.667 68.4 4 58.267-.667 53.2 4 43.067 8.667 38 4 27.867-.667 22.8 4 12.667 8.667 7.6 4-2.533-.667-7.6 4s-10.133 4.667-15.2 0S-32.933-.667-38 4s-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133-4.667-15.2 0-10.133 4.667-15.2 0-10.133 4.667-15.2 0" stroke="#E1E3E1" stroke-linecap="square"></path></g></pattern><rect width="100%" height="100%" fill="url(#a)"></rect></svg></div>`;

    // 4. Legal / Footer Links
    const privacyPage = config?.pages?.privacyCookiePolicy;
    const allergensPage = config?.pages?.allergens;

    if (privacyPage || allergensPage) {
        html += `<section class="info-section contacts-section" style="margin-top: 24px;">`;
        html += `<h2 class="info-title">${t('info.legal')}</h2>`;

        if (privacyPage) {
            const label = tConfig(privacyPage.title, 'Privacy Policy');
            const url = `pages/${lang}/${privacyPage.slug}.html`;
            html += `
                <a href="${url}" class="contact-row">
                    <span class="fluent-icon" aria-hidden="true">&#xf4a2;</span>
                    ${escapeHTML(label)}
                </a>
            `;
        }

        if (allergensPage) {
            const label = tConfig(allergensPage.title, 'Allergens');
            const url = `pages/${lang}/${allergensPage.slug}.html`;
            html += `
                <a href="${url}" class="contact-row">
                    <span class="fluent-icon" aria-hidden="true">&#xf4a2;</span>
                    ${escapeHTML(label)}
                </a>
            `;
        }

        html += `</section>`;
    }

    elements.infoContainer.innerHTML = html;
}

export function updateActiveFilterDisplay() {
    const { diet, excludeAllergens } = state.filters;
    const hasFilters = diet !== 'all' || excludeAllergens.length > 0;

    elements.filterTrigger.classList.toggle('has-filters', hasFilters);

    if (elements.inlineClearFilters) {
        elements.inlineClearFilters.hidden = !hasFilters;
    }

    elements.activeFilters.hidden = !hasFilters;

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

    if (excludeAllergens.length > 0) {
        elements.allergenChip.hidden = false;
        elements.allergenChip.querySelector('.chip-label').textContent =
            `${excludeAllergens.length} ${t('filters.allergensExcluded')}`;
    } else {
        elements.allergenChip.hidden = true;
    }
}

export function buildAllergenGrid() {
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

    elements.allergenGrid.querySelectorAll('.allergen-checkbox input').forEach(input => {
        input.addEventListener('change', (e) => {
            const label = e.target.closest('.allergen-checkbox');
            label.classList.toggle('checked', e.target.checked);
        });
    });
}

export function syncModalToState() {
    elements.dietOptions.forEach(btn => {
        const isActive = btn.dataset.diet === state.tempFilters.diet;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-checked', isActive);
    });
    buildAllergenGrid();
}

export function openFilterModal() {
    state.tempFilters = {
        diet: state.filters.diet,
        excludeAllergens: [...state.filters.excludeAllergens]
    };

    syncModalToState();
    elements.filterModal.hidden = false;
    elements.filterTrigger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    elements.modalClose.focus();

    // Reset scroll position
    const modalBody = elements.filterModal.querySelector('.modal-body');
    if (modalBody) modalBody.scrollTop = 0;
}

export function closeFilterModal() {
    elements.filterModal.hidden = true;
    elements.filterTrigger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    elements.filterTrigger.focus();
}

export function announceToSR(message) {
    if (elements.srAnnounce) {
        elements.srAnnounce.textContent = message;
        setTimeout(() => { elements.srAnnounce.textContent = ''; }, 1000);
    }
}

export function showUpdateIndicator() {
    if (!elements.updateIndicator) return;
    elements.updateIndicator.classList.add('visible');
    setTimeout(() => elements.updateIndicator.classList.remove('visible'), 2000);
}

export function applyConfig() {
    if (!state.config) return;

    const { app } = state.config;

    if (app?.name) elements.storeName.textContent = app.name;

    if (app?.logoUrl && elements.storeLogo) {
        elements.storeLogo.src = app.logoUrl;
        elements.storeLogo.hidden = false;
    }
}

// Collapsible Header
export function setHeaderExpanded(expanded, scrollToTop = false) {
    state.headerExpanded = expanded;

    if (expanded) {
        elements.appContainer.classList.remove('collapsed');
        elements.filterBar.classList.remove('collapsed');
    } else {
        elements.appContainer.classList.add('collapsed');
        elements.filterBar.classList.add('collapsed');
    }

    elements.headerCollapseToggle.setAttribute('aria-expanded', String(expanded));

    if (scrollToTop && expanded) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

export function toggleHeader() {
    const newState = !state.headerExpanded;
    setHeaderExpanded(newState, newState);
}

export function updateHeroContent() {
    const config = state.config;

    const appName = config?.app?.name || 'Menu';
    const claim = tConfig(config?.app?.claim, '');
    if (elements.heroClaim && claim) {
        elements.heroClaim.textContent = claim;
    }

    const heroLogoUrl = config?.app?.heroLogo;
    if (heroLogoUrl) {
        elements.heroLogo.src = heroLogoUrl;
        elements.heroLogo.alt = appName;
        elements.heroLogo.hidden = false;
    } else {
        elements.heroLogo.hidden = true;
    }

    const navbarLogoUrl = config?.app?.navbarLogo;
    if (elements.navbarLogo && navbarLogoUrl) {
        elements.navbarLogo.src = navbarLogoUrl;
        elements.navbarLogo.hidden = false;
    }

    if (elements.storeName) {
        elements.storeName.textContent = appName;
    }

    elements.welcomeHero.classList.remove('hidden');

    if (state.headerExpanded) {
        elements.appContainer.classList.remove('collapsed');
    } else {
        elements.appContainer.classList.add('collapsed');
    }

    updateKitchenStatus();
}

// Kitchen Status
export function updateKitchenStatus() {
    if (!elements.kitchenStatus) return;

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

    const parts = [];

    for (const slot of upcomingSlots) {
        if (slot.status === 'active') {
            parts.push(`${slot.label} ✓`);
        } else {
            parts.push(`${slot.label} ${formatDuration(slot.minutesUntil)}`);
        }
    }

    if (parts.length > 0) {
        const hasActive = upcomingSlots.some(s => s.status === 'active');
        const prefix = hasActive ? '' : t('kitchen.nextToday') + ': ';
        elements.kitchenStatus.textContent = prefix + parts.join(' · ');
        elements.kitchenStatus.hidden = false;
    } else {
        elements.kitchenStatus.hidden = true;
    }
}

function getUpcomingSlots(now) {
    const timeSlots = state.data?.info?.timeSlotsForHero;
    if (!timeSlots || !Array.isArray(timeSlots)) return [];

    const lang = state.currentLanguage;
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const upcoming = [];

    for (const slot of timeSlots) {
        const label = slot[`label_${lang}`] || slot.label_en || slot.id;

        for (const sched of slot.schedule || []) {
            if (sched.day !== dayOfWeek) continue;

            const openMinutes = parseTimeToMinutes(sched.open);
            const closeMinutes = parseTimeToMinutes(sched.close);

            // Determine if slot crosses midnight
            const crossesMidnight = closeMinutes < openMinutes;
            let isActive = false;
            let isUpcoming = false;

            if (crossesMidnight) {
                // Active if: current >= open OR current < close
                if (currentMinutes >= openMinutes || currentMinutes < closeMinutes) {
                    isActive = true;
                }
                // Upcoming if: current < open AND current >= close (to avoid detecting 'past' part of early morning as upcoming)
                // Actually, if it closes at 02:00 and now is 10:00, it is upcoming for 22:00.
                else if (currentMinutes < openMinutes && currentMinutes >= closeMinutes) {
                    isUpcoming = true;
                }
            } else {
                // Standard slot
                if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
                    isActive = true;
                } else if (currentMinutes < openMinutes) {
                    isUpcoming = true;
                }
            }

            if (isActive) {
                upcoming.push({
                    label,
                    status: 'active',
                    isKitchen: slot.isKitchen,
                    minutesUntil: 0
                });
            } else if (isUpcoming) {
                // Calculate minutes until open
                let minUntil = openMinutes - currentMinutes;
                //(No special adjustment needed for cross-midnight upcoming, as open > current)
                upcoming.push({
                    label,
                    status: 'upcoming',
                    isKitchen: slot.isKitchen,
                    minutesUntil: minUntil
                });
            }
        }
    }

    upcoming.sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        return a.minutesUntil - b.minutesUntil;
    });

    return upcoming.slice(0, 3);
}

function parseTimeToMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

function formatDuration(minutes) {
    if (minutes < 60) {
        return t('kitchen.inMinutes').replace('{minutes}', minutes);
    } else {
        const hours = Math.round(minutes / 60);
        return t('kitchen.inHours').replace('{hours}', hours);
    }
}
