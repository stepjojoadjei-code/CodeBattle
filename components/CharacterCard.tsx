import React from 'react';
import { Character } from '../types';
import { StunIcon, WeakenIcon, CorrosionIcon } from './Icons';

interface CharacterCardProps {
  character: Character;
  isPlayer?: boolean;
  isLoadingImage?: boolean;
  isActive?: boolean;
}

const HealthBar: React.FC<{ current: number; max: number, type: 'hp' | 'xp' }> = ({ current, max, type }) => {
  const percentage = max > 0 ? (current / max) * 100 : 0;
  
  const barClass = type === 'hp' ? 'hp-bar' : 'xp-bar';
  const fillColor = type === 'hp'
    ? (percentage > 60 ? 'fill-hp-high' : percentage > 30 ? 'fill-hp-medium' : 'fill-hp-low')
    : 'fill-xp';


  return (
    <div className={`w-full bg-black/50 rounded-full h-4 overflow-hidden border-2 border-black/30 ${barClass}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${fillColor}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

const StatusEffectIcons: React.FC<{ character: Character }> = ({ character }) => {
    if (!character.statusEffects || character.statusEffects.length === 0) return null;

    return (
        <div className="status-effects-container">
            {character.statusEffects.map((effect, index) => {
                let IconComponent;
                switch(effect.type) {
                    case 'Stun': IconComponent = StunIcon; break;
                    case 'Weaken': IconComponent = WeakenIcon; break;
                    case 'Corrosion': IconComponent = CorrosionIcon; break;
                    default: return null;
                }
                return (
                    <div key={index} className="status-icon" title={`${effect.type} - ${effect.turns} turns left`}>
                        <IconComponent />
                        <span>{effect.turns}</span>
                    </div>
                );
            })}
        </div>
    );
};


const CharacterCard: React.FC<CharacterCardProps> = ({ character, isPlayer = false, isLoadingImage = false, isActive = false }) => {
  if (!character) {
    return (
        <div className={`character-card ${isPlayer ? 'player-card' : 'enemy-card'}`}>
            <div className="character-image-placeholder animate-pulse"></div>
        </div>
    );
  }

  const { name, hp, maxHp, imageUrl, level, xp, xpToNextLevel } = character;

  return (
    <div className={`character-card ${isPlayer ? 'player-card' : 'enemy-card'} ${isActive ? 'active-turn' : ''}`}>
      <div className="character-image-container">
        {isLoadingImage ? (
            <div className="character-image-placeholder animate-pulse"></div>
        ) : (
            <img src={imageUrl} alt={name} className="character-image" />
        )}
      </div>
      <div className="character-info">
        <h3>{name} {isPlayer && `(Lvl ${level})`}</h3>
        <HealthBar current={hp} max={maxHp} type="hp" />
        <p className="hp-text">{hp} / {maxHp}</p>
        {isPlayer && (
          <div className="xp-bar-container">
            <HealthBar current={xp} max={xpToNextLevel} type="xp" />
            <p className="xp-text">XP: {xp} / {xpToNextLevel}</p>
          </div>
        )}
      </div>
      <StatusEffectIcons character={character} />
      <div className="stats-display">
        <p>ATK: {character.attack}</p>
        <p>DEF: {character.defense}</p>
      </div>
    </div>
  );
};

export default CharacterCard;
