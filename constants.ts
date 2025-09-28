import { Character } from './types';

// Player Progression
export const LEVEL_XP_BASE = 100;
export const LEVEL_XP_GROWTH = 1.5;
export const STAT_GAIN_HP = 20;
export const STAT_GAIN_ATK = 3;
export const STAT_GAIN_DEF = 2;

// Economy
export const COINS_PER_VICTORY = 50;
export const POTION_HEAL_AMOUNT = 50;

// Shop Costs
export const POTION_COST = 25;
export const ATTACK_UPGRADE_COST = 75;
export const DEFENSE_UPGRADE_COST = 75;

// Combat Mechanics
export const CRIT_CHANCE = 0.15; // 15%
export const CRIT_MULTIPLIER = 1.5; // 150% damage

export const INITIAL_PLAYER_CHARACTER: Omit<Character, 'imageUrl'> = {
  name: 'Code Warrior',
  hp: 150,
  maxHp: 150,
  attack: 20,
  defense: 10,
  speed: 25,
  isDefending: false,
  statusEffects: [],
  abilities: [
    {
      name: 'Laser Pulse',
      description: 'A focused beam of energy. Chance to Weaken the target, lowering their attack.',
      damage: 15,
      cooldown: 0,
      currentCooldown: 0,
      statusEffect: {
        type: 'Weaken',
        chance: 0.5,
        duration: 2,
      }
    },
    {
      name: 'Debug & Reboot',
      description: 'Purge minor errors to heal.',
      damage: -40, // Negative damage is healing
      cooldown: 4,
      currentCooldown: 0,
    },
  ],
  // Progression & Items
  level: 1,
  xp: 0,
  xpToNextLevel: LEVEL_XP_BASE,
  coins: 0,
  potions: 3,
};

export const PLAYER_IMAGE_PROMPT = "A heroic humanoid robot, the Code Warrior, gleaming with polished chrome and circuits of pulsing blue light. Dynamic pose, ready for battle in a cyberspace arena, synthwave art style.";
