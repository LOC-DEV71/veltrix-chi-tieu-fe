import React, { useState, useEffect } from 'react';
import { X, Gift } from 'lucide-react';
import api from '../services/api';
import Swal from 'sweetalert2';
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
      Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: `Nhận phần thưởng ${data.data.reward.name} thành công!`
      });
      
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
          <div className="daily-reward-grid">
            {statusData?.allRewards?.map((reward) => {
              if (!reward.rewardId) return null; // Safeguard for orphaned records
              
              const isClaimed = reward.dayIndex <= statusData.claimedDays;
              const isNext = reward.dayIndex === statusData.claimedDays + 1;
              const isLocked = reward.dayIndex > statusData.claimedDays + 1;
              
              return (
                <div 
                  key={reward._id} 
                  className={`daily-reward-item ${isClaimed ? 'claimed' : ''} ${isNext ? 'next' : ''} ${isLocked ? 'locked' : ''}`}
                >
                  <div className="daily-reward-day">Ngày {reward.dayIndex}</div>
                  <div className="daily-reward-image-wrap">
                    <img src={reward.rewardId.imageUrl} alt={reward.rewardId.name} />
                    {isClaimed && <div className="daily-reward-check-overlay">✓</div>}
                  </div>
                  <p className="daily-reward-name">{reward.rewardId.name}</p>
                  
                  {isNext && (
                    <button 
                      className={`daily-claim-btn small ${!statusData.canClaimToday ? 'disabled' : ''}`}
                      onClick={handleClaim}
                      disabled={!statusData.canClaimToday || claiming}
                    >
                      {claiming ? '...' : statusData.canClaimToday ? 'Nhận' : 'Chờ mai'}
                    </button>
                  )}
                  {isClaimed && <div className="daily-reward-status claimed">Đã nhận</div>}
                  {isLocked && <div className="daily-reward-status locked">Khóa</div>}
                </div>
              );
            })}
            
            {statusData?.allRewards?.length === 0 && (
              <div className="daily-reward-card empty" style={{ gridColumn: '1 / -1' }}>
                <p>🎉 Chúc mừng! Bạn đã nhận toàn bộ phần thưởng hiện có. Hãy chờ thêm nhé!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyLoginModal;
