import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Bot, User, Sparkles, Trash2, Copy, Check, Volume2, Square, Loader2 } from 'lucide-react';
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

  // Audio & Copy states
  const [copiedId, setCopiedId] = useState(null);
  const [playingMsgId, setPlayingMsgId] = useState(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const audioRef = useRef(null);
  const chunksRef = useRef([]);
  const chunkIndexRef = useRef(0);

  useEffect(() => {
    fetchHistory();
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/ai/history');
      if (res.data.success && res.data.data.length > 0) {
        setMessages(res.data.data);
      } else {
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
        if (audioRef.current) audioRef.current.pause();
        setPlayingMsgId(null);
      } catch (error) {
        const errorMsg = error.response?.data?.message || error.message || 'Lỗi không xác định';
        Swal.fire({ title: 'Lỗi', text: `Không thể xóa: ${errorMsg}`, icon: 'error' });
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
    
    setMessages(prev => [...prev, { _id: Date.now(), role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await api.post('/ai/chat', { message: userMsg });
      setMessages(prev => [...prev, { _id: Date.now() + 1, role: 'model', text: response.data.reply }]);
    } catch (error) {
      console.error('Lỗi khi gọi AI:', error);
      setMessages(prev => [...prev, {
        _id: Date.now() + 1,
        role: 'model',
        text: error.response?.data?.message || 'Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau nhé!'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const splitIntoChunks = (text) => {
    const chunks = [];
    // Loại bỏ các dòng markdown như ```json, vì đọc sẽ lỗi
    const cleanText = text.replace(/```[a-z]*\n/g, '').replace(/```/g, '');
    const lines = cleanText.split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      if (line.length > 250) {
        const sentences = line.split(/(?<=[.?!;])\s+/);
        sentences.forEach(s => s.trim() && chunks.push(s.trim()));
      } else {
        chunks.push(line.trim());
      }
    }
    return chunks;
  };

  const playNextChunk = async () => {
    if (chunkIndexRef.current >= chunksRef.current.length) {
      setPlayingMsgId(null);
      return;
    }
    setIsAudioLoading(true);
    const text = chunksRef.current[chunkIndexRef.current];
    try {
      const response = await api.post('/ai/tts', { text, rate: '+50%' }, { responseType: 'blob' });
      const audioUrl = URL.createObjectURL(response.data);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        chunkIndexRef.current += 1;
        playNextChunk();
      };
      
      audio.onplay = () => setIsAudioLoading(false);
      await audio.play();
    } catch (err) {
      console.error('Lỗi phát audio:', err);
      setPlayingMsgId(null);
      setIsAudioLoading(false);
      Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Lỗi phát âm thanh', showConfirmButton: false, timer: 2000 });
    }
  };

  const handlePlayAudio = (msgId, text) => {
    if (playingMsgId === msgId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingMsgId(null);
      setIsAudioLoading(false);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingMsgId(msgId);
    chunksRef.current = splitIntoChunks(text);
    chunkIndexRef.current = 0;
    playNextChunk();
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
        <button className="aichat-clear-btn" onClick={handleClearHistory} title="Xóa lịch sử chat">
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
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '80%' }}>
                <div className={`aichat-bubble ${msg.role === 'model' ? 'ai' : 'user'}`} style={{ maxWidth: '100%' }}>
                  {msg.text.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i !== msg.text.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
                
                {msg.role === 'model' && (
                  <div className="aichat-actions">
                    <button 
                      className="aichat-action-btn" 
                      onClick={() => handlePlayAudio(msg._id, msg.text)}
                      title={playingMsgId === msg._id ? "Dừng đọc" : "Đọc văn bản (1.5x)"}
                    >
                      {playingMsgId === msg._id ? (
                        isAudioLoading ? <Loader2 size={14} className="spin" /> : <Square size={14} className="text-red-500" />
                      ) : (
                        <Volume2 size={14} />
                      )}
                    </button>
                    <button 
                      className="aichat-action-btn"
                      onClick={() => handleCopy(msg.text, msg._id)}
                      title="Sao chép"
                    >
                      {copiedId === msg._id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                )}
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
