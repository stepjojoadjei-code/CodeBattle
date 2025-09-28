import React from 'react';
import { Character } from '../types';
import { PotionIcon } from './Icons';
import { POTION_HEAL_AMOUNT } from '../constants';

interface BattleControlsProps {
  player: Character;
  onAttack: () => void;
  onDefend: () => void;
  onAbility: (abilityIndex: number) => void;
  onUsePotion: () => void;
  isPlayerTurn: boolean;
  isBattleOver: boolean;
}

const BattleControls: React.FC<BattleControlsProps> = ({
  player,
  onAttack,
  onDefend,
  onAbility,
  onUsePotion,
  isPlayerTurn,
  isBattleOver,
}) => {
  const canAct = isPlayerTurn && !isBattleOver;

  return (
    <div className="battle-controls">
      <div className="action-buttons">
        <button onClick={onAttack} disabled={!canAct}>
          Attack
        </button>
        <button onClick={onDefend} disabled={!canAct}>
          Defend
        </button>
        <button onClick={onUsePotion} disabled={!canAct || player.potions <= 0 || player.hp === player.maxHp}>
          <PotionIcon /> Use Potion ({player.potions})
          <span className="tooltip">Heals {POTION_HEAL_AMOUNT} HP</span>
        </button>
      </div>
      <div className="ability-buttons">
        {player.abilities.map((ability, index) => (
          <button
            key={ability.name}
            onClick={() => onAbility(index)}
            disabled={!canAct || ability.currentCooldown > 0}
            className="ability-button"
          >
            {ability.name}
            {ability.currentCooldown > 0 ? (
              <span className="cooldown-timer">({ability.currentCooldown})</span>
            ) : (
              <span className="tooltip">{ability.description}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BattleControls;
