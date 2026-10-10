import React from 'react';
import { AssayPartExplanation } from '../../services/assayPartExplainerService.ts';

interface PartBubbleProps {
  explanation: AssayPartExplanation;
  position: { x: number; y: number };
  onClose: () => void;
}

export const PartBubble: React.FC<PartBubbleProps> = ({ explanation, position, onClose }) => {
  return (
    <div
      className="absolute bg-slate-900/95 backdrop-blur-md border border-teal-500/30 rounded-xl p-3 shadow-2xl z-50 text-xs w-64 pointer-events-auto"
      style={{ top: `${position.y + 10}px`, left: `${position.x + 10}px` }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-teal-300">{explanation.name}</span>
        <button onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
      </div>
      <p className="text-slate-300 leading-snug text-[11px] mb-2">{explanation.biophysicalMechanism}</p>
      <p className="text-[10px] text-teal-400 font-mono">Click for full breakdown</p>
    </div>
  );
};
