import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import './ChatList.css';

const ChatList = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

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

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = () => {
      // Refresh the list when a new message arrives (sent or received)
      fetchConversations();
    };

    socket.on('newMessage', handleNewMessage);
    return () => socket.off('newMessage', handleNewMessage);
  }, [socket]);

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
              <div className="chatlist-avatar-wrapper" style={{ position: 'relative', width: '50px', height: '50px', marginRight: '15px' }}>
                {conv.friend.avatar ? (
                  <img src={conv.friend.avatar} alt="avatar" className="chatlist-avatar" style={{ margin: 0 }} />
                ) : (
                  <div className="chatlist-avatar-placeholder">
                    {conv.friend.name?.charAt(0) || '?'}
                  </div>
                )}
                {conv.friend.avatarFrame && (
                  <img 
                    src={conv.friend.avatarFrame} 
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
                {conv.unreadCount > 0 && <span className="unread-dot" style={{ zIndex: 3 }}></span>}
              </div>
              <div className="chatlist-info">
                <div className="chatlist-name">{conv.friend.name}</div>
                <div className={`chatlist-latest ${conv.unreadCount > 0 ? 'unread' : ''}`}>
                  {conv.latestMessage ? (
                    conv.latestMessage.sender._id === conv.friend._id 
                      ? conv.latestMessage.text 
                      : `Bạn: ${conv.latestMessage.text}`
                  ) : 'Bắt đầu cuộc trò chuyện mới'}
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
