import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import LoadingScreen from '../components/LoadingScreen';
import api from '../services/api';
import { FileText, X, Image as ImageIcon, Filter, RefreshCw } from 'lucide-react';
import './History.css';

const History = () => {
  const navigate = useNavigate();
  
  // Default 10 days ago
  const today = new Date();
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(today.getDate() - 10);
  const formatDateForInput = (d) => {
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - (offset*60*1000));
    return local.toISOString().split('T')[0];
  };

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [startDate, setStartDate] = useState(formatDateForInput(tenDaysAgo));
  const [endDate, setEndDate] = useState(formatDateForInput(today));
  const [categoryId, setCategoryId] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Fetch Categories once
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const budgetRes = await api.get('/budgets/current').catch(() => null);
        if (budgetRes?.data) {
          const catRes = await api.get(`/categories?budgetId=${budgetRes.data._id}`);
          setCategories(catRes.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCats();
  }, []);

  // Fetch transactions when filters change
  useEffect(() => {
    fetchTransactions();
  }, [startDate, endDate, categoryId]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (categoryId) params.categoryId = categoryId;

      const res = await api.get('/transactions', { params });
      setTransactions(res.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setStartDate(formatDateForInput(tenDaysAgo));
    setEndDate(formatDateForInput(today));
    setCategoryId('');
    // fetchTransactions will be called automatically by the useEffect
  };

  const formatCurrency = (amount) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };



  return (
    <div className="history-container">
      <div className="history-header">
        <div>
          <h1 className="history-title">Lịch sử giao dịch</h1>
          <p className="history-subtitle">Mặc định hiển thị 10 ngày gần nhất</p>
        </div>
        <button 
          onClick={handleResetFilters} 
          className="history-refresh-btn"
          disabled={loading}
          title="Làm mới và Đặt lại bộ lọc"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="history-filters">
        <div className="history-filter-row">
          <div className="history-filter-group">
            <label>Từ ngày</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="history-filter-input"
            />
          </div>
          <div className="history-filter-group">
            <label>Đến ngày</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="history-filter-input"
            />
          </div>
        </div>
        
        <div className="history-filter-group" style={{ marginTop: '12px' }}>
          <label>Danh mục</label>
          <select 
            value={categoryId} 
            onChange={(e) => setCategoryId(e.target.value)}
            className="history-filter-input select"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.icon} {cat.name}</option>
            ))}
          </select>
        </div>
        
        {!loading && transactions.length > 0 && (
          <div style={{ 
            marginTop: '12px', 
            paddingTop: '12px', 
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Tổng chi tiêu:</span>
            <span style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              color: transactions.reduce((sum, tx) => tx.type === 'expense' ? sum - tx.amount : sum + tx.amount, 0) < 0 ? 'var(--accent-danger)' : 'var(--accent-success)' 
            }}>
              {transactions.reduce((sum, tx) => tx.type === 'expense' ? sum - tx.amount : sum + tx.amount, 0) < 0 ? '-' : '+'}
              {Math.abs(transactions.reduce((sum, tx) => tx.type === 'expense' ? sum - tx.amount : sum + tx.amount, 0)).toLocaleString('vi-VN')}đ
            </span>
          </div>
        )}
      </div>

      <div className="history-list">
        {loading && transactions.length === 0 ? (
          <div style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ height: '72px', background: 'var(--skeleton-base)', borderRadius: '16px', marginBottom: '12px' }} />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-secondary)' }}>
            Chưa có giao dịch nào.
          </div>
        ) : (
          transactions.map(tx => (
            <div 
              key={tx._id} 
              className="history-item"
              onClick={() => navigate(`/transaction/${tx._id}`, { state: { transaction: tx } })}
              style={{ cursor: 'pointer' }}
            >
              <div className="history-item-left">
                <div className="history-item-icon">
                  {tx.categoryId?.icon || '💰'}
                </div>
                <div className="history-item-details">
                  <span className="history-item-name">{tx.categoryId?.name || 'Chưa phân loại'}</span>
                  {tx.note && <span className="history-item-note">{tx.note}</span>}
                  <span className="history-item-date">{formatDate(tx.createdAt)}</span>
                </div>
              </div>
              <div className="history-item-right">
                <span className="history-item-amount">-đ{formatCurrency(tx.amount)}</span>
                {tx.receipt && tx.receipt.url && (
                  <button 
                    className="history-receipt-btn"
                    onClick={(e) => {
                      e.stopPropagation(); // prevent navigating when clicking the receipt button
                      setSelectedReceipt(tx.receipt.url);
                    }}
                  >
                    <ImageIcon size={14} /> Hóa đơn
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="receipt-modal-overlay" onClick={() => setSelectedReceipt(null)}>
          <div className="receipt-modal-content" onClick={e => e.stopPropagation()}>
            <div className="receipt-modal-header">
              <div className="receipt-modal-title">
                <FileText size={18} color="var(--accent-primary)" /> 
                Ảnh Hóa đơn
              </div>
              <button className="receipt-modal-close" onClick={() => setSelectedReceipt(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="receipt-modal-body">
              <img src={selectedReceipt} alt="Receipt" className="receipt-modal-img" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
