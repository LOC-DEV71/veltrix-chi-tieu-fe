import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, X, FileText, Home, Clock, Copy } from 'lucide-react';
import './Success.css';

const CONFETTI_COLORS = ['#10b981', '#6366f1', '#ec4899', '#f59e0b', '#3b82f6', '#8b5cf6'];

const ConfettiPiece = ({ style }) => <div className="confetti-piece" style={style} />;

const Success = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { transaction } = location.state || {};
  const [showReceipt, setShowReceipt] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confetti, setConfetti] = useState([]);

  // If accessed directly without state, go home
  if (!transaction) {
    navigate('/', { replace: true });
    return null;
  }

  useEffect(() => {
    // Generate confetti
    const pieces = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: `${6 + Math.random() * 8}px`,
      delay: `${Math.random() * 0.8}s`,
      duration: `${1.5 + Math.random() * 1.5}s`,
      rotation: `${Math.random() * 360}deg`,
      shape: Math.random() > 0.5 ? 'circle' : 'square',
    }));
    setConfetti(pieces);
  }, []);

  const formatCurrency = (amount) =>
    amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });

  const txCode = transaction._id.substring(transaction._id.length - 10).toUpperCase();

  const handleCopy = () => {
    navigator.clipboard.writeText(txCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isIncome = transaction.type === 'income';

  return (
    <div className="success-container">
      {/* Confetti */}
      {confetti.map(p => (
        <ConfettiPiece
          key={p.id}
          style={{
            left: p.left,
            background: p.color,
            width: p.size,
            height: p.size,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            animationDelay: p.delay,
            animationDuration: p.duration,
            '--rot': p.rotation,
          }}
        />
      ))}

      {/* Glow background */}
      <div className="success-glow" />

      {/* Header section */}
      <div className="success-header">
        <div className="success-icon-ring">
          <div className="success-icon-wrapper">
            <Check size={36} strokeWidth={3} />
          </div>
        </div>
        <p className="success-subtitle">Giao dịch thành công</p>
        <div className={`success-amount ${isIncome ? 'income' : 'expense'}`}>
          {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}đ
        </div>
        {transaction.category && (
          <div className="success-category-badge">
            <span>{transaction.category.icon}</span>
            <span>{transaction.category.name}</span>
          </div>
        )}
      </div>

      {/* Detail card */}
      <div className="success-card">
        <div className="success-card-title">Chi tiết giao dịch</div>

        <div className="success-row">
          <span className="success-label">⏰ Thời gian</span>
          <span className="success-value">{formatDate(transaction.createdAt)}</span>
        </div>

        <div className="success-row">
          <span className="success-label">🔖 Mã giao dịch</span>
          <span className="success-value mono">
            {txCode}
            <button className="copy-btn" onClick={handleCopy} title="Sao chép">
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </span>
        </div>

        {transaction.note && (
          <div className="success-row">
            <span className="success-label">📝 Ghi chú</span>
            <span className="success-value">{transaction.note}</span>
          </div>
        )}

        {transaction.receipt?.url && (
          <div className="success-row">
            <span className="success-label">🧾 Hóa đơn</span>
            <span className="success-value">
              <img
                src={transaction.receipt.url}
                alt="Receipt"
                className="success-receipt-preview"
                onClick={() => setShowReceipt(true)}
              />
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="success-actions">
        <button className="success-btn-primary" onClick={() => navigate('/history')}>
          <Clock size={18} />
          Xem lịch sử
        </button>
        <button className="success-btn-secondary" onClick={() => navigate('/')}>
          <Home size={18} />
          Về trang chủ
        </button>
      </div>

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="receipt-modal-overlay" onClick={() => setShowReceipt(false)}>
          <div className="receipt-modal-content" onClick={e => e.stopPropagation()}>
            <div className="receipt-modal-header">
              <div className="receipt-modal-title">
                <FileText size={18} color="var(--accent-primary)" />
                Ảnh Hóa đơn
              </div>
              <button className="receipt-modal-close" onClick={() => setShowReceipt(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="receipt-modal-body">
              <img src={transaction.receipt.url} alt="Receipt" className="receipt-modal-img" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Success;
