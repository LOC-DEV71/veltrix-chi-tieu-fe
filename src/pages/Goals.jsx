import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Plus, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import LoadingScreen from '../components/LoadingScreen';
import api from '../services/api';
import './Goals.css';

const Goals = () => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [depositAmount, setDepositAmount] = useState('');
  const [depositSource, setDepositSource] = useState('savings');

  const [showAddSavingsModal, setShowAddSavingsModal] = useState(false);
  const [addSavingsAmount, setAddSavingsAmount] = useState('');

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const [goalsRes, savingsRes] = await Promise.all([
        api.get('/goals'),
        api.get('/budgets/savings')
      ]);
      setGoals(goalsRes.data);
      setTotalSavings(savingsRes.data.totalAccumulatedSavings || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleAddGoal = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      let imageUrl = '';
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadRes = await api.post('/uploads/receipt', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageUrl = uploadRes.data.url;
      }

      await api.post('/goals', {
        name,
        targetAmount: Number(targetAmount.replace(/\D/g, '')),
        deadline,
        image: imageUrl
      });
      setShowAddModal(false);
      setName('');
      setTargetAmount('');
      setDeadline('');
      setImageFile(null);
      setImagePreview(null);
      fetchGoals();
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!selectedGoal) return;

    try {
      setIsSubmitting(true);
      const addedAmount = Number(depositAmount.replace(/\D/g, ''));
      
      if (depositSource === 'savings' && addedAmount > totalSavings) {
        alert('Số dư Quỹ tiết kiệm không đủ!');
        setIsSubmitting(false);
        return;
      }

      await api.post(`/goals/${selectedGoal._id}/deposit`, {
        amount: addedAmount,
        source: depositSource
      });

      setShowDepositModal(false);
      setSelectedGoal(null);
      setDepositAmount('');
      setDepositSource('savings');
      fetchGoals();
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSavings = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const addedAmount = Number(addSavingsAmount.replace(/\D/g, ''));
      await api.post('/budgets/savings/add', { amount: addedAmount });
      setShowAddSavingsModal(false);
      setAddSavingsAmount('');
      fetchGoals();
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa mục tiêu này?')) return;
    try {
      await api.delete(`/goals/${id}`);
      fetchGoals();
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  const formatAmount = (val) => {
    if (!val) return '';
    const num = val.toString().replace(/\D/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  return (
    <div className="page-container goals-page">
      <div className="goals-header">
        <h1 className="page-title"><Target size={28} /> Mục tiêu</h1>
        <button className="add-goal-btn" onClick={() => setShowAddModal(true)}>
          <Plus size={20} />
          Tạo mới
        </button>
      </div>

      <div className="total-savings-card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.02))', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '20px', borderRadius: '24px', margin: '0 0 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 4px 0' }}>Quỹ tiết kiệm tích lũy</p>
          <h2 style={{ color: '#10b981', fontSize: '28px', margin: '0 0 8px 0' }}>{totalSavings.toLocaleString()}đ</h2>
          <button 
            onClick={() => setShowAddSavingsModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: 'none', padding: '6px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
          >
            <Plus size={14} /> Nạp thêm
          </button>
        </div>
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '50%', display: 'flex' }}>
          <Target size={24} color="#10b981" />
        </div>
      </div>

      <div className="goals-list">
        {loading ? (
          <div className="empty-state" style={{ border: 'none' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Đang tải mục tiêu...</p>
          </div>
        ) : goals.length === 0 ? (
          <div className="empty-state">
            <Target size={48} color="var(--text-tertiary)" />
            <p>Bạn chưa có mục tiêu tài chính nào.</p>
            <span>Hãy thiết lập một mục tiêu (mua xe, du lịch...) để có động lực tiết kiệm nhé!</span>
          </div>
        ) : (
          goals.map(goal => {
            const progress = Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100));
            return (
              <div 
                key={goal._id} 
                className={`goal-card ${goal.status === 'completed' ? 'completed' : ''} ${goal.image ? 'has-image' : ''}`}
                style={goal.image ? { 
                  backgroundImage: `linear-gradient(rgba(17, 19, 21, 0.75), rgba(17, 19, 21, 0.95)), url(${goal.image})`, 
                  backgroundSize: 'cover', 
                  backgroundPosition: 'center', 
                  borderColor: 'rgba(255,255,255,0.1)' 
                } : {}}
              >
                <div className="goal-card-header">
                  <div className="goal-title">
                    {goal.status === 'completed' ? <CheckCircle size={20} color="#10b981" /> : <Clock size={20} color="var(--accent-primary)" />}
                    <h3>{goal.name}</h3>
                  </div>
                  <button className="goal-delete" onClick={() => handleDelete(goal._id)}>Xóa</button>
                </div>

                <div className="goal-amounts">
                  <div className="goal-amount-item">
                    <span>Đã gom</span>
                    <strong>{goal.savedAmount.toLocaleString()}đ</strong>
                  </div>
                  <div className="goal-amount-item target">
                    <span>Mục tiêu</span>
                    <strong>{goal.targetAmount.toLocaleString()}đ</strong>
                  </div>
                </div>

                <div className="goal-progress-container">
                  <div className="goal-progress-bar">
                    <div className="goal-progress-fill" style={{ width: `${progress}%` }}></div>
                  </div>
                  <div className="goal-progress-text">{progress}%</div>
                </div>

                <div className="goal-footer">
                  <span className="goal-deadline">Hạn chót: {goal.deadline}</span>
                  {goal.status !== 'completed' && (
                    <button
                      className="goal-deposit-btn"
                      onClick={() => {
                        setSelectedGoal(goal);
                        setShowDepositModal(true);
                      }}
                    >
                      Bỏ ống heo
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <BottomNav />

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Tạo mục tiêu mới</h2>
            <form onSubmit={handleAddGoal}>
              <div className="form-group">
                <label>Tên mục tiêu (Ví dụ: Mua iPhone 16)</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="Nhập tên mục tiêu..."
                />
              </div>
              <div className="form-group">
                <label>Số tiền cần đạt (VND)</label>
                <input
                  type="text"
                  value={targetAmount}
                  onChange={e => setTargetAmount(formatAmount(e.target.value))}
                  required
                  placeholder="Ví dụ: 30.000.000"
                />
              </div>
              <div className="form-group">
                <label>Thời hạn (Tháng)</label>
                <input
                  type="month"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Ảnh đại diện cho mục tiêu (Tùy chọn)</label>
                <div className="image-upload-container" style={{ position: 'relative', height: '100px', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }}>
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>+ Nhấn để tải ảnh lên</span>
                  )}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => {
                  setShowAddModal(false);
                  setImagePreview(null);
                  setImageFile(null);
                }} disabled={isSubmitting}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang tạo...' : 'Tạo mục tiêu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && selectedGoal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Bỏ ống heo</h2>
            <p className="modal-subtitle">Cho mục tiêu: <strong>{selectedGoal.name}</strong></p>
            <form onSubmit={handleDeposit}>
              <div className="form-group">
                <label>Nguồn tiền</label>
                <select 
                  value={depositSource} 
                  onChange={e => setDepositSource(e.target.value)}
                  style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '15px' }}
                >
                  <option value="savings" style={{ color: '#000' }}>Từ Quỹ tiết kiệm (Đang có: {totalSavings.toLocaleString()}đ)</option>
                  <option value="external" style={{ color: '#000' }}>Từ nguồn bên ngoài (Không trừ vào quỹ)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Số tiền gửi vào (VND)</label>
                <input
                  type="text"
                  value={depositAmount}
                  onChange={e => setDepositAmount(formatAmount(e.target.value))}
                  required
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowDepositModal(false)} disabled={isSubmitting}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Savings Modal */}
      {showAddSavingsModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Nạp thêm tiền vào Quỹ</h2>
            <p className="modal-subtitle">Số tiền này sẽ được cộng trực tiếp vào Quỹ tiết kiệm tích lũy.</p>
            <form onSubmit={handleAddSavings}>
              <div className="form-group">
                <label>Số tiền (VND)</label>
                <input
                  type="text"
                  value={addSavingsAmount}
                  onChange={e => setAddSavingsAmount(formatAmount(e.target.value))}
                  required
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddSavingsModal(false)} disabled={isSubmitting}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang xử lý...' : 'Nạp tiền'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
