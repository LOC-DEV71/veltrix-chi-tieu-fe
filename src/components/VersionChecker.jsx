import React, { useEffect, useState } from 'react';
import api from '../services/api';
import './VersionChecker.css';
import { Smartphone, Check, Loader2 } from 'lucide-react';
import versionData from '../version.json';

const VersionChecker = () => {
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, updating, success
  const [serverVer, setServerVer] = useState('');
  const [localVer, setLocalVer] = useState('');
  const [progress, setProgress] = useState(0);

  const checkVersion = async (isManual = false) => {
    if (status === 'updating') return;
    try {
      const { data } = await api.get(`/system/version?t=${Date.now()}`);
      const sVer = data.version;
      const lVer = versionData.version;

      setServerVer(sVer);
      setLocalVer(lVer);

      if (sVer !== lVer) {
        if (!isManual) {
          const updatingTo = localStorage.getItem('updating_to_version');
          const updatingTime = localStorage.getItem('updating_time');
          
          if (updatingTo === sVer && updatingTime) {
            const timePassed = Date.now() - parseInt(updatingTime);
            if (timePassed < 3 * 60 * 1000) {
              return;
            } else {
              localStorage.removeItem('updating_to_version');
              localStorage.removeItem('updating_time');
            }
          }
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
    const successVer = localStorage.getItem('show_update_success');
    if (successVer) {
      const lVer = versionData.version;
      if (lVer === successVer) {
        setServerVer(successVer);
        setStatus('success');
        setShow(true);
      }
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
    localStorage.setItem('updating_to_version', serverVer);
    localStorage.setItem('updating_time', Date.now().toString());
    
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 8 + 2; // Tang ngau nhien
      if (p >= 95) {
        p = 95;
        clearInterval(interval);
        localStorage.setItem('show_update_success', serverVer);
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
            <div className="vc-badge success">v{serverVer}</div>
            <p className="vc-desc">Ứng dụng đã được cập nhật lên phiên bản mới nhất.</p>
            <button className="vc-btn outline" onClick={handleClose}>
              Đóng
            </button>
          </>
        ) : (
          <>
            <div className="vc-icon-wrap primary">
              <Smartphone size={32} strokeWidth={1.5} />
            </div>
            <h3 className="vc-title">Cập nhật phiên bản mới</h3>
            <div className="vc-badge primary">v{serverVer}</div>
            <p className="vc-desc">Vui lòng nhấn cập nhật để tải phiên bản mới nhất.</p>
            
            <button 
              className="vc-btn primary" 
              onClick={handleUpdate}
              disabled={status === 'updating'}
            >
              {status === 'updating' ? (
                <>
                  <Loader2 size={20} className="spin" /> Đang cập nhật...
                </>
              ) : (
                'Cập nhật'
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
