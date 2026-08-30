import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import BottomNav from '../components/BottomNav';
import { User, Palette, Globe, Info, LogOut, ChevronRight, Calendar, Moon, Sun, X, Loader2, Image as ImageIcon, Bell, Sparkles } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../services/api';
import './Settings.css';

const Settings = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isAnimating, customBg, updateCustomBg, triggerBgAnimation, finishBgAnimation, cancelBgAnimation } = useTheme();
  const navigate = useNavigate();
  const [isUploadingBg, setIsUploadingBg] = React.useState(false);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Đăng xuất?',
      text: 'Bạn có chắc chắn muốn đăng xuất không?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: 'rgba(255, 255, 255, 0.1)',
      confirmButtonText: 'Đăng xuất',
      cancelButtonText: 'Hủy',
      background: '#18181b',
      color: '#fff',
      customClass: {
        popup: 'glass-panel'
      }
    });

    if (result.isConfirmed) {
      await logout();
      navigate('/login');
    }
  };

  const handlePlaceholderClick = (featureName) => {
    Swal.fire({
      icon: 'info',
      title: 'Đang phát triển',
      text: `Tính năng ${featureName} đang được xây dựng!`,
      background: '#18181b',
      color: '#fff',
      confirmButtonColor: '#6366f1',
      customClass: {
        popup: 'glass-panel'
      }
    });
  };

  const handleBgChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploadingBg(true);
      triggerBgAnimation();
      const formData = new FormData();
      formData.append('image', file);
      const uploadRes = await api.post('/uploads/receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateCustomBg(uploadRes.data.url);
      finishBgAnimation();
    } catch (err) {
      Swal.fire('Lỗi', 'Không thể tải ảnh lên', 'error');
      cancelBgAnimation();
    } finally {
      setIsUploadingBg(false);
    }
  };

  const handleEnablePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      Swal.fire('Không hỗ trợ', 'Trình duyệt của bạn không hỗ trợ nhận thông báo.', 'warning');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        
        // Helper
        const urlBase64ToUint8Array = (base64String) => {
          const padding = '='.repeat((4 - base64String.length % 4) % 4);
          const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
          const rawData = window.atob(base64);
          const outputArray = new Uint8Array(rawData.length);
          for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
          }
          return outputArray;
        };

        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub) {
          await existingSub.unsubscribe();
        }

        const newSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
        });

        await api.post('/notifications/subscribe', newSubscription.toJSON());
        
        Swal.fire({
          icon: 'success',
          title: 'Thành công!',
          text: 'Đã bật thông báo thành công! Bây giờ bạn sẽ nhận được thông báo từ ứng dụng.',
          background: '#18181b', color: '#fff',
          confirmButtonColor: '#10b981',
          customClass: { popup: 'glass-panel' }
        });
      } else {
        Swal.fire('Từ chối', 'Bạn đã từ chối cấp quyền gửi thông báo.', 'error');
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Lỗi', 'Có lỗi xảy ra khi cài đặt thông báo.', 'error');
    }
  };

  return (
    <div className="settings-container">
      {/* Dynamic Background Glow */}
      <div 
        style={{
          position: 'absolute',
          top: '-150px',
          left: '-150px',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0) 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <div className="settings-header" style={{ position: 'relative', zIndex: 1 }}>
        <h1 className="settings-title">Cài đặt</h1>
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Account Group */}
        <div className="settings-group">
          <div className="settings-group-title">Tài khoản</div>
          
          <div className="settings-row" onClick={() => navigate('/profile')}>
            <div className="settings-row-left">
              <div className="settings-icon-wrapper blue">
                <User size={20} />
              </div>
              <span className="settings-label">Hồ sơ của tôi</span>
            </div>
            <div className="settings-value">
              <span>{user?.name || 'Người dùng'}</span>
              <ChevronRight size={18} className="settings-arrow" />
            </div>
          </div>
        </div>

        {/* Preferences Group */}
        <div className="settings-group">
          <div className="settings-group-title">Tùy chỉnh</div>
          
          <div
            className="settings-row"
            onClick={toggleTheme}
            style={{ cursor: isAnimating ? 'wait' : 'pointer', opacity: isAnimating ? 0.7 : 1 }}
          >
            <div className="settings-row-left">
              <div className="settings-icon-wrapper purple">
                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
              </div>
              <span className="settings-label">Giao diện</span>
            </div>
            <div className="settings-value">
              <span>{theme === 'dark' ? 'Tối (Dark)' : 'Sáng (Light)'}</span>
              <ChevronRight size={18} className="settings-arrow" />
            </div>
          </div>

        {/* Premium Group */}
        <div className="settings-group" style={{ position: 'relative' }}>
          <div className="settings-group-title" style={{ 
            background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Sparkles size={14} color="#fbbf24" /> Đặc quyền (Premium)
          </div>
          
          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-icon-wrapper" style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
                <ImageIcon size={20} color="#fff" />
              </div>
              <span className="settings-label">Hình nền động (Video/GIF)</span>
            </div>
            <div className="settings-value" style={{ display: 'flex', alignItems: 'center' }}>
              {isUploadingBg ? (
                <Loader2 size={18} className="animate-spin" style={{ color: 'var(--text-secondary)' }} />
              ) : (
                <>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{customBg ? 'Đã đổi' : 'Tải lên'}</span>
                    <input 
                      type="file" 
                      accept="image/*,video/mp4,video/webm,image/gif" 
                      onChange={handleBgChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {customBg && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); updateCustomBg(null); }}
                      style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', marginLeft: '8px', color: 'var(--accent-danger)' }}
                      title="Xóa hình nền"
                    >
                      <X size={16} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

          <div className="settings-row" onClick={() => handlePlaceholderClick('Đổi ngôn ngữ')}>
            <div className="settings-row-left">
              <div className="settings-icon-wrapper green">
                <Globe size={20} />
              </div>
              <span className="settings-label">Ngôn ngữ</span>
            </div>
            <div className="settings-value">
              <span>Tiếng Việt</span>
              <ChevronRight size={18} className="settings-arrow" />
            </div>
          </div>
        </div>

        {/* System Group */}
        <div className="settings-group">
          <div className="settings-group-title">Hệ thống</div>

          <div className="settings-row" onClick={handleEnablePush}>
            <div className="settings-row-left">
              <div className="settings-icon-wrapper yellow">
                <Bell size={20} />
              </div>
              <span className="settings-label">Bật thông báo đẩy</span>
            </div>
            <div className="settings-value">
              <ChevronRight size={18} className="settings-arrow" />
            </div>
          </div>

          {user?.createdAt && (
            <div className="settings-row">
              <div className="settings-row-left">
                <div className="settings-icon-wrapper blue">
                  <Calendar size={20} />
                </div>
                <span className="settings-label">Ngày tham gia</span>
              </div>
              <div className="settings-value">
                <span>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          )}
          
          <div className="settings-row" onClick={() => handlePlaceholderClick('Thông tin phiên bản')}>
            <div className="settings-row-left">
              <div className="settings-icon-wrapper gray">
                <Info size={20} />
              </div>
              <span className="settings-label">Phiên bản</span>
            </div>
            <div className="settings-value">
              <span>v1.0.0</span>
            </div>
          </div>

          <div className="settings-row" onClick={handleLogout}>
            <div className="settings-row-left">
              <div className="settings-icon-wrapper red">
                <LogOut size={20} />
              </div>
              <span className="settings-label" style={{ color: 'var(--accent-danger)' }}>Đăng xuất</span>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Settings;
