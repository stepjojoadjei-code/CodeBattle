import React, { useRef, useEffect } from 'react';
import { BattleLogEntry } from '../types';

interface BattleLogProps {
  logs: BattleLogEntry[];
}

const BattleLog: React.FC<BattleLogProps> = ({ logs }) => {
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    const getEntryClass = (log: BattleLogEntry) => {
        if (log.isCritical) return 'log-critical';
        const message = log.message.toLowerCase();
        if (message.includes('leveled up')) return 'log-levelup';
        if (message.includes('gained')) return 'log-reward';
        if (message.includes('potion') || message.includes('heal')) return 'log-heal';
        if (message.includes('stun')) return 'log-status-stun';
        if (message.includes('corrosion')) return 'log-status-corrosion';
        if (message.includes('weaken')) return 'log-status-weaken';
        return '';
    }

    return (
        <div className="battle-log" ref={logContainerRef}>
            {logs.map((log, index) => (
                <p key={index} className={`log-entry ${getEntryClass(log)}`}>
                    <span className="turn-number">Turn {log.turn}:</span> {log.message}
                </p>
            ))}
        </div>
    );
};

export default BattleLog;
