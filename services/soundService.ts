class SoundService {
  private isMuted: boolean = false;
  private sounds: { [key: string]: HTMLAudioElement } = {};
  private music: HTMLAudioElement | null = null;
  private currentMusic: 'battle' | null = null;

  constructor() {
    this.loadSounds();
  }

  private loadSounds() {
    this.sounds.attack = new Audio('/sounds/attack.wav');
    this.sounds.defend = new Audio('/sounds/defend.wav');
    this.sounds.ability = new Audio('/sounds/ability.wav');
    this.sounds.victory = new Audio('/sounds/victory.mp3');
    this.sounds.defeat = new Audio('/sounds/defeat.mp3');
    this.sounds.potion = new Audio('/sounds/potion.wav');
    this.sounds.levelup = new Audio('/sounds/levelup.mp3');
    this.sounds.coin = new Audio('/sounds/coin.wav');
    this.music = new Audio('/sounds/battle_music.mp3');
    if (this.music) {
        this.music.loop = true;
        this.music.volume = 0.5;
    }
  }

  play(soundName: 'attack' | 'defend' | 'ability' | 'victory' | 'defeat' | 'potion' | 'levelup' | 'coin') {
    if (!this.isMuted && this.sounds[soundName]) {
      this.sounds[soundName].currentTime = 0;
      this.sounds[soundName].play().catch(e => console.error(`Error playing sound: ${soundName}`, e));
    }
  }

  startMusic() {
    if (this.currentMusic === 'battle') return; // Don't restart if already playing
    if (!this.isMuted && this.music) {
        this.music.play().catch(e => console.error("Error playing music:", e));
        this.currentMusic = 'battle';
    }
  }

  stopMusic() {
      if(this.music) {
        this.music.pause();
        this.music.currentTime = 0;
        this.currentMusic = null;
      }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopMusic();
      Object.values(this.sounds).forEach(sound => {
        sound.pause();
        sound.currentTime = 0;
      });
    } else {
        // Don't auto-restart music, let the game phase decide
    }
    // Return the new state so UI can update instantly
    return this.isMuted;
  }

  getIsMuted() {
    return this.isMuted;
  }
}

export const soundService = new SoundService();