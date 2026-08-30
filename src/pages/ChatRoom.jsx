import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Send } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import './ChatRoom.css';

const ChatRoom = () => {
  const { friendId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  
  const [messages, setMessages] = useState([]);
  const [friend, setFriend] = useState(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/${friendId}`);
        setMessages(res.data);
        
        // Find friend info from messages if possible, or fetch from friend API
        if (res.data.length > 0) {
          const sampleMsg = res.data[0];
          if (sampleMsg.sender._id === friendId) {
            setFriend(sampleMsg.sender);
          } else {
            setFriend(sampleMsg.receiver || { _id: friendId, name: 'Bạn bè' }); // receiver populate would be better, but we can fallback
          }
        } else {
          // If no messages yet, we might need to fetch friend info separately
          // For now, let's just show a generic name
          setFriend({ _id: friendId, name: 'Người dùng' });
        }
      } catch (err) {
        console.error('Failed to load messages', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [friendId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (msg) => {
      // Chỉ nhận tin nhắn nếu người gửi chính là người bạn đang chat
      const senderId = msg.sender?._id || msg.sender;
      if (senderId === friendId) {
        setMessages(prev => [...prev, msg]);
        // Tự động đánh dấu đã đọc trên server
        api.put(`/messages/${friendId}/read`).catch(err => console.error(err));
      }
    };

    socket.on('newMessage', handleNewMessage);
    return () => socket.off('newMessage', handleNewMessage);
  }, [socket, friendId]);

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await api.post('/messages', {
        receiverId: friendId,
        text: inputText,
        quotedTransaction: null
      });
      
      // Add immediately to local state, merge quotedTx if available
      setMessages([...messages, {
        ...res.data,
        sender: { _id: user._id, name: user.name, avatar: user.avatar },
        quotedTransaction: res.data.quotedTransaction || null
      }]);
      setInputText('');
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setTimeout(() => setIsSending(false), 1000);
    }
  };

  return (
    <div className="chatroom-container">
      <div className="chatroom-header">
        <button className="back-btn" onClick={() => navigate('/messages')}>
          <ChevronLeft size={24} color="var(--text-primary)" />
        </button>
        <div className="chatroom-friend-info">
          <div style={{ position: 'relative', width: '40px', height: '40px' }}>
            {friend?.avatar ? (
              <img src={friend.avatar} alt="avatar" className="chatroom-avatar" style={{ margin: 0 }} />
            ) : (
              <div className="chatroom-avatar-placeholder">
                {friend?.name?.charAt(0) || '?'}
              </div>
            )}
            {friend?.avatarFrame && (
              <img 
                src={`/${friend.avatarFrame}`} 
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
          </div>
          <h2>{friend?.name}</h2>
        </div>
        <div style={{ width: 24 }}></div>
      </div>

      <div className="chatroom-messages" ref={messagesContainerRef}>
        {loading ? (
          <div className="loading-state">Đang tải...</div>
        ) : (
          messages.map((msg, index) => {
            const isMine = msg.sender._id === user._id;
            return (
              <div key={index} className={`message-wrapper ${isMine ? 'mine' : 'theirs'}`}>
                <div className="message-bubble">
                  {msg.quotedTransaction && (
                    <div className="quoted-box">
                      <div className="quoted-text">
                        Đã trả lời khoảnh khắc của {isMine ? friend?.name : 'bạn'}
                      </div>
                      <div className="quoted-image-wrapper">
                        <img 
                          src={msg.quotedTransaction.receipt?.url || '/logo-app.png'} 
                          alt="Quoted" 
                          className="quoted-image"
                        />
                      </div>
                    </div>
                  )}
                  <div className="message-text">{msg.text}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form className="chatroom-input-area" onSubmit={handleSend}>
        <input 
          type="text"
          placeholder="Nhắn tin..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button type="submit" disabled={!inputText.trim() || isSending}>
          <Send size={20} color={(inputText.trim() && !isSending) ? "#3b82f6" : "#666"} />
        </button>
      </form>
    </div>
  );
};

export default ChatRoom;
