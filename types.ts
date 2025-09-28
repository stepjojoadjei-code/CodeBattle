export interface Ability {
  name: string;
  description: string;
  damage: number; // Can be negative for healing
  cooldown: number; // Turns to wait after use
  currentCooldown: number;
  // New: status effect applied by the ability
  statusEffect?: {
    type: 'Stun' | 'Corrosion' | 'Weaken';
    chance: number; // 0 to 1
    duration: number; // in turns
  };
}

export interface StatusEffect {
    type: 'Stun' | 'Corrosion' | 'Weaken';
    turns: number;
}

export interface Character {
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  abilities: Ability[];
  isDefending: boolean;
  imageUrl?: string;
  // New: track status effects
  statusEffects: StatusEffect[];
  // Progression
  level: number;
  xp: number;
  xpToNextLevel: number;
  // Economy & Items
  coins: number;
  potions: number;
}

export interface BattleLogEntry {
  turn: number;
  message: string;
  isCritical?: boolean; // New: flag for crits
}

export interface AIAction {
    action: 'attack' | 'defend' | 'use_ability';
    abilityName?: string;
    narration: string;
}

export type GamePhase = 'start' | 'battle' | 'victory' | 'defeat';