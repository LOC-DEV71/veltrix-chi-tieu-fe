import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, Plus, Trash2 } from 'lucide-react';
import api from '../services/api';
import LoadingScreen from '../components/LoadingScreen';
import './SetupBudget.css';

const defaultCategories = [
  { id: 1, name: 'Ăn uống', icon: '🍜', pct: 40, amount: 0 },
  { id: 2, name: 'Đi lại', icon: '🚕', pct: 15, amount: 0 },
  { id: 3, name: 'Mua sắm', icon: '🛍️', pct: 20, amount: 0 },
  { id: 4, name: 'Giải trí', icon: '🎬', pct: 10, amount: 0 },
  { id: 5, name: 'Tiết kiệm', icon: '💰', pct: 15, amount: 0 },
];

const formatNum = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const SetupBudget = () => {
  const navigate = useNavigate();
  const [totalBudgetStr, setTotalBudgetStr] = useState('10.000.000');
  const [categories, setCategories] = useState(defaultCategories);
  const [originalCategories, setOriginalCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [existingBudgetId, setExistingBudgetId] = useState(null);

  // Fetch existing budget on mount
  useEffect(() => {
    const fetchExisting = async () => {
      try {
        const budgetRes = await api.get('/budgets/current').catch(e => {
          if (e.response && e.response.status === 404) return null;
          throw e;
        });

        if (budgetRes && budgetRes.data) {
          const budget = budgetRes.data;
          setExistingBudgetId(budget._id);
          setTotalBudgetStr(formatNum(budget.totalMoney));

          const catRes = await api.get(`/categories?budgetId=${budget._id}`);
          if (catRes.data && catRes.data.length > 0) {
            const mappedCats = catRes.data.map(c => ({
              _id: c._id,
              id: c._id, // use _id as id for UI keys
              name: c.name,
              icon: c.icon,
              amount: c.budgetAmount,
              pct: 0 // existing ones don't use auto pct
            }));
            setCategories(mappedCats);
            setOriginalCategories(mappedCats);
          }
        }
      } catch (error) {
        console.error('Failed to load budget', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExisting();
  }, []);

  // Auto calculate when total budget string changes, ONLY for default categories
  // Or rather, we should only auto-calc if they are using pct
  useEffect(() => {
    if (existingBudgetId) return; // Don't auto calc in edit mode
    
    const total = parseInt(totalBudgetStr.replace(/\./g, ''), 10) || 0;
    setCategories(prev => prev.map(c => c.pct > 0 ? {
      ...c,
      amount: Math.floor(total * (c.pct / 100))
    } : c));
  }, [totalBudgetStr, existingBudgetId]);

  const handleTotalChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    setTotalBudgetStr(val.replace(/\B(?=(\d{3})+(?!\d))/g, "."));
  };

  const handleCategoryAmountChange = (id, val) => {
    const numStr = val.replace(/\D/g, '');
    const num = parseInt(numStr, 10) || 0;
    setCategories(prev => prev.map(c => c.id === id ? { ...c, amount: num } : c));
  };

  const handleCategoryNameChange = (id, newName) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c));
  };

  const addCategory = () => {
    const newId = Date.now();
    setCategories(prev => [
      ...prev,
      { id: newId, name: 'Danh mục mới', icon: '🏷️', pct: 0, amount: 0 }
    ]);
  };

  const deleteCategory = (id) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const totalBudget = parseInt(totalBudgetStr.replace(/\./g, ''), 10) || 0;
  const allocated = categories.reduce((sum, c) => sum + c.amount, 0);
  const remaining = totalBudget - allocated;
  const isError = remaining < 0;

  const handleSubmit = async () => {
    if (totalBudget <= 0 || isError) return;
    setIsSubmitting(true);
    
    try {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      let budgetId = existingBudgetId;
      
      if (existingBudgetId) {
        await api.put(`/budgets/${existingBudgetId}`, { totalMoney: totalBudget });
      } else {
        const budgetRes = await api.post('/budgets', { month, totalMoney: totalBudget });
        budgetId = budgetRes.data._id;
      }
      
      // Determine deletes
      if (existingBudgetId) {
        const currentIds = categories.filter(c => c._id).map(c => c._id);
        const deletedCats = originalCategories.filter(orig => !currentIds.includes(orig._id));
        
        // Process deletes sequentially so we can catch errors and stop if needed
        for (const delCat of deletedCats) {
          try {
            await api.delete(`/categories/${delCat._id}`);
          } catch (err) {
            throw new Error(err.response?.data?.message || `Lỗi khi xóa mục ${delCat.name}`);
          }
        }
      }

      const promises = categories.map(c => {
        if (c._id) {
          return api.put(`/categories/${c._id}`, {
            name: c.name,
            icon: c.icon,
            budgetAmount: c.amount
          });
        } else {
          return api.post('/categories', {
            budgetId,
            name: c.name,
            icon: c.icon,
            budgetAmount: c.amount
          });
        }
      });
      
      await Promise.all(promises);
      navigate('/');
    } catch (err) {
      console.error(err);
      alert(err.message || err.response?.data?.message || 'Có lỗi xảy ra khi tạo ngân sách');
      setIsSubmitting(false);
    }
  };

  if (isLoading || isSubmitting) {
    return <LoadingScreen fullScreen={true} text={isSubmitting ? "Đang xử lý ngân sách..." : "Đang tải dữ liệu..."} />;
  }

  return (
    <div className="setup-page">
      {/* Header */}
      <div className="setup-header">
        <button 
          onClick={() => navigate(-1)} 
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
        >
          <X size={24} />
        </button>
        <h2 className="setup-title">Thiết lập ngân sách</h2>
      </div>

      <div className="setup-content">
        {/* Total Budget Input */}
        <div className="setup-total-section">
          <div className="setup-total-label">Tổng ngân sách tháng này</div>
          <div className="setup-total-input-wrapper">
            <span className="setup-currency">đ</span>
            <input 
              type="text" 
              inputMode="numeric"
              className="setup-total-input"
              value={totalBudgetStr}
              onChange={handleTotalChange}
              autoFocus
            />
          </div>
        </div>

        {/* Categories Allocation */}
        <div className="setup-categories-card">
          <div className="setup-cat-title">
            <span>Phân bổ danh mục</span>
            <span className={`setup-cat-remaining ${isError ? 'error' : ''}`}>
              {isError ? 'Vượt mức: ' : 'Còn dư: '} 
              {formatNum(Math.abs(remaining))}đ
            </span>
          </div>

          <div className="setup-cat-list">
            {categories.map(cat => (
              <div key={cat.id} className="setup-cat-item">
                <div className="setup-cat-icon">{cat.icon}</div>
                <div className="setup-cat-info">
                  <input 
                    type="text" 
                    className="setup-cat-name-input"
                    value={cat.name}
                    onChange={(e) => handleCategoryNameChange(cat.id, e.target.value)}
                  />
                  {cat.pct > 0 && <div className="setup-cat-pct">{cat.pct}% gợi ý</div>}
                </div>
                <div className="setup-cat-input-wrapper">
                  <input 
                    type="text"
                    inputMode="numeric"
                    className="setup-cat-input"
                    value={formatNum(cat.amount)}
                    onChange={(e) => handleCategoryAmountChange(cat.id, e.target.value)}
                  />
                  <span className="setup-cat-currency">đ</span>
                </div>
                <button 
                  className="setup-cat-delete-btn"
                  onClick={() => deleteCategory(cat.id)}
                  title="Xóa danh mục"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            
            <button className="setup-add-cat-btn" onClick={addCategory}>
              <Plus size={18} />
              Thêm danh mục
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="setup-footer">
        <button 
          className="setup-submit-btn" 
          onClick={handleSubmit}
          disabled={totalBudget <= 0 || isError}
        >
          <Check size={20} />
          Hoàn tất & Bắt đầu
        </button>
      </div>
    </div>
  );
};

export default SetupBudget;
