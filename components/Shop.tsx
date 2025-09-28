import React from 'react';
import { CoinIcon, PotionIcon } from './Icons';
import { POTION_COST, ATTACK_UPGRADE_COST, DEFENSE_UPGRADE_COST } from '../constants';

interface ShopProps {
  isOpen: boolean;
  onClose: () => void;
  playerCoins: number;
  onBuyPotion: () => void;
  onBuyAttack: () => void;
  onBuyDefense: () => void;
}

const Shop: React.FC<ShopProps> = ({ isOpen, onClose, playerCoins, onBuyPotion, onBuyAttack, onBuyDefense }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content shop-modal" onClick={(e) => e.stopPropagation()}>
        <div className="shop-header">
            <h2>Upgrade Shop</h2>
            <div className="coin-display">
                <CoinIcon />
                <span>{playerCoins}</span>
            </div>
        </div>
        <div className="shop-items">
            <div className="shop-item">
                <div className="item-info">
                    <PotionIcon />
                    <h3>Health Potion</h3>
                    <p>Restores {50} HP during battle.</p>
                </div>
                <button onClick={onBuyPotion} disabled={playerCoins < POTION_COST}>
                    Buy ({POTION_COST} <CoinIcon className="inline-icon"/>)
                </button>
            </div>
            <div className="shop-item">
                <div className="item-info">
                    <h3>+2 Attack</h3>
                    <p>Permanently increase your Attack power.</p>
                </div>
                <button onClick={onBuyAttack} disabled={playerCoins < ATTACK_UPGRADE_COST}>
                    Buy ({ATTACK_UPGRADE_COST} <CoinIcon className="inline-icon"/>)
                </button>
            </div>
            <div className="shop-item">
                <div className="item-info">
                    <h3>+1 Defense</h3>
                    <p>Permanently increase your Defense.</p>
                </div>
                <button onClick={onBuyDefense} disabled={playerCoins < DEFENSE_UPGRADE_COST}>
                    Buy ({DEFENSE_UPGRADE_COST} <CoinIcon className="inline-icon"/>)
                </button>
            </div>
        </div>
        <button onClick={onClose} className="close-button">Leave Shop</button>
      </div>
    </div>
  );
};

export default Shop;