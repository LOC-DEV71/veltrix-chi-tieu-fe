import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, ShieldAlert, Target } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import api from '../services/api';
import BottomNav from '../components/BottomNav';
import './AdvancedAnalytics.css';
import Swal from 'sweetalert2';

const AdvancedAnalytics = () => {
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics/daily');
      setReport(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: 'Lỗi',
        text: 'Không thể phân tích dữ liệu lúc này.',
        icon: 'error',
        background: 'var(--bg-secondary)',
        color: '#fff'
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score) => {
    if (score < 40) return '#10b981'; // Green
    if (score < 75) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getRiskText = (score) => {
    if (score < 40) return 'Thấp';
    if (score < 75) return 'Trung bình';
    return 'Cao';
  };

  const renderGauge = (score, title, icon) => {
    const data = [{ name: 'Risk', value: score, fill: getRiskColor(score) }];
    const riskLevel = getRiskText(score);
    
    let badgeClass = 'risk-low';
    if (score >= 40 && score < 75) badgeClass = 'risk-medium';
    if (score >= 75) badgeClass = 'risk-high';

    return (
      <div className="analytics-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          {icon}
          <div className="analytics-card-title" style={{ margin: 0 }}>{title}</div>
        </div>
        
        <div style={{ width: '200px', height: '200px', position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart 
              cx="50%" cy="50%" 
              innerRadius="70%" outerRadius="90%" 
              barSize={15} data={data} 
              startAngle={180} endAngle={0}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar 
                minAngle={15} 
                background={{ fill: 'var(--bg-glass)' }} 
                clockWise 
                dataKey="value" 
                cornerRadius={10}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -20%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center'
          }}>
            <span style={{ fontSize: '32px', fontWeight: 'bold', color: getRiskColor(score) }}>
              {score}
            </span>
          </div>
        </div>
        
        <div className={`risk-level-badge ${badgeClass}`}>
          Rủi ro: {riskLevel}
        </div>
      </div>
    );
  };

  return (
    <div className="advanced-analytics-container">
      {/* Background Effect */}
      <div 
        style={{
          position: 'absolute', top: '-150px', left: '50%', transform: 'translateX(-50%)',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0) 70%)',
          borderRadius: '50%', filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none',
        }}
      />

      <div className="advanced-analytics-header" style={{ position: 'relative', zIndex: 1 }}>
        <button className="analytics-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="analytics-title">Phân tích AI</h1>
      </div>

      <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
        {loading ? (
          <div className="ai-thinking">
            <Brain size={64} className="pulsing-brain" />
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
              Veltrix AI đang thu thập và phân tích<br/>dữ liệu chi tiêu của bạn...
            </p>
          </div>
        ) : report ? (
          <>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '13px' }}>
              Báo cáo ngày: {report.dateString.split('-').reverse().join('/')}
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {renderGauge(report.budgetRiskScore, 'Rủi ro Thu chi', <ShieldAlert size={20} color="var(--text-primary)" />)}
              {renderGauge(report.goalRiskScore, 'Rủi ro Mục tiêu', <Target size={20} color="var(--text-primary)" />)}
            </div>

            <div className="ai-commentary-box">
              <div className="ai-icon-container">
                <Brain size={24} />
              </div>
              <div className="ai-text-content">
                <div className="ai-text-title">
                  Nhận xét từ Veltrix AI
                </div>
                <div className="ai-text-body">
                  {report.aiCommentary}
                </div>
                
                {/* Meme vui vẻ khi hết tiền hoặc rủi ro cao */}
                {report.budgetRiskScore >= 80 && (
                  <div style={{ marginTop: '16px', textAlign: 'center' }}>
                    <img 
                      src="/xin-loi-khong-tien.webp" 
                      alt="Hết tiền rồi sếp ơi" 
                      style={{ maxWidth: '100%', borderRadius: '12px', border: '2px solid rgba(239, 68, 68, 0.3)' }}
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            Không có dữ liệu phân tích.
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default AdvancedAnalytics;
