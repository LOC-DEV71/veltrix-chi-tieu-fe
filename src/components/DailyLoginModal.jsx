import React, { useState, useEffect } from 'react';
import { X, Gift } from 'lucide-react';
import api from '../services/api';
import './DailyLoginModal.css';

const DailyLoginModal = ({ onClose, forceShow = false }) => {
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [show, setShow] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data } = await api.get('/rewards/daily/status');
        setStatusData(data.data);
        
        // Check local storage for 12h cooldown
        const lastDismissed = localStorage.getItem('daily_reward_dismissed');
        const now = Date.now();
        
        // Show if forced, or if can claim today, or if 12h passed
        if (
          forceShow || 
          data.data.canClaimToday || 
          !lastDismissed || 
          (now - parseInt(lastDismissed) > 12 * 60 * 60 * 1000)
        ) {
          setShow(true);
        }
      } catch (err) {
        console.error('Error fetching reward status:', err);
        setError('Không thể tải thông tin điểm danh');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStatus();
  }, [forceShow]);

  const handleClose = () => {
    localStorage.setItem('daily_reward_dismissed', Date.now().toString());
    setShow(false);
    if (onClose) onClose();
  };

  const handleClaim = async () => {
    try {
      setClaiming(true);
      const { data } = await api.post('/rewards/daily/claim');
      
      // Show success animation or toast here if needed
      alert('Nhận phần thưởng thành công! ' + data.data.reward.name);
      
      // Update status locally
      setStatusData({
        ...statusData,
        canClaimToday: false,
        claimedDays: data.data.claimedDays
      });
      
    } catch (err) {
      console.error('Error claiming reward:', err);
      alert(err.response?.data?.message || 'Lỗi khi nhận thưởng');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) return null; // Or a small spinner overlay
  if (!show) return null;

  return (
    <div className="daily-modal-overlay" onClick={handleClose}>
      <div className="daily-modal-content" onClick={e => e.stopPropagation()}>
        <button className="daily-modal-close" onClick={handleClose}>
          <X size={20} />
        </button>
        
        <div className="daily-modal-header">
          <div className="daily-modal-icon-wrap">
            <Gift size={32} />
          </div>
          <h2>Điểm danh hàng ngày</h2>
          <p>
            Tiến độ: <strong>{statusData?.claimedDays || 0}</strong> / {statusData?.totalRewards || 0} ngày
          </p>
        </div>
        
        <div className="daily-modal-body">
          {statusData?.nextReward ? (
            <div className="daily-reward-card">
              <h3>Ngày {statusData.claimedDays + 1}</h3>
              <div className="daily-reward-image-wrap">
                <img src={`/${statusData.nextReward.rewardId.imageUrl}`} alt="Reward" />
              </div>
              <p className="daily-reward-name">{statusData.nextReward.rewardId.name}</p>
              
              <button 
                className={`daily-claim-btn ${!statusData.canClaimToday ? 'disabled' : ''}`}
                onClick={handleClaim}
                disabled={!statusData.canClaimToday || claiming}
              >
                {claiming ? 'Đang nhận...' : statusData.canClaimToday ? 'Nhận thưởng ngay' : 'Hôm nay đã nhận'}
              </button>
            </div>
          ) : (
            <div className="daily-reward-card empty">
              <p>🎉 Chúc mừng! Bạn đã nhận toàn bộ phần thưởng hiện có. Hãy chờ thêm nhé!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyLoginModal;
