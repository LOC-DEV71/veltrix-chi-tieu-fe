import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, X, FileText } from 'lucide-react';
import './Success.css';

const Success = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { transaction } = location.state || {};
  
  const [showReceipt, setShowReceipt] = useState(false);

  // If accessed directly without state, go home
  if (!transaction) {
    navigate('/', { replace: true });
    return null;
  }

  const formatCurrency = (amount) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  return (
    <div className="success-container">
      <div className="success-header">
        <div className="success-icon-wrapper">
          <Check size={48} color="#10b981" />
        </div>
        <h1 className="success-title">Giao dịch thành công</h1>
        <div className="success-amount">-{formatCurrency(transaction.amount)}đ</div>
      </div>

      <div className="success-card">
        <div className="success-row">
          <span className="success-label">Thời gian thanh toán</span>
          <span className="success-value">{formatDate(transaction.createdAt)}</span>
        </div>

        <div className="success-row">
          <span className="success-label">Mã giao dịch</span>
          <span className="success-value" style={{ fontFamily: 'monospace', letterSpacing: '1px' }}>
            {transaction._id.substring(transaction._id.length - 10).toUpperCase()}
          </span>
        </div>
        
        <div className="success-row">
          <span className="success-label">Danh mục</span>
          <span className="success-value">
            {transaction.category?.icon} {transaction.category?.name}
          </span>
        </div>

        {transaction.note && (
          <div className="success-row">
            <span className="success-label">Ghi chú</span>
            <span className="success-value">{transaction.note}</span>
          </div>
        )}

        {transaction.receipt && transaction.receipt.url && (
          <div className="success-row" style={{ alignItems: 'center' }}>
            <span className="success-label">Hóa đơn đính kèm</span>
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

      <div className="success-actions">
        <button className="btn btn-primary" onClick={() => navigate('/history')} style={{ width: '100%' }}>
          Xem lịch sử giao dịch
        </button>
        <button className="btn success-btn-secondary" onClick={() => navigate('/')} style={{ width: '100%' }}>
          Về trang chủ
        </button>
      </div>

      {/* Receipt Modal (reuse styles from History or define locally) */}
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
