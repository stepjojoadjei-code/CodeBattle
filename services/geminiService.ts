import { GoogleGenAI, Type } from "@google/genai";
import { Character, EnemyIntent, Ability } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not found. The app may not function correctly.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const generateEnemySchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "The enemy's creative and thematic name." },
    hp: { type: Type.NUMBER, description: "The enemy's health points, between 100 and 300." },
    attack: { type: Type.NUMBER, description: "The enemy's attack power, between 15 and 40." },
    defense: { type: Type.NUMBER, description: "The enemy's defense value, between 5 and 25." },
    speed: { type: Type.NUMBER, description: "The enemy's speed, determining turn order, between 10 and 30." },
    abilities: {
      type: Type.ARRAY,
      description: "A list of 1 to 2 unique abilities the enemy possesses.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "The ability's cool, thematic name." },
          description: { type: Type.STRING, description: "A brief description of the ability's effect." },
          damage: { type: Type.NUMBER, description: "The base damage of the ability. Can be 0 for status-only moves. Range: 0 to 50." },
          cooldown: { type: Type.NUMBER, description: "The number of turns the enemy must wait before using this ability again. Range: 2 to 5." },
          statusEffect: {
            type: Type.OBJECT,
            description: "An optional status effect the ability can apply.",
            properties: {
              type: { type: Type.STRING, description: "The type of status effect: 'Stun', 'Corrosion' (damage over time), or 'Weaken' (reduces attack)." },
              chance: { type: Type.NUMBER, description: "The probability (0.0 to 1.0) of the status effect being applied." },
              duration: { type: Type.NUMBER, description: "The number of turns the status effect lasts. Range: 1 to 3." },
            },
          },
        },
        required: ["name", "description", "damage", "cooldown"],
      },
    },
    imagePrompt: { type: Type.STRING, description: "A detailed prompt to generate a portrait of this enemy. The style should be 'cyberspace arena, synthwave art style'." },
  },
  required: ["name", "hp", "attack", "defense", "speed", "abilities", "imagePrompt"],
};

const getEnemyActionAndIntentSchema = {
    type: Type.OBJECT,
    properties: {
        action: { type: Type.STRING, description: "The action to take this turn: 'attack' or 'ability'."},
        abilityIndex: { type: Type.NUMBER, description: "The index of the ability to use, if action is 'ability'. Otherwise, -1."},
        nextTurnIntent: {
            type: Type.OBJECT,
            description: "The intended action for the NEXT turn.",
            properties: {
                type: { type: Type.STRING, description: "The type of intent: 'attack', 'heavy_attack', 'defend', or 'debuff'." },
                description: { type: Type.STRING, description: "A brief player-facing description of the intent, e.g., 'Preparing a powerful strike!'" }
            },
            required: ["type", "description"]
        }
    },
    required: ["action", "abilityIndex", "nextTurnIntent"]
};

export const generateEnemy = async (playerLevel: number): Promise<Omit<Character, 'imageUrl'>> => {
  try {
    const prompt = `Generate a unique and challenging enemy for a level ${playerLevel} player in a futuristic, cyberspace-themed RPG. The enemy should be a rogue AI, a glitch monster, or a corrupted data entity.`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: generateEnemySchema, temperature: 0.9, },
    });
    const enemyData = JSON.parse(response.text);
    return {
      ...enemyData, maxHp: enemyData.hp, isDefending: false, statusEffects: [],
      abilities: enemyData.abilities.map((ab: any) => ({ ...ab, currentCooldown: 0 })),
      level: playerLevel, xp: 0, xpToNextLevel: 0, coins: 0, potions: 0,
    };
  } catch (error) {
    console.error("Error generating enemy:", error);
    return {
      name: 'Fallback Glitch', hp: 100, maxHp: 100, attack: 15, defense: 5, speed: 10,
      isDefending: false, statusEffects: [], abilities: [{ name: 'Crash', description: 'A simple attack.', damage: 10, cooldown: 0, currentCooldown: 0 }],
      level: playerLevel, xp: 0, xpToNextLevel: 0, coins: 0, potions: 0,
    };
  }
};

export const getEnemyActionAndIntent = async (enemy: Character, player: Character): Promise<{ action: 'attack' | 'ability', abilityIndex: number, nextTurnIntent: EnemyIntent }> => {
    const availableAbilities = enemy.abilities.map((ab, i) => ({...ab, index: i})).filter(ab => ab.currentCooldown === 0);
    const prompt = `You are the AI for an enemy in a turn-based RPG.
    Your character: ${JSON.stringify({name: enemy.name, hp: enemy.hp, attack: enemy.attack, defense: enemy.defense, abilities: enemy.abilities, statusEffects: enemy.statusEffects})}
    Your opponent: ${JSON.stringify({name: player.name, hp: player.hp, defense: player.defense, isDefending: player.isDefending, statusEffects: player.statusEffects})}
    
    Available abilities you can use this turn (if any): ${JSON.stringify(availableAbilities)}
    
    Based on the situation, decide your action for THIS turn and your intent for the NEXT turn. Be strategic. If the player is defending, maybe apply a debuff. If you have a powerful ability off cooldown, use it.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: getEnemyActionAndIntentSchema, temperature: 1, thinkingConfig: { thinkingBudget: 0 } },
        });
        const result = JSON.parse(response.text);
        
        // Validate AI response
        if (result.action === 'ability' && (result.abilityIndex < 0 || result.abilityIndex >= enemy.abilities.length || enemy.abilities[result.abilityIndex].currentCooldown > 0)) {
           result.action = 'attack'; // Fallback to basic attack if AI chooses an invalid ability
        }
        
        return result;
    } catch (error) {
        console.error("Error getting enemy action:", error);
        return {
            action: 'attack',
            abilityIndex: -1,
            nextTurnIntent: { type: 'attack', description: 'Preparing a basic assault.' }
        };
    }
};

export const generateCharacterImage = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001', prompt,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '1:1', },
        });
        return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
    } catch (error) {
        console.error("Error generating character image:", error);
        return 'https://via.placeholder.com/512';
    }
};
