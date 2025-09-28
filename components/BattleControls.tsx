import React from 'react';
import { Ability, Character } from '../types';
import { PotionIcon } from './Icons';

interface BattleControlsProps {
  onAttack: () => void;
  onDefend: () => void;
  onUseAbility: (ability: Ability) => void;
  onUsePotion: () => void;
  player: Character;
  isPlayerTurn: boolean;
}

const BattleControls: React.FC<BattleControlsProps> = ({
  onAttack,
  onDefend,
  onUseAbility,
  onUsePotion,
  player,
  isPlayerTurn,
}) => {
  const isDisabled = !isPlayerTurn;

  return (
    <div className="battle-controls">
      <button onClick={onAttack} disabled={isDisabled}>
        Attack
      </button>
      <button onClick={onDefend} disabled={isDisabled}>
        Defend
      </button>
      {player.abilities.map((ability) => (
        <button
          key={ability.name}
          onClick={() => onUseAbility(ability)}
          disabled={isDisabled || ability.currentCooldown > 0}
          className="ability-button"
        >
          {ability.name}
          {ability.currentCooldown > 0 && ` (${ability.currentCooldown})`}
        </button>
      ))}
      <button 
        onClick={onUsePotion} 
        disabled={isDisabled || player.potions <= 0} 
        className="potion-button"
      >
        <PotionIcon /> Use Potion ({player.potions})
      </button>
    </div>
  );
};

export default BattleControls;