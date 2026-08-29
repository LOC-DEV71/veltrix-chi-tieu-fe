import React from 'react';
import { Wallet } from 'lucide-react';
import './LoadingScreen.css';

const LoadingScreen = ({ fullScreen = true, text = "Đang tải dữ liệu..." }) => {
  return (
    <div className={`loading-wrapper ${!fullScreen ? 'inline' : ''}`}>
      <div className="loading-ring-container">
        <div className="loading-ring loading-ring-1"></div>
        <div className="loading-ring loading-ring-2"></div>
        <div className="loading-icon-center">
          <Wallet size={24} color="white" strokeWidth={2.5} />
        </div>
      </div>
      {text && <div className="loading-text">{text}</div>}
    </div>
  );
};

export default LoadingScreen;
