import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, Camera, Loader2 } from 'lucide-react';
import api from '../services/api';
import LoadingScreen from '../components/LoadingScreen';
import Swal from 'sweetalert2';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [name, setName] = useState(user?.name || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.avatar || '');
  const [isSaving, setIsSaving] = useState(false);
  
  // Cropper states
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [tempImageUrl, setTempImageUrl] = useState('');
  const [isGif, setIsGif] = useState(false);

  // If user is null initially (page refresh), handle it or show loading
  if (!user) return <LoadingScreen />;

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const isFileGif = file.type === 'image/gif';
      setIsGif(isFileGif);
      
      const objectUrl = URL.createObjectURL(file);
      
      if (isFileGif) {
        // Bypass crop for GIF
        setSelectedFile(file);
        setPreviewUrl(objectUrl);
      } else {
        // Show cropper for static image
        setTempImageUrl(objectUrl);
        setShowCropper(true);
        // Reset cropper
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      }
    }
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    try {
      const croppedImageBlob = await getCroppedImg(
        tempImageUrl,
        croppedAreaPixels
      );
      
      // Convert Blob to File
      const croppedFile = new File([croppedImageBlob], 'avatar.jpg', { type: 'image/jpeg' });
      setSelectedFile(croppedFile);
      setPreviewUrl(URL.createObjectURL(croppedFile));
      setShowCropper(false);
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Không thể cắt ảnh',
        background: '#18181b',
        color: '#fff'
      });
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const formData = new FormData();
      formData.append('name', name);
      if (selectedFile) {
        formData.append('avatar', selectedFile);
      }

      // We use PUT /api/auth/profile
      const { data } = await api.put('/auth/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update AuthContext user state
      updateUser(data);
      
      await Swal.fire({
        icon: 'success',
        title: 'Thành công!',
        text: 'Đã cập nhật hồ sơ thành công!',
        background: '#18181b',
        color: '#fff',
        confirmButtonColor: '#6366f1',
        confirmButtonText: 'Tuyệt vời',
        customClass: {
          popup: 'glass-panel'
        }
      });
      navigate('/settings'); // go back to settings
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMsg = error.response?.data?.message || error.message;
      Swal.fire({
        icon: 'error',
        title: 'Lỗi cập nhật',
        text: `Có lỗi xảy ra: ${errorMsg}`,
        background: '#18181b',
        color: '#fff',
        confirmButtonColor: '#ef4444',
        customClass: {
          popup: 'glass-panel'
        }
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="profile-container">
      
      {/* Dynamic Background Glow */}
      <div 
        style={{
          position: 'absolute',
          top: '-150px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0) 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <div className="profile-header" style={{ position: 'relative', zIndex: 1 }}>
        <button className="profile-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="profile-title">Chỉnh sửa hồ sơ</h1>
      </div>

      <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
        <div className="profile-avatar-section">
          <div className={`profile-avatar-wrapper ${isSaving && selectedFile ? 'saving' : ''}`} onClick={handleAvatarClick}>
            <img 
              src={previewUrl || 'https://ui-avatars.com/api/?name=' + (name || 'U') + '&background=6366f1&color=fff'} 
              alt="Avatar" 
              className="profile-avatar"
            />
            {user?.avatarFrame && (
              <img 
                src={user.avatarFrame} 
                alt="frame" 
                style={{
                  position: 'absolute',
                  top: '-20%', left: '-20%',
                  width: '140%', height: '140%',
                  pointerEvents: 'none',
                  zIndex: 2
                }}
              />
            )}
            <div className="profile-avatar-overlay">
              <Camera size={24} />
            </div>
            {/* The accept="image/*" combined with capture allows mobile to open camera/gallery */}
            <input 
              type="file" 
              accept="image/*,image/gif"
              ref={fileInputRef} 
              className="profile-file-input" 
              onChange={handleFileChange}
            />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Chạm để đổi ảnh</p>
        </div>

        <div className="profile-form">
          <div className="profile-input-group">
            <label className="profile-label">Tên hiển thị</label>
            <input 
              type="text" 
              className="profile-input" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên của bạn"
            />
          </div>

          <div className="profile-input-group">
            <label className="profile-label">Email</label>
            <input 
              type="email" 
              className="profile-input" 
              value={user.email}
              disabled
              title="Không thể thay đổi email"
            />
          </div>

          <button 
          className="btn btn-primary profile-submit-btn" 
          onClick={handleSave} 
          disabled={isSaving || (name === user?.name && !selectedFile)}
        >
          {isSaving ? <Loader2 className="animate-spin" /> : 'Lưu thay đổi'}
        </button>
      </div>
      </div>

      {showCropper && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.9)', zIndex: 9999,
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Cropper
              image={tempImageUrl}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          <div style={{ padding: '20px', background: '#18181b', display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setShowCropper(false)}
              style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#3f3f46', color: '#fff', border: 'none', fontWeight: 600 }}
            >
              Hủy
            </button>
            <button 
              onClick={handleCropSave}
              style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#6366f1', color: '#fff', border: 'none', fontWeight: 600 }}
            >
              Cắt & Chọn
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
