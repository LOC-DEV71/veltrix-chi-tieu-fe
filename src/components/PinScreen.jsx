import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import './PinScreen.css';
import { Lock, Delete, Fingerprint } from 'lucide-react';
import Swal from 'sweetalert2';

const PinScreen = () => {
  const { user, setPinVerified, updateUser } = useContext(AuthContext);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState(user?.hasPin ? 'verify' : 'setup-1');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pin.length === 6) {
      handlePinComplete(pin);
    }
  }, [pin]);

  const handlePinComplete = async (enteredPin) => {
    if (loading) return;
    
    if (step === 'verify') {
      verifyPin(enteredPin);
    } else if (step === 'setup-1') {
      setStep('setup-2');
      setConfirmPin(enteredPin);
      setPin('');
    } else if (step === 'setup-2') {
      if (enteredPin === confirmPin) {
        setupPin(enteredPin);
      } else {
        triggerError();
        Swal.fire('Lỗi', 'Mã PIN không khớp. Vui lòng nhập lại.', 'error');
        setStep('setup-1');
        setPin('');
        setConfirmPin('');
      }
    }
  };

  const triggerError = () => {
    setError(true);
    setTimeout(() => setError(false), 500);
  };

  const setupPin = async (finalPin) => {
    try {
      setLoading(true);
      await api.post('/auth/setup-pin', { pin: finalPin });
      updateUser({ ...user, hasPin: true });
      setPinVerified(true);
      Swal.fire({
        title: 'Thành công',
        text: 'Đã thiết lập mã PIN bảo vệ',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      triggerError();
      Swal.fire('Lỗi', err.response?.data?.message || 'Không thể thiết lập mã PIN', 'error');
      setStep('setup-1');
      setPin('');
      setConfirmPin('');
    } finally {
      setLoading(false);
    }
  };

  const verifyPin = async (enteredPin) => {
    try {
      setLoading(true);
      await api.post('/auth/verify-pin', { pin: enteredPin });
      setPinVerified(true);
    } catch (err) {
      triggerError();
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (num) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
      // Haptic feedback if available
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const getTitleText = () => {
    if (step === 'verify') return 'Nhập mã PIN để mở khóa';
    if (step === 'setup-1') return 'Thiết lập mã PIN 6 số';
    if (step === 'setup-2') return 'Xác nhận lại mã PIN';
    return '';
  };

  return (
    <div className="pin-screen-overlay">
      <div className="pin-container">
        <div className="pin-header">
          <div className="pin-icon">
            <Lock size={32} color="#818cf8" />
          </div>
          <h2 className="pin-title">{getTitleText()}</h2>
          <p className="pin-subtitle">
            {step === 'verify' ? 'Veltrix bảo vệ dữ liệu của bạn an toàn tuyệt đối' : 'Mã này sẽ được dùng để mở khóa ứng dụng của bạn'}
          </p>
        </div>

        <div className={`pin-dots ${error ? 'error-shake' : ''}`}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div 
              key={i} 
              className={`pin-dot ${i < pin.length ? 'filled' : ''}`}
            />
          ))}
        </div>

        {error && step === 'verify' && (
          <div className="pin-error-text">Mã PIN không chính xác</div>
        )}

        <div className="numpad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button 
              key={num} 
              className="numpad-btn" 
              onClick={() => handleKeyPress(num.toString())}
              disabled={loading}
            >
              {num}
            </button>
          ))}
          <button className="numpad-btn action-btn">
            {step === 'verify' && <Fingerprint size={28} />}
          </button>
          <button 
            className="numpad-btn" 
            onClick={() => handleKeyPress('0')}
            disabled={loading}
          >
            0
          </button>
          <button 
            className="numpad-btn action-btn" 
            onClick={handleDelete}
            disabled={loading || pin.length === 0}
          >
            <Delete size={28} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PinScreen;
