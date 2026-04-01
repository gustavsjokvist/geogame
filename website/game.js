import { COUNTRY_FLAGS, getCountryFlagUrl } from './countries.js';

const ROUND_SIZE = 5;
const MIN_CATEGORY_COUNTRIES = 20;
const MAX_ROUND_ATTEMPTS = 400;

const COUNTRY_NAME_SET = new Set(Object.keys(COUNTRY_FLAGS));

const CATEGORY_ICONS = {
    avocado: 'A',
    coffee: 'C',
    pear: 'P',
    soybean: 'S',
    wheat: 'W',
    forest_area: 'F',
    irrigated_land_area: 'I',
    coal_production: 'C',
    oil_production: 'O',
    electricity_production: 'E',
    electricity_exports: 'X',
    aluminium_production: 'A',
    carbon_dioxide_emissions: 'CO2',
    external_debt: 'D',
    gdp_ppp: 'GDP',
    gdp_nominal: 'GDP',
    countries_and_dependencies_by_population: 'POP',
    countries_and_dependencies_by_population_density: 'DEN',
    vehicles: 'V',
    world_heritage_sites_by_country: 'WH',
    nobel_laureates_by_country: 'N',
    rail_transport_network_size: 'R',
    internet_connection_speeds: 'NET',
    literacy_rate: 'L',
    life_expectancy: 'LE',
    education_index: 'EDU',
    urbanization_by_country: 'URB',
    alcohol_consumption: 'ALC',
    body_mass_index: 'BMI',
    average_wage: 'WAGE',
    minimum_wages_by_country: 'MIN'
};

const CATEGORY_CONFIG = {
    avocado: {
        label: 'Avocado production',
        detail: 'Total production',
        sort: 'desc'
    },
    coffee: {
        label: 'Coffee production',
        detail: 'Total production',
        sort: 'desc'
    },
    pear: {
        label: 'Pear production',
        detail: 'Total production',
        sort: 'desc'
    },
    soybean: {
        label: 'Soybean production',
        detail: 'Total production',
        sort: 'desc'
    },
    wheat: {
        label: 'Wheat production',
        detail: 'Total production',
        sort: 'desc'
    },
    forest_area: {
        label: 'Forest area',
        detail: 'Total area',
        sort: 'desc'
    },
    irrigated_land_area: {
        label: 'Irrigated land',
        detail: 'Total area',
        sort: 'desc'
    },
    coal_production: {
        label: 'Coal production',
        detail: 'Total production',
        sort: 'desc'
    },
    oil_production: {
        label: 'Oil production',
        detail: 'Total production',
        sort: 'desc'
    },
    electricity_production: {
        label: 'Electricity production',
        detail: 'Total output',
        sort: 'desc'
    },
    electricity_exports: {
        label: 'Electricity exports',
        detail: 'Total exports',
        sort: 'desc'
    },
    aluminium_production: {
        label: 'Aluminium production',
        detail: 'Total production',
        sort: 'desc'
    },
    carbon_dioxide_emissions: {
        label: 'CO2 emissions',
        detail: 'Total emissions',
        sort: 'desc'
    },
    external_debt: {
        label: 'External debt',
        detail: 'Total debt',
        sort: 'desc'
    },
    gdp_ppp: {
        label: 'GDP (PPP)',
        detail: 'Total economy',
        sort: 'desc'
    },
    gdp_nominal: {
        label: 'GDP (nominal)',
        detail: 'Per capita',
        sort: 'desc'
    },
    countries_and_dependencies_by_population: {
        label: 'Population',
        detail: 'Total population',
        sort: 'desc'
    },
    countries_and_dependencies_by_population_density: {
        label: 'Population density',
        detail: 'People per km2',
        sort: 'desc'
    },
    vehicles: {
        label: 'Vehicles',
        detail: 'Per 1,000 people',
        sort: 'desc'
    },
    world_heritage_sites_by_country: {
        label: 'World Heritage Sites',
        detail: 'Site count',
        sort: 'desc'
    },
    nobel_laureates_by_country: {
        label: 'Nobel laureates',
        detail: 'Laureate count',
        sort: 'desc'
    },
    rail_transport_network_size: {
        label: 'Rail network',
        detail: 'Track length',
        sort: 'desc'
    },
    internet_connection_speeds: {
        label: 'Internet speed',
        detail: 'Mbps',
        sort: 'desc'
    },
    literacy_rate: {
        label: 'Literacy rate',
        detail: 'Percent',
        sort: 'desc'
    },
    life_expectancy: {
        label: 'Life expectancy',
        detail: 'Years',
        sort: 'desc'
    },
    education_index: {
        label: 'Education index',
        detail: 'Index score',
        sort: 'desc'
    },
    urbanization_by_country: {
        label: 'Urban population',
        detail: 'Total urban population',
        sort: 'desc'
    },
    alcohol_consumption: {
        label: 'Alcohol consumption',
        detail: 'Per capita',
        sort: 'desc'
    },
    body_mass_index: {
        label: 'Body mass index',
        detail: 'Average BMI',
        sort: 'desc'
    },
    average_wage: {
        label: 'Average wage',
        detail: 'Annual average',
        sort: 'desc'
    },
    minimum_wages_by_country: {
        label: 'Minimum wage',
        detail: 'Annualized minimum',
        sort: 'desc'
    }
};

const COUNTRY_ALIASES = new Map([
    ['democratic republic of the congo', 'DR Congo'],
    ['dr congo', 'DR Congo'],
    ['republic of the congo', 'Republic of the Congo'],
    ['czechia', 'Czech Republic'],
    ['timor leste', 'Timor Leste'],
    ['east timor', 'Timor Leste'],
    ['turkiye', 'Turkey'],
    ['turkiye republic of', 'Turkey'],
    ['cote d ivoire', 'Ivory Coast'],
    ['cote divoire', 'Ivory Coast'],
    ['macao', 'Macao'],
    ['macau', 'Macao'],
    ['palestinian territories', 'Palestine'],
    ['palestinian territory', 'Palestine'],
    ['micronesia federated states of', 'Micronesia'],
    ['bahamas the', 'Bahamas'],
    ['gambia the', 'Gambia'],
    ['united states of america', 'United States'],
    ['russian federation', 'Russia'],
    ['korea south', 'South Korea'],
    ['korea north', 'North Korea'],
    ['viet nam', 'Vietnam'],
    ['cape verde', 'Cape Verde']
]);

const NON_COUNTRY_ENTRIES = new Set([
    'world',
    'africa',
    'asia',
    'europe',
    'north america',
    'south america',
    'oceania',
    'antarctica',
    'americas',
    'arab world',
    'european union',
    'eurasia',
    'latin america',
    'middle east',
    'commonwealth of nations'
]);

const state = {
    rawData: null,
    categories: [],
    currentRound: null,
    selectedCountry: null
};

const audio = {
    main: new Audio('audio/main.mp3'),
    win: new Audio('audio/win.mp3'),
    brasil: new Audio('audio/brasil.mp3'),
    initialized: false
};

audio.main.loop = true;
audio.main.volume = 0.35;
audio.win.volume = 0.7;
audio.brasil.loop = true;
audio.brasil.volume = 0.55;

const ui = {
    statusPill: document.getElementById('statusPill'),
    roundTitle: document.getElementById('roundTitle'),
    instructions: document.getElementById('instructions'),
    missionTags: document.getElementById('missionTags'),
    countriesGrid: document.getElementById('countriesGrid'),
    categoriesGrid: document.getElementById('categoriesGrid'),
    selectedCountryCard: document.getElementById('selectedCountryCard'),
    currentScore: document.getElementById('currentScore'),
    assignmentCount: document.getElementById('assignmentCount'),
    progressText: document.getElementById('progressText'),
    progressFill: document.getElementById('progressFill'),
    newRoundButton: document.getElementById('newRoundButton'),
    playAgainButton: document.getElementById('playAgainButton'),
    resultsCard: document.getElementById('resultsCard'),
    finalScore: document.getElementById('finalScore'),
    optimalScore: document.getElementById('optimalScore'),
    scoreGap: document.getElementById('scoreGap'),
    resultsGrid: document.getElementById('resultsGrid'),
    resultsTitle: document.getElementById('resultsTitle')
};

function normalizeText(value) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\([^)]*\)/g, ' ')
        .replace(/\[[^\]]*\]/g, ' ')
        .replace(/[\u03b2*]/g, ' ')
        .replace(/&/g, ' and ')
        .replace(/['\u2019]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, ' ')
        .trim()
        .toLowerCase();
}

function canonicalCountryName(rawName) {
    const normalized = normalizeText(rawName);
    if (!normalized || NON_COUNTRY_ENTRIES.has(normalized)) {
        return null;
    }

    if (COUNTRY_ALIASES.has(normalized)) {
        return COUNTRY_ALIASES.get(normalized);
    }

    for (const countryName of COUNTRY_NAME_SET) {
        if (normalizeText(countryName) === normalized) {
            return countryName;
        }
    }

    return null;
}

function shuffle(items) {
    const copy = [...items];

    for (let index = copy.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }

    return copy;
}

function sample(items, count) {
    return shuffle(items).slice(0, count);
}

function getCountryInitials(country) {
    return country
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0])
        .join('')
        .toUpperCase();
}

function getCountryFlagMarkup(country, className = 'flag-image') {
    const url = getCountryFlagUrl(country);
    if (url) {
        return `<img class="${className}" src="${url}" alt="Flag of ${country}" loading="lazy">`;
    }

    return `<span class="flag-fallback ${className}">${getCountryInitials(country)}</span>`;
}

function getCategoryIcon(categoryKey) {
    return CATEGORY_ICONS[categoryKey] || 'MAP';
}

function ensureAudioStarted() {
    if (audio.initialized) {
        return;
    }

    audio.initialized = true;
    audio.main.play().catch(() => {
        audio.initialized = false;
    });
}

function stopBrasilAudio() {
    audio.brasil.pause();
    audio.brasil.currentTime = 0;
}

function syncSelectionAudio() {
    if (state.selectedCountry === 'Brazil') {
        audio.brasil.play().catch(() => {});
        return;
    }

    stopBrasilAudio();
}

function buildCategoryDataset(rawData) {
    return Object.entries(CATEGORY_CONFIG)
        .map(([categoryKey, config]) => {
            const values = rawData[categoryKey];
            if (!values || typeof values !== 'object' || Array.isArray(values)) {
                return null;
            }

            const cleanedEntries = [];

            for (const [rawCountry, rawValue] of Object.entries(values)) {
                if (typeof rawValue !== 'number' || !Number.isFinite(rawValue)) {
                    continue;
                }

                const country = canonicalCountryName(rawCountry);
                if (!country) {
                    continue;
                }

                cleanedEntries.push({
                    country,
                    value: rawValue
                });
            }

            cleanedEntries.sort((left, right) => {
                if (config.sort === 'asc') {
                    return left.value - right.value;
                }

                return right.value - left.value;
            });

            const orderedEntries = [];
            const ranksByCountry = {};

            cleanedEntries.forEach(entry => {
                if (ranksByCountry[entry.country]) {
                    return;
                }

                orderedEntries.push(entry.country);
                ranksByCountry[entry.country] = orderedEntries.length;
            });

            if (orderedEntries[0] === 'World') {
                orderedEntries.shift();
            }

            if (orderedEntries.length < MIN_CATEGORY_COUNTRIES) {
                return null;
            }

            return {
                key: categoryKey,
                label: config.label,
                detail: config.detail,
                countries: orderedEntries,
                countrySet: new Set(orderedEntries),
                ranksByCountry
            };
        })
        .filter(Boolean);
}

function buildRound() {
    if (state.categories.length < ROUND_SIZE) {
        throw new Error('Not enough valid categories to build a round.');
    }

    for (let attempt = 0; attempt < MAX_ROUND_ATTEMPTS; attempt += 1) {
        const categories = sample(state.categories, ROUND_SIZE);
        const sharedCountries = categories.reduce((shared, category, index) => {
            if (index === 0) {
                return new Set(category.countries);
            }

            return new Set([...shared].filter(country => category.countrySet.has(country)));
        }, new Set());

        if (sharedCountries.size < ROUND_SIZE) {
            continue;
        }

        return {
            categories,
            countries: sample([...sharedCountries], ROUND_SIZE),
            assignments: {},
            score: 0
        };
    }

    throw new Error('Could not find five categories with five shared countries.');
}

function getUnassignedCountries() {
    const assignedCountries = new Set(
        Object.values(state.currentRound.assignments)
            .filter(Boolean)
            .map(assignment => assignment.country)
    );

    return state.currentRound.countries.filter(country => !assignedCountries.has(country));
}

function isRoundComplete() {
    return state.currentRound.categories.every(category => Boolean(state.currentRound.assignments[category.key]));
}

function updateScore() {
    const assignments = Object.values(state.currentRound.assignments).filter(Boolean);
    const total = assignments.reduce((sum, assignment) => sum + assignment.rank, 0);
    const progress = (assignments.length / ROUND_SIZE) * 100;

    state.currentRound.score = total;
    ui.currentScore.textContent = total;
    ui.assignmentCount.textContent = `${assignments.length} / ${ROUND_SIZE}`;
    ui.progressText.textContent = `${assignments.length} of ${ROUND_SIZE} placed`;
    ui.progressFill.style.width = `${progress}%`;
}

function renderMissionTags() {
    ui.missionTags.innerHTML = '';

    state.currentRound.categories.forEach(category => {
        const tag = document.createElement('div');
        tag.className = 'mission-tag';

        if (state.currentRound.assignments[category.key]) {
            tag.classList.add('done');
        }

        tag.innerHTML = `
            <span class="mission-tag-icon">${getCategoryIcon(category.key)}</span>
            <span class="mission-tag-title">${category.label}</span>
            <span class="mission-tag-detail">${category.detail}</span>
        `;

        ui.missionTags.appendChild(tag);
    });
}

function renderSelectedCountryCard() {
    if (!state.selectedCountry) {
        ui.selectedCountryCard.classList.remove('active');
        ui.selectedCountryCard.innerHTML = `
            <div class="selected-country-flag">?</div>
            <div class="selected-country-copy">
                <p class="selected-country-label">Current pick</p>
                <h4>Select a country</h4>
                <p>Then assign it to the category where it should score best.</p>
            </div>
        `;
        return;
    }

    ui.selectedCountryCard.classList.add('active');
    ui.selectedCountryCard.innerHTML = `
        <div class="selected-country-flag">${getCountryFlagMarkup(state.selectedCountry, 'selected-flag-image')}</div>
        <div class="selected-country-copy">
            <p class="selected-country-label">Current pick</p>
            <h4>${state.selectedCountry}</h4>
            <p>Choose one open category on the target board to lock this country in.</p>
        </div>
    `;
}

function renderCountries() {
    const availableCountries = getUnassignedCountries();
    ui.countriesGrid.innerHTML = '';

    availableCountries.forEach(country => {
        const button = document.createElement('button');
        button.className = 'country-chip';
        if (state.selectedCountry === country) {
            button.classList.add('selected');
        }

        button.type = 'button';
        button.innerHTML = `
            <span class="country-flag">${getCountryFlagMarkup(country, 'deck-flag-image')}</span>
            <span class="country-name">${country}</span>
            <span class="country-chip-glow"></span>
        `;
        button.addEventListener('click', () => {
            ensureAudioStarted();
            state.selectedCountry = state.selectedCountry === country ? null : country;
            syncSelectionAudio();
            renderBoard();
        });

        ui.countriesGrid.appendChild(button);
    });

    if (availableCountries.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-message';
        emptyState.textContent = 'All countries have been assigned.';
        ui.countriesGrid.appendChild(emptyState);
    }
}

function renderCategories() {
    ui.categoriesGrid.innerHTML = '';

    state.currentRound.categories.forEach(category => {
        const assignment = state.currentRound.assignments[category.key];
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'category-card';
        if (assignment) {
            card.classList.add('filled');
        }
        if (!assignment && state.selectedCountry) {
            card.classList.add('ready');
        }

        const detailMarkup = assignment
            ? `
                <div class="assignment-country">${getCountryFlagMarkup(assignment.country, 'inline-flag-image')} ${assignment.country}</div>
                <div class="assignment-rank">Rank #${assignment.rank}</div>
            `
            : '<div class="assignment-placeholder">Click to assign selected country</div>';

        card.innerHTML = `
            <div class="category-topline">
                <div class="category-icon">${getCategoryIcon(category.key)}</div>
                <div>
                    <div class="category-title">${category.label}</div>
                    <div class="category-detail">${category.detail}</div>
                </div>
            </div>
            <div class="assignment-slot">${detailMarkup}</div>
        `;

        card.addEventListener('click', () => assignSelectedCountry(category.key));
        ui.categoriesGrid.appendChild(card);
    });
}

function renderBoard() {
    updateScore();
    renderMissionTags();
    renderSelectedCountryCard();
    renderCountries();
    renderCategories();

    if (state.selectedCountry) {
        ui.instructions.textContent = `${state.selectedCountry} selected. Click a category to place it.`;
    } else {
        ui.instructions.textContent = 'Pick a country from the left, then click a category on the right.';
    }
}

function assignSelectedCountry(categoryKey) {
    if (!state.selectedCountry) {
        return;
    }

    ensureAudioStarted();

    if (state.currentRound.assignments[categoryKey]) {
        return;
    }

    const category = state.currentRound.categories.find(item => item.key === categoryKey);
    const rank = category.ranksByCountry[state.selectedCountry];

    if (!rank) {
        return;
    }

    state.currentRound.assignments[categoryKey] = {
        country: state.selectedCountry,
        rank
    };

    state.selectedCountry = null;
    stopBrasilAudio();
    renderBoard();

    if (isRoundComplete()) {
        showResults();
    }
}

function permutations(items) {
    if (items.length <= 1) {
        return [items];
    }

    const result = [];
    items.forEach((item, index) => {
        const rest = [...items.slice(0, index), ...items.slice(index + 1)];
        permutations(rest).forEach(permutation => {
            result.push([item, ...permutation]);
        });
    });

    return result;
}

function getOptimalAssignment() {
    const categories = state.currentRound.categories;
    const countries = state.currentRound.countries;
    let best = null;

    permutations(countries).forEach(order => {
        const total = order.reduce((sum, country, index) => {
            return sum + categories[index].ranksByCountry[country];
        }, 0);

        if (!best || total < best.total) {
            best = {
                total,
                assignments: categories.map((category, index) => ({
                    category: category.label,
                    country: order[index],
                    rank: category.ranksByCountry[order[index]]
                }))
            };
        }
    });

    return best;
}

function showResults() {
    const optimal = getOptimalAssignment();
    const userAssignments = state.currentRound.categories.map(category => {
        const assignment = state.currentRound.assignments[category.key];
        return {
            category: category.label,
            country: assignment.country,
            rank: assignment.rank
        };
    });

    audio.win.currentTime = 0;
    audio.win.play().catch(() => {});

    ui.resultsCard.classList.remove('hidden');
    ui.finalScore.textContent = state.currentRound.score;
    ui.optimalScore.textContent = optimal.total;
    ui.scoreGap.textContent = state.currentRound.score - optimal.total;
    ui.resultsTitle.textContent = state.currentRound.score === optimal.total
        ? 'Perfect round'
        : 'Round complete';

    ui.resultsGrid.innerHTML = '';

    userAssignments.forEach((assignment, index) => {
        const optimalAssignment = optimal.assignments[index];
        const card = document.createElement('article');
        card.className = 'result-card';
        card.innerHTML = `
            <div class="result-head">
                <span class="result-icon">${getCategoryIcon(state.currentRound.categories[index].key)}</span>
                <div>
                    <div class="result-category">${assignment.category}</div>
                    <div class="result-detail">${state.currentRound.categories[index].detail}</div>
                </div>
            </div>
            <div class="result-row">
                <span class="result-label">You</span>
                <span class="result-value">${getCountryFlagMarkup(assignment.country, 'inline-flag-image')} ${assignment.country}</span>
                <span class="result-rank">#${assignment.rank}</span>
            </div>
            <div class="result-row muted">
                <span class="result-label">Best</span>
                <span class="result-value">${getCountryFlagMarkup(optimalAssignment.country, 'inline-flag-image')} ${optimalAssignment.country}</span>
                <span class="result-rank">#${optimalAssignment.rank}</span>
            </div>
        `;
        ui.resultsGrid.appendChild(card);
    });
}

function startRound() {
    if (!state.categories.length) {
        ui.statusPill.textContent = 'Still loading rankings...';
        return;
    }

    state.currentRound = buildRound();
    state.selectedCountry = null;
    stopBrasilAudio();

    ui.resultsCard.classList.add('hidden');
    ui.statusPill.textContent = `${state.categories.length} curated ranking lists ready`;
    ui.roundTitle.textContent = 'Five countries. Five rankings. Lowest score wins.';

    renderBoard();
}

async function loadGame() {
    try {
        const response = await fetch('data/all_rankings.json');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        state.rawData = await response.json();
        state.categories = buildCategoryDataset(state.rawData);

        if (state.categories.length < ROUND_SIZE) {
            throw new Error('Not enough valid categories after cleanup.');
        }

        startRound();
    } catch (error) {
        console.error(error);
        ui.statusPill.textContent = 'Failed to load rankings';
        ui.roundTitle.textContent = 'Unable to prepare a round';
        ui.instructions.textContent = 'Open the console for details. The rankings file may be missing or malformed.';
    }
}

ui.newRoundButton.addEventListener('click', startRound);
ui.playAgainButton.addEventListener('click', startRound);

window.addEventListener('pointerdown', ensureAudioStarted, { once: true });
window.addEventListener('keydown', ensureAudioStarted, { once: true });

loadGame();
