import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPinVerified, setPinVerified] = useState(false);

  const fetchUser = async () => {
    try {
      // Capture token from URL if redirected from Google OAuth
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('token');
      
      if (tokenFromUrl) {
        localStorage.setItem('token', tokenFromUrl);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const { data } = await api.get('/auth/me');
      setUser(data);
      if (!data.hasPin) {
        setPinVerified(true);
      } else {
        const pinToken = localStorage.getItem('jwt_pin');
        if (pinToken) {
          try {
            const validateRes = await api.post('/auth/validate-pin-token', { pinToken });
            if (validateRes.data.isValid) {
              setPinVerified(true);
            } else {
              localStorage.removeItem('jwt_pin');
            }
          } catch (err) {
            localStorage.removeItem('jwt_pin');
          }
        }
      }
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const updateUser = (userData) => {
    setUser(userData);
  };

  const loginWithGoogle = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google`;
  };

  const loginWithEmail = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    setUser(data);
    
    // We should fetch auth/me to get the real hasPin status
    const meRes = await api.get('/auth/me');
    setUser(meRes.data);
    if (!meRes.data.hasPin) {
      setPinVerified(true);
    } else {
      localStorage.removeItem('jwt_pin');
      setPinVerified(false);
    }
    
    return data;
  };

  const registerWithEmail = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    setUser(data);
    setPinVerified(true); // new user definitely has no PIN
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('jwt_pin');
      setUser(null);
      setPinVerified(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isPinVerified, setPinVerified, loginWithGoogle, loginWithEmail, registerWithEmail, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
