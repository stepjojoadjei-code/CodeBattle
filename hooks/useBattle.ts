
import { useState, useEffect, useCallback } from 'react';
// Fix: Import `StatusEffect` to resolve the type error.
import { Character, BattleLogEntry, Ability, DamageInfo, EnemyIntent, StatusEffect } from '../types';
import { generateEnemy, getEnemyActionAndIntent } from '../services/geminiService';
import { 
  INITIAL_PLAYER_CHARACTER,
  CRIT_CHANCE, 
  CRIT_MULTIPLIER, 
  LEVEL_XP_BASE, 
  LEVEL_XP_GROWTH, 
  STAT_GAIN_HP, 
  STAT_GAIN_ATK, 
  STAT_GAIN_DEF,
  COINS_PER_VICTORY,
  POTION_HEAL_AMOUNT,
  POTION_COST,
  ATTACK_UPGRADE_COST,
  DEFENSE_UPGRADE_COST
} from '../constants';
import { soundService } from '../services/soundService';

type GamePhase = 'PRE_BATTLE' | 'BATTLE' | 'POST_BATTLE';
const PLAYER_SAVE_KEY = 'codeBattlePlayer';

export const useBattle = () => {
  const [player, setPlayer] = useState<Character>(() => {
    const saved = localStorage.getItem(PLAYER_SAVE_KEY);
    return saved ? JSON.parse(saved) : { ...INITIAL_PLAYER_CHARACTER, imageUrl: '' };
  });
  const [enemy, setEnemy] = useState<Character | null>(null);
  const [battleLog, setBattleLog] = useState<BattleLogEntry[]>([]);
  const [turn, setTurn] = useState(1);
  const [isBattleOver, setIsBattleOver] = useState(false);
  const [winner, setWinner] = useState<'player' | 'enemy' | null>(null);
  const [turnOrder, setTurnOrder] = useState<Character[]>([]);
  const [activeCharacterIndex, setActiveCharacterIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [gamePhase, setGamePhase] = useState<GamePhase>('PRE_BATTLE');

  useEffect(() => {
    localStorage.setItem(PLAYER_SAVE_KEY, JSON.stringify(player));
  }, [player]);

  const addLog = useCallback((message: string, isCritical: boolean = false) => {
    setBattleLog(prev => [...prev, { turn, message, isCritical }]);
  }, [turn]);

  const updateCharacterWithDamage = useCallback((character: Character, damageInfo: DamageInfo): Character => {
    const newHp = Math.max(0, character.hp - damageInfo.amount);
    return { ...character, hp: newHp, lastDamage: { ...damageInfo, id: Date.now() } };
  }, []);

  const calculateDamage = useCallback((attacker: Character, defender: Character, ability: Ability | null = null) => {
    const baseDamage = ability ? ability.damage : attacker.attack;
    const isCrit = Math.random() < CRIT_CHANCE;
    const critMultiplier = isCrit ? CRIT_MULTIPLIER : 1;
    let defenseModifier = 1 - (defender.defense / (defender.defense + 100));
    if (defender.isDefending) defenseModifier *= 0.5;
    const weakenEffect = attacker.statusEffects.find(e => e.type === 'Weaken');
    const attackMultiplier = weakenEffect ? 0.75 : 1;
    const damage = Math.round(baseDamage * attackMultiplier * critMultiplier * defenseModifier);
    if (isCrit) addLog("Critical Hit!", true);
    return { amount: Math.max(1, damage), isCritical: isCrit };
  }, [addLog]);

  const applyAttack = useCallback((attacker: Character, defender: Character, ability: Ability | null = null) => {
    const { amount, isCritical } = calculateDamage(attacker, defender, ability);
    addLog(`${attacker.name} uses ${ability?.name || 'a basic attack'} on ${defender.name}, dealing ${amount} damage.`);
    let newDefender = updateCharacterWithDamage(defender, { amount, isCritical, type: 'damage', id: 0 });
    
    if (ability?.statusEffect && Math.random() < ability.statusEffect.chance) {
        if (!newDefender.statusEffects.some(e => e.type === ability.statusEffect!.type)) {
            newDefender.statusEffects.push({ type: ability.statusEffect.type, duration: ability.statusEffect.duration });
            addLog(`${defender.name} is now ${ability.statusEffect.type}!`);
        }
    }
    return newDefender;
  }, [addLog, calculateDamage, updateCharacterWithDamage]);

  const endTurn = useCallback(() => {
    if (isBattleOver) return;
    const nextIndex = (activeCharacterIndex + 1) % turnOrder.length;
    setActiveCharacterIndex(nextIndex);
    if (nextIndex === 0) setTurn(t => t + 1);
  }, [activeCharacterIndex, turnOrder.length, isBattleOver]);
  
  const handleEndOfBattle = useCallback((victor: 'player' | 'enemy') => {
    setIsBattleOver(true);
    setWinner(victor);
    setGamePhase('POST_BATTLE');
    soundService.stopMusic();
    if (victor === 'player') {
      soundService.play('victory');
      const xpGained = 50 + (enemy?.level || 1) * 10;
      const coinsGained = COINS_PER_VICTORY;
      addLog(`You gained ${xpGained} XP and ${coinsGained} coins!`);
      setPlayer(p => {
          let newPlayer = { ...p, coins: p.coins + coinsGained, xp: p.xp + xpGained };
          if (newPlayer.xp >= newPlayer.xpToNextLevel) {
              soundService.play('levelup');
              newPlayer.level++;
              newPlayer.xp -= newPlayer.xpToNextLevel;
              newPlayer.xpToNextLevel = Math.floor(LEVEL_XP_BASE * Math.pow(LEVEL_XP_GROWTH, newPlayer.level - 1));
              newPlayer.maxHp += STAT_GAIN_HP;
              newPlayer.attack += STAT_GAIN_ATK;
              newPlayer.defense += STAT_GAIN_DEF;
              newPlayer.hp = newPlayer.maxHp;
              addLog(`${newPlayer.name} leveled up to Level ${newPlayer.level}! Stats increased!`);
          }
          return newPlayer;
      });
    } else {
      soundService.play('defeat');
    }
  }, [addLog, enemy]);

  const runEnemyTurn = useCallback(async (currentEnemyState: Character) => {
    if (isBattleOver || !enemy) return;
    const { action, abilityIndex, nextTurnIntent } = await getEnemyActionAndIntent(currentEnemyState, player);
    let updatedPlayerState: Character;
    let updatedEnemyState = { ...currentEnemyState, currentIntent: nextTurnIntent };

    if (action === 'ability' && abilityIndex !== -1) {
      const chosenAbility = updatedEnemyState.abilities[abilityIndex];
      soundService.play('ability');
      updatedEnemyState.abilities[abilityIndex].currentCooldown = chosenAbility.cooldown;
      updatedPlayerState = applyAttack(updatedEnemyState, player, chosenAbility);
    } else {
      soundService.play('attack');
      updatedPlayerState = applyAttack(updatedEnemyState, player);
    }
    
    setPlayer(updatedPlayerState);
    setEnemy(updatedEnemyState);

    if (updatedPlayerState.hp <= 0) {
      addLog(`${player.name} has been defeated!`);
      handleEndOfBattle('enemy');
    } else {
      endTurn();
    }
  }, [player, enemy, isBattleOver, applyAttack, endTurn, handleEndOfBattle, addLog]);

  const processTurn = useCallback(() => {
    if (isBattleOver || !turnOrder.length) return;
    const activeCharacter = turnOrder[activeCharacterIndex];
    if (!activeCharacter) return;
    let characterState = activeCharacter.name === player.name ? {...player} : {...enemy!};
    
    const cleanupEffects = (char: Character): Character => {
        let newChar = { ...char, isDefending: false };
        newChar.abilities = newChar.abilities.map(ab => ({...ab, currentCooldown: Math.max(0, ab.currentCooldown - 1)}));
        return newChar;
    };
    if(activeCharacter.name === player.name) setPlayer(p => cleanupEffects(p)); else setEnemy(e => e ? cleanupEffects(e) : null);
    
    let hpAfterEffects = characterState.hp;
    const newStatusEffects: StatusEffect[] = [];
    let stunned = false;
    for (const effect of characterState.statusEffects) {
        if (effect.type === 'Corrosion') {
            const corrosionDamage = Math.floor(characterState.maxHp * 0.05);
            hpAfterEffects -= corrosionDamage;
            addLog(`${characterState.name} takes ${corrosionDamage} damage from Corrosion.`);
            if (characterState.name === player.name) setPlayer(p => updateCharacterWithDamage(p, { amount: corrosionDamage, isCritical: false, type: 'corrosion', id: 0 }));
            else setEnemy(e => e ? updateCharacterWithDamage(e, { amount: corrosionDamage, isCritical: false, type: 'corrosion', id: 0 }) : null);
        }
        if (effect.type === 'Stun') stunned = true;
        if (effect.duration - 1 > 0) newStatusEffects.push({ ...effect, duration: effect.duration - 1 });
        else addLog(`${effect.type} wore off for ${characterState.name}.`);
    }
    characterState.hp = Math.max(0, hpAfterEffects);
    characterState.statusEffects = newStatusEffects;
    if (characterState.name === player.name) setPlayer(p => ({...p, hp: characterState.hp, statusEffects: newStatusEffects})); else setEnemy(e => e ? ({...e, hp: characterState.hp, statusEffects: newStatusEffects}) : null);
    if (characterState.hp <= 0) {
      const winner = characterState.name === player.name ? 'enemy' : 'player';
      addLog(`${characterState.name} has been defeated!`);
      handleEndOfBattle(winner);
      return;
    }
    if (stunned) { addLog(`${characterState.name} is stunned and cannot act!`); setTimeout(endTurn, 1000); return; }
    if (activeCharacter.name === enemy?.name) setTimeout(() => runEnemyTurn(characterState), 1000);
  }, [activeCharacterIndex, addLog, enemy, isBattleOver, player, turnOrder, endTurn, handleEndOfBattle, runEnemyTurn, updateCharacterWithDamage]);

  useEffect(() => {
    if (gamePhase !== 'BATTLE' || isLoading || isBattleOver) return;
    processTurn();
  }, [activeCharacterIndex, turnOrder, gamePhase, isLoading, isBattleOver, turn]);

  const startNewBattle = useCallback(async (playerImageUrl: string) => {
    setIsLoading(true); setGamePhase('BATTLE');
    const [enemyData, firstIntentData] = await Promise.all([
        generateEnemy(player.level),
        getEnemyActionAndIntent(player, player) // Dummy call to get an intent structure
    ]);
    setEnemy({ ...enemyData, imageUrl: '', currentIntent: firstIntentData.nextTurnIntent });
    setPlayer(p => ({
        ...p, hp: p.maxHp, isDefending: false, statusEffects: [],
        abilities: p.abilities.map(ab => ({ ...ab, currentCooldown: 0})),
        imageUrl: playerImageUrl,
    }));
    setBattleLog([]); setTurn(1); setIsBattleOver(false); setWinner(null); setActiveCharacterIndex(0);
    soundService.stopMusic(); soundService.startMusic();
    setIsLoading(false);
  }, [player.level]);

  useEffect(() => {
      if (player && enemy && gamePhase === 'BATTLE') setTurnOrder([player, enemy].sort((a, b) => b.speed - a.speed));
  }, [player, enemy, gamePhase]);

  const handlePlayerAction = (type: 'attack' | 'defend' | 'ability' | 'potion', payload?: any) => {
    if (isBattleOver || !enemy || turnOrder[activeCharacterIndex]?.name !== player.name) return;
    let updatedPlayer = { ...player }; let updatedEnemy = { ...enemy };
    switch (type) {
      case 'attack': soundService.play('attack'); updatedEnemy = applyAttack(player, enemy); break;
      case 'defend': soundService.play('defend'); updatedPlayer.isDefending = true; addLog(`${player.name} is defending.`); break;
      case 'ability':
        const ability = player.abilities[payload.abilityIndex as number]; if (ability.currentCooldown > 0) return;
        soundService.play('ability'); updatedPlayer.abilities[payload.abilityIndex].currentCooldown = ability.cooldown;
        if (ability.damage < 0) {
          const healAmount = -ability.damage;
          const newHp = Math.min(player.maxHp, player.hp + healAmount);
          updatedPlayer = { ...updatedPlayer, hp: newHp, lastDamage: { amount: healAmount, isCritical: false, type: 'heal', id: Date.now() }};
          addLog(`${player.name} uses ${ability.name} and heals for ${healAmount} HP.`);
        } else { updatedEnemy = applyAttack(player, enemy, ability); }
        break;
      case 'potion':
        if (player.potions > 0 && player.hp < player.maxHp) {
            soundService.play('potion'); updatedPlayer.potions--;
            const healAmount = POTION_HEAL_AMOUNT;
            const newHp = Math.min(player.maxHp, player.hp + healAmount);
            updatedPlayer = { ...updatedPlayer, hp: newHp, lastDamage: { amount: healAmount, isCritical: false, type: 'heal', id: Date.now() }};
            addLog(`${player.name} uses a potion and restores ${healAmount} HP.`);
        }
        break;
    }
    setPlayer(updatedPlayer); setEnemy(updatedEnemy);
    if (updatedEnemy.hp <= 0) { addLog(`${updatedEnemy.name} has been defeated!`); handleEndOfBattle('player'); } else { endTurn(); }
  };

  const purchaseItem = (item: 'potion' | 'attack' | 'defense') => {
      const newPlayer = {...player}; let cost = 0;
      switch(item) {
          case 'potion': cost = POTION_COST; if (player.coins >= cost) { newPlayer.coins -= cost; newPlayer.potions++; } break;
          case 'attack': cost = ATTACK_UPGRADE_COST; if (player.coins >= cost) { newPlayer.coins -= cost; newPlayer.attack += STAT_GAIN_ATK; } break;
          case 'defense': cost = DEFENSE_UPGRADE_COST; if (player.coins >= cost) { newPlayer.coins -= cost; newPlayer.defense += STAT_GAIN_DEF; } break;
      }
      if (player.coins >= cost) { soundService.play('coin'); setPlayer(newPlayer); }
  }

  return { player, setPlayer, enemy, setEnemy, battleLog, isBattleOver, winner, turnOrder, activeCharacterName: isBattleOver || !turnOrder.length ? null : turnOrder[activeCharacterIndex]?.name, isLoading, gamePhase, startNewBattle, handlePlayerAction, purchaseItem };
};