// Fix: Replaced invalid file content with a full implementation of the SoundService.
// This creates a singleton service to handle all audio using the Web Audio API,
// resolving the module resolution errors in files that import it.
class SoundService {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicSource: OscillatorNode | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;

  constructor() {
    // Initialize on first user interaction to comply with autoplay policies.
    const savedMuteState = localStorage.getItem('soundMuted');
    this.isMuted = savedMuteState === 'true';
  }

  private initializeAudio() {
    if (this.isInitialized || typeof window === 'undefined') return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = this.isMuted ? 0 : 0.5; // Set initial volume
      this.isInitialized = true;
    } catch (e) {
      console.error("Web Audio API is not supported or could not be initialized.", e);
    }
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.5) {
      if (!this.audioContext || !this.masterGain) return;
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
  }

  private get sounds(): { [key: string]: () => void } {
      return {
          'attack': () => this.playTone(100, 0.2, 'square', 0.3),
          'defend': () => this.playTone(800, 0.2, 'sine', 0.4),
          'ability': () => this.playTone(600, 0.5, 'triangle', 0.5),
          'potion': () => this.playTone(1200, 0.4, 'sine', 0.4),
          'victory': () => {
              this.playTone(523.25, 0.15, 'sine', 0.5);
              setTimeout(() => this.playTone(659.25, 0.15, 'sine', 0.5), 150);
              setTimeout(() => this.playTone(783.99, 0.15, 'sine', 0.5), 300);
              setTimeout(() => this.playTone(1046.50, 0.2, 'sine', 0.5), 450);
          },
          'defeat': () => {
              this.playTone(200, 0.3, 'sawtooth', 0.4);
              setTimeout(() => this.playTone(150, 0.4, 'sawtooth', 0.4), 300);
          },
          'levelup': () => {
              this.playTone(440, 0.1, 'triangle');
              setTimeout(() => this.playTone(554.37, 0.1, 'triangle'), 100);
              setTimeout(() => this.playTone(659.25, 0.1, 'triangle'), 200);
              setTimeout(() => this.playTone(880, 0.2, 'triangle'), 300);
          },
          'coin': () => this.playTone(1500, 0.1, 'sine', 0.3),
      };
  }
  
  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.initializeAudio();
    this.isMuted = !this.isMuted;
    localStorage.setItem('soundMuted', this.isMuted.toString());
    if (this.masterGain && this.audioContext) {
        this.masterGain.gain.exponentialRampToValueAtTime(this.isMuted ? 0.0001 : 0.5, this.audioContext.currentTime + 0.1);
    }
    if (this.isMuted) {
        this.stopMusic();
    }
    return this.isMuted;
  }

  private async resumeContext() {
      if(this.audioContext?.state === 'suspended') {
          await this.audioContext.resume();
      }
  }

  public play(soundName: string) {
    this.initializeAudio();
    this.resumeContext();
    const soundPlayer = this.sounds[soundName];
    if (soundPlayer) {
        soundPlayer();
    } else {
        console.warn(`Sound not found: ${soundName}`);
    }
  }

  public startMusic() {
    this.initializeAudio();
    this.resumeContext();
    if (this.isMuted || this.musicSource || !this.audioContext || !this.masterGain) return;

    this.musicSource = this.audioContext.createOscillator();
    const musicGain = this.audioContext.createGain();
    
    this.musicSource.type = 'sawtooth';
    this.musicSource.frequency.value = 55; // A low A note for battle music
    musicGain.gain.value = 0.1; // Music is quieter

    this.musicSource.connect(musicGain);
    musicGain.connect(this.masterGain);
    this.musicSource.start();
  }

  public stopMusic() {
    if (this.musicSource) {
      try {
        this.musicSource.stop();
        this.musicSource.disconnect();
      } catch (e) {
        // Can throw if already stopped, ignore error.
      }
      this.musicSource = null;
    }
  }
}

export const soundService = new SoundService();
