import React from 'react';
import { Character } from '../types';

interface TurnOrderDisplayProps {
  turnOrder: Character[];
  activeCharacterName: string | null;
}

const TurnOrderDisplay: React.FC<TurnOrderDisplayProps> = ({ turnOrder, activeCharacterName }) => {
  return (
    <div className="turn-order-container">
      <h4>Turn Order</h4>
      <div className="turn-order-list">
        {turnOrder.map((char, index) => (
          <div
            key={`${char.name}-${index}`}
            className={`turn-order-item ${char.name === activeCharacterName ? 'active-turn' : ''}`}
            title={char.name}
          >
            {char.imageUrl ? (
              <img src={char.imageUrl} alt={char.name} />
            ) : (
              <span>{char.name.charAt(0)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TurnOrderDisplay;
