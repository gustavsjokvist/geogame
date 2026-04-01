import { CSVRankingsParser } from './csvParser.js';
import { PopupManager } from './popups.js';
import { Sounds } from './sound.js'; // Import sound system

export class GeographyChallenge {
    constructor() {
        this.csvParser = new CSVRankingsParser();
        this.popupManager = null; // Will be initialized after DOM is ready
        this.soundSystem = new Sounds(); // Initialize sound system
        this.countries = [];
        this.categories = ['population', 'football', 'small-size', 'crime', 'gdp', 'tourism', 'gas', 'coffee'];
        this.gameState = {
            currentRound: 0,
            selectedCountries: [],
            assignedCategories: new Set(),
            totalScore: 0,
            gameStarted: false,
            gameOver: false,
            assignments: {},
            results: [], // Array to store game results for sharing
            dataLoaded: false,
            flagReady: false,
            spinning: false,
            showCountryNames: true,
            isFirstTime: false,
            tutorialStep: 0,
            showingTutorial: false
        };
        
        // Game statistics tracking
        this.gameStats = {
            gamesPlayed: 0,
            bestScore: null, // Start with null instead of Infinity for cleaner display
            averageScore: 0,
            perfectGames: 0,
            achievements: new Set()
        };
        
        // User tracking for analytics (privacy-friendly, no personal data)
        this.userTracker = {
            enabled: true,
            userId: null,
            sessionId: null,
            installDate: null,
            totalSessions: 0,
            totalPlayTime: 0,
            sessionStartTime: null
        };
        
        this.initializeGame();
    }
    
    // Initialize privacy-friendly user tracking
    initializeUserTracking() {
        try {
            // Generate or load user ID (anonymous)
            let userData = localStorage.getItem('geoHunterUser');
            if (userData) {
                this.userTracker = { ...this.userTracker, ...JSON.parse(userData) };
            } else {
                // Generate anonymous user ID
                this.userTracker.userId = this.generateAnonymousId();
                this.userTracker.installDate = new Date().toISOString();
                this.userTracker.totalSessions = 0;
                this.userTracker.totalPlayTime = 0;
            }
            
            // Generate new session ID for this session
            this.userTracker.sessionId = this.generateAnonymousId();
            this.userTracker.sessionStartTime = Date.now();
            this.userTracker.totalSessions++;
            
            this.saveUserTracking();
            
        } catch (error) {
            console.warn('User tracking initialization failed:', error);
            this.userTracker.enabled = false;
        }
    }
    
    // Generate anonymous ID for tracking
    generateAnonymousId() {
        return 'ght_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    
    // Save user tracking data
    saveUserTracking() {
        if (!this.userTracker.enabled) return;
        
        try {
            // Calculate session duration
            if (this.userTracker.sessionStartTime) {
                const sessionDuration = Date.now() - this.userTracker.sessionStartTime;
                this.userTracker.totalPlayTime += sessionDuration;
            }
            
            const userData = {
                userId: this.userTracker.userId,
                installDate: this.userTracker.installDate,
                totalSessions: this.userTracker.totalSessions,
                totalPlayTime: this.userTracker.totalPlayTime,
                lastSeen: new Date().toISOString()
            };
            
            localStorage.setItem('geoHunterUser', JSON.stringify(userData));
        } catch (error) {
            console.warn('Failed to save user tracking:', error);
        }
    }
    
    // Track game events (privacy-friendly)
    trackEvent(eventType, eventData = {}) {
        if (!this.userTracker.enabled) return;
        
        try {
            const event = {
                userId: this.userTracker.userId,
                sessionId: this.userTracker.sessionId,
                timestamp: new Date().toISOString(),
                type: eventType,
                data: eventData
            };
            
            // For now, just log events (can be extended to send to analytics service)
            // Could extend this to send to a privacy-friendly analytics service like:
            // - Plausible Analytics
            // - Simple Analytics
            // - Self-hosted analytics
            // Example:
            // if (window.plausible) {
            //     window.plausible(eventType, { props: eventData });
            // }
            
        } catch (error) {
            console.warn('Event tracking failed:', error);
        }
    }
    
    // Display user statistics (for debugging/analytics)
    displayUserStats() {
        if (!this.userTracker.enabled) return;
        
        const playTimeHours = (this.userTracker.totalPlayTime / (1000 * 60 * 60)).toFixed(1);
        const installDays = Math.floor((Date.now() - new Date(this.userTracker.installDate)) / (1000 * 60 * 60 * 24));
        
        // User statistics are available for analytics but not logged in production
        // console.log('👤 User Statistics:');
        // console.log(`   📅 Installed: ${installDays} days ago`);
        // console.log(`   🎮 Total Sessions: ${this.userTracker.totalSessions}`);
        // console.log(`   ⏱️ Total Play Time: ${playTimeHours} hours`);
        // console.log(`   🎯 Games Played: ${this.gameStats.gamesPlayed}`);
        // console.log(`   🏆 Best Score: ${this.gameStats.bestScore || 'None yet'}`);
    }

    // Enhanced haptic feedback for mobile devices
    triggerHaptic(type = 'light') {
        if ('vibrate' in navigator) {
            switch(type) {
                case 'light':
                    navigator.vibrate(50);
                    break;
                case 'medium':
                    navigator.vibrate(100);
                    break;
                case 'heavy':
                    navigator.vibrate([100, 50, 100]);
                    break;
                case 'success':
                    navigator.vibrate([50, 50, 50]);
                    break;
                case 'error':
                    navigator.vibrate([200, 100, 200]);
                    break;
                case 'achievement':
                    navigator.vibrate([100, 50, 100, 50, 200]);
                    break;
            }
        }
    }
    
    // Load game statistics from localStorage
    loadGameStats() {
        try {
            const saved = localStorage.getItem('geoHunterStats');
            
            if (saved) {
                const stats = JSON.parse(saved);
                this.gameStats = {
                    ...this.gameStats,
                    ...stats,
                    achievements: new Set(stats.achievements || [])
                };
            } else {
                // First time user
                this.gameState.isFirstTime = true;
            }
        } catch (error) {
            console.warn('Failed to load game stats:', error);
            // Assume first time user if stats can't be loaded
            this.gameState.isFirstTime = true;
        }
    }
    
    // Save game statistics to localStorage
    saveGameStats() {
        try {
            // Update stats
            this.gameStats.gamesPlayed++;
            
            // Update best score (lower is better!)
            if (this.gameStats.bestScore === null || this.gameState.totalScore < this.gameStats.bestScore) {
                this.gameStats.bestScore = this.gameState.totalScore;
            }
            
            // Calculate average score
            this.gameStats.averageScore = Math.round(
                ((this.gameStats.averageScore * (this.gameStats.gamesPlayed - 1)) + this.gameState.totalScore) / this.gameStats.gamesPlayed
            );
            
            // Check for perfect game (very low average score)
            if (this.gameState.totalScore <= 80) { // 8 rounds * 10 average = very good
                this.gameStats.perfectGames++;
            }
            
            const statsToSave = {
                ...this.gameStats,
                achievements: Array.from(this.gameStats.achievements)
            };
            localStorage.setItem('geoHunterStats', JSON.stringify(statsToSave));
        } catch (error) {
            console.warn('Failed to save game stats:', error);
        }
    }
    
    // Load user preferences from localStorage
    loadPreferences() {
        try {
            const saved = localStorage.getItem('geoHunterPrefs');
            if (saved) {
                const prefs = JSON.parse(saved);
                this.gameState.showCountryNames = prefs.showCountryNames !== false;
                this.soundSystem.enabled = prefs.soundEnabled !== false;
                
                // Update UI to reflect loaded preferences
                this.updateCountryToggle();
                this.updateSoundToggle();
            }
        } catch (error) {
            console.warn('Failed to load preferences:', error);
        }
    }
    
    // Save user preferences to localStorage
    savePreferences() {
        try {
            const prefs = {
                showCountryNames: this.gameState.showCountryNames,
                soundEnabled: this.soundSystem.enabled
            };
            localStorage.setItem('geoHunterPrefs', JSON.stringify(prefs));
        } catch (error) {
            console.warn('Failed to save preferences:', error);
        }
    }
    
    // Display game statistics
    displayGameStats() {
        if (this.gameStats.gamesPlayed > 0) {
            const bestScoreText = this.gameStats.bestScore !== null ? this.gameStats.bestScore : 'None yet';
            // Stats are available for display but not logged in production
            // console.log(`🎯 Geo Hunter Stats - Games: ${this.gameStats.gamesPlayed} | Best Score: ${bestScoreText} (lower is better!) | Average: ${this.gameStats.averageScore}`);
        }
    }
    
    // Show enhanced loading state with progress
    showLoadingState(show) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const startButton = document.getElementById('startButton');
        
        if (show) {
            loadingOverlay.classList.remove('hidden');
            startButton.textContent = 'Loading...';
            startButton.disabled = true;
            
            // Simulate loading progress
            this.updateLoadingProgress(0);
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 20;
                if (progress > 90) progress = 90;
                this.updateLoadingProgress(progress);
                
                if (progress >= 90) {
                    clearInterval(progressInterval);
                }
            }, 100);
            
            // Store interval to clear it later
            this.loadingInterval = progressInterval;
        }
        else {
            // Complete the progress bar
            this.updateLoadingProgress(100);
            
            if (this.loadingInterval) {
                clearInterval(this.loadingInterval);
            }
            
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
                startButton.textContent = 'Start Game';
                startButton.disabled = false;
            }, 500);
        }
    }
    
    updateLoadingProgress(progress) {
        const loadingBar = document.getElementById('loadingBar');
        if (loadingBar) {
            loadingBar.style.width = `${progress}%`;
        }
    }

    async initializeGame() {
        // Initialize user tracking
        this.initializeUserTracking();
        
        // Load saved data
        this.loadGameStats();
        this.loadPreferences();
        
        this.setupEventListeners();
        
        // Show loading state
        this.showLoadingState(true);
        
        // Load CSV data
        const loadingSuccess = await this.csvParser.loadCSVData();
        if (loadingSuccess) {
            this.countries = this.csvParser.getCountries();
            this.gameState.dataLoaded = true;
        } else {
            console.error('Failed to load ranking data');
            alert('Failed to load ranking data. Please check if the CSV file is available.');
        }
        
        // Hide loading state
        this.showLoadingState(false);
        
        // Initialize popup manager
        this.popupManager = new PopupManager(this);
        
        // Initial UI update to set proper state
        this.updateUI();
        this.updateScoreVisualization();
        this.displayGameStats();
        
        // Show tutorial if it's the first time (with slight delay to ensure DOM is ready)
        if (this.gameState.isFirstTime) {
            setTimeout(() => {
                this.popupManager.showTutorial();
            }, 100);
        }
    }
    
    setupEventListeners() {
        // Start game button with sound and haptic feedback
        document.getElementById('startButton').addEventListener('click', () => {
            this.soundSystem.handleFirstInteraction(); // Initialize audio on first click
            this.triggerHaptic('medium');
            this.soundSystem.playSoundEffect('button');
            this.startGame();
        });
        
        // Reset/Play again buttons
        document.getElementById('resetButton').addEventListener('click', () => {
            this.triggerHaptic('light');
            this.soundSystem.playSoundEffect('button');
            this.resetGame();
        });
        
        document.getElementById('playAgainButton').addEventListener('click', () => {
            this.triggerHaptic('light');
            this.soundSystem.playSoundEffect('button');
            this.resetGame();
            document.getElementById('gameOverModal').style.display = 'none';
        });
        
        // Help modal buttons
        document.getElementById('helpButton').addEventListener('click', () => {
            this.soundSystem.handleFirstInteraction(); // Initialize audio if needed
            this.triggerHaptic('light');
            this.soundSystem.playSoundEffect('button');
            document.getElementById('helpModal').style.display = 'flex';
            this.updateUserAnalyticsDisplay(); // Update analytics display in help modal
        });
        
        document.getElementById('closeHelpButton').addEventListener('click', () => {
            this.soundSystem.handleFirstInteraction(); // Initialize audio if needed
            this.triggerHaptic('light');
            this.soundSystem.playSoundEffect('button');
            document.getElementById('helpModal').style.display = 'none';
        });
        
        // Close help modal when clicking outside
        document.getElementById('helpModal').addEventListener('click', (e) => {
            if (e.target.id === 'helpModal') {
                this.soundSystem.handleFirstInteraction(); // Initialize audio if needed
                this.triggerHaptic('light');
                this.soundSystem.playSoundEffect('button');
                document.getElementById('helpModal').style.display = 'none';
            }
        });
        
        // Show Tutorial button in help modal
        document.getElementById('showTutorialButton').addEventListener('click', () => {
            this.soundSystem.handleFirstInteraction(); // Initialize audio if needed
            this.triggerHaptic('medium');
            this.soundSystem.playSoundEffect('button');
            // Close help modal first
            document.getElementById('helpModal').style.display = 'none';
            // Force show tutorial
            this.forceTutorial();
        });
        
        // Sound toggle
        document.getElementById('soundToggle').addEventListener('click', () => {
            this.soundSystem.handleFirstInteraction(); // Initialize audio if needed
            this.triggerHaptic('light');
            this.toggleSound();
        });
        
        // Country name toggle
        document.getElementById('countryToggle').addEventListener('click', () => {
            this.soundSystem.handleFirstInteraction(); // Initialize audio if needed
            this.triggerHaptic('light');
            this.soundSystem.playSoundEffect('button');
            this.toggleCountryNames();
        });

        // Sound test button
        document.getElementById('soundTestButton').addEventListener('click', () => {
            this.soundSystem.handleFirstInteraction(); // Initialize audio if needed
            this.triggerHaptic('medium');
            
            // Play a series of test sounds
            this.soundSystem.playSoundEffect('button');
            setTimeout(() => this.soundSystem.playSoundEffect('ready'), 300);
            setTimeout(() => this.soundSystem.playSoundEffect('select'), 600);
        });

        // Category selection
        const categoryItems = document.querySelectorAll('.category-item');
        categoryItems.forEach(item => {
            item.addEventListener('click', (e) => {
                this.soundSystem.handleFirstInteraction(); // Initialize audio if needed
                const category = e.currentTarget.dataset.category;
                this.selectCategory(category);
            });
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardInput(e);
        });
        
        // Share modal event listeners with error handling
        const shareScoreButton = document.getElementById('shareScoreButton');
        if (shareScoreButton) {
            shareScoreButton.addEventListener('click', () => {
                this.soundSystem.handleFirstInteraction(); // Initialize audio if needed
                this.triggerHaptic('light');
                this.soundSystem.playSoundEffect('button');
                this.showShareModal();
            });
        }

        const closeShareButton = document.getElementById('closeShareButton');
        if (closeShareButton) {
            closeShareButton.addEventListener('click', () => {
                this.soundSystem.handleFirstInteraction(); // Initialize audio if needed
                this.triggerHaptic('light');
                this.soundSystem.playSoundEffect('button');
                this.hideShareModal();
            });
        }

        const shareModal = document.getElementById('shareModal');
        if (shareModal) {
            shareModal.addEventListener('click', (e) => {
                if (e.target.id === 'shareModal') {
                    this.soundSystem.handleFirstInteraction(); // Initialize audio if needed
                    this.triggerHaptic('light');
                    this.soundSystem.playSoundEffect('button');
                    this.hideShareModal();
                }
            });
        }

        const copyTextButton = document.getElementById('copyTextButton');
        if (copyTextButton) {
            copyTextButton.addEventListener('click', () => {
                this.soundSystem.handleFirstInteraction(); // Initialize audio if needed
                this.triggerHaptic('medium');
                this.soundSystem.playSoundEffect('button');
                this.copyShareText();
            });
        }

        const downloadButton = document.getElementById('downloadButton');
        if (downloadButton) {
            downloadButton.addEventListener('click', () => {
                this.soundSystem.handleFirstInteraction(); // Initialize audio if needed
                this.triggerHaptic('medium');
                this.soundSystem.playSoundEffect('button');
                this.downloadShareImage();
            });
        }

        const nativeShareButton = document.getElementById('nativeShareButton');
        if (nativeShareButton) {
            nativeShareButton.addEventListener('click', () => {
                this.soundSystem.handleFirstInteraction(); // Initialize audio if needed
                this.triggerHaptic('medium');
                this.soundSystem.playSoundEffect('button');
                this.nativeShare();
            });
        }
    }
    
    // Keyboard navigation support
    handleKeyboardInput(e) {
        // Only handle keyboard when game is active and not in modal
        const helpModal = document.getElementById('helpModal');
        const gameOverModal = document.getElementById('gameOverModal');
        
        if (helpModal.style.display === 'flex' || gameOverModal.style.display === 'flex') {
            // Handle modal navigation
            if (e.key === 'Escape') {
                helpModal.style.display = 'none';
                gameOverModal.style.display = 'none';
                this.soundSystem.playSoundEffect('button');
            }
            return;
        }
        
        if (!this.gameState.gameStarted || !this.gameState.flagReady) {
            // Handle game start
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!this.gameState.gameStarted && this.gameState.dataLoaded) {
                    document.getElementById('startButton').click();
                }
            }
            return;
        }
        
        // Number keys 1-8 for category selection
        const keyNum = parseInt(e.key);
        if (keyNum >= 1 && keyNum <= 8) {
            e.preventDefault();
            const category = this.categories[keyNum - 1];
            this.selectCategory(category);
        }
        
        // Letter shortcuts for categories
        const shortcuts = {
            'p': 'population',
            'f': 'football', 
            's': 'small-size',
            'c': 'crime',
            'g': 'gdp',
            't': 'tourism',
            'a': 'gas', // 'a' for gas to avoid conflict
            'o': 'coffee' // 'o' for coffee
        };
        
        if (shortcuts[e.key.toLowerCase()]) {
            e.preventDefault();
            this.selectCategory(shortcuts[e.key.toLowerCase()]);
        }
        
        // Utility shortcuts
        if (e.key === 'h' || e.key === '?') {
            e.preventDefault();
            document.getElementById('helpButton').click();
        }
        
        if (e.key === 'r') {
            e.preventDefault();
            if (this.gameState.gameStarted) {
                document.getElementById('resetButton').click();
            }
        }
        
        if (e.key === 'n') {
            e.preventDefault();
            document.getElementById('countryToggle').click();
        }
        
        if (e.key === '=') {
            e.preventDefault();
            this.autoPopulateCategories();
        }
    }
    
    startGame() {
        if (!this.gameState.dataLoaded) {
            alert('Data is still loading. Please try again in a moment.');
            return;
        }
        
        // Track game start event
        this.trackEvent('game_started', {
            countries_count: this.countries.length,
            show_country_names: this.gameState.showCountryNames,
            sound_enabled: this.soundSystem.enabled
        });
        
        this.gameState.gameStarted = true;
        this.gameState.gameOver = false;
        this.gameState.selectedCountries = this.getRandomCountries(8);
        this.gameState.currentRound = 0;
        this.gameState.totalScore = 0;
        this.gameState.assignedCategories.clear();
        this.gameState.assignments = {};
        this.gameState.results = []; // Clear results for new game
        this.gameState.flagReady = false;
        this.gameState.spinning = false;
        // showCountryNames state is preserved
        
        document.getElementById('startButton').style.display = 'none';
        document.getElementById('resetButton').style.display = 'inline-block';
        
        this.showNextFlag();
        this.updateUI();
        this.updateScoreVisualization();
        
        // Play start sound
        this.soundSystem.playSoundEffect('gameStart');
    }
    
    resetGame() {
        this.gameState = {
            currentRound: 0,
            selectedCountries: [],
            assignedCategories: new Set(),
            totalScore: 0,
            gameStarted: false,
            gameOver: false,
            assignments: {},
            results: [], // Reset results array for new game
            dataLoaded: this.gameState.dataLoaded, // Preserve data loaded state
            flagReady: false,
            spinning: false,
            showCountryNames: this.gameState.showCountryNames // Preserve toggle state
        };
        
        document.getElementById('startButton').style.display = 'inline-block';
        document.getElementById('resetButton').style.display = 'none';
        
        // Reset UI
        this.resetCategoriesUI();
        this.updateUI();
        this.updateScoreVisualization();
        
        // Reset flag display
        const flagDisplay = document.getElementById('flagDisplay');
        const countryName = document.getElementById('countryName');
        flagDisplay.classList.remove('ready', 'spinning');
        flagDisplay.innerHTML = '<div class="flag-placeholder"><span>Click Start Game to begin!</span></div>';
        if (countryName) {
            countryName.textContent = '';
        }
        
        // Play reset sound
        this.soundSystem.playSoundEffect('reset');
    }
    
    getRandomCountries(count) {
        // Normal shuffle
        const selected = [];
        for (let i = 0; i < count; i++) {
            const randomIndex = Math.floor(Math.random() * this.countries.length);
            selected.push(this.countries[randomIndex]);
        }
        return selected;
    }
    
    showNextFlag() {
        if (this.gameState.currentRound >= this.gameState.selectedCountries.length) {
            this.endGame();
            return;
        }
        
        const targetCountry = this.gameState.selectedCountries[this.gameState.currentRound];
        const flagDisplay = document.getElementById('flagDisplay');
        const countryName = document.getElementById('countryName');
        
        // Clear country name during spinning
        if (countryName) {
            countryName.textContent = '';
        }
        
        // Start slot machine effect
        this.startFlagSpinning(flagDisplay, targetCountry);
        
        this.updateUI();
    }
    
    startFlagSpinning(flagDisplay, targetCountry) {
        const spinDuration = 1000 + Math.random() * 1000; // 1.0-2.0 seconds
        const spinInterval = 80; // Change flag every 80ms
        let spinCount = 0;
        const maxSpins = Math.floor(spinDuration / spinInterval);
        
        // Set spinning state
        this.gameState.spinning = true;
        this.gameState.flagReady = false;
        
        // Add spinning visual state
        flagDisplay.classList.remove('ready');
        flagDisplay.classList.add('spinning');
        
        // Disable category selection during spinning
        this.disableCategorySelection(true);
        this.updateUI(); // Update UI to reflect spinning state
        
        // Play spinning sound repeatedly
        const spinSoundInterval = setInterval(() => {
            this.soundSystem.playSoundEffect('spin');
        }, 200);
        
        const spinInterval_id = setInterval(() => {
            // Get random country for spinning effect
            const randomCountry = this.countries[Math.floor(Math.random() * this.countries.length)];
            flagDisplay.innerHTML = `<div class="flag-emoji spinning">${randomCountry.flag}</div>`;
            
            spinCount++;
            
            // Stop spinning and show target country
            if (spinCount >= maxSpins) {
                clearInterval(spinInterval_id);
                clearInterval(spinSoundInterval);
                
                // Final reveal with animation
                setTimeout(() => {
                    flagDisplay.classList.add('flag-transition');
                    flagDisplay.innerHTML = `<div class="flag-emoji">${targetCountry.flag}</div>`;
                    const countryNameElement = document.getElementById('countryName');
                    if (countryNameElement && this.gameState.showCountryNames) {
                        countryNameElement.textContent = targetCountry.name;
                        countryNameElement.style.display = '';
                    } else if (countryNameElement) {
                        countryNameElement.style.display = 'none';
                    }
                    
                    // Re-enable category selection and set flag ready
                    this.gameState.spinning = false;
                    this.gameState.flagReady = true;
                    
                    // Add ready visual state
                    flagDisplay.classList.remove('spinning');
                    flagDisplay.classList.add('ready');
                    
                    this.disableCategorySelection(false);
                    this.updateUI(); // Update UI to reflect ready state
                    
                    // Trigger light haptic for flag ready
                    this.triggerHaptic('light');
                    
                    // Play ready sound
                    this.soundSystem.playSoundEffect('ready');
                    
                    // Show tutorial for first-time users on first flag
                    if (this.gameState.isFirstTime && this.gameState.currentRound === 0 && this.gameState.tutorialStep === 0) {
                        setTimeout(() => {
                            this.popupManager.showTutorial();
                        }, 800);
                    }
                    
                    // Remove animation class
                    setTimeout(() => {
                        flagDisplay.classList.remove('flag-transition');
                    }, 500);
                }, 200);
            }
        }, spinInterval);
    }
    
    disableCategorySelection(disabled) {
        const categoryItems = document.querySelectorAll('.category-item:not(.selected)');
        categoryItems.forEach(item => {
            if (disabled) {
                item.classList.add('spinning-disabled');
            } else {
                item.classList.remove('spinning-disabled');
            }
        });
    }
    
    selectCategory(category) {
        // Check all conditions for valid selection
        if (!this.gameState.gameStarted || this.gameState.gameOver) {
            return;
        }
        if (this.gameState.assignedCategories.has(category)) {
            return;
        }
        
        // Check if there's a current country ready for assignment
        if (this.gameState.currentRound >= this.gameState.selectedCountries.length) {
            return;
        }
        
        // Check if categories are disabled due to spinning or no flag ready
        const categoryItem = document.querySelector(`[data-category="${category}"]`);
        if (categoryItem.classList.contains('spinning-disabled') || !this.gameState.flagReady) {
            return;
        }
        
        const currentCountry = this.gameState.selectedCountries[this.gameState.currentRound];
        const score = currentCountry.rankings[category];
        const scoreValue = score === "100+" ? 101 : score;
        
        // Assign country to category
        this.gameState.assignedCategories.add(category);
        this.gameState.assignments[category] = {
            country: currentCountry,
            score: score,
            scoreValue: scoreValue
        };
        
        // Add to results array for sharing
        this.gameState.results.push({
            country: currentCountry,
            category: category,
            score: score,
            scoreValue: scoreValue
        });
        
        this.gameState.totalScore += scoreValue;

        // Update category UI
        this.updateCategoryUI(category, currentCountry, score);
        
        // Trigger haptic feedback and sound
        this.triggerHaptic('medium');
        this.soundSystem.playSoundEffect('select');
        
        // Check for achievements
        this.checkAchievements(score, currentCountry, category);
        
        // Show tutorial feedback for first-time users on first selection
        if (this.gameState.isFirstTime && this.gameState.tutorialStep === 2) {
            setTimeout(() => {
                this.popupManager.showTutorialFeedback(score, currentCountry, category);
            }, 1000);
        }
        
        // Reset flag ready state and visual state
        this.gameState.flagReady = false;
        const flagDisplay = document.getElementById('flagDisplay');
        flagDisplay.classList.remove('ready', 'spinning');
        
        // Move to next round
        this.gameState.currentRound++;
        
        // Update UI immediately
        this.updateUI();
        this.updateScoreVisualization();
        
        // Check if this is the last round (round 8, index 7)
        if (this.gameState.currentRound === 8) {
            // End the game after all 8 countries have been assigned
            setTimeout(() => {
                this.endGame();
            }, 1000);
        } else {
            // Show next flag
            setTimeout(() => {
                this.showNextFlag();
            }, 1000);
        }
    }
    
    updateCategoryUI(category, country, score) {
        const categoryItem = document.querySelector(`[data-category="${category}"]`);
        const flagElement = document.getElementById(`flag-${category}`);
        const scoreElement = document.getElementById(`score-${category}`);
        
        categoryItem.classList.add('selected', 'just-selected');
        flagElement.innerHTML = `<div class="flag-emoji">${country.flag}</div>`;
        scoreElement.textContent = score;
        
        // Add rank quality indicator
        const scoreValue = score === "100+" ? 101 : score;
        if (scoreValue <= 10) {
            scoreElement.setAttribute('data-rank', 'excellent');
        } else if (scoreValue <= 30) {
            scoreElement.setAttribute('data-rank', 'good');
        } else {
            scoreElement.setAttribute('data-rank', 'poor');
        }
        
        // Remove animation class after animation completes
        setTimeout(() => {
            categoryItem.classList.remove('just-selected');
        }, 500);
        
        // Animate score update
        const totalScoreElement = document.getElementById('totalScore');
        totalScoreElement.classList.add('updated');
        setTimeout(() => {
            totalScoreElement.classList.remove('updated');
        }, 300);
    }
    
    resetCategoriesUI() {
        this.categories.forEach(category => {
            const categoryItem = document.querySelector(`[data-category="${category}"]`);
            const flagElement = document.getElementById(`flag-${category}`);
            const scoreElement = document.getElementById(`score-${category}`);
            
            categoryItem.classList.remove('selected', 'disabled', 'spinning-disabled', 'just-selected');
            flagElement.innerHTML = '';
            scoreElement.textContent = '';
        });
    }
    
    updateUI() {
        // Update score display
        document.getElementById('totalScore').textContent = this.gameState.totalScore;
        
        // Update best score display
        const bestScore = document.getElementById('bestScore');
        if (bestScore && this.gameStats.bestScore !== null) {
            bestScore.textContent = `(Best: ${this.gameStats.bestScore})`;
        }
        
        // Update round counter
        const roundCounterEl = document.getElementById('roundCounter');
        if (this.gameState.gameStarted && !this.gameState.gameOver) {
            if (this.gameState.isFirstTime && this.gameState.currentRound === 0 && this.gameState.flagReady && !this.gameState.showingTutorial) {
                roundCounterEl.textContent = '👆 Choose the category where this country ranks best!';
                roundCounterEl.classList.add('tutorial-active');
            } else {
                const roundText = this.gameState.currentRound < 8 ? 
                    `Country ${this.gameState.currentRound + 1} of 8` : 
                    'Final Score';
                roundCounterEl.textContent = roundText;
                roundCounterEl.classList.remove('tutorial-active');
            }
        } else {
            roundCounterEl.textContent = '';
            roundCounterEl.classList.remove('tutorial-active');
        }
        
        // Update category availability
        this.categories.forEach(category => {
            const categoryItem = document.querySelector(`[data-category="${category}"]`);
            
            // Remove all state classes first
            categoryItem.classList.remove('disabled', 'spinning-disabled');
            
            if (this.gameState.assignedCategories.has(category)) {
                // Category is already assigned
                categoryItem.classList.add('disabled');
            } else if (!this.gameState.gameStarted || this.gameState.gameOver) {
                // Game not started or over - disable all categories
                categoryItem.classList.add('disabled');
            } else if (this.gameState.spinning || !this.gameState.flagReady) {
                // Flag is spinning or not ready - disable categories
                categoryItem.classList.add('spinning-disabled');
            }
            // If game is started and category not assigned and flag ready, it remains enabled
        });
    }
    
    endGame() {
        // Track game completion event
        this.trackEvent('game_completed', {
            score: this.gameState.totalScore,
            rounds_played: this.gameState.currentRound,
            show_country_names: this.gameState.showCountryNames,
            categories_used: Array.from(this.gameState.assignedCategories)
        });
        
        this.gameState.gameOver = true;
        this.gameState.gameStarted = false;
        this.gameState.flagReady = false;
        this.gameState.spinning = false;
        
        // Hide current flag
        const flagDisplay = document.getElementById('flagDisplay');
        const countryName = document.getElementById('countryName');
        flagDisplay.classList.remove('ready', 'spinning');
        flagDisplay.innerHTML = '<div class="flag-placeholder"><span>Game Complete!</span></div>';
        if (countryName) {
            countryName.textContent = '';
        }
        
        // Show game over modal
        this.showGameOverModal();
        
        // Hide reset button, show start button
        document.getElementById('resetButton').style.display = 'none';
        document.getElementById('startButton').style.display = 'inline-block';
        
        // Play game over sound
        this.soundSystem.playSoundEffect('gameOver');
        
        // Save game statistics and user tracking
        this.saveGameStats();
        this.saveUserTracking();
    }
    
    showGameOverModal() {
        const modal = document.getElementById('gameOverModal');
        const finalScore = document.getElementById('finalScore');
        const scoreBreakdown = document.getElementById('scoreBreakdown');
        
        finalScore.textContent = this.gameState.totalScore;
        
        // Calculate final rating
        const avgScore = this.gameState.totalScore / 8;
        let finalRating = '';
        let ratingColor = '';
        
        if (avgScore <= 10) {
            finalRating = '🏆 Geography Master!';
            ratingColor = '#48bb78';
            this.showAchievement('🏆 Geography Master!', 'Incredible hunting skills!', '🏆', true);
        } else if (avgScore <= 20) {
            finalRating = '🎯 Expert Hunter!';
            ratingColor = '#38a169';
        } else if (avgScore <= 35) {
            finalRating = '🗺️ Skilled Explorer!';
            ratingColor = '#ed8936';
        } else {
            finalRating = '🎲 Adventurous Hunter!';
            ratingColor = '#e53e3e';
        }
        
        // Check for new best score achievement
        if (this.gameStats.bestScore !== null && this.gameState.totalScore === this.gameStats.bestScore && this.gameStats.gamesPlayed > 1) {
            this.showAchievement('⭐ New Best Score!', `You beat your previous best with ${this.gameState.totalScore}!`, '⭐', true);
        }
        
        // Create score breakdown
        let breakdownHTML = `
            <div class="final-rating" style="color: ${ratingColor}; font-size: 1.1rem; font-weight: 600; margin-bottom: 15px; text-align: center;">
                ${finalRating}
            </div>
            <div class="score-summary" style="margin-bottom: 15px; text-align: center; padding: 10px; background: rgba(0,0,0,0.05); border-radius: 8px;">
                <div><strong>Your Best Score:</strong> ${this.gameStats.bestScore !== null ? this.gameStats.bestScore : 'N/A'} ${this.gameStats.bestScore !== null ? '(Lower is better!)' : ''}</div>
                <div><strong>Games Played:</strong> ${this.gameStats.gamesPlayed}</div>
                <div><strong>Average Score:</strong> ${this.gameStats.averageScore || 'N/A'}</div>
                ${this.gameStats.bestScore !== null && this.gameState.totalScore === this.gameStats.bestScore ? '<div style="color: #48bb78; font-weight: bold;">🎉 NEW BEST SCORE!</div>' : ''}
            </div>
        `;
        
        this.categories.forEach(category => {
            const assignment = this.gameState.assignments[category];
            if (assignment) {
                breakdownHTML += `
                    <div class="breakdown-item">
                        <div class="breakdown-country">
                            <span class="flag-emoji" style="font-size: 20px;">${assignment.country.flag}</span>
                            <span>${assignment.country.name}</span>
                        </div>
                        <div class="breakdown-category">${category.charAt(0).toUpperCase() + category.slice(1)}</div>
                        <div class="breakdown-score">${assignment.score}</div>
                    </div>
                `;
            }
        });
        
        scoreBreakdown.innerHTML = breakdownHTML;
        modal.style.display = 'flex';
        
        // Trigger completion haptic
        this.triggerHaptic('success');
    }
    
    // Confetti animation for special achievements
    createConfetti() {
        const colors = ['red', 'blue', 'green', 'yellow', 'purple'];
        const confettiCount = 50;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = `confetti ${colors[Math.floor(Math.random() * colors.length)]}`;
            
            // Random starting position
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
            confetti.style.animation = `confettiFall ${(Math.random() * 3 + 2)}s linear forwards`;
            
            document.body.appendChild(confetti);
            
            // Remove confetti after animation
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.parentNode.removeChild(confetti);
                }
            }, 5000);
        }
    }
    
    // Enhanced achievement system with confetti
    showAchievement(title, description, icon = '🏆', showConfetti = false) {
        const notification = document.getElementById('achievementNotification');
        const titleEl = document.getElementById('achievementTitle');
        const descEl = document.getElementById('achievementDesc');
        const iconEl = notification.querySelector('.achievement-icon');
        
        titleEl.textContent = title;
        descEl.textContent = description;
        iconEl.textContent = icon;
        
        notification.classList.add('show');
        this.triggerHaptic('achievement');
        this.soundSystem.playSoundEffect('achievement');
        
        // Add confetti for special achievements
        if (showConfetti) {
            setTimeout(() => this.createConfetti(), 300);
        }
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3500);
    }
    
    checkAchievements(score, country, category) {
        // Perfect score achievement
        if (score === 1) {
            this.gameStats.achievements.add('perfect_shot');
            this.showAchievement('🎯 Perfect Shot!', `${country.name} is #1 in ${category}!`, '🎯', true);
            this.soundSystem.playSoundEffect('perfect');
        }
        
        // Good score achievement
        if (score <= 5 && score !== 1) {
            this.showAchievement('🔥 Great Answer!', `Top 5 placement in ${category}!`, '🔥');
        }
        
        // Geography expert achievement
        if (score <= 5 && this.gameState.currentRound >= 3) {
            this.gameStats.achievements.add('geography_expert');
            this.showAchievement('🌍 Geography Expert!', 'Multiple excellent guesses!', '🌍', true);
        }
        
        // Consecutive perfect games
        const avgScore = this.gameState.totalScore / Math.max(this.gameState.currentRound, 1);
        if (avgScore <= 10 && this.gameState.currentRound >= 4) {
            this.gameStats.achievements.add('expert_hunter');
            this.showAchievement('🎖️ Expert Hunter!', 'Maintaining excellent average score!', '🎖️', true);
        }
    }
    
    updateScoreVisualization() {
        const scoreBar = document.getElementById('scoreBar');
        const scoreRating = document.getElementById('scoreRating');
        const scoreValue = document.getElementById('totalScore');
        const bestScore = document.getElementById('bestScore');
        
        if (!scoreBar || !scoreRating || !scoreValue) return;
        
        const score = this.gameState.totalScore;
        const currentRound = this.gameState.currentRound;
        
        // Update best score display
        if (bestScore && this.gameStats.bestScore !== null) {
            bestScore.textContent = `(Best: ${this.gameStats.bestScore})`;
        } else if (bestScore) {
            bestScore.textContent = '';
        }
        
        if (currentRound === 0) {
            scoreBar.style.setProperty('--progress', '0%');
            
            // Show best score or default message
            if (this.gameStats.bestScore !== null) {
                scoreRating.textContent = `🏆 Your Best Score: ${this.gameStats.bestScore}`;
                scoreRating.style.color = '#48bb78';
            } else {
                scoreRating.textContent = 'Ready to Hunt!';
                scoreRating.style.color = '#667eea';
            }
            
            // Reset score value to default styling
            scoreValue.style.color = '#667eea';
            scoreValue.style.background = 'rgba(102, 126, 234, 0.1)';
            scoreValue.style.borderColor = 'transparent';
            return;
        }
        
        // Calculate average score per round
        const avgScore = score / currentRound;
        let progress = 0;
        let rating = '';
        let color = '';
        let backgroundColor = '';
        let borderColor = '';
        
        // More specific rating phrases based on average score
        if (avgScore <= 5) {
            progress = (avgScore / 5) * 15; // 0-15% for exceptional
            rating = '🏆 Geography Master - Incredible!';
            color = '#38a169';
            backgroundColor = 'rgba(56, 161, 105, 0.15)';
            borderColor = 'rgba(56, 161, 105, 0.3)';
        } else if (avgScore <= 10) {
            progress = 15 + ((avgScore - 5) / 5) * 15; // 15-30% for excellent
            rating = "🏆 Geography Expert - Outstanding!";
            color = '#48bb78';
            backgroundColor = 'rgba(72, 187, 120, 0.15)';
            borderColor = 'rgba(72, 187, 120, 0.3)';
        } else if (avgScore <= 15) {
            progress = 30 + ((avgScore - 10) / 5) * 15; // 30-45% for very good
            rating = "🎯 Wow! What a score";
            color = '#4299e1';
            backgroundColor = 'rgba(66, 153, 225, 0.15)';
            borderColor = 'rgba(66, 153, 225, 0.3)';
        } else if (avgScore <= 25) {
            progress = 45 + ((avgScore - 15) / 10) * 15; // 45-60% for good
            rating = "🌟 Youre doing amazing ! Keep going ";
            color = '#38a169';
            backgroundColor = 'rgba(56, 161, 105, 0.15)';
            borderColor = 'rgba(56, 161, 105, 0.3)';
        } else if (avgScore <= 35) {
            progress = 60 + ((avgScore - 25) / 10) * 15; // 60-75% for average
            rating = "🗺️ Youre doing good - keep going!";
            color = '#ed8936';
            backgroundColor = 'rgba(237, 137, 54, 0.15)';
            borderColor = 'rgba(237, 137, 54, 0.3)';
        } else if (avgScore <= 50) {
            progress = 75 + ((avgScore - 35) / 15) * 15; // 75-90% for below average
            rating = '📚 Come on... Think strategy!';
            color = '#e53e3e';
            backgroundColor = 'rgba(229, 62, 62, 0.15)';
            borderColor = 'rgba(229, 62, 62, 0.3)';
        } else if (avgScore <= 70) {
            progress = 90 + ((avgScore - 50) / 20) * 10; // 90-100% for poor
            rating = '🤔 Guessing you got unlucky';
            color = '#e53e3e';
            backgroundColor = 'rgba(229, 62, 62, 0.15)';
            borderColor = 'rgba(229, 62, 62, 0.3)';
        } else {
            progress = 100; // Max out at 100%
            rating = '🎲 Stop wild Guessing..';
            color = '#e53e3e';
            backgroundColor = 'rgba(229, 62, 62, 0.15)';
            borderColor = 'rgba(229, 62, 62, 0.3)';
        }
        
        // Update progress bar
        scoreBar.style.setProperty('--progress', `${Math.min(progress, 100)}%`);
        
        // Update rating text
        scoreRating.textContent = rating;
        scoreRating.style.color = color;
        
        // Color the score value itself
        scoreValue.style.color = color;
        scoreValue.style.background = backgroundColor;
        scoreValue.style.borderColor = borderColor;
    }

    toggleSound() {
        this.soundSystem.enabled = !this.soundSystem.enabled;
        
        // Track sound toggle event
        this.trackEvent('sound_toggled', {
            new_state: this.soundSystem.enabled ? 'enabled' : 'disabled'
        });
        
        this.updateSoundToggle();
        
        // Play a test sound if enabling
        if (this.soundSystem.enabled) {
            this.soundSystem.playSoundEffect('button');
        }
        
        // Save preference
        this.savePreferences();
    }
    
    updateSoundToggle() {
        const toggleButton = document.getElementById('soundToggle');
        const toggleIcon = toggleButton.querySelector('.toggle-icon');
        const toggleText = toggleButton.querySelector('.toggle-text');
        
        if (this.soundSystem.enabled) {
            toggleButton.classList.remove('muted');
            toggleIcon.textContent = '🔊';
            toggleText.textContent = 'Sound On';
            toggleButton.title = 'Disable sound effects';
        } else {
            toggleButton.classList.add('muted');
            toggleIcon.textContent = '🔇';
            toggleText.textContent = 'Sound Off';
            toggleButton.title = 'Enable sound effects';
        }
    }
    
    toggleCountryNames() {
        this.gameState.showCountryNames = !this.gameState.showCountryNames;
        
        // Track toggle event
        this.trackEvent('country_names_toggled', {
            new_state: this.gameState.showCountryNames ? 'shown' : 'hidden'
        });
        
        this.updateCountryToggle();
        
        const countryNameElement = document.getElementById('countryName');
        if (countryNameElement) {
            countryNameElement.style.display = this.gameState.showCountryNames ? '' : 'none';
        }
        
        // Save preference
        this.savePreferences();
    }
    
    updateCountryToggle() {
        const toggleButton = document.getElementById('countryToggle');
        const toggleIcon = toggleButton.querySelector('.toggle-icon');
        const toggleText = toggleButton.querySelector('.toggle-text');
        
        if (this.gameState.showCountryNames) {
            toggleButton.classList.remove('hidden-mode');
            toggleIcon.textContent = '👁️';
            toggleText.textContent = 'Hide Country';
            toggleButton.title = 'Hide country names for expert mode';
        } else {
            toggleButton.classList.add('hidden-mode');
            toggleIcon.textContent = '🙈';
            toggleText.textContent = 'Show Country';
            toggleButton.title = 'Show country names for easier gameplay';
        }
    }
    
    // Update user analytics display in help modal
    updateUserAnalyticsDisplay() {
        if (!this.userTracker.enabled) return;
        
        try {
            // Calculate display values
            const playTimeHours = (this.userTracker.totalPlayTime / (1000 * 60 * 60)).toFixed(1);
            const installDate = new Date(this.userTracker.installDate).toLocaleDateString();
            const userIdShort = this.userTracker.userId.substring(0, 12) + '...';
            
            // Update DOM elements
            const sessionsEl = document.getElementById('userSessions');
            const playTimeEl = document.getElementById('userPlayTime');
            const installDateEl = document.getElementById('userInstallDate');
            const userIdEl = document.getElementById('userId');
            
            if (sessionsEl) sessionsEl.textContent = this.userTracker.totalSessions;
            if (playTimeEl) playTimeEl.textContent = `${playTimeHours}h`;
            if (installDateEl) installDateEl.textContent = installDate;
            if (userIdEl) userIdEl.textContent = userIdShort;
            
        } catch (error) {
            console.warn('Failed to update analytics display:', error);
        }
   }

    // Share modal methods
    showShareModal() {
        // Update share card with current game data
        this.updateShareCard();
        
        // Show the modal
        const shareModal = document.getElementById('shareModal');
        shareModal.style.display = 'flex';
        
        // Native share button is always visible now
        
        // Trigger analytics
        this.trackEvent('share_modal_opened');
    }

    hideShareModal() {
        const shareModal = document.getElementById('shareModal');
        shareModal.style.display = 'none';
        
        // Trigger analytics
        this.trackEvent('share_modal_closed');
    }

    updateShareCard() {
        try {
            // Update score and rating
            const shareScoreValue = document.getElementById('shareScoreValue');
            const shareRating = document.getElementById('shareRating');
            
            if (shareScoreValue) {
                shareScoreValue.textContent = this.gameState.totalScore;
            }
            
            if (shareRating) {
                shareRating.textContent = this.getRatingForScore(this.gameState.totalScore);
            }
            
            // Update results grid
            const shareResultsGrid = document.getElementById('shareResultsGrid');
            if (shareResultsGrid) {
                shareResultsGrid.innerHTML = '';
                
                this.gameState.results.forEach(result => {
                    const resultItem = document.createElement('div');
                    resultItem.className = 'share-result-item';
                    
                    resultItem.innerHTML = `
                        <span class="share-result-flag">${result.country.flag}</span>
                        <div class="share-result-country">${result.country.name}</div>
                        <div class="share-result-category">${result.category}</div>
                        <div class="share-result-score">${result.score}</div>
                    `;
                    
                    shareResultsGrid.appendChild(resultItem);
                });
            }
            
        } catch (error) {
            console.warn('Failed to update share card:', error);
        }
    }

    getRatingForScore(score) {
        if (score <= 50) return '🏆 Geography Expert!';
        if (score <= 100) return '🎯 Amazing Hunter!';
        if (score <= 150) return '🌟 Great Player!';
        if (score <= 200) return '👍 Good Job!';
        return '🎮 Nice Try!';
    }

    async copyShareText() {
        try {
            let shareText = `🎯 Geo Hunter - Final Score: ${this.gameState.totalScore}\n`;
            shareText += `🏆 ${this.getRatingForScore(this.gameState.totalScore)}\n\n`;
            shareText += `My Results:\n`;
            
            this.gameState.results.forEach((result, index) => {
                shareText += `${index + 1}. ${result.country.flag} ${result.country.name} → ${result.category} (${result.score})\n`;
            });
            
            shareText += `\nPlay at: geohunter.vercel.app`;
            
            // Check if clipboard API is available
            if (!navigator.clipboard) {
                // Fallback method
                const textArea = document.createElement('textarea');
                textArea.value = shareText;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                this.showAchievement('📋 Score Copied!', 'Score copied to clipboard!', '📋');
                return;
            }
            
            await navigator.clipboard.writeText(shareText);
            
            // Show success feedback
            this.showAchievement('📋 Score Copied!', 'Score copied to clipboard!', '📋');
            
            // Trigger analytics
            this.trackEvent('share_text_copied', {
                score: this.gameState.totalScore,
                results_count: this.gameState.results.length
            });
            
        } catch (error) {
            console.error('Failed to copy share text:', error);
            this.showAchievement('❌ Error!', 'Failed to copy text', '❌');
        }
    }

    async downloadShareImage() {
        try {
            // Generate image blob from share card
            const imageBlob = await this.generateShareImage();
            
            // Create download link
            const url = URL.createObjectURL(imageBlob);
            const link = document.createElement('a');
            link.download = `geo-hunter-score-${this.gameState.totalScore}.png`;
            link.href = url;
            link.click();
            
            // Clean up
            URL.revokeObjectURL(url);
            
            this.showAchievement('💾 Downloaded!', 'Image saved successfully!', '💾');
            
            // Trigger analytics
            this.trackEvent('share_image_downloaded', {
                score: this.gameState.totalScore,
                type: 'image'
            });
            
        } catch (error) {
            console.error('Failed to download share image:', error);
            
            // Fallback to text download
            try {
                const shareText = await this.generateShareText();
                const blob = new Blob([shareText], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.download = `geo-hunter-score-${this.gameState.totalScore}.txt`;
                link.href = url;
                link.click();
                
                URL.revokeObjectURL(url);
                
                this.showAchievement('💾 Downloaded!', 'Text file downloaded (image failed)', '💾');
                
            } catch (fallbackError) {
                console.error('Fallback download also failed:', fallbackError);
                this.showAchievement('❌ Error!', 'Failed to download', '❌');
            }
        }
    }

    async nativeShare() {
        try {
            if (!navigator.share) {
                this.showAchievement('❌ Error!', 'Native sharing not supported', '❌');
                return;
            }
            
            // Generate image blob from share card
            const imageBlob = await this.generateShareImage();
            
            // Create file object from blob
            const imageFile = new File([imageBlob], `geo-hunter-score-${this.gameState.totalScore}.png`, {
                type: 'image/png'
            });
            
            // Share the image
            await navigator.share({
                title: 'GeoHunter - My Score',
                text: `🎯 My GeoHunter Score: ${this.gameState.totalScore}\n🏆 ${this.getRatingForScore(this.gameState.totalScore)}\n\nPlay at: geohuntergame.com`,
                files: [imageFile]
            });
            
            this.showAchievement('📤 Shared!', 'Image shared successfully!', '📤');
            
            // Trigger analytics
            this.trackEvent('native_image_shared', {
                score: this.gameState.totalScore
            });
            
        } catch (error) {
            if (error.name === 'AbortError') {
                // User cancelled share - don't show error
                return;
            }
            
            console.error('Failed to share image:', error);
            
            // Fallback to text sharing
            try {
                const shareText = await this.generateShareText();
                
                await navigator.share({
                    title: 'GeoHunter - My Score',
                    text: shareText,
                    url: 'https://geohuntergame.com'
                });
                
                this.showAchievement('📤 Shared!', 'Text shared successfully!', '📤');
                
            } catch (fallbackError) {
                if (fallbackError.name !== 'AbortError') {
                    console.error('Fallback share also failed:', fallbackError);
                    this.showAchievement('❌ Error!', 'Failed to share', '❌');
                }
            }
        }
    }

    async generateShareText() {
        let shareText = `🎯 Geo Hunter - Final Score: ${this.gameState.totalScore}\n`;
        shareText += `🏆 ${this.getRatingForScore(this.gameState.totalScore)}\n\n`;
        shareText += `My Results:\n`;
        
        this.gameState.results.forEach((result, index) => {
            shareText += `${index + 1}. ${result.country.flag} ${result.country.name} → ${result.category} (${result.score})\n`;
        });
        
        shareText += `\nPlay at: geohuntergame.com`;
        
        return shareText;
    }

    async generateShareImage() {
        try {
            const shareCard = document.getElementById('shareCard');
            if (!shareCard) {
                throw new Error('Share card element not found');
            }

            // Check if htmlToImage is available
            if (typeof htmlToImage === 'undefined') {
                throw new Error('html-to-image library not loaded');
            }

            // Get elements to modify
            const niceTryElement = shareCard.querySelector('.share-nice-try');
            const totalRankLabel = shareCard.querySelector('.share-rank-label');
            const breakdownItems = shareCard.querySelectorAll('.share-result-item');

            // Store original styles to revert later
            const originalNiceTryDisplay = niceTryElement ? niceTryElement.style.display : '';
            const originalTotalRankFontSize = totalRankLabel ? totalRankLabel.style.fontSize : '';
            const originalBreakdownItemStyles = [];
            const originalCategoryStyles = [];
            const originalFlagStyles = [];
            const originalCountryStyles = [];
            const originalScoreStyles = [];

            // Apply temporary styles
            if (niceTryElement) {
                niceTryElement.style.display = 'none';
            }
            if (totalRankLabel) {
                totalRankLabel.style.fontSize = '0.6em'; // Make total rank smaller
            }

            breakdownItems.forEach((item, index) => {
                originalBreakdownItemStyles[index] = {
                    justifyContent: item.style.justifyContent,
                    alignItems: item.style.alignItems
                };
                item.style.justifyContent = 'space-around'; // Adjust for centering
                item.style.alignItems = 'center';

                const categoryEl = item.querySelector('.share-result-category');
                const flagEl = item.querySelector('.share-result-flag');
                const countryEl = item.querySelector('.share-result-country');
                const scoreEl = item.querySelector('.share-result-score');

                if (categoryEl) {
                    originalCategoryStyles[index] = {
                        flex: categoryEl.style.flex,
                        textAlign: categoryEl.style.textAlign
                    };
                    categoryEl.style.flex = '1'; // Take available space
                    categoryEl.style.textAlign = 'center'; // Ensure text is centered
                }
                if (flagEl) {
                    originalFlagStyles[index] = flagEl.style.flex;
                    flagEl.style.flex = '0 0 auto'; // Take only necessary space
                }
                if (countryEl) {
                    originalCountryStyles[index] = countryEl.style.flex;
                    countryEl.style.flex = '0 0 auto'; // Take only necessary space
                }
                if (scoreEl) {
                    originalScoreStyles[index] = scoreEl.style.flex;
                    scoreEl.style.flex = '0 0 auto'; // Take only necessary space
                }
            });

            // Temporarily add image-generation class for better layout
            shareCard.classList.add('image-generation', 'compact-share');

            // Generate blob from share card using html-to-image
            const blob = await htmlToImage.toBlob(shareCard, {
                backgroundColor: null, // Transparent background
                pixelRatio: 1, // Equivalent to scale in html2canvas for better quality
                cacheBust: true, // Prevent caching issues
                quality: 1.0, // Max quality
            });

            // Remove the temporary class
            shareCard.classList.remove('image-generation', 'compact-share');

            // Revert styles
            if (niceTryElement) {
                niceTryElement.style.display = originalNiceTryDisplay;
            }
            if (totalRankLabel) {
                totalRankLabel.style.fontSize = originalTotalRankFontSize;
            }

            breakdownItems.forEach((item, index) => {
                item.style.justifyContent = originalBreakdownItemStyles[index].justifyContent;
                item.style.alignItems = originalBreakdownItemStyles[index].alignItems;

                const categoryEl = item.querySelector('.share-result-category');
                const flagEl = item.querySelector('.share-result-flag');
                const countryEl = item.querySelector('.share-result-country');
                const scoreEl = item.querySelector('.share-result-score');

                if (categoryEl) {
                    categoryEl.style.flex = originalCategoryStyles[index].flex;
                    categoryEl.style.textAlign = originalCategoryStyles[index].textAlign;
                }
                if (flagEl) {
                    flagEl.style.flex = originalFlagStyles[index];
                }
                if (countryEl) {
                    countryEl.style.flex = originalCountryStyles[index];
                }
                if (scoreEl) {
                    scoreEl.style.flex = originalScoreStyles[index];
                }
            });

            return blob;

        } catch (error) {
            console.error('Failed to generate share image:', error);
            throw error;
        }
    }

    // Debug methods for tutorial testing
    forceTutorial() {
        this.gameState.isFirstTime = true;
        this.gameState.tutorialStep = 0;
        this.gameState.showingTutorial = false;
        if (this.popupManager) {
            this.popupManager.forceTutorial();
        }
    }

    resetToFirstTime() {
        localStorage.removeItem('geoHunterStats');
        localStorage.removeItem('geoHunterPrefs');
        localStorage.removeItem('geoHunterUser');
        this.gameState.isFirstTime = true;
        this.gameState.tutorialStep = 0;
        this.gameState.showingTutorial = false;
        console.log('Reset to first time user - reload page to see tutorial');
    }

    autoPopulateCategories() {
        this.gameState.gameStarted = true;
        this.gameState.selectedCountries = this.getRandomCountries(8);
        this.gameState.results = this.gameState.selectedCountries.map((country, i) => {
            const category = this.categories[i];
            const score = country.rankings[category];
            const scoreValue = score === "100+" ? 101 : score;
            this.gameState.totalScore += scoreValue;
            this.gameState.assignedCategories.add(category);
            this.gameState.assignments[category] = {
                country: country,
                score: score,
                scoreValue: scoreValue
            };
            return {
                country: country,
                category: category,
                score: score,
                scoreValue: scoreValue
            };
        });

        this.updateUI();
        this.endGame();
    }
}

// Global variable to store game instance for session tracking
let gameInstance;

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    gameInstance = new GeographyChallenge();
});

// Track session end when page is about to close
window.addEventListener('beforeunload', () => {
    if (gameInstance && gameInstance.userTracker.enabled) {
        // Save final session data
        gameInstance.saveUserTracking();
        gameInstance.trackEvent('session_ended', {
            session_duration: Date.now() - gameInstance.userTracker.sessionStartTime,
            games_played_this_session: gameInstance.gameStats.gamesPlayed
        });
        gameInstance.displayUserStats();
    }
});

// Track when user becomes inactive (page hidden)
document.addEventListener('visibilitychange', () => {
    if (gameInstance && gameInstance.userTracker.enabled) {
        if (document.visibilityState === 'hidden') {
            gameInstance.trackEvent('page_hidden');
        } else if (document.visibilityState === 'visible') {
            gameInstance.trackEvent('page_visible');
        }
    }
});

// Global debug functions for testing
window.resetToFirstTime = () => {
    if (gameInstance) {
        gameInstance.resetToFirstTime();
    }
};

window.showTutorial = () => {
    if (gameInstance) {
        gameInstance.forceTutorial();
    }
};

// Test function to verify tutorial works
window.testTutorialSystem = () => {
    console.log('=== TUTORIAL SYSTEM TEST ===');
    
    // Check if game instance exists
    if (!window.gameInstance) {
        console.error('Game instance not found');
        return;
    }
    
    const game = window.gameInstance;
    const popupManager = game.popupManager;
    
    if (!popupManager) {
        console.error('PopupManager not found');
        return;
    }
    
    // Check tutorial modal elements
    const tutorialModal = document.getElementById('tutorialModal');
    const step1 = document.getElementById('tutorialStep1');
    const step2 = document.getElementById('tutorialStep2');
    
    console.log('Tutorial elements:', {
        tutorialModal: !!tutorialModal,
        step1: !!step1,
        step2: !!step2
    });
    
    // Check current state
    console.log('Game state:', {
        isFirstTime: game.gameState.isFirstTime,
        tutorialStep: game.gameState.tutorialStep,
        showingTutorial: game.gameState.showingTutorial
    });
    
    // Test localStorage
    const hasStats = localStorage.getItem('geoHunterStats');
    console.log('Has existing stats:', !!hasStats);
    
    // Test force tutorial
    console.log('Testing force tutorial...');
    popupManager.forceTutorial();
    
    console.log('=== TEST COMPLETE ===');
};

// Global functions for testing
window.clearStorage = () => {
    localStorage.removeItem('geoHunterStats');
    localStorage.removeItem('geoHunterPrefs');
    localStorage.removeItem('geoHunterUser');
    console.log('Storage cleared - reload page to see tutorial');
    location.reload();
};

window.forceTutorial = () => {
    if (window.gameInstance) {
        window.gameInstance.forceTutorial();
    }
};

window.showTutorial = () => {
    if (window.gameInstance && window.gameInstance.popupManager) {
        window.gameInstance.popupManager.forceTutorial();
    }
};