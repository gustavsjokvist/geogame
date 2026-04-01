import { COUNTRY_FLAGS, CATEGORY_MAPPING } from './countries.js';

export class CSVRankingsParser {
    constructor() {
        this.countries = [];
        this.rankings = {};
    }

    async loadCSVData() {
        try {
            // Try to load from the CSV file
            const response = await fetch('./rankings.csv');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
            this.parseCSV(csvText);
            return true;
        } catch (error) {
            console.error('Error loading CSV data:', error);
            console.log('Falling back to hardcoded sample data...');
            this.createFallbackData();
            return true;
        }
    }

    createFallbackData() {
        // Fallback data with a sample of countries from your CSV
        const sampleData = [
            { name: "India", rankings: { population: 1, football: 16, "small-size": 72, crime: 80, gdp: 4, tourism: 35, gas: 23, coffee: 8 } },
            { name: "China", rankings: { population: 2, football: 90, "small-size": 86, crime: 92, gdp: 2, tourism: 4, gas: 7, coffee: 16 } },
            { name: "United States", rankings: { population: 3, football: 16, "small-size": 85, crime: 56, gdp: 1, tourism: 3, gas: 4, coffee: 50 } },
            { name: "Brazil", rankings: { population: 7, football: 5, "small-size": 80, crime: 15, gdp: 10, tourism: 30, gas: 36, coffee: 1 } },
            { name: "Argentina", rankings: { population: 33, football: 1, "small-size": 78, crime: 18, gdp: 23, tourism: 68, gas: 35, coffee: 41 } },
            { name: "Germany", rankings: { population: 19, football: 10, "small-size": 63, crime: 93, gdp: 3, tourism: 8, gas: 74, coffee: 8 } },
            { name: "France", rankings: { population: 20, football: 3, "small-size": 49, crime: 35, gdp: 7, tourism: 1, gas: 84, coffee: 22 } },
            { name: "United Kingdom", rankings: { population: 21, football: 4, "small-size": 80, crime: 61, gdp: 6, tourism: 7, gas: 46, coffee: 21 } },
            { name: "Spain", rankings: { population: 31, football: 2, "small-size": 51, crime: 100, gdp: 12, tourism: 2, gas: 97, coffee: 43 } },
            { name: "Netherlands", rankings: { population: 69, football: 6, "small-size": 64, crime: 8, gdp: 18, tourism: 16, gas: 51, coffee: 75 } },
            { name: "Italy", rankings: { population: 25, football: 9, "small-size": 71, crime: 63, gdp: 8, tourism: 4, gas: 66, coffee: 8 } },
            { name: "Japan", rankings: { population: 11, football: 15, "small-size": 62, crime: 10, gdp: 5, tourism: 15, gas: 76, coffee: 15 } },
            { name: "South Korea", rankings: { population: 29, football: 23, "small-size": 88, crime: 29, gdp: 13, tourism: 24, gas: 83, coffee: 24 } },
            { name: "Australia", rankings: { population: 54, football: 26, "small-size": 96, crime: 64, gdp: 14, tourism: 69, gas: 13, coffee: 69 } },
            { name: "Canada", rankings: { population: 37, football: 29, "small-size": 98, crime: 76, gdp: 9, tourism: 19, gas: 16, coffee: 19 } },
            { name: "Russia", rankings: { population: 9, football: 34, "small-size": 99, crime: 92, gdp: 11, tourism: 52, gas: 1, coffee: 34 } },
            { name: "Mexico", rankings: { population: 10, football: 17, "small-size": 67, crime: 40, gdp: 15, tourism: 6, gas: 45, coffee: 13 } },
            { name: "Colombia", rankings: { population: 26, football: 14, "small-size": 45, crime: 25, gdp: 38, tourism: 32, gas: 57, coffee: 4 } },
            { name: "Peru", rankings: { population: 43, football: 41, "small-size": 20, crime: 11, gdp: 47, tourism: 57, gas: 38, coffee: 7 } },
            { name: "Chile", rankings: { population: 63, football: 50, "small-size": 38, crime: 30, gdp: 44, tourism: 42, gas: 55, coffee: 42 } },
            { name: "Uruguay", rankings: { population: 97, football: 13, "small-size": 91, crime: 47, gdp: 80, tourism: 41, gas: 96, coffee: 61 } },
            { name: "Ecuador", rankings: { population: 72, football: 24, "small-size": 28, crime: 22, gdp: 63, tourism: 73, gas: 80, coffee: 41 } },
            { name: "Norway", rankings: { population: 118, football: 37, "small-size": 6, crime: 2, gdp: 31, tourism: 55, gas: 21, coffee: 37 } },
            { name: "Switzerland", rankings: { population: 99, football: 20, "small-size": 63, crime: 1, gdp: 21, tourism: 48, gas: 95, coffee: 20 } }
        ];

        this.countries = sampleData.map(data => ({
            name: data.name,
            flag: COUNTRY_FLAGS[data.name] || "🏳️",
            rankings: data.rankings
        }));

        console.log(`Loaded ${this.countries.length} countries from fallback data`);
    }

    parseCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',');
        
        // Initialize rankings structure
        Object.values(CATEGORY_MAPPING).forEach(category => {
            this.rankings[category] = {};
        });

        // Process each line (skip header and empty lines)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith('Wikipedia')) continue;
            
            const cells = this.parseCSVLine(line);
            if (cells.length < headers.length) continue;

            // Process each category column
            headers.forEach((header, colIndex) => {
                const gameCategory = CATEGORY_MAPPING[header.trim()];
                if (!gameCategory) return;

                const cellValue = cells[colIndex]?.trim();
                if (!cellValue) return;

                // Parse "1. Country Name" format
                const match = cellValue.match(/^(\d+)\.\s*(.+)$/);
                if (match) {
                    const rank = parseInt(match[1]);
                    const countryName = match[2].trim();
                    
                    // Store the ranking
                    this.rankings[gameCategory][countryName] = rank;
                }
            });
        }

        // Create countries array with all available data
        this.createCountriesArray();
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                // If we encounter a quote, check if it's a double quote escape
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++; // Skip the next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current.trim());
        return result;
    }

    createCountriesArray() {
        const countrySet = new Set();
        
        // Collect all unique countries
        Object.values(this.rankings).forEach(categoryRankings => {
            Object.keys(categoryRankings).forEach(country => {
                if (COUNTRY_FLAGS[country]) {
                    countrySet.add(country);
                }
            });
        });

        // Create countries array with rankings
        this.countries = Array.from(countrySet).map(countryName => {
            const country = {
                name: countryName,
                flag: COUNTRY_FLAGS[countryName] || "🏳️", // Fallback for missing flags
                rankings: {}
            };

            // Add rankings for each category
            Object.keys(CATEGORY_MAPPING).forEach(csvCategory => {
                const gameCategory = CATEGORY_MAPPING[csvCategory];
                country.rankings[gameCategory] = this.rankings[gameCategory][countryName] || "100+";
            });

            return country;
        }).filter(country => {
            // Only include countries that have rankings for most categories
            const validRankings = Object.values(country.rankings).filter(rank => rank !== "100+");
            return validRankings.length >= 2; // Must have at least 2 out of 8 categories (more lenient)
        });

        console.log(`Loaded ${this.countries.length} countries with rankings`);
    }

    getCountries() {
        return this.countries;
    }

    // Get a random selection of countries for the game
    getRandomCountries(count = 8) {
        const shuffled = [...this.countries].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
}
