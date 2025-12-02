import React, { useMemo } from 'react';
import { OrbitalSlot, SlotType, OrbitalPositionType } from '../types';
import { VISUAL_CONFIG } from '../constants';

interface OrbitalVisualizerProps {
  centralAtom: string;
  slots: OrbitalSlot[];
  onSlotClick: (id: number) => void;
  ligandAtom: string;
}

const OrbitalVisualizer: React.FC<OrbitalVisualizerProps> = ({ 
  centralAtom, 
  slots, 
  onSlotClick,
  ligandAtom
}) => {
  // Sort slots to render "back" slots first for simple z-indexing
  // Positive tilt means "back" (smaller, darker), Negative/Zero means front
  const sortedSlots = useMemo(() => {
    return [...slots].sort((a, b) => b.tilt - a.tilt);
  }, [slots]);

  const renderLobe = (slot: OrbitalSlot) => {
    const angleRad = (slot.angle * Math.PI) / 180;
    const length = VISUAL_CONFIG.LOBE_LENGTH;
    const width = VISUAL_CONFIG.LOBE_WIDTH * (1 - slot.tilt * 0.3); // Perspective scale
    
    const endX = Math.cos(angleRad) * length;
    const endY = Math.sin(angleRad) * length;

    // Control points for Bezier curve (tear drop shape)
    const cp1X = Math.cos(angleRad - Math.PI / 8) * (length * 0.5);
    const cp1Y = Math.sin(angleRad - Math.PI / 8) * (length * 0.5);
    const cp2X = Math.cos(angleRad + Math.PI / 8) * (length * 0.5);
    const cp2Y = Math.sin(angleRad + Math.PI / 8) * (length * 0.5);

    // Color logic
    let fill = VISUAL_CONFIG.COLORS.EMPTY;
    let stroke = '#94a3b8';
    let opacity = 1 - slot.tilt * 0.4;

    if (slot.type === SlotType.BOND) {
      fill = VISUAL_CONFIG.COLORS.BOND;
      stroke = '#059669';
    } else if (slot.type === SlotType.LONE_PAIR) {
      fill = VISUAL_CONFIG.COLORS.LONE_PAIR;
      stroke = '#d97706';
    }

    // Lobe path: Start 0,0 -> Curve to End -> Curve back to 0,0
    // Simplified ellipse-like shape rotated
    
    return (
      <g 
        key={slot.id} 
        onClick={() => onSlotClick(slot.id)}
        className="cursor-pointer transition-all duration-200 hover:opacity-80"
        style={{ opacity }}
      >
        {/* The Orbital Lobe */}
        <ellipse 
          cx={endX / 2} 
          cy={endY / 2} 
          rx={length / 2} 
          ry={width / 2}
          fill={fill}
          stroke={stroke}
          strokeWidth="2"
          transform={`rotate(${slot.angle}, ${endX/2}, ${endY/2})`}
        />
        
        {/* Content Indicator */}
        {slot.type === SlotType.BOND && (
          <g transform={`translate(${endX}, ${endY})`}>
            <circle r="12" fill="#e2e8f0" stroke="#475569" strokeWidth="2"/>
            <text x="0" y="4" textAnchor="middle" fontSize="10" fill="#0f172a" className="font-bold font-mono">
              {ligandAtom}
            </text>
          </g>
        )}
        
        {slot.type === SlotType.LONE_PAIR && (
          <g transform={`translate(${endX * 0.8}, ${endY * 0.8})`}>
            <circle r="3" cx="-4" cy="0" fill="#fff" opacity="0.8"/>
            <circle r="3" cx="4" cy="0" fill="#fff" opacity="0.8"/>
          </g>
        )}

        {slot.type === SlotType.EMPTY && (
           <circle cx={endX*0.8} cy={endY*0.8} r="4" fill="transparent" stroke="#ffffff33" strokeDasharray="2 2" />
        )}
      </g>
    );
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg viewBox="-150 -150 300 300" className="w-full max-w-[500px] h-auto drop-shadow-2xl">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Back slots */}
        {sortedSlots.filter(s => s.tilt > 0).map(renderLobe)}

        {/* Central Atom */}
        <circle 
          cx="0" 
          cy="0" 
          r={VISUAL_CONFIG.ATOM_RADIUS} 
          fill={VISUAL_CONFIG.COLORS.CENTRAL_ATOM}
          stroke="#4338ca"
          strokeWidth="3"
          filter="url(#glow)"
        />
        <text 
          x="0" 
          y="5" 
          textAnchor="middle" 
          fill="white" 
          fontSize="16" 
          className="font-bold font-mono select-none pointer-events-none"
        >
          {centralAtom}
        </text>

        {/* Front slots */}
        {sortedSlots.filter(s => s.tilt <= 0).map(renderLobe)}

      </svg>
      
      {/* Helper Text */}
      <div className="absolute bottom-4 text-slate-400 text-xs text-center pointer-events-none">
        Click lobes to cycle: Bond / Lone Pair / Empty
      </div>
    </div>
  );
};

export default OrbitalVisualizer;
