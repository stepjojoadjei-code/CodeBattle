
import React, { useState, useEffect } from 'react';
import { useBattle } from './hooks/useBattle';
import { generateCharacterImage } from './services/geminiService';
import CharacterCard from './components/CharacterCard';
import BattleLog from './components/BattleLog';
import BattleControls from './components/BattleControls';
import TurnOrderDisplay from './components/TurnOrderDisplay';
import Shop from './components/Shop';
import SettingsModal from './components/SettingsModal';
import { INITIAL_PLAYER_CHARACTER, PLAYER_IMAGE_PROMPT } from './constants';
import { soundService } from './services/soundService';
import { Volume2Icon, VolumeXIcon, CodeBattleLogo } from './components/Icons';

function App() {
  const {
    player,
    enemy,
    setEnemy,
    battleLog,
    isBattleOver,
    winner,
    turnOrder,
    activeCharacterName,
    isLoading,
    gamePhase,
    startNewBattle,
    handlePlayerAction,
    purchaseItem,
    // Fix: The useBattle hook does not take any arguments.
  } = useBattle();

  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(soundService.getIsMuted());

  // Generate enemy image when a new enemy is created by useBattle
  useEffect(() => {
    if (enemy && !enemy.imageUrl && enemy.name !== 'Fallback Glitch' && !isLoading) {
      // The enemy object from useBattle contains an imagePrompt
      const enemyWithPrompt = enemy as any;
      if (enemyWithPrompt.imagePrompt) {
        generateCharacterImage(enemyWithPrompt.imagePrompt).then(imageUrl => {
          setEnemy(e => e ? { ...e, imageUrl } : null);
        });
      }
    }
  }, [enemy, isLoading, setEnemy]);

  const handleStartBattle = async () => {
      const playerImageUrl = player.imageUrl || await generateCharacterImage(PLAYER_IMAGE_PROMPT);
      await startNewBattle(playerImageUrl);
  }

  const toggleMute = () => {
    const newMutedState = soundService.toggleMute();
    setIsMuted(newMutedState);
  };
  
  const renderGameContent = () => {
    if (isLoading && gamePhase === 'BATTLE') {
      return <div className="loading-screen">
          <h2>Generating Next Challenger...</h2>
          <div className="spinner"></div>
          <p>The Gemini AI is crafting a unique opponent for you.</p>
          <p>Please wait, this may take a moment.</p>
        </div>;
    }

    if (gamePhase === 'BATTLE' && enemy) {
      return (
        <>
          <TurnOrderDisplay turnOrder={turnOrder} activeCharacterName={activeCharacterName} />
          <div className="battle-arena">
            <CharacterCard character={player} isPlayer={true} />
            <div className="vs-text">VS</div>
            <CharacterCard character={enemy} isPlayer={false} />
          </div>
          <BattleLog logs={battleLog} />
          <BattleControls
            player={player}
            onAttack={() => handlePlayerAction('attack')}
            onDefend={() => handlePlayerAction('defend')}
            onAbility={(abilityIndex) => handlePlayerAction('ability', { abilityIndex })}
            onUsePotion={() => handlePlayerAction('potion')}
            isPlayerTurn={activeCharacterName === player.name}
            isBattleOver={isBattleOver}
          />
        </>
      );
    }
    
    // Pre-battle and Post-battle screen
    return (
        <div className="game-hub">
            {winner === 'player' && <h2 className="victory-title">Victory!</h2>}
            {winner === 'enemy' && <h2 className="defeat-title">Defeat!</h2>}
            
            <div className="hub-player-card">
              <CharacterCard character={{...player, hp: player.maxHp}} isPlayer={true} />
            </div>

            <div className="hub-controls">
                <h3>Welcome, {player.name}</h3>
                <p>XP: {player.xp} / {player.xpToNextLevel}</p>
                <p>Coins: {player.coins}</p>
                <p>Potions: {player.potions}</p>
                <button onClick={handleStartBattle} className="battle-button" disabled={isLoading}>
                    {isLoading ? 'Loading...' : (gamePhase === 'POST_BATTLE' ? 'Fight Next Opponent' : 'Start Battle')}
                </button>
                <button onClick={() => setIsShopOpen(true)} className="shop-button">
                    Open Shop
                </button>
            </div>
        </div>
    );
  };

  return (
    <div className="App">
      <header>
        <CodeBattleLogo />
        <div className="header-controls">
            <button onClick={() => setIsSettingsOpen(true)} className="icon-button" aria-label="Settings">⚙️</button>
            <button onClick={toggleMute} className="icon-button" aria-label="Toggle Sound">
                {isMuted ? <VolumeXIcon /> : <Volume2Icon />}
            </button>
        </div>
      </header>
      <main>
        {renderGameContent()}
      </main>
      <Shop 
        isOpen={isShopOpen} 
        onClose={() => setIsShopOpen(false)} 
        playerCoins={player.coins}
        onBuyPotion={() => purchaseItem('potion')}
        onBuyAttack={() => purchaseItem('attack')}
        onBuyDefense={() => purchaseItem('defense')}
      />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => {
            setIsSettingsOpen(false);
            // Resync mute state from service when modal closes
            setIsMuted(soundService.getIsMuted());
        }} 
      />
    </div>
  );
}

export default App;