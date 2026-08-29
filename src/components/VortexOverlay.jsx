import React from 'react';
import { useTheme } from '../context/ThemeContext';
import './VortexOverlay.css';

const VortexOverlay = () => {
  const { animPhase } = useTheme();

  if (animPhase === 'idle') return null;

  return (
    <div className={`vortex-overlay ${animPhase}`}>
      {animPhase === 'vortex' && (
        <div className="vortex-container">
          {/* Spiral arms */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="vortex-arm"
              style={{ '--arm-index': i }}
            />
          ))}
          {/* Inner glow rings */}
          <div className="vortex-ring vortex-ring-1" />
          <div className="vortex-ring vortex-ring-2" />
          <div className="vortex-ring vortex-ring-3" />
          {/* Center core */}
          <div className="vortex-core" />
        </div>
      )}
      {/* Expand burst – fullscreen colour wash */}
      {animPhase === 'expand' && (
        <div className="vortex-expand-burst" />
      )}
    </div>
  );
};

export default VortexOverlay;
