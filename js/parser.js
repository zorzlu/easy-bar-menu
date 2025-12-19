// ========================================
// Data Parsing & Processing
// ========================================

import { state } from './state.js';
import { TRANSLATIONS, ALLERGENS } from './i18n.js';
import { isTruthy, parsePrice, parseTimeValue } from './utils.js';

/**
 * Parse CSV text into array of objects
 */
export function parseCSV(text) {
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
    const csvLang = state.config?.inputData?.csvLanguage || 'en';
    const csvKeywords = TRANSLATIONS?.csvKeywords || {};

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

/**
 * Parse unified CSV with horizontal marker row structure
 */
export function parseUnifiedCSV(text) {
    if (!text) return { bar: [], kitchen: [], timeslots: [], content: [], categories: [] };
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

    const csvLang = state.config?.inputData?.csvLanguage || 'en';
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

function getAllergens(row) {
    return Object.entries(ALLERGENS)
        .filter(([col]) => isTruthy(row[col]))
        .map(([colKey, info]) => ({ ...info, colKey }))
        .sort((a, b) => a.number - b.number);
}

function getAllergenKeys(row) {
    return Object.keys(ALLERGENS).filter(col => isTruthy(row[col]));
}

/**
 * Process raw menu data into structured objects
 */
export function processMenuData(rawData, categoryData = []) {
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
            tipo: tipo,
            noGlutenOption: isTruthy(row.no_gluten_option)
        });
    });

    // Items already in CSV order, just sort categories by their order
    return {
        categories: Object.values(categories).sort((a, b) => a.order - b.order),
        lastSheetUpdate
    };
}

/**
 * Process timeslots data
 */
export function processTimeslotsData(rawData) {
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
            const fmt = state.config?.inputData?.csvNumberFormat || 'us';
            slot.schedule.push({
                day: dayNum,
                open: parseTimeValue(row.open, fmt),
                close: parseTimeValue(row.close, fmt)
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

/**
 * Process content data (texts, CTAs, headers)
 */
export function processContentData(rawData) {
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

/**
 * Process legacy Info data (should be deprecated, but kept for safe migration if needed)
 */
export function processInfoData(rawData) {
    const sections = {
        timeSlots: [],
        timeSlotsForHero: [],
        timeSlotsForInfo: [],
        menuHeaderKitchen: null,
        menuHeaderBar: null,
        contentItems: []
    };

    const timeSlotsMap = new Map();
    const dayToNum = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 };

    rawData.forEach(row => {
        const type = (row.type || '').toLowerCase().trim();
        const day = (row.day || '').toLowerCase().trim();

        if (type === 'time_slot' && day && row.slot_id) {
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
            if (row.slot1_open && row.slot1_close) {
                slot.schedule.push({
                    day: dayNum,
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

    sections.timeSlots = Array.from(timeSlotsMap.values());
    sections.timeSlotsForHero = sections.timeSlots.filter(s => s.showInHero);
    sections.timeSlotsForInfo = sections.timeSlots
        .filter(s => s.showInInfo)
        .map(slot => ({
            ...slot,
            collapsedSchedule: collapseTimeSlotDays(slot.schedule)
        }));

    return sections;
}

/**
 * Collapse adjacent days with same open/close times
 */
export function collapseTimeSlotDays(schedule) {
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
