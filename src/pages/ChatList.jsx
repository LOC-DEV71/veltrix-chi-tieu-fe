import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import api from '../services/api';
import './ChatList.css';

const ChatList = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await api.get('/messages/conversations');
        setConversations(res.data);
      } catch (err) {
        console.error('Failed to load conversations', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  return (
    <div className="chatlist-container">
      <div className="chatlist-header">
        <button className="back-btn" onClick={() => navigate('/feed')}>
          <ChevronLeft size={24} color="var(--text-primary)" />
        </button>
        <h2>Tin nhắn</h2>
        <div style={{ width: 24 }}></div>
      </div>

      <div className="chatlist-content">
        {loading ? (
          <div className="loading-state">Đang tải...</div>
        ) : conversations.length === 0 ? (
          <div className="empty-state">
            Chưa có tin nhắn nào.<br/>
            Hãy phản hồi khoảnh khắc của bạn bè nhé!
          </div>
        ) : (
          conversations.map((conv, index) => (
            <div 
              key={index} 
              className="chatlist-item" 
              onClick={() => navigate(`/chat/${conv.friend._id}`)}
            >
              <div className="chatlist-avatar-wrapper">
                {conv.friend.avatar ? (
                  <img src={conv.friend.avatar} alt="avatar" className="chatlist-avatar" />
                ) : (
                  <div className="chatlist-avatar-placeholder">
                    {conv.friend.name?.charAt(0) || '?'}
                  </div>
                )}
                {conv.unreadCount > 0 && <span className="unread-dot"></span>}
              </div>
              <div className="chatlist-info">
                <div className="chatlist-name">{conv.friend.name}</div>
                <div className={`chatlist-latest ${conv.unreadCount > 0 ? 'unread' : ''}`}>
                  {conv.latestMessage.sender._id === conv.friend._id 
                    ? conv.latestMessage.text 
                    : `Bạn: ${conv.latestMessage.text}`}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList;
