import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import LoadingScreen from '../components/LoadingScreen';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  MoreHorizontal, 
  BrainCircuit, 
  TrendingUp, 
  User, 
  LogOut,
  Target,
  Edit2,
  Settings,
  AlertCircle,
  PieChart,
  Sparkles,
  X,
  Flag,
  Globe
} from 'lucide-react';
import api from '../services/api';
import './Home.css';

const Home = () => {
  const { user, logout } = useAuth();
  const { avatarFrame } = useTheme();
  const navigate = useNavigate();
  const [budget, setBudget] = useState(null);
  const [categories, setCategories] = useState([]);
  const [topGoal, setTopGoal] = useState(null);
  const [unreadFeedCount, setUnreadFeedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Get current budget
      const budgetRes = await api.get('/budgets/current').catch(err => {
        if (err.response && err.response.status === 404) return null;
        throw err;
      });

      if (!budgetRes || !budgetRes.data) {
        setBudget(null);
        setCategories([]);
        return;
      }

      const currentBudget = budgetRes.data;

      // 2 & 3 & 4. Dùng luôn dữ liệu nếu Backend đã gộp sẵn
      let fetchedCategories = currentBudget.categories;
      let transactions = currentBudget.transactions;
      let goals = currentBudget.goals || [];

      if (!fetchedCategories || !transactions) {
        const [categoriesRes, txRes, unreadRes, msgUnreadRes] = await Promise.all([
          api.get(`/categories?budgetId=${currentBudget._id}`),
          api.get(`/transactions?budgetId=${currentBudget._id}`),
          api.get('/transactions/feed/unread-count'),
          api.get('/messages/unread-count')
        ]);
        fetchedCategories = categoriesRes.data;
        transactions = txRes.data;
        
        let totalUnread = 0;
        if (unreadRes && unreadRes.data) totalUnread += unreadRes.data.count || 0;
        if (msgUnreadRes && msgUnreadRes.data) totalUnread += msgUnreadRes.data.count || 0;
        setUnreadFeedCount(totalUnread);
      } else {
        // If data is already there, we just need to fetch unread count separately
        const [unreadRes, msgUnreadRes] = await Promise.all([
          api.get('/transactions/feed/unread-count'),
          api.get('/messages/unread-count')
        ]);
        
        let totalUnread = 0;
        if (unreadRes && unreadRes.data) totalUnread += unreadRes.data.count || 0;
        if (msgUnreadRes && msgUnreadRes.data) totalUnread += msgUnreadRes.data.count || 0;
        setUnreadFeedCount(totalUnread);
      }

      // Calculate spent per category and total spent
      let totalSpent = 0;
      const catStats = fetchedCategories.map(cat => {
        const spent = transactions
          .filter(tx => tx.categoryId && (tx.categoryId._id === cat._id || tx.categoryId === cat._id))
          .reduce((sum, tx) => sum + tx.amount, 0);
        
        totalSpent += spent;
        return { ...cat, spent };
      });

      setBudget({ 
        totalMoney: currentBudget.totalMoney, 
        remaining: currentBudget.totalMoney - totalSpent,
        _id: currentBudget._id
      });
      setCategories(catStats);

      if (goals.length > 0) {
        setTopGoal(goals[0]);
      } else {
        setTopGoal(null);
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="home-container" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* The Scroll-linked Sun Effect (Parallax) */}
      <div 
        style={{
          position: 'absolute',
          top: '-100px',
          right: '-50px',
          width: '350px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(250, 204, 21, 0.15) 0%, rgba(250, 204, 21, 0) 70%)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          zIndex: 0,
          pointerEvents: 'none',
          // scrollY * 1.5 offsets the container scrolling up, making it move down the screen
          transform: `translate(${-scrollY * 0.2}px, ${scrollY * 1.2}px)`,
          transition: 'transform 0.1s ease-out',
        }}
      />

      {/* Header */}
      <div className="home-header" style={{ position: 'relative', zIndex: 10 }}>
        <div>
          <p className="home-greeting">Xin chào, {user?.name || 'Bạn'} 👋</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
            Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}
          </p>
        </div>
        
        <div className="home-avatar-container" style={{ position: 'relative' }}>
          <img 
            src={user?.avatar || 'https://ui-avatars.com/api/?name=' + (user?.name || 'U') + '&background=6366f1&color=fff'} 
            alt="Avatar" 
            className="home-avatar" 
            onClick={() => setShowAvatarMenu(!showAvatarMenu)}
          />
          {avatarFrame && (
            <img 
              src={`/${avatarFrame}`} 
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
          
          {showAvatarMenu && (
            <div className="home-avatar-menu">
              <button 
                className="home-avatar-menu-item"
                onClick={() => {
                  setShowAvatarMenu(false);
                  setShowProfileModal(true);
                }}
              >
                <User size={16} />
                Hồ sơ
              </button>
              <button 
                className="home-avatar-menu-item"
                onClick={() => {
                  setShowAvatarMenu(false);
                  navigate('/settings');
                }}
              >
                <Settings size={16} />
                Cài đặt
              </button>
              <button 
                className="home-avatar-menu-item logout"
                onClick={async () => {
                  setShowAvatarMenu(false);
                  await logout();
                  navigate('/login');
                }}
              >
                <LogOut size={16} />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '20px', animation: 'pulse 1.5s ease-in-out infinite' }}>
          <div style={{ height: '140px', background: 'var(--skeleton-base)', borderRadius: '20px', marginBottom: '24px' }} />
          <div style={{ height: '20px', background: 'var(--skeleton-base)', borderRadius: '8px', width: '50%', marginBottom: '16px' }} />
          {[1,2,3].map(i => (
            <div key={i} style={{ height: '80px', background: 'var(--skeleton-shine)', borderRadius: '16px', marginBottom: '12px' }} />
          ))}
        </div>
      ) : (
        <>
          {/* Hero Card */}
          <div className="home-hero-card" style={{ position: 'relative', zIndex: 1 }}>
        <div className="home-balance-label">
          <span>{budget ? 'Còn lại trong tháng' : 'Ngân sách tháng này'}</span>
          {budget && (
            <button 
              className="home-settings-btn"
              onClick={() => navigate('/setup-budget')}
              title="Chỉnh sửa ngân sách"
            >
              <Settings size={18} />
            </button>
          )}
        </div>
        <h2 className="home-balance-amount">
          {budget ? budget.remaining.toLocaleString() + 'đ' : 'Chưa thiết lập'}
        </h2>
        </div>

        {/* Goal Widget */}
        {topGoal && (
          <div className="home-goal-widget" onClick={() => navigate('/goals')}>
            <div className="home-goal-widget-header">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)'}}>
                <Flag size={14} color="var(--accent-primary)"/> Mục tiêu ưu tiên
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Hạn: {topGoal.deadline}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: '600' }}>{topGoal.name}</span>
              <span style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>
                {Math.min(100, Math.round((topGoal.savedAmount / topGoal.targetAmount) * 100))}%
              </span>
            </div>
            <div className="goal-progress-bar" style={{ height: '6px', marginBottom: '4px' }}>
              <div 
                className="goal-progress-fill" 
                style={{ width: `${Math.min(100, Math.round((topGoal.savedAmount / topGoal.targetAmount) * 100))}%` }}
              ></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <span>Đã có: {topGoal.savedAmount.toLocaleString()}đ</span>
              <span>Cần: {topGoal.targetAmount.toLocaleString()}đ</span>
            </div>
          </div>
        )}

      {/* Categories */}
      <div style={{ marginBottom: '24px', position: 'relative', zIndex: 1 }}>
        <h3 className="home-section-title">Danh mục chi tiêu</h3>
        
        {!budget ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            Bạn chưa tạo ngân sách nào cho tháng này.<br/><br/>
            <button className="btn btn-primary" onClick={() => navigate('/setup-budget')}>Tạo ngân sách ngay</button>
          </div>
        ) : categories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
            Chưa có danh mục nào.
          </div>
        ) : (
          <div className="home-category-list">
            {categories.map(cat => {
              const percent = cat.budgetAmount > 0 ? (cat.spent / cat.budgetAmount) * 100 : 0;
              const remaining = cat.budgetAmount - cat.spent;
              const isLow = percent > 80;
              
              return (
                <div key={cat._id} className="home-category-card">
                  <div className="home-cat-header">
                    <div className="home-cat-name-box">
                      <div className="home-cat-icon">{cat.icon}</div>
                      <span className="home-cat-name">{cat.name}</span>
                    </div>
                    <div className="home-cat-amounts">
                      <span className="home-cat-remaining">{remaining.toLocaleString()}đ</span>
                      <span className="home-cat-spent">Đã tiêu {cat.spent.toLocaleString()}đ</span>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="home-progress-bg">
                    <div 
                      className={`home-progress-fill ${isLow ? 'warning' : ''}`}
                      style={{ width: `${Math.min(percent, 100)}%` }} 
                    />
                  </div>
                  
                  {isLow && (
                    <p className="home-warning-text">
                      <AlertCircle size={14} />
                      {percent >= 100 ? 'Đã vượt quá ngân sách!' : 'Sắp hết ngân sách!'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Extra Features */}
      <div className="home-section-title" style={{ marginTop: '32px', position: 'relative', zIndex: 1 }}>Tiện ích mở rộng</div>
      <div className="home-features-grid" style={{ position: 'relative', zIndex: 1 }}>
        <div className="home-feature-card" onClick={() => alert('Tính năng phân tích số liệu đang được phát triển!')}>
          <div className="home-feature-icon analytics">
            <PieChart size={24} strokeWidth={2.5} />
          </div>
          <div>
            <div className="home-feature-title">Phân tích</div>
            <div className="home-feature-desc">Báo cáo thu chi</div>
          </div>
        </div>
        
        <div className="home-feature-card" onClick={() => navigate('/ai-chat')}>
          <div className="home-feature-icon ai">
            <Sparkles size={24} strokeWidth={2.5} />
          </div>
          <div>
            <div className="home-feature-title">Trợ lý AI</div>
            <div className="home-feature-desc">Phân tích thông minh</div>
          </div>
        </div>

        <div className="home-feature-card" onClick={() => navigate('/feed')}>
          <div className="home-feature-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', position: 'relative' }}>
            <Globe size={24} strokeWidth={2.5} />
            {unreadFeedCount > 0 && (
              <div style={{ position: 'absolute', top: '-4px', right: '-4px', minWidth: '18px', height: '18px', padding: '0 4px', backgroundColor: 'var(--accent-danger)', color: '#fff', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', border: '2px solid var(--bg-glass)' }}>
                {unreadFeedCount > 99 ? '99+' : unreadFeedCount}
              </div>
            )}
          </div>
          <div>
            <div className="home-feature-title">Cộng đồng</div>
            <div className="home-feature-desc">Feed khoảnh khắc</div>
          </div>
        </div>
      </div>
      </>
    )}

      <BottomNav />

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="home-modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="home-modal-content" onClick={e => e.stopPropagation()}>
            <div className="home-modal-header">
              <div className="home-modal-title">Thông tin tài khoản</div>
              <button className="home-modal-close" onClick={() => setShowProfileModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="home-modal-body">
              <img 
                src={user?.avatar || 'https://ui-avatars.com/api/?name=' + (user?.name || 'U') + '&background=6366f1&color=fff'} 
                alt="Avatar" 
                className="home-modal-avatar" 
              />
              <div className="home-modal-info">
                <div className="home-modal-name">{user?.name || 'Người dùng'}</div>
                <div className="home-modal-email">{user?.email || 'Chưa cập nhật email'}</div>
              </div>
              <button 
                className="home-modal-edit-btn"
                onClick={() => navigate('/profile')}
              >
                <Edit2 size={16} />
                Chỉnh sửa hồ sơ
              </button>

              {user?.createdAt && (
                <div className="home-modal-joined-date">
                  Tham gia từ {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
