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
                  <div key={f._id} className="friend-item">
                    {f.avatar ? (
                      <img src={f.avatar} alt="Avatar" className="f-avatar" />
                    ) : (
                      <div className="f-avatar-placeholder">{f.name.charAt(0)}</div>
                    )}
                    <div className="f-info">
                      <div className="f-name">{f.name}</div>
                      <div className="f-email">{f.email}</div>
                    </div>
                    <button className="remove-btn" onClick={() => removeFriend(f._id)}>✕</button>
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
                  <div key={u._id} className="friend-item">
                    {u.avatar ? (
                      <img src={u.avatar} alt="Avatar" className="f-avatar" />
                    ) : (
                      <div className="f-avatar-placeholder">{u.name.charAt(0)}</div>
                    )}
                    <div className="f-info">
                      <div className="f-name">{u.name}</div>
                      <div className="f-email">{u.email}</div>
                    </div>
                    <button className="add-btn" onClick={() => sendRequest(u._id)}>Kết bạn</button>
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
                  <div key={req._id} className="friend-item">
                    {req.sender?.avatar ? (
                      <img src={req.sender.avatar} alt="Avatar" className="f-avatar" />
                    ) : (
                      <div className="f-avatar-placeholder">{req.sender?.name?.charAt(0)}</div>
                    )}
                    <div className="f-info">
                      <div className="f-name">{req.sender?.name}</div>
                      <div className="f-email">muốn kết bạn với bạn</div>
                    </div>
                    <div className="action-btns">
                      <button className="accept-btn" onClick={() => respondRequest(req._id, 'accept')}>Đồng ý</button>
                      <button className="reject-btn" onClick={() => respondRequest(req._id, 'reject')}>Từ chối</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendsModal;
