import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import BottomNav from '../components/BottomNav';
import { User, Palette, Globe, Info, LogOut, ChevronRight, Calendar, Moon, Sun, X, Loader2, Image as ImageIcon, Bell, Sparkles, Settings as SettingsIcon, PlaySquare, Hexagon, Lock } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../services/api';
import PinScreen from '../components/PinScreen';
import './Settings.css';

const AVATAR_FRAMES = [
  'ao-giac.png', 'ao-mong-sac-dem.png', 'bach-duong.png', 'buom-tung-bay.png',
  'canh-tien.png', 'cau-vong-vu-tru.png', 'chin-tang-may.png', 'chococat.png',
  'cinnamoroll.png', 'cong-suy-ngam.png', 'dam-may-dong.png', 'do-mo-hoi.png',
  'gian-du.png', 'gio-ke-chuyen.png', 'hello-kitty.png', 'hoa-hong-den.png',
  'hoa-hong-hac-am.png', 'hoa-hong-trang.png', 'hoa-linh-lan.png', 
  'hoa-quang-dien-thach-anh.png', 'hoang-hon-chang-vang.png', 'hoang-hon-xanh-lam.png'
];

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { 
    theme, toggleTheme, isAnimating, 
    triggerBgAnimation, finishBgAnimation, cancelBgAnimation 
  } = useTheme();
  
  const { updateUser } = useAuth();
  
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);

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
      const bgUrl = uploadRes.data.url;
      const res = await api.put('/auth/profile', { customBg: bgUrl });
      updateUser(res.data);
      finishBgAnimation();
    } catch (err) {
      Swal.fire('Lỗi', 'Không thể tải ảnh lên', 'error');
      cancelBgAnimation();
    } finally {
      setIsUploadingBg(false);
    }
  };

  const handleUpdateAvatarFrame = async (frameUrl) => {
    try {
      const res = await api.put('/auth/profile', { avatarFrame: frameUrl === null ? 'null' : frameUrl });
      updateUser(res.data);
    } catch (err) {
      console.error('Lỗi khi lưu khung đại diện:', err);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Không thể lưu khung đại diện',
        background: '#18181b',
        color: '#fff'
      });
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

  const handleCheckVersion = async () => {
    try {
      const res = await api.get('/system/version');
      const serverVersion = res.data.version;
      const currentVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';
      if (serverVersion !== currentVersion) {
        Swal.fire({
          title: 'Cập nhật phiên bản mới',
          text: `Đã có phiên bản ${serverVersion}. Phiên bản của bạn là ${currentVersion}.`,
          icon: 'info',
          showCancelButton: true,
          confirmButtonText: 'Cập nhật ngay',
          cancelButtonText: 'Để sau',
          background: '#18181b', color: '#fff',
          customClass: { popup: 'glass-panel' }
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.reload(true);
          }
        });
      } else {
        Swal.fire({
          icon: 'success',
          title: 'Đã cập nhật',
          text: 'Bạn đang sử dụng phiên bản mới nhất.',
          background: '#18181b', color: '#fff',
          customClass: { popup: 'glass-panel' }
        });
      }
    } catch (err) {
      Swal.fire('Lỗi', 'Không thể kiểm tra phiên bản', 'error');
    }
  };

  const handleTogglePin = async () => {
    if (user?.hasPin) {
      const result = await Swal.fire({
        title: 'Tắt mã PIN?',
        text: 'Bạn sẽ không cần nhập mã PIN mỗi khi mở app hay giao dịch nữa. Tuy nhiên điều này sẽ làm giảm bảo mật.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonText: 'Hủy',
        confirmButtonText: 'Tắt mã PIN',
        background: '#18181b', color: '#fff',
        customClass: { popup: 'glass-panel' }
      });

      if (result.isConfirmed) {
        try {
          await api.post('/auth/remove-pin');
          updateUser({ ...user, hasPin: false });
          Swal.fire({
            icon: 'success',
            title: 'Thành công',
            text: 'Đã tắt mã PIN',
            background: '#18181b', color: '#fff',
            customClass: { popup: 'glass-panel' }
          });
        } catch (err) {
          Swal.fire('Lỗi', 'Không thể tắt mã PIN', 'error');
        }
      }
    } else {
      setShowPinSetup(true);
    }
  };

  return (
    <>
      {showPinSetup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99999 }}>
          <PinScreen 
            mode="setup"
            onSuccess={() => setShowPinSetup(false)}
            onCancel={() => setShowPinSetup(false)} 
          />
        </div>
      )}
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

          <div className="settings-row">
            <div className="settings-row-left">
              <div className="settings-icon-wrapper" style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}>
                <ImageIcon size={20} color="#fff" />
              </div>
              <span className="settings-label">Hình nền mờ</span>
            </div>
            <div className="settings-value" style={{ display: 'flex', alignItems: 'center' }}>
              {isUploadingBg ? (
                <Loader2 size={18} className="animate-spin" style={{ color: 'var(--text-secondary)' }} />
              ) : (
                <>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{user?.customBg ? 'Đã đổi' : 'Mặc định'}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleBgChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {user?.customBg && (
                    <button 
                      onClick={async (e) => { 
                        e.stopPropagation(); 
                        try {
                          const res = await api.put('/auth/profile', { customBg: 'null' });
                          updateUser(res.data);
                        } catch(err) { Swal.fire('Lỗi', 'Không thể xóa hình nền', 'error'); }
                      }}
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
          
          <div className="settings-row" onClick={() => setShowAdvancedModal(true)}>
            <div className="settings-row-left">
              <div className="settings-icon-wrapper" style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
                <SettingsIcon size={20} color="#fff" />
              </div>
              <span className="settings-label" style={{ fontWeight: 600, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Cài đặt nâng cao
              </span>
            </div>
            <div className="settings-value">
              <ChevronRight size={18} className="settings-arrow" />
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

          <div className="settings-row" onClick={handleTogglePin}>
            <div className="settings-row-left">
              <div className="settings-icon-wrapper purple">
                <Lock size={20} />
              </div>
              <span className="settings-label">Bảo mật mã PIN</span>
            </div>
            <div className="settings-value">
              <span>{user?.hasPin ? 'Đang bật' : 'Đã tắt'}</span>
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
          
          <div className="settings-row" onClick={handleCheckVersion}>
            <div className="settings-row-left">
              <div className="settings-icon-wrapper gray">
                <Info size={20} />
              </div>
              <span className="settings-label">Phiên bản</span>
            </div>
            <div className="settings-value">
              <span>v{import.meta.env.VITE_APP_VERSION || '1.0.0'}</span>
              <ChevronRight size={18} className="settings-arrow" />
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

      {/* Advanced Settings Modal */}
      {showAdvancedModal && (
        <div style={{
          position: 'fixed', top: 0, bottom: 0,
          left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: '480px',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex', flexDirection: 'column',
          zIndex: 9999,
          padding: '24px 20px',
          paddingTop: 'max(24px, env(safe-area-inset-top))',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={24} color="#f59e0b" /> Cài đặt nâng cao
            </h2>
            <button 
              onClick={() => setShowAdvancedModal(false)}
              style={{ background: 'var(--bg-glass)', border: 'var(--glass-border)', borderRadius: '50%', padding: '8px', color: 'white' }}
            >
              <X size={20} />
            </button>
          </div>

          <div className="glass-panel" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PlaySquare size={20} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0' }}>Hình nền động</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Hỗ trợ MP4, GIF. Sẽ tự động lặp lại (Loop) dưới nền.</p>
              </div>
            </div>
            
            {isUploadingBg ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Loader2 size={32} className="animate-spin" style={{ color: '#f59e0b', margin: '0 auto' }} />
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '12px' }}>Đang tải lên...</p>
              </div>
            ) : (
              <label style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                width: '100%', padding: '14px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px dashed rgba(245, 158, 11, 0.5)',
                borderRadius: '12px',
                color: '#fbbf24',
                fontWeight: 600,
                cursor: 'pointer'
              }}>
                <ImageIcon size={18} />
                <span>{user?.customBg ? 'Thay đổi hình nền động' : 'Tải lên Video/GIF'}</span>
                <input 
                  type="file" 
                  accept="image/*,video/mp4,video/webm,video/quicktime,.mov,image/gif" 
                  onChange={handleBgChange}
                  style={{ display: 'none' }}
                />
              </label>
            )}
            
            {user?.customBg && !isUploadingBg && (
              <button 
                onClick={async () => {
                  try {
                    const res = await api.put('/auth/profile', { customBg: 'null' });
                    updateUser(res.data);
                  } catch(err) { Swal.fire('Lỗi', 'Không thể xóa hình nền', 'error'); }
                }}
                style={{
                  width: '100%', padding: '12px', marginTop: '12px',
                  background: 'none', border: 'none',
                  color: 'var(--accent-danger)', fontWeight: 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <X size={16} /> Gỡ bỏ hình nền hiện tại
              </button>
            )}
          </div>
          
          {/* Avatar Frames Selection */}
          <div className="glass-panel" style={{ padding: '16px', marginTop: '16px', marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Hexagon size={20} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0' }}>Khung đại diện động</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Chọn khung để làm nổi bật Avatar của bạn.</p>
              </div>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, 1fr)', 
              gap: '12px',
              maxHeight: '300px',
              overflowY: 'auto',
              padding: '4px'
            }}>
              <div 
                onClick={() => handleUpdateAvatarFrame(null)}
                style={{ 
                  aspectRatio: '1', borderRadius: '50%', 
                  background: 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  border: !user?.avatarFrame ? '2px solid #10b981' : '2px solid transparent'
                }}
              >
                <X size={24} color="var(--text-secondary)" />
              </div>
              
              {AVATAR_FRAMES.map(frame => (
                <div 
                  key={frame}
                  onClick={() => handleUpdateAvatarFrame(frame)}
                  style={{
                    aspectRatio: '1', borderRadius: '50%',
                    background: '#000',
                    cursor: 'pointer',
                    position: 'relative',
                    border: user?.avatarFrame === frame ? '2px solid #10b981' : '2px solid transparent'
                  }}
                >
                  <img src={`/${frame}`} alt={frame} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
    </>
  );
};

export default Settings;
