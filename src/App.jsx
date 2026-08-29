import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoadingScreen from './components/LoadingScreen';
import Home from './pages/Home';
import Login from './pages/Login';
import AddExpense from './pages/AddExpense';
import Terms from './pages/Terms';
import SetupBudget from './pages/SetupBudget';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import History from './pages/History';
import Success from './pages/Success';
import TransactionDetail from './pages/TransactionDetail';
import Statistics from './pages/Statistics';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  // Only block if still doing initial auth check, then redirect if not logged in
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  
  return children;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/terms" element={<Terms />} />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Home />
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
      {/* Placeholder routes */}
      <Route path="/statistics" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      <Route path="/transaction/:id" element={<ProtectedRoute><TransactionDetail /></ProtectedRoute>} />
      <Route path="/success" element={<ProtectedRoute><Success /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
