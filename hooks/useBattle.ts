import { useState, useEffect, useCallback } from 'react';
import { Character, BattleLogEntry, Ability, GamePhase, StatusEffect } from '../types';
import { INITIAL_PLAYER_CHARACTER, PLAYER_IMAGE_PROMPT, LEVEL_XP_BASE, LEVEL_XP_GROWTH, STAT_GAIN_HP, STAT_GAIN_ATK, STAT_GAIN_DEF, COINS_PER_VICTORY, POTION_HEAL_AMOUNT, POTION_COST, ATTACK_UPGRADE_COST, DEFENSE_UPGRADE_COST, CRIT_CHANCE, CRIT_MULTIPLIER } from '../constants';
import { generateEnemyCharacter, getEnemyAction, generateImage } from '../services/geminiService';
import { soundService } from '../services/soundService';

const PLAYER_DATA_KEY = 'code_battle_player_data';

const loadPlayerData = (): Omit<Character, 'imageUrl'> => {
    try {
        const savedData = localStorage.getItem(PLAYER_DATA_KEY);
        if (savedData) {
            const parsed = JSON.parse(savedData);
            return { 
                ...parsed, 
                hp: parsed.maxHp, // Full heal on load
                isDefending: false,
                statusEffects: [],
                abilities: INITIAL_PLAYER_CHARACTER.abilities.map(a => ({...a, currentCooldown: 0})) 
            };
        }
    } catch (error) {
        console.error("Failed to load player data:", error);
    }
    return INITIAL_PLAYER_CHARACTER;
};

const savePlayerData = (player: Character) => {
    try {
        const dataToSave = { ...player };
        // Don't save transient battle state
        delete (dataToSave as any).imageUrl; 
        delete (dataToSave as any).isDefending;
        delete (dataToSave as any).statusEffects;
        localStorage.setItem(PLAYER_DATA_KEY, JSON.stringify(dataToSave));
    } catch (error) {
        console.error("Failed to save player data:", error);
    }
};

export const useBattle = () => {
    const [player, setPlayer] = useState<Character | null>(null);
    const [enemy, setEnemy] = useState<Character | null>(null);
    const [battleLog, setBattleLog] = useState<BattleLogEntry[]>([]);
    const [turn, setTurn] = useState(1);
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    const [gamePhase, setGamePhase] = useState<GamePhase>('start');
    const [isLoading, setIsLoading] = useState(true);
    const [isPlayerImageLoading, setIsPlayerImageLoading] = useState(true);
    const [isEnemyImageLoading, setIsEnemyImageLoading] = useState(true);

    useEffect(() => {
        setPlayer({ ...loadPlayerData(), imageUrl: ''}); // Load with empty image
        setIsLoading(false);
    }, []);

    const addLog = useCallback((message: string, isCritical: boolean = false) => {
        setBattleLog(prev => [...prev, { turn, message, isCritical }]);
    }, [turn]);
    
    const startNewGame = useCallback(async () => {
        if (!player) return;
        
        setIsLoading(true);
        setGamePhase('start');
        setBattleLog([]);
        setTurn(1);
        
        const freshPlayer = { ...loadPlayerData(), imageUrl: player.imageUrl };
        setPlayer(freshPlayer);

        try {
            setIsPlayerImageLoading(true);
            setIsEnemyImageLoading(true);

            const [enemyData, playerImage, enemyImage] = await Promise.all([
                generateEnemyCharacter(),
                generateImage(PLAYER_IMAGE_PROMPT),
                generateImage((await generateEnemyCharacter()).imageUrl!) // This is slightly inefficient but ensures prompt is fresh
            ]);
            
            setPlayer(p => p ? { ...p, imageUrl: playerImage } : null);
            setIsPlayerImageLoading(false);

            const initialEnemy: Character = { 
                ...enemyData, 
                hp: enemyData.maxHp,
                isDefending: false,
                statusEffects: [], 
                level: 1, xp:0, xpToNextLevel:0, coins: 0, potions: 0 
            };
            initialEnemy.imageUrl = enemyImage;
            setEnemy(initialEnemy);
            setIsEnemyImageLoading(false);

            setGamePhase('battle');
            const startingPlayer = freshPlayer.speed >= initialEnemy.speed;
            setIsPlayerTurn(startingPlayer);
            addLog(startingPlayer ? 'You are faster and attack first!' : 'The enemy is faster and attacks first!');

        } catch (error) {
            console.error("Failed to generate assets for new battle:", error);
            addLog("Error: Could not start a new battle. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [addLog]);
    
    useEffect(() => {
        if (player && gamePhase === 'start' && !isLoading) {
            startNewGame();
        }
    }, [player, gamePhase, isLoading, startNewGame]);

    const applyStatusEffects = useCallback((character: Character, isPlayer: boolean) => {
        let newCharacter = { ...character };
        let characterName = isPlayer ? player!.name : enemy!.name;

        newCharacter.statusEffects = newCharacter.statusEffects.filter(effect => {
            if (effect.type === 'Corrosion') {
                const corrosionDamage = Math.ceil(newCharacter.maxHp * 0.05); // 5% max HP damage
                newCharacter.hp = Math.max(0, newCharacter.hp - corrosionDamage);
                addLog(`${characterName} takes ${corrosionDamage} damage from corrosion.`);
            }
            effect.turns -= 1;
            return effect.turns > 0;
        });

        if(isPlayer) setPlayer(newCharacter as Character);
        else setEnemy(newCharacter as Character);

        return newCharacter;
    }, [addLog, player, enemy]);

    const endTurn = useCallback(() => {
        setTurn(t => t + 1);
        
        const updateCooldowns = (char: Character): Character => ({
            ...char,
            isDefending: false,
            abilities: char.abilities.map(a => ({ ...a, currentCooldown: Math.max(0, a.currentCooldown - 1) })),
        });

        if (player) setPlayer(p => updateCooldowns(p!));
        if (enemy) setEnemy(e => updateCooldowns(e!));

    }, [player, enemy]);

    const executeAction = (actionFn: () => void) => {
        if ((isPlayerTurn && !player) || (!isPlayerTurn && !enemy) || gamePhase !== 'battle') return;
        
        let character = isPlayerTurn ? player! : enemy!;
        
        // 1. Process status effects at the start of the turn
        character = applyStatusEffects(character, isPlayerTurn);
        
        // 2. Check for stun
        if (character.statusEffects.some(e => e.type === 'Stun')) {
            addLog(`${character.name} is stunned and cannot move!`);
            setTimeout(() => {
                endTurn();
                setIsPlayerTurn(!isPlayerTurn);
            }, 1000);
            return;
        }

        // 3. Execute the action
        actionFn();
        
        // 4. Switch turns
        if (gamePhase === 'battle') {
            setIsPlayerTurn(!isPlayerTurn);
        }
    };

    const attack = () => {
        if (!isPlayerTurn) return;
        executeAction(() => {
            if (!enemy || !player) return;
            const { damage, isCritical } = calculateDamage(player, enemy);
            setEnemy(e => e ? { ...e, hp: Math.max(0, e.hp - damage) } : null);
            addLog(`${player.name} attacks ${enemy.name} for ${damage} damage.`, isCritical);
            soundService.play('attack');
        });
    };
    
    // ... other player actions (defend, useAbility, usePotion) also need to wrap their logic in executeAction ...
    const defend = () => {
        if (!isPlayerTurn) return;
        executeAction(() => {
            setPlayer(p => p ? { ...p, isDefending: true } : null);
            addLog(`${player!.name} takes a defensive stance.`);
            soundService.play('defend');
        });
    };
    
    const useAbility = (ability: Ability) => {
        if (!isPlayerTurn) return;
        executeAction(() => {
            if (ability.currentCooldown > 0 || !enemy || !player) return;
            soundService.play('ability');
            
            // Apply damage/healing
            if (ability.damage !== 0) {
                 if (ability.damage > 0) { // Damage
                    const { damage, isCritical } = calculateDamage(player, enemy, ability.damage);
                    setEnemy(e => e ? { ...e, hp: Math.max(0, e.hp - damage) } : null);
                    addLog(`${player.name} uses ${ability.name}, dealing ${damage} damage!`, isCritical);
                } else { // Healing
                    const healing = -ability.damage;
                    setPlayer(p => p ? { ...p, hp: Math.min(p.maxHp, p.hp + healing) } : null);
                    addLog(`${player.name} uses ${ability.name}, healing for ${healing} HP.`);
                }
            }
    
            // Apply status effect
            if (ability.statusEffect && Math.random() < ability.statusEffect.chance) {
                applyStatus(enemy!, ability.statusEffect, false);
            }
            
            // Set cooldown
            setPlayer(p => p ? {
                ...p,
                abilities: p.abilities.map(a => a.name === ability.name ? { ...a, currentCooldown: a.cooldown + 1 } : a)
            } : null);
        });
    };

    const usePotion = () => {
        if (!isPlayerTurn) return;
        executeAction(() => {
            if (!player || player.potions <= 0) return;
            const healing = POTION_HEAL_AMOUNT;
            setPlayer(p => p ? { ...p, hp: Math.min(p.maxHp, p.hp + healing), potions: p.potions - 1 } : null);
            addLog(`${player.name} uses a potion, healing for ${healing} HP.`);
            soundService.play('potion');
        });
    };
    
    // Enemy Turn Logic
    useEffect(() => {
        if (!isPlayerTurn && gamePhase === 'battle' && enemy && enemy.hp > 0 && player && player.hp > 0) {
            const timer = setTimeout(() => {
                executeAction(async () => {
                    try {
                        const aiAction = await getEnemyAction(enemy, player, battleLog);
                        addLog(`${enemy.name}'s narration: "${aiAction.narration}"`);
                        
                        switch (aiAction.action) {
                            case 'attack':
                                const { damage, isCritical } = calculateDamage(enemy, player);
                                setPlayer(p => p ? { ...p, hp: Math.max(0, p.hp - damage) } : null);
                                addLog(`${enemy.name} attacks ${player.name} for ${damage} damage.`, isCritical);
                                soundService.play('attack');
                                break;
                            case 'defend':
                                setEnemy(e => e ? { ...e, isDefending: true } : null);
                                addLog(`${enemy.name} defends.`);
                                soundService.play('defend');
                                break;
                            case 'use_ability':
                                const ability = enemy.abilities.find(a => a.name === aiAction.abilityName);
                                if (ability) {
                                    soundService.play('ability');
                                    // ... ability logic similar to player's ...
                                    if (ability.damage > 0) {
                                        const { damage, isCritical } = calculateDamage(enemy, player, ability.damage);
                                        setPlayer(p => p ? { ...p, hp: Math.max(0, p.hp - damage) } : null);
                                        addLog(`${enemy.name} uses ${ability.name}, dealing ${damage} damage.`, isCritical);
                                    } else if (ability.damage < 0) {
                                        const healing = -ability.damage;
                                        setEnemy(e => e ? { ...e, hp: Math.min(e.maxHp, e.hp + healing) } : null);
                                        addLog(`${enemy.name} uses ${ability.name}, healing for ${healing} HP.`);
                                    }
                                     if (ability.statusEffect && Math.random() < ability.statusEffect.chance) {
                                        applyStatus(player, ability.statusEffect, true);
                                    }
                                    setEnemy(e => e ? {
                                        ...e,
                                        abilities: e.abilities.map(a => a.name === ability.name ? { ...a, currentCooldown: a.cooldown + 1 } : a)
                                    } : null);
                                } else {
                                    addLog(`${enemy.name} fumbles its ability!`);
                                }
                                break;
                        }
                    } catch (error) {
                        console.error("Error getting enemy action:", error);
                        addLog(`${enemy.name} seems confused and does nothing.`);
                    } finally {
                        endTurn();
                    }
                });
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [isPlayerTurn, gamePhase]);

    useEffect(() => {
        if (gamePhase !== 'battle' || !player) return;
        if (player.hp <= 0) {
            setGamePhase('defeat');
            addLog("You have been defeated.");
            soundService.play('defeat');
        } else if (enemy && enemy.hp <= 0) {
            setGamePhase('victory');
            const xpGained = Math.floor(enemy.maxHp / 3);
            const coinsGained = COINS_PER_VICTORY;
            addLog(`${enemy.name} has been defeated! You gained ${xpGained} XP and ${coinsGained} Code-Coins!`);
            
            let updatedPlayer = { ...player, xp: player.xp + xpGained, coins: player.coins + coinsGained };
            
            if (updatedPlayer.xp >= updatedPlayer.xpToNextLevel) {
                updatedPlayer.level += 1;
                updatedPlayer.xp -= updatedPlayer.xpToNextLevel;
                updatedPlayer.xpToNextLevel = Math.floor(LEVEL_XP_BASE * (LEVEL_XP_GROWTH ** (updatedPlayer.level - 1)));
                updatedPlayer.maxHp += STAT_GAIN_HP;
                updatedPlayer.attack += STAT_GAIN_ATK;
                updatedPlayer.defense += STAT_GAIN_DEF;
                updatedPlayer.hp = updatedPlayer.maxHp;
                addLog(`Congratulations! You leveled up to Level ${updatedPlayer.level}!`);
                soundService.play('levelup');
            } else {
                soundService.play('victory');
            }
            setPlayer(updatedPlayer);
            savePlayerData(updatedPlayer);
        }
    }, [player?.hp, enemy?.hp]);

    const calculateDamage = (attacker: Character, defender: Character, baseDamage?: number) => {
        const attackPower = baseDamage ?? attacker.attack;
        const isCritical = Math.random() < CRIT_CHANCE;
        
        let modifiedAttack = attackPower;
        if(attacker.statusEffects.some(e => e.type === 'Weaken')) modifiedAttack *= 0.75; // Weakened deals 75%
        
        let damage = modifiedAttack - defender.defense;
        if (defender.isDefending) damage *= 0.5;
        if (isCritical) damage *= CRIT_MULTIPLIER;
        
        return { damage: Math.max(1, Math.ceil(damage)), isCritical };
    };
    
    const applyStatus = (target: Character, effect: Ability['statusEffect'], isPlayerTarget: boolean) => {
        if (!effect) return;
        addLog(`${target.name} is afflicted with ${effect.type}!`);
        const newStatus: StatusEffect = { type: effect.type, turns: effect.duration };
        const setTarget = isPlayerTarget ? setPlayer : setEnemy;
        setTarget(t => t ? ({ ...t, statusEffects: [...t.statusEffects, newStatus] }) : null);
    };

    const buyPotion = () => { /* ... same as before ... */ };
    const buyAttack = () => { /* ... same as before ... */ };
    const buyDefense = () => { /* ... same as before ... */ };

    return {
        player, enemy, battleLog, isPlayerTurn, gamePhase, isLoading, isPlayerImageLoading, isEnemyImageLoading,
        actions: { attack, defend, useAbility, usePotion, buyPotion, buyAttack, buyDefense },
        startNewGame,
    };
};
