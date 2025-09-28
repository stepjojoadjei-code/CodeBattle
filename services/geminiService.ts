import { GoogleGenAI, Type } from "@google/genai";
import { Character, BattleLogEntry, AIAction, Ability } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const statusEffectSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, enum: ['Stun', 'Corrosion', 'Weaken'] },
        chance: { type: Type.NUMBER, description: "Chance to apply, from 0.1 to 1.0" },
        duration: { type: Type.INTEGER, description: "Duration in turns, from 1 to 3" },
    },
    required: ['type', 'chance', 'duration'],
};

const characterSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "The enemy's cool and thematic name, like 'Glitch Fiend' or 'Data Drake'." },
        hp: { type: Type.INTEGER, description: "The enemy's health points. Between 80 and 200." },
        attack: { type: Type.INTEGER, description: "The enemy's attack power. Between 10 and 25." },
        defense: { type: Type.INTEGER, description: "The enemy's defense power. Between 5 and 20." },
        speed: { type: Type.INTEGER, description: "The enemy's speed. Between 10 and 40." },
        imagePrompt: { type: Type.STRING, description: "A creative, detailed prompt for an image generator. Style: vibrant, colorful, synthwave-style robot. e.g., 'A menacing robot serpent made of neon green code, glitching in a dark cyberspace, synthwave art'." },
        abilities: {
            type: Type.ARRAY,
            description: "A list of 1 or 2 unique and thematic abilities for the character.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "The name of the ability, e.g., 'Static Shock'." },
                    description: { type: Type.STRING, description: "A brief description of the ability." },
                    damage: { type: Type.INTEGER, description: "Base damage. 0 if it's a pure status move." },
                    cooldown: { type: Type.INTEGER, description: "Cooldown in turns after use." },
                    statusEffect: { ...statusEffectSchema, description: "Optional status effect this ability can apply." },
                },
                required: ["name", "description", "damage", "cooldown"],
            },
        },
    },
    required: ["name", "hp", "attack", "defense", "speed", "imagePrompt", "abilities"],
};


export const generateEnemyCharacter = async (): Promise<Omit<Character, 'hp' | 'isDefending' | 'statusEffects' | 'level'|'xp'|'xpToNextLevel'|'coins'|'potions'>> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: 'Generate a unique and challenging synthwave-themed robot enemy for a turn-based RPG battle. The player is a "Code Warrior".',
    config: {
      responseMimeType: "application/json",
      responseSchema: characterSchema,
      temperature: 1,
    },
  });

  const characterData = JSON.parse(response.text);

  return {
      ...characterData,
      maxHp: characterData.hp,
      imageUrl: characterData.imagePrompt,
      abilities: characterData.abilities.map((a: Omit<Ability, 'currentCooldown'>) => ({...a, currentCooldown: 0 }))
  };
};

const aiActionSchema = {
    type: Type.OBJECT,
    properties: {
        action: { type: Type.STRING, enum: ['attack', 'defend', 'use_ability'] },
        abilityName: { type: Type.STRING, description: "Required if action is 'use_ability'. Must be an available, off-cooldown ability." },
        narration: { type: Type.STRING, description: "A short, dramatic narration for the action from the enemy's perspective." }
    },
    required: ["action", "narration"],
};

export const getEnemyAction = async (enemy: Character, player: Character, battleLog: BattleLogEntry[]): Promise<AIAction> => {
    const availableAbilities = enemy.abilities.filter(a => a.currentCooldown === 0);
    const playerStatus = player.statusEffects.length > 0 ? `Player is affected by: ${player.statusEffects.map(s => s.type).join(', ')}.` : 'Player has no status effects.';
    
    const prompt = `
    You are the AI for an enemy in a turn-based RPG. Your character is ${enemy.name}.
    Your current stats: HP=${enemy.hp}/${enemy.maxHp}. Your status effects: ${enemy.statusEffects.map(s => s.type).join(', ') || 'None'}.
    Your available abilities: ${availableAbilities.length > 0 ? availableAbilities.map(a => `${a.name} (Cooldown: ${a.cooldown})`).join(', ') : 'None'}.
    The player is ${player.name} with ${player.hp}/${player.maxHp} HP. ${playerStatus}
    The player is currently ${player.isDefending ? 'defending' : 'not defending'}.
    
    Recent battle events:
    ${battleLog.slice(-5).map(log => `Turn ${log.turn}: ${log.message}`).join('\n')}

    Based on this situation, decide your next move.
    - If my HP is low, defending or using a healing/utility ability is wise.
    - If the player is defending, a standard attack is weak. An ability that applies a status effect (like Corrosion) is a good choice.
    - If I have a powerful ability off cooldown (like Stun), it's a great time to use it to gain an advantage.
    - I MUST NOT use an ability that is on cooldown. If I choose 'use_ability', I MUST pick a valid abilityName.
    
    Choose one action: 'attack', 'defend', or 'use_ability'.
    Provide a short, dramatic narration for the action.
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: aiActionSchema,
            temperature: 0.9,
            thinkingConfig: { thinkingBudget: 0 } 
        },
    });

    return JSON.parse(response.text);
};

export const generateImage = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            aspectRatio: '1:1',
            outputMimeType: 'image/png'
        }
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;
};
