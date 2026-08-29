import React, { useState, useEffect } from 'react';
import { MessageCircle, LayoutGrid, Upload, ChevronDown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { timeAgo } from '../utils/timeFormatter';
import FriendsModal from '../components/FriendsModal';
import Swal from 'sweetalert2';
import './Feed.css';

const Feed = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [transactions, setTransactions] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [selectedReactionTx, setSelectedReactionTx] = useState(null);
  const [reactionPickerId, setReactionPickerId] = useState(null);
  const [replyText, setReplyText] = useState({});
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const triggerBurst = (element, emoji) => {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    for (let i = 0; i < 15; i++) {
      const particle = document.createElement('div');
      particle.className = 'reaction-particle';
      particle.innerText = emoji;
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      
      const angle = Math.random() * Math.PI * 2;
      const velocity = 50 + Math.random() * 100;
      const tx = Math.cos(angle) * velocity;
      const ty = Math.sin(angle) * velocity - 100; 
      
      particle.style.setProperty('--tx', `${tx}px`);
      particle.style.setProperty('--ty', `${ty}px`);
      
      document.body.appendChild(particle);
      
      setTimeout(() => {
        particle.remove();
      }, 1500);
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('openFriends') === 'true') {
      setShowFriendsModal(true);
    }
    
    const scrollToTx = searchParams.get('scrollToTx');
    const reaction = searchParams.get('reaction');
    if (scrollToTx && !loading) {
      setTimeout(() => {
        const el = document.querySelector(`[data-tx-id="${scrollToTx}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (reaction) {
             triggerBurst(el, reaction);
          }
        }
      }, 500);
    }
  }, [location, loading]);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const [feedRes, friendsRes, msgsRes] = await Promise.all([
          api.get('/transactions/feed'),
          api.get('/friends'),
          api.get('/messages/conversations')
        ]);
        setTransactions(feedRes.data);
        setFriends(friendsRes.data);
        
        // Count total unread from conversations
        let unread = 0;
        msgsRes.data.forEach(conv => unread += conv.unreadCount);
        setUnreadCount(unread);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
    // Ghi nhận người dùng đã xem feed mới
    api.post('/transactions/feed/viewed').catch(console.error);
  }, []);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (msg) => {
      setUnreadCount(prev => prev + 1);
    };

    const handleUpdateInteraction = (data) => {
      setTransactions(prevTxs => prevTxs.map(tx => {
        if (tx._id === data.transactionId) {
          if (data.type === 'view') {
            const viewers = tx.viewers || [];
            if (!viewers.some(v => (v._id || v) === data.user._id)) {
              return { ...tx, viewers: [...viewers, data.user] };
            }
          } else if (data.type === 'react') {
            const reactions = tx.reactions || [];
            if (data.action === 'add') {
              const existingIdx = reactions.findIndex(r => (r.user?._id || r.user) === data.user._id);
              if (existingIdx !== -1) {
                // Update existing
                const newReactions = [...reactions];
                newReactions[existingIdx].type = data.reactionType || '❤️';
                
                // Trigger burst if we are the ones viewing
                const el = document.querySelector(`[data-tx-id="${data.transactionId}"]`);
                if (el) triggerBurst(el, data.reactionType || '❤️');

                return { ...tx, reactions: newReactions };
              } else {
                // Trigger burst
                const el = document.querySelector(`[data-tx-id="${data.transactionId}"]`);
                if (el) triggerBurst(el, data.reactionType || '❤️');

                return { ...tx, reactions: [...reactions, { user: data.user, type: data.reactionType || '❤️' }] };
              }
            } else if (data.action === 'remove') {
              return { ...tx, reactions: reactions.filter(r => (r.user?._id || r.user) !== data.user._id) };
            }
          }
        }
        return tx;
      }));
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('updateInteraction', handleUpdateInteraction);
    
    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('updateInteraction', handleUpdateInteraction);
    };
  }, [socket]);

  // IntersectionObserver for auto view
  useEffect(() => {
    if (loading || transactions.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const txId = entry.target.getAttribute('data-tx-id');
            const authorId = entry.target.getAttribute('data-author-id');
            // Check if not mine and not viewed yet locally to prevent spam
            if (authorId !== user._id) {
              const tx = transactions.find(t => t._id === txId);
              if (tx && (!tx.viewers || !tx.viewers.some(v => (v._id || v) === user._id))) {
                api.post(`/transactions/${txId}/view`).catch(() => {});
                // Optimistically update local
                setTransactions(prev => prev.map(t => {
                  if (t._id === txId) {
                    const viewers = t.viewers || [];
                    if (!viewers.some(v => (v._id || v) === user._id)) {
                      return { ...t, viewers: [...viewers, { _id: user._id, name: user.name, avatar: user.avatar }] };
                    }
                  }
                  return t;
                }));
              }
            }
          }
        });
      },
      { threshold: 0.6 } // Trigger when 60% of the card is visible
    );

    const cards = document.querySelectorAll('.locket-card-wrapper');
    cards.forEach(card => observer.observe(card));

    return () => observer.disconnect();
  }, [loading, transactions, user._id]);

  // Get users for filter
  const displayUsersMap = {};
  const displayUsers = [];

  // Add self
  if (user) {
    displayUsersMap[user._id] = true;
    displayUsers.push(user);
  }

  // Add all friends
  friends.forEach(f => {
    if (!displayUsersMap[f._id]) {
      displayUsersMap[f._id] = true;
      displayUsers.push(f);
    }
  });

  // Add anyone else from transactions just in case
  transactions.forEach(tx => {
    if (tx.userId && !displayUsersMap[tx.userId._id]) {
      displayUsersMap[tx.userId._id] = true;
      displayUsers.push(tx.userId);
    }
  });

  const selectedUserName = selectedUserId 
    ? (selectedUserId === user?._id ? 'Bạn' : (displayUsers.find(u => u._id === selectedUserId)?.name || 'Bạn bè'))
    : 'Mọi người';

  const locketHeader = (
    <div className="locket-header">
      <div className="locket-avatar-btn" onClick={() => setShowFriendsModal(true)}>
        {user?.avatar ? (
          <img src={user.avatar} alt="You" />
        ) : (
          <div className="locket-avatar-placeholder">{user?.name?.charAt(0) || '<'}</div>
        )}
      </div>
      <div className="locket-pill" onClick={() => setShowFilter(true)}>
        {selectedUserName} <ChevronDown size={16} style={{ marginLeft: 4 }} />
      </div>
      <div className="locket-chat-btn" onClick={() => navigate('/messages')}>
        <MessageCircle size={20} color="var(--text-primary)" />
        {unreadCount > 0 && <div className="locket-chat-badge">{unreadCount}</div>}
      </div>
    </div>
  );

  const filterModal = showFilter && (
    <div className="locket-filter-modal-overlay" onClick={() => setShowFilter(false)}>
      <div className="locket-filter-modal" onClick={e => e.stopPropagation()}>
        <div className="locket-filter-header">Chọn bạn bè</div>
        <div className="locket-filter-list">
          <div className="locket-filter-item" onClick={() => { setSelectedUserId(null); setShowFilter(false); }}>
            <div className="locket-filter-avatar" style={{ background: '#333' }}>M</div>
            <span>Mọi người</span>
            {selectedUserId === null && <span className="locket-filter-check">✓</span>}
          </div>
          {displayUsers.map(u => (
            <div key={u._id} className="locket-filter-item" onClick={() => { setSelectedUserId(u._id); setShowFilter(false); }}>
              {u.avatar ? (
                <img src={u.avatar} alt={u.name} className="locket-filter-avatar" />
              ) : (
                <div className="locket-filter-avatar" style={{ background: '#555' }}>{u.name?.charAt(0) || '?'}</div>
              )}
              <span>{u._id === user?._id ? 'Bạn' : u.name}</span>
              {selectedUserId === u._id && <span className="locket-filter-check">✓</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const reactionModal = selectedReactionTx && (
    <div className="locket-reaction-modal-overlay" onClick={() => setSelectedReactionTx(null)}>
      <div className="locket-reaction-modal" onClick={e => e.stopPropagation()}>
        <div className="locket-reaction-modal-drag-handle"></div>
        <div className="locket-reaction-modal-header">Biểu cảm</div>
        <div className="locket-reaction-list">
          {/* Người thả tim */}
          {selectedReactionTx.reactions?.map((r, idx) => (
            <div key={`react-${idx}`} className="locket-reaction-item">
              {r.user?.avatar ? (
                <img src={r.user.avatar} alt={r.user.name} className="locket-reaction-item-avatar" />
              ) : (
                <div className="locket-reaction-item-avatar placeholder">{r.user?.name?.charAt(0) || '?'}</div>
              )}
              <span className="locket-reaction-item-name">{r.user?.name || 'Ai đó'}</span>
              <span className="locket-reaction-item-icon">{r.type === 'heart' ? '❤️' : (r.type || '💛')}</span>
            </div>
          ))}
          {/* Người xem (không hiển thị nếu đã thả tim để tránh trùng) */}
          {selectedReactionTx.viewers?.filter(v => 
            !selectedReactionTx.reactions?.some(r => r.user?._id === v._id)
          ).map((v, idx) => (
            <div key={`view-${idx}`} className="locket-reaction-item">
              {v?.avatar ? (
                <img src={v.avatar} alt={v.name} className="locket-reaction-item-avatar" />
              ) : (
                <div className="locket-reaction-item-avatar placeholder">{v?.name?.charAt(0) || '?'}</div>
              )}
              <span className="locket-reaction-item-name">{v?.name || 'Ai đó'}</span>
              <span className="locket-reaction-item-icon" style={{ opacity: 0.5 }}>👁️</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const locketBottomNav = (
    <div className="locket-bottom-nav">
      <button className="locket-icon-btn" onClick={() => navigate('/')}>
        <LayoutGrid size={28} color="var(--text-primary)" />
      </button>
      <button className="locket-camera-btn" onClick={() => navigate('/add-expense')}>
        <div className="locket-camera-inner"></div>
      </button>
      <button className="locket-icon-btn">
        <Upload size={28} color="var(--text-primary)" />
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="feed-container">
        {locketHeader}
        <div className="feed-loading-state">
          Đang tải...
        </div>
        {locketBottomNav}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="feed-container">
        {locketHeader}
        <div className="feed-empty-state">
          Chưa có khoảnh khắc nào.<br/>Nhấn nút Camera để chia sẻ ngay!
        </div>
        {locketBottomNav}
      </div>
    );
  }

  const displayTransactions = selectedUserId 
    ? transactions.filter(tx => tx.userId?._id === selectedUserId)
    : transactions;

  const handleReplyChange = (txId, text) => {
    setReplyText(prev => ({ ...prev, [txId]: text }));
  };

  const handleSendReply = async (tx) => {
    const text = replyText[tx._id];
    if (!text || !text.trim() || isSendingReply) return;

    setIsSendingReply(true);
    try {
      await api.post('/messages', {
        receiverId: tx.userId._id,
        text: text,
        quotedTransaction: tx._id
      });
      setReplyText(prev => ({ ...prev, [tx._id]: '' }));
      Swal.fire({
        icon: 'success',
        title: 'Đã gửi tin nhắn',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
        background: '#333',
        color: '#fff'
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Không thể gửi tin nhắn',
        background: '#333',
        color: '#fff'
      });
    } finally {
      setTimeout(() => setIsSendingReply(false), 1000);
    }
  };

  const reactionOptions = ['❤️', '😂', '😮', '😢', '🔥', '👏'];

  const handleReact = async (tx, emoji) => {
    try {
      const res = await api.post(`/transactions/${tx._id}/react`, { type: emoji });
      // Optimistic update
      setTransactions(prev => prev.map(t => {
        if (t._id === tx._id) {
          let newReactions = [...(t.reactions || [])];
          if (res.data.isReacted) {
            const existingIdx = newReactions.findIndex(r => (r.user?._id || r.user) === user._id);
            if (existingIdx !== -1) {
              newReactions[existingIdx].type = emoji;
            } else {
              newReactions.push({ user: { _id: user._id, name: user.name, avatar: user.avatar }, type: emoji });
            }
            // Trigger burst optimistically
            const el = document.querySelector(`[data-tx-id="${tx._id}"]`);
            if (el) triggerBurst(el, emoji);
          } else {
            newReactions = newReactions.filter(r => (r.user?._id || r.user) !== user._id);
          }
          return { ...t, reactions: newReactions };
        }
        return t;
      }));
    } catch (err) {
      console.error(err);
    }
    setReactionPickerId(null);
  };

  return (
    <div className="feed-container">
      {locketHeader}
      {filterModal}
      {reactionModal}
      {showFriendsModal && <FriendsModal onClose={() => setShowFriendsModal(false)} />}

      <div className="feed-scroll-area">
        {displayTransactions.length === 0 ? (
          <div className="feed-empty-state" style={{ height: '100vh' }}>
            Người này chưa có khoảnh khắc nào!
          </div>
        ) : (
          displayTransactions.map((tx) => {
            const myReaction = (tx.reactions || []).find(r => 
              (r.user?._id || r.user) === user._id
            );
            const isReacted = !!myReaction;
            const myReactionType = (myReaction?.type === 'heart' ? '❤️' : myReaction?.type) || '🖤'; // Mặc định tim đen khi chưa thả
            
            return (
            <div key={tx._id} className="locket-card-wrapper" data-tx-id={tx._id} data-author-id={tx.userId?._id}>
            <div className="locket-image-container">
              <img src={tx.receipt?.url} alt="Khoảnh khắc" className="locket-main-img" />
              <div className="locket-reaction-pill">
                {tx.categoryId?.icon}
              </div>
            </div>
            
            <div className="locket-user-info">
              <span className="locket-username">
                {tx.userId?._id === user?._id ? 'Bạn' : (tx.userId?.name || 'Ai đó')}
              </span>
              <span className="locket-time">{timeAgo(tx.createdAt)}</span>
            </div>
            
            {tx.note && (
              <div className="locket-details">
                <span className="locket-amount">{tx.note}</span>
              </div>
            )}

            {tx.userId?._id === user?._id ? (
              <>
                {(tx.reactions?.length > 0 || tx.viewers?.length > 0) ? (
                  <div className="locket-activity-btn-wrapper">
                    <button className="locket-activity-btn" onClick={() => setSelectedReactionTx(tx)}>
                      ✨ Hoạt động
                      {tx.reactions?.length > 0 && (
                        <img 
                          src={tx.reactions[tx.reactions.length - 1].user?.avatar || '/logo-app.png'} 
                          alt="avatar" 
                          className="locket-activity-avatar" 
                        />
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="locket-no-activity">
                    ✨ Ghi chép tài chính
                  </div>
                )}
              </>
            ) : (
              <div className="locket-reply-wrapper" style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder="Trả lời khoảnh khắc..." 
                  className="locket-reply-input"
                  value={replyText[tx._id] || ''}
                  onChange={e => handleReplyChange(tx._id, e.target.value)}
                  disabled={isSendingReply}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSendReply(tx);
                  }}
                />
                
                {/* Reaction Picker Tooltip */}
                {reactionPickerId === tx._id && (
                  <div className="reaction-picker-tooltip">
                    {reactionOptions.map(emoji => (
                      <span key={emoji} onClick={() => handleReact(tx, emoji)}>{emoji}</span>
                    ))}
                  </div>
                )}
                
                <button 
                  className="locket-react-btn" 
                  onClick={() => setReactionPickerId(tx._id === reactionPickerId ? null : tx._id)}
                >
                  <span style={{ fontSize: '1.5rem', filter: isReacted ? 'none' : 'grayscale(100%) opacity(50%)' }}>
                    {myReactionType}
                  </span>
                </button>
              </div>
            )}
            </div>
            );
          })
        )}
      </div>

      {locketBottomNav}
    </div>
  );
};

export default Feed;
