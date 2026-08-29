import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './AddFriend.css';

const AddFriend = () => {
  const { id } = useParams(); // This is the friendId
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [friendUser, setFriendUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState(''); // 'pending', 'success', 'error'

  useEffect(() => {
    // If not logged in, wait or redirect to login (auth context should handle this normally)
    // But since this might be a public link, let's fetch basic info anyway. 
    // Wait, /api/friends/search is protected. 
    // Let's create a public endpoint or just use the protected one and assume they must login first.
    // Assuming the user must be logged in to view AddFriend page:
    if (!user) {
      // Need to login first to send request
      // Can't do anything here, rely on ProtectedRoute to redirect to /login
      return;
    }

    const fetchFriendInfo = async () => {
      try {
        // search returns an array, we find the exact match
        const res = await api.get(`/friends/search?q=${id}`);
        const found = res.data.find(u => u.friendId === id);
        if (found) {
          setFriendUser(found);
        } else {
          setError('Không tìm thấy người dùng này hoặc mã đã thay đổi.');
        }
      } catch (err) {
        setError('Lỗi khi tải thông tin. Vui lòng thử lại.');
      }
      setLoading(false);
    };

    fetchFriendInfo();
  }, [id, user]);

  const handleAddFriend = async () => {
    setStatus('pending');
    try {
      await api.post('/friends/request', { receiverId: friendUser._id });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.message || 'Không thể gửi lời mời.');
    }
  };

  if (loading) return <div className="add-friend-container"><div className="loading">Đang tải...</div></div>;

  return (
    <div className="add-friend-container">
      <div className="add-friend-card">
        {error ? (
          <div className="error-message">
            <p>{error}</p>
            <button className="back-btn" onClick={() => navigate('/')}>Về trang chủ</button>
          </div>
        ) : (
          <>
            <h2>Yêu cầu kết bạn</h2>
            <div className="friend-profile">
              {friendUser.avatar ? (
                <img src={friendUser.avatar} alt={friendUser.name} className="large-avatar" />
              ) : (
                <div className="large-avatar-placeholder">{friendUser.name.charAt(0)}</div>
              )}
              <h3>{friendUser.name}</h3>
              <p>Muốn kết bạn với bạn để cùng quản lý chi tiêu và chia sẻ khoảnh khắc.</p>
            </div>

            {status === 'success' ? (
              <div className="success-message">
                Đã gửi lời mời thành công! Chờ người đó đồng ý nhé.
                <button className="back-btn mt-3" onClick={() => navigate('/')}>Về trang chủ</button>
              </div>
            ) : (
              <div className="action-buttons">
                <button 
                  className="add-btn-large" 
                  onClick={handleAddFriend}
                  disabled={status === 'pending'}
                >
                  {status === 'pending' ? 'Đang gửi...' : 'Gửi lời mời kết bạn'}
                </button>
                <button className="cancel-btn" onClick={() => navigate('/')}>Để sau</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AddFriend;
