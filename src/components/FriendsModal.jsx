import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import './FriendsModal.css';

const FriendsModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'search', 'requests'
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [myFriendId, setMyFriendId] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedFriendProfile, setSelectedFriendProfile] = useState(null);

  // Drag to dismiss state
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(null);

  useEffect(() => {
    fetchMyId();
    if (activeTab === 'friends') fetchFriends();
    if (activeTab === 'requests') fetchRequests();
  }, [activeTab]);

  const fetchMyId = async () => {
    try {
      const res = await api.get('/friends/me');
      setMyFriendId(res.data.friendId);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const res = await api.get('/friends');
      setFriends(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/friends/requests');
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await api.get(`/friends/search?q=${searchQuery}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const sendRequest = async (userId) => {
    try {
      await api.post('/friends/request', { receiverId: userId });
      Swal.fire({
        title: 'Thành công!',
        text: 'Đã gửi lời mời kết bạn!',
        icon: 'success',
        confirmButtonColor: '#fbbf24',
        background: 'var(--bg-secondary)',
        color: 'var(--text-primary)'
      });
    } catch (err) {
      Swal.fire({
        title: 'Lỗi',
        text: err.response?.data?.message || 'Lỗi gửi lời mời',
        icon: 'error',
        confirmButtonColor: '#ef4444',
        background: 'var(--bg-secondary)',
        color: 'var(--text-primary)'
      });
    }
  };

  const respondRequest = async (reqId, action) => {
    try {
      await api.put(`/friends/request/${reqId}`, { action });
      fetchRequests(); // refresh list
      if (action === 'accept') {
        Swal.fire({
          title: 'Thành công!',
          text: 'Đã kết bạn thành công!',
          icon: 'success',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)'
        });
      }
    } catch (err) {
      Swal.fire({
        title: 'Lỗi',
        text: err.response?.data?.message || 'Lỗi hệ thống',
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        background: 'var(--bg-secondary)',
        color: 'var(--text-primary)'
      });
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(myFriendId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const removeFriend = async (friendId) => {
    const result = await Swal.fire({
      title: 'Hủy kết bạn?',
      text: 'Bạn có chắc chắn muốn hủy kết bạn với người này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#333',
      confirmButtonText: 'Đồng ý hủy',
      cancelButtonText: 'Hủy',
      background: 'var(--bg-secondary)',
      color: 'var(--text-primary)'
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/friends/${friendId}`);
      setFriends(friends.filter(f => f._id !== friendId));
    } catch (err) {
      Swal.fire({
        title: 'Lỗi',
        text: err.response?.data?.message || 'Lỗi hủy kết bạn',
        icon: 'error',
        background: 'var(--bg-secondary)',
        color: 'var(--text-primary)'
      });
    }
  };

  const shareLink = () => {
    const domain = import.meta.env.VITE_DOMAIN_URL || 'http://localhost:5173';
    const link = `${domain}/add-friend/${myFriendId}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Kết bạn với tôi trên App Chi Tiêu',
        text: 'Nhấn vào link để kết bạn và xem khoảnh khắc của tôi nhé!',
        url: link,
      }).catch(err => console.error('Share failed:', err));
    } else {
      navigator.clipboard.writeText(link);
      Swal.fire({
        title: 'Thành công',
        text: 'Đã copy link kết bạn vào khay nhớ tạm!',
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        background: 'var(--bg-secondary)',
        color: 'var(--text-primary)'
      });
    }
  };

  // Drag Handlers
  const handlePointerDown = (e) => {
    setIsDragging(true);
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setStartY(clientY);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || startY === null) return;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - startY;
    if (deltaY > 0) {
      setOffsetY(deltaY);
    }
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (offsetY > 120) {
      onClose();
    } else {
      setOffsetY(0);
    }
    setStartY(null);
  };

  return (
    <div className="friends-modal-overlay" onClick={onClose}>
      {selectedFriendProfile ? (
        <div 
          className="friend-profile-modal" 
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: '480px', height: '100%',
            background: 'var(--bg-primary)',
            position: 'relative',
            display: 'flex', flexDirection: 'column'
          }}
        >
          {/* Background Layer with Opacity */}
          {selectedFriendProfile.customBg && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              opacity: 0.2, zIndex: 0, pointerEvents: 'none', overflow: 'hidden'
            }}>
              {selectedFriendProfile.customBg.includes('/video/upload/') || selectedFriendProfile.customBg.match(/\.(mp4|webm|mov)$/i) ? (
                <video 
                  src={selectedFriendProfile.customBg} 
                  autoPlay loop muted playsInline 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div 
                  style={{ 
                    width: '100%', height: '100%', 
                    backgroundImage: `url(${selectedFriendProfile.customBg})`, 
                    backgroundSize: 'cover', backgroundPosition: 'center' 
                  }} 
                />
              )}
            </div>
          )}
          
          <div style={{ position: 'relative', zIndex: 1, padding: '20px', paddingTop: 'calc(20px + env(safe-area-inset-top))' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
              <button onClick={() => setSelectedFriendProfile(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <h3 style={{ flex: 1, textAlign: 'center', margin: 0, color: '#fff', fontSize: '18px', marginRight: '40px' }}>Hồ sơ người dùng</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '20px' }}>
                {selectedFriendProfile.avatar ? (
                  <img src={selectedFriendProfile.avatar} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: '#fff', fontWeight: 'bold' }}>
                    {selectedFriendProfile.name?.charAt(0) || '?'}
                  </div>
                )}
                {selectedFriendProfile.avatarFrame && (
                  <img src={selectedFriendProfile.avatarFrame} alt="frame" style={{ position: 'absolute', top: '-20%', left: '-20%', width: '140%', height: '140%', pointerEvents: 'none', zIndex: 2 }} />
                )}
              </div>
              <h2 style={{ margin: 0, color: '#fff', fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>{selectedFriendProfile.name}</h2>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>{selectedFriendProfile.email}</p>
              
              <div style={{ width: '100%', maxWidth: '300px', marginTop: '40px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '4px' }}>Tên hiển thị</div>
                  <div style={{ color: '#fff', fontSize: '16px' }}>{selectedFriendProfile.name}</div>
                </div>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '4px' }}>Email</div>
                  <div style={{ color: '#fff', fontSize: '16px' }}>{selectedFriendProfile.email}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
      <div 
        className="friends-modal" 
        onClick={e => e.stopPropagation()}
        style={{ 
          transform: `translateY(${offsetY}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.1, 0.9, 0.2, 1)'
        }}
      >
        <div 
          className="drag-area"
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
        >
          <div className="drag-handle-wrapper">
            <div className="drag-handle"></div>
          </div>
          <div className="friends-modal-header">
            <h3>Bạn bè</h3>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="friends-tabs">
          <div 
            className={`friends-tab ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            Danh sách
          </div>
          <div 
            className={`friends-tab ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            Tìm bạn
          </div>
          <div 
            className={`friends-tab ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            Lời mời {requests.length > 0 && <span className="badge">{requests.length}</span>}
          </div>
        </div>

        <div className="friends-content">
          {loading && <div className="loading-text">Đang tải...</div>}

          {/* TAB 1: Danh sách */}
          {activeTab === 'friends' && !loading && (
            <div className="friends-list">
              {friends.length === 0 ? (
                <div className="empty-state">Bạn chưa có người bạn nào. Hãy qua mục "Tìm bạn" nhé!</div>
              ) : (
                friends.map(f => (
                  <div key={f._id} className="friend-item" onClick={() => setSelectedFriendProfile(f)}>
                    <div style={{ position: 'relative', width: '44px', height: '44px', flexShrink: 0 }}>
                      {f.avatar ? (
                        <img src={f.avatar} alt="Avatar" className="f-avatar" />
                      ) : (
                        <div className="f-avatar-placeholder">{f.name.charAt(0)}</div>
                      )}
                      {f.avatarFrame && (
                        <img src={f.avatarFrame} alt="frame" style={{ position: 'absolute', top: '-20%', left: '-20%', width: '140%', height: '140%', pointerEvents: 'none', zIndex: 2 }} />
                      )}
                    </div>
                    <div className="f-info">
                      <div className="f-name">{f.name}</div>
                      <div className="f-email">{f.email}</div>
                    </div>
                    <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeFriend(f._id); }}>✕</button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: Tìm bạn */}
          {activeTab === 'search' && (
            <div className="friends-search">
              <div className="my-id-card">
                <div style={{ flex: 1 }}>
                  Mã kết bạn của bạn:<br/>
                  <strong>{myFriendId}</strong>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="copy-btn" onClick={copyId}>
                    {copied ? 'Đã copy!' : 'Copy Mã'}
                  </button>
                  <button className="share-btn" onClick={shareLink}>
                    Chia sẻ Link
                  </button>
                </div>
              </div>
              <form onSubmit={handleSearch} className="search-form">
                <input 
                  type="text" 
                  placeholder="Nhập Email hoặc Mã (VD: A4F9E2)..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <button type="submit">Tìm</button>
              </form>
              <div className="search-results">
                {!loading && searchResults.map(u => (
                  <div key={u._id} className="friend-item" onClick={() => setSelectedFriendProfile(u)}>
                    <div style={{ position: 'relative', width: '44px', height: '44px', flexShrink: 0 }}>
                      {u.avatar ? (
                        <img src={u.avatar} alt="Avatar" className="f-avatar" />
                      ) : (
                        <div className="f-avatar-placeholder">{u.name.charAt(0)}</div>
                      )}
                      {u.avatarFrame && (
                        <img src={u.avatarFrame} alt="frame" style={{ position: 'absolute', top: '-20%', left: '-20%', width: '140%', height: '140%', pointerEvents: 'none', zIndex: 2 }} />
                      )}
                    </div>
                    <div className="f-info">
                      <div className="f-name">{u.name}</div>
                      <div className="f-email">{u.email}</div>
                    </div>
                    <button className="add-btn" onClick={(e) => { e.stopPropagation(); sendRequest(u._id); }}>Kết bạn</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Lời mời */}
          {activeTab === 'requests' && !loading && (
            <div className="friends-requests">
              {requests.length === 0 ? (
                <div className="empty-state">Không có lời mời nào.</div>
              ) : (
                requests.map(req => (
                  <div key={req._id} className="friend-item" onClick={() => setSelectedFriendProfile(req.sender)}>
                    <div style={{ position: 'relative', width: '44px', height: '44px', flexShrink: 0 }}>
                      {req.sender?.avatar ? (
                        <img src={req.sender.avatar} alt="Avatar" className="f-avatar" />
                      ) : (
                        <div className="f-avatar-placeholder">{req.sender?.name?.charAt(0)}</div>
                      )}
                      {req.sender?.avatarFrame && (
                        <img src={req.sender.avatarFrame} alt="frame" style={{ position: 'absolute', top: '-20%', left: '-20%', width: '140%', height: '140%', pointerEvents: 'none', zIndex: 2 }} />
                      )}
                    </div>
                    <div className="f-info">
                      <div className="f-name">{req.sender?.name}</div>
                      <div className="f-email">muốn kết bạn với bạn</div>
                    </div>
                    <div className="action-btns">
                      <button className="accept-btn" onClick={(e) => { e.stopPropagation(); respondRequest(req._id, 'accept'); }}>Đồng ý</button>
                      <button className="reject-btn" onClick={(e) => { e.stopPropagation(); respondRequest(req._id, 'reject'); }}>Từ chối</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default FriendsModal;
