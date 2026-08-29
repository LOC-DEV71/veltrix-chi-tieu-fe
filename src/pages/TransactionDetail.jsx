import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Download, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import './Success.css';

const TransactionDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { transaction } = location.state || {};
  const [showReceipt, setShowReceipt] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const receiptRef = useRef(null);

  // If accessed directly without state, go back
  if (!transaction) {
    navigate('/history', { replace: true });
    return null;
  }

  const formatCurrency = (amount) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    
    try {
      setIsCapturing(true);
      // Wait for font/layout to stabilize
      await new Promise(r => setTimeout(r, 100));
      
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#09090b', // Match var(--bg-primary)
        scale: 2, // High resolution
        useCORS: true,
        logging: false
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsCapturing(false);
          return;
        }
        
        const fileName = `BienLai_${transaction._id.substring(0,6)}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });

        // iOS Safari & Mobile standard: Share API
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'Biên lai giao dịch'
            });
          } catch (error) {
            console.error('Lỗi khi share ảnh:', error);
          }
        } else {
          // Fallback for Desktop/Unsupported browsers
          const image = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = image;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(image);
        }
        setIsCapturing(false);
      }, 'image/png');

    } catch (error) {
      console.error('Lỗi khi tạo ảnh biên lai:', error);
      setIsCapturing(false);
    }
  };

  return (
    <div className="success-container" style={{ paddingTop: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px', display: 'flex', justifyContent: 'space-between', zIndex: 10, paddingBottom: '20px' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px' }}
        >
          <ArrowLeft size={24} />
        </button>
        <span style={{ fontWeight: 600, fontSize: '16px', display: 'flex', alignItems: 'center' }}>Chi tiết giao dịch</span>
        <div style={{ width: '40px' }}></div>
      </div>

      <div ref={receiptRef} style={{ width: '100%', maxWidth: '400px', padding: '20px', borderRadius: '24px', position: 'relative' }}>
        {/* Glow effect for capture */}
        <div style={{
          position: 'absolute', top: '-50px', left: '50%', transform: 'translateX(-50%)',
          width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
          borderRadius: '50%', zIndex: 0
        }}></div>

        <div className="success-header" style={{ marginTop: '0', zIndex: 1, position: 'relative', opacity: 1, animation: 'none', transform: 'none' }}>
          <div className="success-icon-wrapper" style={{ width: '64px', height: '64px', marginBottom: '16px', opacity: 1, animation: 'none', transform: 'none' }}>
            <CheckCircle2 size={36} color="#10b981" />
          </div>
          <h1 className="success-title">Thành công</h1>
          <div className="success-amount">-{formatCurrency(transaction.amount)}đ</div>
        </div>

        <div className="success-card" style={{ zIndex: 1, position: 'relative', margin: '0 auto', opacity: 1, animation: 'none', transform: 'none', backgroundColor: '#18181b' }}>
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
            {transaction.category?.icon || transaction.categoryId?.icon} {transaction.category?.name || transaction.categoryId?.name}
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

      </div>

      <div className="success-actions" style={{ marginTop: '30px' }}>
        <button 
          className="btn btn-primary" 
          onClick={handleDownload} 
          disabled={isCapturing}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
        >
          {isCapturing ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />} 
          {isCapturing ? 'Đang tạo ảnh...' : 'Lưu ảnh biên lai'}
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

export default TransactionDetail;
