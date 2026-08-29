import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Bot, User, Sparkles, Trash2 } from 'lucide-react';
import api from '../services/api';
import Swal from 'sweetalert2';
import './AiChat.css';

const AiChat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/ai/history');
      if (res.data.success && res.data.data.length > 0) {
        setMessages(res.data.data);
      } else {
        // Mặc định nếu chưa có lịch sử
        setMessages([
          {
            _id: 'welcome',
            role: 'model',
            text: 'Xin chào! Tôi là Chuyên gia Tài chính cá nhân của bạn. Tôi đã được kết nối với dữ liệu chi tiêu của bạn. Bạn muốn tôi phân tích điều gì nào?'
          }
        ]);
      }
    } catch (error) {
      console.error('Lỗi khi lấy lịch sử:', error);
    } finally {
      setIsFetchingHistory(false);
    }
  };

  const handleClearHistory = async () => {
    const result = await Swal.fire({
      title: 'Xóa lịch sử trò chuyện?',
      text: 'AI sẽ quên mọi ngữ cảnh của cuộc trò chuyện hiện tại.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      background: 'var(--bg-secondary)',
      color: 'var(--text-primary)'
    });

    if (result.isConfirmed) {
      try {
        await api.delete('/ai/history');
        setMessages([
          {
            _id: 'welcome-new',
            role: 'model',
            text: 'Lịch sử đã được xóa. Chúng ta bắt đầu lại nhé!'
          }
        ]);
      } catch (error) {
        const errorMsg = error.response?.data?.message || error.message || 'Lỗi không xác định';
        Swal.fire({
          title: 'Lỗi',
          text: `Không thể xóa lịch sử: ${errorMsg}`,
          icon: 'error',
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)'
        });
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    
    // Add user message to UI
    const newUserMsg = { _id: Date.now(), role: 'user', text: userMsg };
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      const response = await api.post('/ai/chat', { message: userMsg });
      
      const aiMsg = {
        _id: Date.now() + 1,
        role: 'model',
        text: response.data.reply
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('Lỗi khi gọi AI:', error);
      const errorMsg = {
        _id: Date.now() + 1,
        role: 'model',
        text: error.response?.data?.message || 'Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau nhé!'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="aichat-container">
      {/* Header */}
      <div className="aichat-header">
        <button className="aichat-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className="aichat-header-info">
          <div className="aichat-avatar-glow">
            <Sparkles size={14} className="aichat-sparkle" />
            <Bot size={24} className="aichat-bot-icon" />
          </div>
          <div>
            <h1 className="aichat-title">Trợ lý AI</h1>
            <p className="aichat-subtitle">Hoạt động dựa trên Gemini</p>
          </div>
        </div>
        <button 
          className="aichat-clear-btn" 
          onClick={handleClearHistory}
          title="Xóa lịch sử chat"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Chat Area */}
      <div className="aichat-messages">
        {isFetchingHistory ? (
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <div className="typing-dot" style={{ display: 'inline-block', margin: '0 4px' }}></div>
            <div className="typing-dot" style={{ display: 'inline-block', margin: '0 4px', animationDelay: '-0.16s' }}></div>
            <div className="typing-dot" style={{ display: 'inline-block', margin: '0 4px', animationDelay: '-0.32s' }}></div>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg._id} className={`aichat-message-wrapper ${msg.role === 'model' ? 'ai' : 'user'}`}>
              {msg.role === 'model' && (
                <div className="aichat-msg-avatar ai">
                  <Bot size={16} />
                </div>
              )}
              
              <div className={`aichat-bubble ${msg.role === 'model' ? 'ai' : 'user'}`}>
                {msg.text.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i !== msg.text.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>

              {msg.role === 'user' && (
                <div className="aichat-msg-avatar user">
                  <User size={16} />
                </div>
              )}
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="aichat-message-wrapper ai">
            <div className="aichat-msg-avatar ai">
              <Bot size={16} />
            </div>
            <div className="aichat-bubble ai typing">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="aichat-input-area">
        <form className="aichat-form" onSubmit={handleSend}>
          <input
            type="text"
            className="aichat-input"
            placeholder="Hỏi về chi tiêu, ngân sách..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button 
            type="submit" 
            className={`aichat-send-btn ${input.trim() ? 'active' : ''}`}
            disabled={!input.trim() || isLoading}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AiChat;
