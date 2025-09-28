import React, { useState, useEffect } from 'react';
import { Volume2Icon, VolumeXIcon } from './Icons';
import { soundService } from '../services/soundService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  // Fix: Synchronize muted state with the sound service.
  const [isMuted, setIsMuted] = useState(soundService.getIsMuted());

  // Effect to update local state if it's changed elsewhere
  useEffect(() => {
    setIsMuted(soundService.getIsMuted());
  }, [isOpen]);


  const toggleMute = () => {
    soundService.toggleMute();
    setIsMuted(soundService.getIsMuted());
  };
  
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Settings</h2>
        <div className="settings-option">
            <span>Sound</span>
            <button onClick={toggleMute} className="icon-button">
                {isMuted ? <VolumeXIcon /> : <Volume2Icon />}
            </button>
        </div>
        <button onClick={onClose} className="close-button">Close</button>
      </div>
    </div>
  );
};

export default SettingsModal;
