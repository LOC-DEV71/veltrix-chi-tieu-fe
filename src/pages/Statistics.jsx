import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart as RePieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import BottomNav from '../components/BottomNav';
import LoadingScreen from '../components/LoadingScreen';
import api from '../services/api';
import './Statistics.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="custom-tooltip-label">{payload[0].name || payload[0].payload.name}</p>
        <p className="custom-tooltip-value">
          {payload[0].value.toLocaleString()}đ
        </p>
      </div>
    );
  }
  return null;
};

const Statistics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Format: YYYY-MM
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  
  const [budget, setBudget] = useState(null);
  const [categories, setCategories] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      // 1. Get budget for selected month
      const budgetRes = await api.get(`/budgets/current?month=${selectedMonth}`).catch(err => {
        if (err.response && err.response.status === 404) return null;
        throw err;
      });

      if (!budgetRes || !budgetRes.data) {
        setBudget(null);
        setCategories([]);
        setTotalSpent(0);
        return;
      }

      const currentBudget = budgetRes.data;

      // 2. Get categories
      const categoriesRes = await api.get(`/categories?budgetId=${currentBudget._id}`);
      let fetchedCategories = categoriesRes.data;

      // 3. Get transactions
      const txRes = await api.get(`/transactions?budgetId=${currentBudget._id}`);
      const transactions = txRes.data;

      // 4. Calculate stats
      let spent = 0;
      fetchedCategories = fetchedCategories.map(cat => {
        const catSpent = transactions
          .filter(tx => tx.categoryId && (tx.categoryId._id === cat._id || tx.categoryId === cat._id))
          .reduce((sum, tx) => sum + tx.amount, 0);
        
        spent += catSpent;
        return { ...cat, spent: catSpent };
      });

      // Filter out categories with 0 spent for the charts
      fetchedCategories = fetchedCategories.filter(cat => cat.spent > 0);
      // Sort by spent descending
      fetchedCategories.sort((a, b) => b.spent - a.spent);

      setBudget(currentBudget);
      setCategories(fetchedCategories);
      setTotalSpent(spent);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [selectedMonth]);

  if (loading && categories.length === 0 && !budget) {
    return (
      <div className="stats-container" style={{ padding: '20px', animation: 'pulse 1.5s ease-in-out infinite' }}>
        <div style={{ height: '48px', background: 'var(--skeleton-base)', borderRadius: '12px', marginBottom: '20px' }} />
        <div style={{ height: '220px', background: 'var(--skeleton-shine)', borderRadius: '20px', marginBottom: '16px' }} />
        <div style={{ height: '180px', background: 'var(--skeleton-shine)', borderRadius: '20px' }} />
      </div>
    );
  }

  // Data for Donut Chart (Spent vs Remaining)
  const donutData = budget ? [
    { name: 'Đã chi tiêu', value: totalSpent },
    { name: 'Còn lại', value: Math.max(0, budget.totalMoney - totalSpent) }
  ] : [];

  // Data for Bar Chart (By Category)
  const barData = categories.map(cat => ({
    name: cat.name,
    icon: cat.icon,
    value: cat.spent
  }));

  return (
    <div className="statistics-container">
      <div className="statistics-header">
        <h1 className="statistics-title">Thống kê</h1>
        <input 
          type="month" 
          value={selectedMonth} 
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="statistics-month-selector"
        />
      </div>

      {!budget ? (
        <div className="statistics-empty">
          <p>Không có dữ liệu ngân sách cho tháng này.</p>
          <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/setup-budget')}>
            Tạo ngân sách ngay
          </button>
        </div>
      ) : (
        <>
          <div className="statistics-overview">
            <div className="statistics-overview-glow"></div>
            <div className="statistics-overview-title">Tổng chi tiêu tháng {selectedMonth.split('-')[1]}</div>
            <div className="statistics-overview-amount">{totalSpent.toLocaleString()}đ</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Ngân sách: {budget.totalMoney.toLocaleString()}đ
            </div>
          </div>

          {categories.length === 0 ? (
            <div className="statistics-empty">
              Chưa có giao dịch nào được ghi nhận.
            </div>
          ) : (
            <>
              {/* Donut Chart */}
              <div className="statistics-chart-card">
                <div className="statistics-chart-title">Tỷ lệ tiêu dùng</div>
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer>
                    <RePieChart>
                      <Pie
                        data={donutData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        <Cell key="cell-0" fill="#ef4444" /> {/* Red for spent */}
                        <Cell key="cell-1" fill="#10b981" /> {/* Green for remaining */}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></div>
                    Đã chi
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></div>
                    Còn lại
                  </div>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="statistics-chart-card">
                <div className="statistics-chart-title">Chi tiêu theo danh mục</div>
                <div style={{ width: '100%', height: 300, marginLeft: '-20px' }}>
                  <ResponsiveContainer>
                    <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} 
                        width={80}
                      />
                      <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                        {barData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </>
      )}

      <BottomNav />
    </div>
  );
};

export default Statistics;
