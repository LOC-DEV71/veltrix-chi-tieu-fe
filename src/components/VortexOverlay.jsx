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
      
      {/* ─── BG LOADING (Magic Dust) ─── */}
      {animPhase === 'bg-loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="magic-dust-container">
            <div className="magic-dust" />
            <div className="magic-dust" />
            <div className="magic-dust" />
            <div className="magic-core" />
          </div>
          <div className="magic-loading-text">
            {"Đang thiết lập...".split("").map((char, index) => (
              <span key={index} style={{ '--delay': `${index * 0.1}s` }}>
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ─── BG EXPAND (Shards & Shockwave) ─── */}
      {animPhase === 'bg-expand' && (
        <div className="magic-expand-burst">
          <div className="magic-flash" />
          <div className="magic-shockwave" />
          <div className="magic-shockwave delay-1" />
          <div className="magic-shards-container">
            {[...Array(24)].map((_, i) => (
              <div 
                key={i} 
                className={`magic-shard ${i % 2 === 0 ? 'large' : 'small'}`} 
                style={{ '--angle': `${i * 15}deg` }} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VortexOverlay;
