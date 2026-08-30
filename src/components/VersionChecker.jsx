import React, { useEffect, useState } from 'react';
import api from '../services/api';
import './VersionChecker.css';
import { Smartphone, Check, Loader2 } from 'lucide-react';

const VersionChecker = () => {
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);

  // BUILD_TIME được inject tự động bởi Vite mỗi lần build (mỗi lần Vercel deploy)
  // eslint-disable-next-line no-undef
  const MY_BUILD_TIME = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : '0';

  const checkVersion = async (isManual = false) => {
    if (status === 'updating') return;
    try {
      const { data } = await api.get(`/system/version?t=${Date.now()}`);
      const serverTime = data.version; // timestamp khi Render khởi động - deploy mới = restart = timestamp mới

      // Nếu server restart time > thời điểm app được build -> có bản mới trên server
      const hasUpdate = parseInt(serverTime) > parseInt(MY_BUILD_TIME);

      if (hasUpdate) {
        if (!isManual) {
          // Không spam nếu user vừa bấm dismiss
          const dismissed = localStorage.getItem('dismissed_server_time');
          if (dismissed === serverTime) return;
        }
        setStatus('idle');
        setProgress(0);
        setShow(true);
      } else if (isManual) {
        import('sweetalert2').then(Swal => {
           Swal.default.fire({
             title: 'Đã cập nhật',
             text: 'Bạn đang dùng phiên bản mới nhất.',
             icon: 'success',
             background: '#18181b', color: '#fff',
             customClass: { popup: 'glass-panel' }
           });
        });
      }
    } catch (error) {
      console.error('Lỗi khi kiểm tra phiên bản:', error);
    }
  };

  useEffect(() => {
    const successFlag = localStorage.getItem('show_update_success');
    if (successFlag) {
      setStatus('success');
      setShow(true);
      localStorage.removeItem('show_update_success');
      return;
    }

    checkVersion();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };
    
    const handleManualCheck = () => {
       checkVersion(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('MANUAL_VERSION_CHECK', handleManualCheck);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('MANUAL_VERSION_CHECK', handleManualCheck);
    };
  }, []);

  const handleUpdate = () => {
    setStatus('updating');
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 8 + 2;
      if (p >= 95) {
        p = 95;
        clearInterval(interval);
        localStorage.setItem('show_update_success', '1');
        window.location.reload(true);
      }
      setProgress(p);
    }, 1000);
  };

  const handleClose = () => {
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="vc-overlay">
      <div className="vc-modal">
        {status === 'success' ? (
          <>
            <div className="vc-icon-wrap success">
              <Check size={32} />
            </div>
            <h3 className="vc-title">Cập nhật thành công</h3>
            <p className="vc-desc">Ứng dụng đã được tải phiên bản mới nhất.</p>
            <button className="vc-btn outline" onClick={handleClose}>
              Đóng
            </button>
          </>
        ) : (
          <>
            <div className="vc-icon-wrap primary">
              <Smartphone size={32} strokeWidth={1.5} />
            </div>
            <h3 className="vc-title">Có phiên bản mới!</h3>
            <p className="vc-desc">Nhấn cập nhật để tải code mới nhất về thiết bị của bạn.</p>
            
            <button 
              className="vc-btn primary" 
              onClick={handleUpdate}
              disabled={status === 'updating'}
            >
              {status === 'updating' ? (
                <>
                  <Loader2 size={20} className="spin" /> Đang tải...
                </>
              ) : (
                'Cập nhật ngay'
              )}
            </button>
            
            {status === 'updating' && (
              <div className="vc-progress-container">
                <div className="vc-progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VersionChecker;
