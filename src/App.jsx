import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import VortexOverlay from './components/VortexOverlay';
import LoadingScreen from './components/LoadingScreen';
import Home from './pages/Home';
import Login from './pages/Login';
import AddExpense from './pages/AddExpense';
import Terms from './pages/Terms';
import SetupBudget from './pages/SetupBudget';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import History from './pages/History';
import Goals from './pages/Goals';
import Success from './pages/Success';
import Feed from './pages/Feed';
import AddFriend from './pages/AddFriend';
import TransactionDetail from './pages/TransactionDetail';
import Statistics from './pages/Statistics';
import AiChat from './pages/AiChat';
import ChatList from './pages/ChatList';
import ChatRoom from './pages/ChatRoom';
import AdvancedAnalytics from './pages/AdvancedAnalytics';
import PushNotificationManager from './components/PushNotificationManager';
import PinScreen from './components/PinScreen';
import VersionChecker from './components/VersionChecker';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading, isPinVerified } = useAuth();
  
  // Only block if still doing initial auth check, then redirect if not logged in
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isPinVerified) return <PinScreen />;
  
  return children;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const { theme } = useTheme();

  if (loading) return <LoadingScreen />;

  return (
    <>
      {/* Background Layer */}
      {user?.customBg && (
        <div style={{
          position: 'fixed',
          top: 0, 
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '480px',
          height: '100vh',
          opacity: theme === 'dark' ? 0.35 : 0.45,
          zIndex: -1,
          pointerEvents: 'none',
          overflow: 'hidden'
        }}>
          {user.customBg.includes('/video/upload/') || user.customBg.match(/\.(mp4|webm|mov)$/i) ? (
            <video 
              src={user.customBg} 
              autoPlay 
              loop 
              muted 
              playsInline 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div 
              className="bg-image" 
              style={{ 
                width: '100%',
                height: '100%',
                backgroundImage: `url(${user.customBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }} 
            />
          )}
        </div>
      )}
      <VersionChecker />
      <PushNotificationManager user={user} />
      <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/terms" element={<Terms />} />
      
      {/* Friend Share Link Route (requires login to accept, but can be viewed) */}
      <Route path="/add-friend/:id" element={
        <ProtectedRoute>
          <AddFriend />
        </ProtectedRoute>
      } />
      
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/history" 
        element={
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/goals" 
        element={
          <ProtectedRoute>
            <Goals />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/ai-chat" 
        element={
          <ProtectedRoute>
            <AiChat />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/setup-budget" 
        element={
          <ProtectedRoute>
            <SetupBudget />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/add-expense" 
        element={
          <ProtectedRoute>
            <AddExpense />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/feed" 
        element={
          <ProtectedRoute>
            <Feed />
          </ProtectedRoute>
        } 
      />
      {/* Placeholder routes */}
      <Route path="/statistics" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
      <Route path="/advanced-analytics" element={<ProtectedRoute><AdvancedAnalytics /></ProtectedRoute>} />
      <Route path="/ai-chat" element={<ProtectedRoute><AiChat /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><ChatList /></ProtectedRoute>} />
      <Route path="/chat/:friendId" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
      <Route path="/transaction/:id" element={<ProtectedRoute><TransactionDetail /></ProtectedRoute>} />
      <Route path="/success" element={<ProtectedRoute><Success /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
    </Routes>
    </>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <VortexOverlay />
            <AppRoutes />
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
