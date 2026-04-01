// Sound System for Geography Challenge
export class Sounds {
    constructor() {
        // Sound system configuration
        this.enabled = true;
        this.audioContext = null;
        this.needsUserInteraction = true;
        
        // Initialize the sound system
        this.initializeSounds();
    }
    // Initialize Web Audio API for sound effects
    initializeSounds() {
        try {
            // Create audio context lazily on first user interaction
            this.needsUserInteraction = true;
            console.log('Sound system initialized - waiting for user interaction');
        } catch (error) {
            console.warn('Sound system initialization failed:', error);
            this.enabled = false;
        }
    }
    
    // Handle first user interaction to initialize audio
    handleFirstInteraction() {
        if (this.needsUserInteraction && this.enabled) {
            try {
                // Create audio context on first user interaction
                if (!this.audioContext) {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }
                
                // Resume if suspended
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume().then(() => {
                        console.log('Audio context resumed successfully');
                        this.needsUserInteraction = false;
                    }).catch(error => {
                        console.warn('Failed to resume audio context:', error);
                        this.enabled = false;
                    });
                } else {
                    console.log('Audio context ready');
                    this.needsUserInteraction = false;
                }
            } catch (error) {
                console.warn('Failed to initialize audio context:', error);
                this.enabled = false;
            }
        }
    }
    
    // Alternative sound system using HTML5 Audio (more reliable fallback)
    createToneDataUrl(frequency, duration, type = 'sine', volume = 0.1) {
        // Simple sine wave generation
        const sampleRate = 44100;
        const length = Math.floor(sampleRate * (duration / 1000));
        const arrayBuffer = new ArrayBuffer(length * 2);
        const view = new DataView(arrayBuffer);
        
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            let sample = 0;
            
            switch (type) {
                case 'sine':
                    sample = Math.sin(2 * Math.PI * frequency * t);
                    break;
                case 'square':
                    sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
                    break;
                case 'triangle':
                    sample = (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * frequency * t));
                    break;
                case 'sawtooth':
                    sample = 2 * (frequency * t - Math.floor(frequency * t + 0.5));
                    break;
            }
            
            // Apply volume and envelope
            const envelope = Math.max(0, 1 - (i / length)); // Fade out
            const value = Math.max(-1, Math.min(1, sample * volume * envelope));
            view.setInt16(i * 2, value * 32767, true);
        }
        
        // Create WAV file blob
        const wavHeader = new ArrayBuffer(44);
        const wavView = new DataView(wavHeader);
        const setUint32 = (offset, value) => wavView.setUint32(offset, value, true);
        const setUint16 = (offset, value) => wavView.setUint16(offset, value, true);
        
        // WAV header
        wavView.setUint32(0, 0x46464952); // "RIFF"
        setUint32(4, 36 + length * 2);
        wavView.setUint32(8, 0x45564157); // "WAVE"
        wavView.setUint32(12, 0x20746d66); // "fmt "
        setUint32(16, 16);
        setUint16(20, 1);
        setUint16(22, 1);
        setUint32(24, sampleRate);
        setUint32(28, sampleRate * 2);
        setUint16(32, 2);
        setUint16(34, 16);
        wavView.setUint32(36, 0x61746164); // "data"
        setUint32(40, length * 2);
        
        const blob = new Blob([wavHeader, arrayBuffer], { type: 'audio/wav' });
        return URL.createObjectURL(blob);
    }
    
    // Fallback sound using HTML5 Audio
    playFallbackSound(frequency, duration = 200, type = 'sine', volume = 0.1) {
        try {
            const url = this.createToneDataUrl(frequency, duration, type, volume);
            const audio = new Audio(url);
            audio.volume = Math.min(1, volume * 2); // Boost volume for HTML5 audio
            
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('🔊 Fallback audio played successfully');
                    // Clean up the blob URL after playing
                    setTimeout(() => URL.revokeObjectURL(url), duration + 100);
                }).catch(error => {
                    console.warn('Fallback audio failed:', error);
                    URL.revokeObjectURL(url);
                });
            }
        } catch (error) {
            console.warn('Could not create fallback sound:', error);
        }
    }

    // Play sound using Web Audio API
    playSound(frequency, duration = 200, type = 'sine', volume = 0.1) {
        if (!this.enabled) return;
        
        // Try Web Audio API first
        if (this.audioContext) {
            try {
                // Check if audio context is ready
                if (this.audioContext.state === 'suspended') {
                    // Try to resume audio context
                    this.audioContext.resume().then(() => {
                        this.playWebAudioSound(frequency, duration, type, volume);
                    }).catch(error => {
                        console.warn('Could not resume audio context, using fallback:', error);
                        this.playFallbackSound(frequency, duration, type, volume);
                    });
                    return;
                }
                
                if (this.audioContext.state === 'running') {
                    this.playWebAudioSound(frequency, duration, type, volume);
                    return;
                }
            } catch (error) {
                console.warn('Web Audio API failed, using fallback:', error);
            }
        }
        
        // Fallback to HTML5 Audio
        console.log('Using fallback audio system');
        this.playFallbackSound(frequency, duration, type, volume);
    }
    
    // Web Audio API implementation (moved from main playSound method)
    playWebAudioSound(frequency, duration = 200, type = 'sine', volume = 0.1) {
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = type;
            
            // More gradual volume ramp for smoother sound
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration / 1000);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration / 1000);
            
            console.log('🔊 Web Audio played successfully');
        } catch (error) {
            console.warn('Web Audio playback failed:', error);
            // Fallback if Web Audio fails
            this.playFallbackSound(frequency, duration, type, volume);
        }
    }
    
    // Enhanced sound effects
    playSoundEffect(type) {
        // Always try to initialize audio context on any sound attempt
        this.handleFirstInteraction();
        
        // Add debug logging
        console.log(`🔊 Attempting to play sound: ${type}`, {
            enabled: this.enabled,
            hasContext: !!this.audioContext,
            contextState: this.audioContext?.state,
            needsInteraction: this.needsUserInteraction
        });
        
        switch(type) {
            case 'spin':
                this.playSound(220, 100, 'square', 0.05);
                break;
            case 'ready':
                this.playSound(440, 200, 'sine', 0.1);
                setTimeout(() => this.playSound(550, 100, 'sine', 0.08), 150);
                break;
            case 'select':
                this.playSound(660, 150, 'sine', 0.12);
                break;
            case 'perfect':
                // Perfect score fanfare
                setTimeout(() => this.playSound(523, 200, 'sine', 0.1), 0);   // C
                setTimeout(() => this.playSound(659, 200, 'sine', 0.1), 150); // E
                setTimeout(() => this.playSound(783, 200, 'sine', 0.1), 300); // G
                setTimeout(() => this.playSound(1046, 400, 'sine', 0.12), 450); // C
                break;
            case 'achievement':
                // Achievement sound
                setTimeout(() => this.playSound(880, 150, 'sine', 0.1), 0);
                setTimeout(() => this.playSound(1108, 150, 'sine', 0.1), 150);
                setTimeout(() => this.playSound(1318, 300, 'sine', 0.12), 300);
                break;
            case 'gameStart':
                this.playSound(400, 100, 'triangle', 0.08);
                setTimeout(() => this.playSound(600, 150, 'triangle', 0.1), 100);
                break;
            case 'gameOver':
                this.playSound(330, 400, 'triangle', 0.1);
                setTimeout(() => this.playSound(220, 600, 'triangle', 0.08), 200);
                break;
            case 'button':
                this.playSound(800, 60, 'square', 0.06);
                break;
            case 'reset':
                this.playSound(300, 200, 'sawtooth', 0.08);
                break;
        }
    }
}