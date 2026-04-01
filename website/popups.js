// Tutorial and Sharing Popup Management
export class PopupManager {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Tutorial event listeners
        if (document.getElementById('tutorialContinue')) {
            document.getElementById('tutorialContinue').onclick = () => {
                this.closeTutorialStep1();
            };
        }
        
        if (document.getElementById('tutorialFinish')) {
            document.getElementById('tutorialFinish').onclick = () => {
                this.closeTutorialStep2();
            };
        }

        // Note: Share modal event listeners are now handled in game.js
    }

    // ===== TUTORIAL SYSTEM =====
    showTutorial() {
        if (!this.game.gameState.isFirstTime) return;
        
        this.game.gameState.showingTutorial = true;
        this.game.gameState.tutorialStep = 1;
        
        const tutorialModal = document.getElementById('tutorialModal');
        const step1 = document.getElementById('tutorialStep1');
        const step2 = document.getElementById('tutorialStep2');
        
        if (tutorialModal && step1 && step2) {
            step1.style.display = 'block';
            step2.style.display = 'none';
            tutorialModal.style.display = 'flex';
        }
        
        this.game.trackEvent('tutorial_started');
    }
    
    closeTutorialStep1() {
        const tutorialModal = document.getElementById('tutorialModal');
        tutorialModal.style.display = 'none';
        this.game.gameState.tutorialStep = 2;
        this.game.gameState.showingTutorial = false;
        
        this.game.trackEvent('tutorial_step1_completed');
    }
    
    showTutorialFeedback(score, country, category) {
        if (this.game.gameState.tutorialStep !== 2) return;
        
        const tutorialModal = document.getElementById('tutorialModal');
        const step1 = document.getElementById('tutorialStep1');
        const step2 = document.getElementById('tutorialStep2');
        const feedbackTitle = document.getElementById('tutorialFeedbackTitle');
        const feedbackText = document.getElementById('tutorialFeedbackText');
        
        step1.style.display = 'none';
        step2.style.display = 'block';
        tutorialModal.style.display = 'flex';
        
        const scoreValue = score === "100+" ? 101 : score;
        
        if (scoreValue <= 10) {
            feedbackTitle.textContent = "🎯 Excellent choice!";
            feedbackText.innerHTML = `<strong>${country.name}</strong> ranks #${score} in ${category}! That's a great match. You're getting the hang of it!`;
        } else if (scoreValue <= 30) {
            feedbackTitle.textContent = "👍 Good thinking!";
            feedbackText.innerHTML = `<strong>${country.name}</strong> ranks #${score} in ${category}. Not bad! Look for categories where countries are more famous.`;
        } else {
            feedbackTitle.textContent = "🤔 Let's try again!";
            feedbackText.innerHTML = `<strong>${country.name}</strong> ranks #${score} in ${category}. Try thinking about what ${country.name} is most famous for!`;
        }
        
        this.game.trackEvent('tutorial_feedback_shown', { 
            score: scoreValue, 
            category: category,
            country: country.name 
        });
    }
    
    closeTutorialStep2() {
        const tutorialModal = document.getElementById('tutorialModal');
        tutorialModal.style.display = 'none';
        this.game.gameState.tutorialStep = 0;
        this.game.gameState.isFirstTime = false;
        this.game.gameState.showingTutorial = false;
        
        this.game.trackEvent('tutorial_completed');
    }

    // Force show tutorial (for help modal button)
    forceTutorial() {
        this.game.gameState.showingTutorial = true;
        this.game.gameState.tutorialStep = 1;
        
        const tutorialModal = document.getElementById('tutorialModal');
        const step1 = document.getElementById('tutorialStep1');
        const step2 = document.getElementById('tutorialStep2');
        
        if (tutorialModal && step1 && step2) {
            step1.style.display = 'block';
            step2.style.display = 'none';
            tutorialModal.style.display = 'flex';
        }
        
        this.game.trackEvent('tutorial_forced');
    }

    // ===== SHARING SYSTEM =====
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
    }

    async shareNatively() {
        try {
            let shareText = `🎯 My Geography Rank: ${this.game.gameState.totalScore}\n`;
            
            const avgScore = this.game.gameState.totalScore / 8;
            if (avgScore <= 10) {
                shareText += '🏆 Geography Master!\n\n';
            } else if (avgScore <= 20) {
                shareText += '🎯 Expert Hunter!\n\n';
            } else if (avgScore <= 35) {
                shareText += '🗺️ Skilled Explorer!\n\n';
            } else {
                shareText += '🎲 Adventurous Hunter!\n\n';
            }
            
            const assignments = Object.values(this.game.gameState.assignments)
                .sort((a, b) => a.scoreValue - b.scoreValue)
                .slice(0, 3);
                
            assignments.forEach(assignment => {
                shareText += `${assignment.country.flag} ${assignment.country.name}: ${assignment.score}\n`;
            });
            
            shareText += `\nCan you beat my score? geohuntergame.com`;

            await navigator.share({
                title: '🎯 My GeoHunter Score',
                text: shareText,
                url: 'https://geohuntergame.com'
            });

            this.showTemporaryMessage('Score shared! 📤');
            this.game.trackEvent('score_shared_natively');

        } catch (error) {
            console.log('Native sharing cancelled or failed:', error);
            this.showDesktopShareModal();
        }
    }

    showShareModal() {
        if (navigator.share && this.isMobileDevice()) {
            this.shareNatively();
            return;
        }
        this.showDesktopShareModal();
    }

    showDesktopShareModal() {
        const shareModal = document.getElementById('shareModal');
        const shareScoreValue = document.getElementById('shareScoreValue');
        const shareRating = document.getElementById('shareRating');
        const shareResultsGrid = document.getElementById('shareResultsGrid');

        shareScoreValue.textContent = this.game.gameState.totalScore;
        
        const avgScore = this.game.gameState.totalScore / 8;
        if (avgScore <= 10) {
            shareRating.textContent = '🏆 Geography Master!';
            shareRating.style.color = '#48bb78';
        } else if (avgScore <= 20) {
            shareRating.textContent = '🎯 Expert Hunter!';
            shareRating.style.color = '#38a169';
        } else if (avgScore <= 35) {
            shareRating.textContent = '🗺️ Skilled Explorer!';
            shareRating.style.color = '#ed8936';
        } else {
            shareRating.textContent = '🎲 Adventurous Hunter!';
            shareRating.style.color = '#e53e3e';
        }

        let resultsHTML = '';
        this.game.categories.forEach(category => {
            const assignment = this.game.gameState.assignments[category];
            if (assignment) {
                resultsHTML += `
                    <div class="share-result-item">
                        <div class="share-result-flag">${assignment.country.flag}</div>
                        <div class="share-result-info">
                            <div class="share-result-country">${assignment.country.name}</div>
                            <div class="share-result-category">${category.charAt(0).toUpperCase() + category.slice(1)}</div>
                        </div>
                        <div class="share-result-score">${assignment.score}</div>
                    </div>
                `;
            }
        });
        shareResultsGrid.innerHTML = resultsHTML;

        const nativeShareButton = document.getElementById('nativeShareButton');
        if (navigator.share) {
            nativeShareButton.style.display = 'inline-block';
        } else {
            nativeShareButton.style.display = 'none';
        }

        shareModal.style.display = 'flex';

        this.game.trackEvent('share_modal_opened', {
            final_score: this.game.gameState.totalScore,
            rating: shareRating.textContent
        });
    }

    async copyScoreAsImage() {
        try {
            if (typeof html2canvas === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                document.head.appendChild(script);
                
                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = reject;
                });
            }

            const shareCard = document.getElementById('shareCard');
            const canvas = await html2canvas(shareCard, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
                allowTaint: false
            });

            canvas.toBlob(async (blob) => {
                try {
                    if (navigator.clipboard && window.ClipboardItem) {
                        await navigator.clipboard.write([
                            new ClipboardItem({ 'image/png': blob })
                        ]);
                        this.showTemporaryMessage('Image copied to clipboard! 📋');
                        this.game.trackEvent('score_copied_as_image');
                    } else {
                        this.downloadImageBlob(blob, `geo-hunter-score-${Date.now()}.png`);
                        this.showTemporaryMessage('Image saved to downloads! 💾');
                        this.game.trackEvent('score_downloaded_as_image');
                    }
                } catch (error) {
                    console.error('Error copying image:', error);
                    this.downloadImageBlob(blob, `geo-hunter-score-${Date.now()}.png`);
                    this.showTemporaryMessage('Image saved to downloads! 💾');
                    this.game.trackEvent('score_download_fallback');
                }
            }, 'image/png');

        } catch (error) {
            console.error('Error generating image:', error);
            this.showTemporaryMessage('Unable to create image. Try copying as text instead. ❌');
            this.game.trackEvent('image_generation_error', { error: error.message });
        }
    }

    copyScoreAsText() {
        try {
            let shareText = `🎯 My Geography Rank: ${this.game.gameState.totalScore}\n`;
            shareText += `${document.getElementById('shareRating').textContent}\n\n`;
            
            this.game.categories.forEach(category => {
                const assignment = this.game.gameState.assignments[category];
                if (assignment) {
                    shareText += `${assignment.country.flag} ${assignment.country.name} (${category}): ${assignment.score}\n`;
                }
            });
            
            shareText += `\ngeohuntergame.com`;

            navigator.clipboard.writeText(shareText).then(() => {
                this.showTemporaryMessage('Score copied as text! 📋');
                this.game.trackEvent('score_copied_as_text');
            }).catch((error) => {
                console.error('Error copying text:', error);
                this.showTextCopyFallback(shareText);
            });

        } catch (error) {
            console.error('Error creating share text:', error);
            this.showTemporaryMessage('Unable to copy text. ❌');
            this.game.trackEvent('text_copy_error', { error: error.message });
        }
    }

    downloadScoreCard() {
        this.copyScoreAsImage();
        this.game.trackEvent('score_download_requested');
    }

    // ===== HELPER METHODS =====
    downloadImageBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    showTemporaryMessage(message) {
        const notification = document.createElement('div');
        notification.className = 'temp-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(72, 187, 120, 0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    showTextCopyFallback(text) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; justify-content: center;
            align-items: center; z-index: 10000;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: white; padding: 20px; border-radius: 10px;
            max-width: 400px; width: 90%;
        `;

        const title = document.createElement('h3');
        title.textContent = 'Copy Your Score';
        title.style.marginBottom = '10px';

        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.cssText = `
            width: 100%; height: 200px; border: 1px solid #ccc;
            border-radius: 5px; padding: 10px; font-family: inherit; resize: vertical;
        `;
        textarea.select();

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.cssText = `
            background: #667eea; color: white; border: none;
            padding: 8px 16px; border-radius: 5px; margin-top: 10px; cursor: pointer;
        `;
        closeBtn.onclick = () => document.body.removeChild(modal);

        content.appendChild(title);
        content.appendChild(textarea);
        content.appendChild(closeBtn);
        modal.appendChild(content);
        document.body.appendChild(modal);

        modal.onclick = (e) => {
            if (e.target === modal) document.body.removeChild(modal);
        };
    }
}
