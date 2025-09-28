export interface StatusEffect {
  type: 'Stun' | 'Corrosion' | 'Weaken';
  duration: number;
}

export interface Ability {
  name: string;
  description: string;
  damage: number; // Can be negative for healing
  cooldown: number;
  currentCooldown: number;
  statusEffect?: {
    type: StatusEffect['type'];
    chance: number;
    duration: number;
  };
}

export type EnemyIntentType = 'attack' | 'heavy_attack' | 'defend' | 'debuff';

export interface EnemyIntent {
    type: EnemyIntentType;
    description: string;
}

export interface DamageInfo {
    amount: number;
    isCritical: boolean;
    type: 'damage' | 'heal' | 'corrosion';
    id: number; // To trigger re-renders
}

export interface Character {
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  isDefending: boolean;
  statusEffects: StatusEffect[];
  abilities: Ability[];
  // Progression & Items
  level: number;
  xp: number;
  xpToNextLevel: number;
  coins: number;
  potions: number;
  // Visuals & AI
  imageUrl: string;
  currentIntent?: EnemyIntent | null;
  lastDamage?: DamageInfo | null;
}

export interface BattleLogEntry {
  turn: number;
  message: string;
  isCritical?: boolean;
}
