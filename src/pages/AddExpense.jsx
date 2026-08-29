import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, X, Check, Loader2 } from 'lucide-react';
import api from '../services/api';
import LoadingScreen from '../components/LoadingScreen';
import Swal from 'sweetalert2';

const AddExpense = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [categories, setCategories] = useState([]);
  const [budgetId, setBudgetId] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  React.useEffect(() => {
    const fetchBudgetData = async () => {
      try {
        const budgetRes = await api.get('/budgets/current').catch(err => {
          if (err.response && err.response.status === 404) return null;
          throw err;
        });
        
        if (budgetRes && budgetRes.data) {
          setBudgetId(budgetRes.data._id);
          if (budgetRes.data.categories) {
            setCategories(budgetRes.data.categories);
          } else {
            const catRes = await api.get(`/categories?budgetId=${budgetRes.data._id}`);
            setCategories(catRes.data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch budget or categories', err);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchBudgetData();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatAmount = (val) => {
    // Remove non-digits
    const num = val.replace(/\D/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleAmountChange = (e) => {
    setAmount(formatAmount(e.target.value));
  };

  if (isLoadingData) {
    return (
      <div style={{ padding: '80px 20px 20px', animation: 'pulse 1.5s ease-in-out infinite' }}>
        <div style={{ height: '56px', background: 'var(--skeleton-base)', borderRadius: '16px', marginBottom: '16px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ height: '80px', background: 'var(--skeleton-shine)', borderRadius: '16px' }} />
          ))}
        </div>
        <div style={{ height: '52px', background: 'var(--skeleton-base)', borderRadius: '16px' }} />
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !categoryId) return;
    
    setIsSubmitting(true);
    
    try {
      let receiptData = null;
      
      // 1. Upload receipt if exists
      if (receiptFile) {
        const formData = new FormData();
        formData.append('image', receiptFile);
        
        const uploadRes = await api.post('/uploads/receipt', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        receiptData = uploadRes.data;
      }
      
      // 2. Create Transaction
      const numAmount = parseInt(amount.replace(/\./g, ''), 10);
      
      const txRes = await api.post('/transactions', {
        budgetId,
        categoryId,
        amount: numAmount,
        note,
        receipt: receiptData
      });
      
      // Get the full category object to display in Success page
      const selectedCategory = categories.find(c => c._id === categoryId);
      const transactionData = { 
        ...txRes.data, 
        category: selectedCategory 
      };
      
      // Success
      navigate('/success', { state: { transaction: transactionData } });
    } catch (error) {
      console.error(error);
      
      // Xử lý khi bị AI chặn
      if (error.response?.status === 403 && error.response?.data?.blockedByAI) {
        // Bật hiệu ứng chớp đỏ
        document.body.classList.add('screen-blink-warning');
        setTimeout(() => document.body.classList.remove('screen-blink-warning'), 2500);

        Swal.fire({
          title: '⚠️ Cảnh báo từ AI!',
          text: error.response.data.message,
          imageUrl: 'https://cdn-icons-png.flaticon.com/512/4712/4712010.png',
          imageWidth: 80,
          imageHeight: 80,
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonText: 'Đến trang Chat',
          denyButtonText: 'Tiếp tục chi',
          cancelButtonText: 'Hủy',
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          confirmButtonColor: 'var(--accent-primary)',
          denyButtonColor: 'var(--accent-danger)',
          customClass: {
            popup: 'glass-panel'
          }
        }).then(async (result) => {
          if (result.isConfirmed) {
            navigate('/ai-chat');
          } else if (result.isDenied) {
            // Force save
            setIsSubmitting(true);
            try {
              const numAmount = parseInt(amount.replace(/\./g, ''), 10);
              const txRes = await api.post('/transactions', {
                budgetId,
                categoryId,
                amount: numAmount,
                note,
                force: true
              });
              const selectedCategory = categories.find(c => c._id === categoryId);
              navigate('/success', { state: { transaction: { ...txRes.data, category: selectedCategory } } });
            } catch (forceErr) {
              Swal.fire('Lỗi', 'Không thể thêm chi tiêu', 'error');
            } finally {
              setIsSubmitting(false);
            }
          }
        });
        return; // Dừng luồng xử lý lỗi mặc định
      }

      const errorMsg = error.response?.data?.message || error.message;
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: `Không thể thêm chi tiêu: ${errorMsg}`,
        background: '#18181b',
        color: '#fff',
        confirmButtonColor: '#ef4444',
        customClass: {
          popup: 'glass-panel'
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.iconBtn} onClick={() => navigate(-1)}>
          <X size={24} color="var(--text-primary)" />
        </button>
        <h2 style={styles.title}>Thêm chi tiêu</h2>
        <div style={{width: '40px'}}></div>
      </div>

      {!budgetId ? (
        <div style={{ 
          flex: 1,
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '20px', 
          color: 'var(--text-secondary)' 
        }}>
          <img 
            src="/xin-loi-khong-tien.webp" 
            alt="Không có tiền" 
            style={{ 
              width: '240px', 
              maxWidth: '80%', 
              marginBottom: '24px', 
              opacity: 0.9,
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
            }} 
          />
          <p style={{ textAlign: 'center', lineHeight: '1.6' }}>
            Bạn chưa có ngân sách nào cho tháng này.<br/>
            Vui lòng tạo ngân sách trước khi thêm chi tiêu.
          </p>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/setup-budget')}
            style={{ marginTop: '24px', padding: '12px 24px', borderRadius: '12px' }}
          >
            Tạo ngân sách ngay
          </button>
        </div>
      ) : (
      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Amount Input */}
        <div style={styles.amountContainer}>
          <span style={styles.currency}>đ</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={amount}
            onChange={handleAmountChange}
            style={styles.amountInput}
            autoFocus
          />
        </div>

        {/* Form Body - Glass Panel */}
        <div className="glass-panel" style={styles.formBody}>
          
          {/* Receipt Scanner */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Hóa đơn (Tùy chọn)</label>
            <div style={styles.receiptUploadBox} className={isSubmitting && receiptPreview ? 'receipt-scanning' : ''}>
              {receiptPreview ? (
                <div style={{...styles.previewContainer, zIndex: 1}}>
                  <img src={receiptPreview} alt="Receipt" style={styles.previewImg} />
                  {!isSubmitting && (
                    <button 
                      type="button" 
                      style={styles.removeImgBtn}
                      onClick={() => {
                        setReceiptFile(null);
                        setReceiptPreview(null);
                      }}
                    >
                      <X size={16} color="#fff" />
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <label htmlFor="receipt-upload" style={styles.uploadLabel}>
                    <Camera size={28} color="var(--accent-primary)" style={{marginBottom: '8px'}} />
                    <span style={styles.uploadText}>Chụp hoặc chọn ảnh</span>
                  </label>
                  <input
                    id="receipt-upload"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                </>
              )}
            </div>
          </div>

          {/* Category Selector */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Danh mục</label>
            <div style={styles.categoryGrid}>
              {categories.map(cat => (
                <div 
                  key={cat._id}
                  style={{
                    ...styles.categoryPill,
                    background: categoryId === cat._id 
                      ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' 
                      : 'rgba(255,255,255,0.05)',
                    borderColor: categoryId === cat._id ? 'transparent' : 'rgba(255,255,255,0.1)',
                  }}
                  onClick={() => setCategoryId(cat._id)}
                >
                  <span style={styles.catIcon}>{cat.icon}</span>
                  <span style={styles.catName}>{cat.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Note Input */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Ghi chú</label>
            <input 
              type="text"
              placeholder="Vd: Ăn trưa với đối tác"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={styles.textInput}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          className="btn btn-primary" 
          style={styles.submitBtn}
          disabled={!amount || !categoryId || isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <>
              <Check size={24} />
              Lưu giao dịch
            </>
          )}
        </button>
      </form>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg-primary)',
    paddingBottom: '40px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    cursor: 'pointer',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
  },
  form: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '0 20px',
  },
  amountContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '30px 0 40px 0',
  },
  currency: {
    fontSize: '42px',
    fontWeight: '700',
    color: 'var(--accent-primary)',
    marginRight: '8px',
    opacity: 0.8,
  },
  amountInput: {
    background: 'none',
    border: 'none',
    fontSize: '56px',
    fontWeight: '800',
    color: 'var(--text-primary)',
    width: '100%',
    textAlign: 'left',
    outline: 'none',
    caretColor: 'var(--accent-primary)',
  },
  formBody: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  label: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  receiptUploadBox: {
    width: '100%',
    minHeight: '120px',
    border: '2px dashed rgba(255,255,255,0.15)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    overflow: 'hidden',
    position: 'relative',
  },
  uploadLabel: {
    width: '100%',
    height: '120px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  uploadText: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  previewContainer: {
    width: '100%',
    height: '200px',
    position: 'relative',
  },
  previewImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  removeImgBtn: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: 'rgba(0,0,0,0.6)',
    border: 'none',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backdropFilter: 'blur(4px)',
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  categoryPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  catIcon: {
    fontSize: '18px',
  },
  catName: {
    fontSize: '14px',
    fontWeight: '500',
  },
  textInput: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '16px',
    color: 'var(--text-primary)',
    fontSize: '15px',
    outline: 'none',
    transition: 'var(--transition)',
  },
  submitBtn: {
    marginTop: '30px',
    padding: '18px',
    width: '100%',
    fontSize: '16px',
  }
};

export default AddExpense;
