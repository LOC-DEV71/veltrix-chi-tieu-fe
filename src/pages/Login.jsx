import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import './Login.css';

const Login = () => {
  const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Custom Validation
    const newErrors = {};
    if (!email.trim()) newErrors.email = "Vui lòng nhập địa chỉ email";
    if (!password) newErrors.password = "Vui lòng nhập mật khẩu";
    if (!isLogin && !name.trim()) newErrors.name = "Vui lòng nhập họ và tên";
    
    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }
    
    setFieldErrors({});
    setIsLoading(true);

    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(name, email, password);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Đã xảy ra lỗi, vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <main className="login-main">
        {/* Logo and Header */}
        <div className="login-header">
          <img 
            alt="MoneyFlow Logo" 
            className="login-logo" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB52tFEJb00VHZeg9W3OpXQBfF_zqZj_STjiwMf1xXYnvGyCaEvBG4DKCRQnkgbYsWuI11TcYqt6XlTm39txJEsOS3QlkhReE98moyAaA3M_6-hBRLPhmQPuEeRjnmF0Dw-UpobAhjSx8ZoXHsAtmPfv_ogic6-3GN4G2k4hRvzaiaaZt2jSzXy8r4aoIkSf2TBH0DcW3eXQfexAWSVn1nlndx6Nztq6FAYQuQdXpD-QIgVC-vwd8sZ"
          />
          <h2 className="login-title">
            {isLogin ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}
          </h2>
          <p className="login-subtitle">
            Quản lý tiền tệ. Kiểm soát ngân sách hiệu quả.
          </p>
        </div>

        <div className="login-card-container">
          <div className="login-glass-panel">
            
            {/* Google SSO */}
            <div>
              <button 
                type="button" 
                className="login-google-btn"
                onClick={loginWithGoogle}
              >
                <svg className="login-google-icon" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                </svg>
                Tiếp tục với Google
              </button>
            </div>

            <div className="login-divider">
              <div className="login-divider-line-container">
                <div className="login-divider-line"></div>
              </div>
              <div className="login-divider-text-container">
                <span className="login-divider-text">Hoặc tiếp tục với</span>
              </div>
            </div>

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="login-form">
              
              {!isLogin && (
                <div>
                  <label htmlFor="name" className="login-label">Họ và tên</label>
                  <div className="login-input-wrapper">
                    <input 
                      id="name" 
                      name="name" 
                      type="text" 
                      className={`login-input ${fieldErrors.name ? 'input-error' : ''}`} 
                      placeholder="Nguyễn Văn A" 
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (fieldErrors.name) setFieldErrors({...fieldErrors, name: null});
                      }}
                    />
                    {fieldErrors.name && <div className="field-error-text">{fieldErrors.name}</div>}
                  </div>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label htmlFor="email" className="login-label">Địa chỉ Email</label>
                <div className="login-input-wrapper">
                  <input 
                    id="email" 
                    name="email" 
                    type="email" 
                    autoComplete="email" 
                    className={`login-input ${fieldErrors.email ? 'input-error' : ''}`} 
                    placeholder="name@example.com" 
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors({...fieldErrors, email: null});
                    }}
                  />
                  {fieldErrors.email && <div className="field-error-text">{fieldErrors.email}</div>}
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="login-password-header">
                  <label htmlFor="password" className="login-label" style={{ marginBottom: 0 }}>Mật khẩu</label>
                  {isLogin && (
                    <div className="text-sm">
                      <a href="#" className="login-forgot-link">Quên mật khẩu?</a>
                    </div>
                  )}
                </div>
                <div className="login-input-wrapper" style={{ marginTop: '8px' }}>
                  <input 
                    id="password" 
                    name="password" 
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password" 
                    className={`login-input has-icon ${fieldErrors.password ? 'input-error' : ''}`} 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors({...fieldErrors, password: null});
                    }}
                  />
                  <div 
                    className="login-visibility-toggle" 
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span 
                      className="material-symbols-outlined" 
                      style={{ fontVariationSettings: "'FILL' 0" }}
                    >
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </div>
                </div>
                {fieldErrors.password && <div className="field-error-text">{fieldErrors.password}</div>}
              </div>

              {/* Sign In Button */}
              <div className="login-submit-container">
                <button 
                  type="submit" 
                  className="login-submit-btn" 
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Đăng nhập' : 'Đăng ký')}
                </button>
              </div>

            </form>

            {/* Sign Up Link */}
            <div className="login-footer-text">
              {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
              <span 
                className="login-footer-link" 
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
              >
                {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
              </span>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="login-page-footer">
        <p className="login-terms">
          Bằng việc tiếp tục, bạn đồng ý với <Link to="/terms">Điều khoản Dịch vụ</Link> và <Link to="/terms">Chính sách Bảo mật</Link> của chúng tôi.
        </p>
        <p className="login-copyright">
          © 2024 MoneyFlow Inc. Security & Privacy Guaranteed.
        </p>
      </footer>
    </div>
  );
};

export default Login;
