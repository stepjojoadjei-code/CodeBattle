import React, { useState, useEffect } from 'react';
import './App.css';
import { useBattle } from './hooks/useBattle';
import CharacterCard from './components/CharacterCard';
import BattleLog from './components/BattleLog';
import BattleControls from './components/BattleControls';
import SettingsModal from './components/SettingsModal';
import Shop from './components/Shop';
import { SettingsIcon, ShopIcon, CoinIcon, PotionIcon, CodeBattleLogo } from './components/Icons';
import { soundService } from './services/soundService';

const App: React.FC = () => {
  const {
    player,
    enemy,
    battleLog,
    isPlayerTurn,
    gamePhase,
    isLoading,
    isPlayerImageLoading,
    isEnemyImageLoading,
    actions,
    startNewGame,
  } = useBattle();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);

  useEffect(() => {
    if (gamePhase === 'battle' && !soundService.getIsMuted()) {
        soundService.startMusic();
    } else if (gamePhase === 'victory' || gamePhase === 'defeat') {
        soundService.stopMusic();
    }
    return () => {
        soundService.stopMusic();
    }
  }, [gamePhase]);

  const renderGamePhase = () => {
    if (isLoading || !player) {
      return (
        <div className="loading-screen">
          <h2>Loading Game Data...</h2>
          <div className="spinner"></div>
        </div>
      );
    }
    
    if (gamePhase === 'start' && enemy === null) {
        return (
            <div className="loading-screen">
              <h2>Compiling a Worthy Opponent...</h2>
              <div className="spinner"></div>
            </div>
          );
    }

    if (gamePhase === 'victory' || gamePhase === 'defeat') {
      const lastLog = battleLog[battleLog.length -1];
      const xpLog = battleLog.find(log => log.message.includes("gained"));

      return (
        <div className="game-over-screen">
          <h2>{gamePhase === 'victory' ? 'Victory!' : 'Defeat!'}</h2>
          <p>{lastLog?.message}</p>
          {gamePhase === 'victory' && xpLog && <p className="rewards">{xpLog.message}</p>}
          <button onClick={startNewGame}>New Opponent</button>
        </div>
      );
    }

    if (!enemy) {
        return (
            <div className="loading-screen">
              <h2>Initializing Battle Matrix...</h2>
              <div className="spinner"></div>
            </div>
          );
    }

    return (
      <>
        <div className="battle-arena">
          <CharacterCard character={player} isPlayer={true} isLoadingImage={isPlayerImageLoading} isActive={isPlayerTurn} />
          <div className="vs-text">VS</div>
          <CharacterCard character={enemy} isLoadingImage={isEnemyImageLoading} isActive={!isPlayerTurn} />
        </div>
        <BattleLog logs={battleLog} />
        <BattleControls
          onAttack={actions.attack}
          onDefend={actions.defend}
          onUseAbility={actions.useAbility}
          onUsePotion={actions.usePotion}
          player={player}
          isPlayerTurn={isPlayerTurn}
        />
      </>
    );
  };
  
  return (
    <div className="App">
      <header>
        <CodeBattleLogo />
        <div className="player-stats">
            <div className="stat-display">
                <CoinIcon />
                <span>{player?.coins ?? 0}</span>
            </div>
            <div className="stat-display">
                <PotionIcon />
                <span>{player?.potions ?? 0}</span>
            </div>
        </div>
        <div className="header-buttons">
            <button onClick={() => setIsShopOpen(true)} className="header-icon-button" aria-label="Open Shop">
                <ShopIcon />
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="header-icon-button" aria-label="Open Settings">
                <SettingsIcon />
            </button>
        </div>
      </header>
      <main>
        {renderGamePhase()}
      </main>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      {player && (
          <Shop 
            isOpen={isShopOpen} 
            onClose={() => setIsShopOpen(false)}
            playerCoins={player.coins}
            onBuyPotion={actions.buyPotion}
            onBuyAttack={actions.buyAttack}
            onBuyDefense={actions.buyDefense}
          />
      )}
    </div>
  );
};

export default App;
