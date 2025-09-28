import React, { useState, useEffect } from 'react';
import { Character, StatusEffect, DamageInfo, EnemyIntentType } from '../types';
import { SwordIcon, ShieldIcon, DebuffIcon, HeavyAttackIcon } from './Icons'; // Assuming these are created

interface CharacterCardProps {
  character: Character;
  isPlayer: boolean;
}

const getIntentIcon = (type: EnemyIntentType) => {
    switch (type) {
        case 'attack': return <SwordIcon />;
        case 'heavy_attack': return <HeavyAttackIcon />;
        case 'defend': return <ShieldIcon />;
        case 'debuff': return <DebuffIcon />;
        default: return null;
    }
};

const getStatusEffectData = (effectType: StatusEffect['type']) => {
  switch (effectType) {
    case 'Stun': return { icon: '😵', description: 'Cannot act on the next turn.' };
    case 'Corrosion': return { icon: '☠️', description: 'Takes damage over time.' };
    case 'Weaken': return { icon: '📉', description: 'Deals reduced damage.' };
    default: return { icon: '❓', description: 'An unknown effect.' };
  }
};

const CharacterCard: React.FC<CharacterCardProps> = ({ character, isPlayer }) => {
  const hpPercentage = character.maxHp > 0 ? (character.hp / character.maxHp) * 100 : 0;
  const xpPercentage = isPlayer && character.xpToNextLevel > 0 ? (character.xp / character.xpToNextLevel) * 100 : 0;
  
  const [floatingNumbers, setFloatingNumbers] = useState<DamageInfo[]>([]);

  useEffect(() => {
    if (character.lastDamage) {
      setFloatingNumbers(prev => [...prev, character.lastDamage!]);
      const timer = setTimeout(() => {
        setFloatingNumbers(prev => prev.slice(1));
      }, 2000); // Corresponds to animation duration
      return () => clearTimeout(timer);
    }
  }, [character.lastDamage]);

  return (
    <div className={`character-card ${isPlayer ? 'player-card' : 'enemy-card'}`}>
      <div className="character-image-container">
        {character.imageUrl ? (
          <img src={character.imageUrl} alt={character.name} className="character-image" />
        ) : (
          <div className="character-image-placeholder"><div className="spinner"></div></div>
        )}
        <div className="floating-numbers-container">
            {floatingNumbers.map((num) => (
                <div key={num.id} className={`floating-number ${num.type} ${num.isCritical ? 'critical' : ''}`}>
                    {num.type === 'heal' ? `+${num.amount}` : num.amount}
                </div>
            ))}
        </div>
      </div>
      <div className="character-info">
        <div className="card-header">
            <h3>{character.name} {isPlayer && `(Lvl ${character.level})`}</h3>
            {!isPlayer && character.currentIntent && (
                <div className="enemy-intent tooltip-container">
                    {getIntentIcon(character.currentIntent.type)}
                    <span className="tooltip">{character.currentIntent.description}</span>
                </div>
            )}
        </div>

        <div className="hp-bar-container">
          <div className="hp-bar" style={{ width: `${hpPercentage}%` }}></div>
          <span className="hp-text">{character.hp} / {character.maxHp}</span>
        </div>
        {isPlayer && (
            <div className="xp-bar-container">
                <div className="xp-bar" style={{ width: `${xpPercentage}%` }}></div>
                <span className="xp-text">XP: {character.xp} / {character.xpToNextLevel}</span>
            </div>
        )}
        <div className="stats-grid">
          <span>ATK: {character.attack}</span>
          <span>DEF: {character.defense}</span>
          <span>SPD: {character.speed}</span>
        </div>
        <div className="status-effects">
          {character.statusEffects.map((effect, index) => {
            const { icon, description } = getStatusEffectData(effect.type);
            return (
                <div key={index} className="status-icon tooltip-container">
                    <span>{icon}</span>
                    <span className="tooltip">{`${effect.type} (${effect.duration} turns left): ${description}`}</span>
                </div>
            );
          })}
          {character.isDefending && (
            <div className="status-icon tooltip-container">
                <span>🛡️</span>
                <span className="tooltip">Defending: Takes 50% reduced damage until next turn.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CharacterCard;
