import React from 'react';
import { Home, PieChart, FileText, Settings, Plus, Target } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <div style={styles.fabContainer}>
        <button 
          className="btn-primary" 
          style={styles.fab}
          onClick={() => navigate('/add-expense')}
        >
          <Plus size={28} color="#fff" />
        </button>
      </div>
      
      <div className="glass-panel" style={styles.nav}>
        <NavItem 
          icon={<Home size={24} />} 
          active={isActive('/')} 
          onClick={() => navigate('/')} 
        />
        <NavItem 
          icon={<PieChart size={24} />} 
          active={isActive('/statistics')} 
          onClick={() => navigate('/statistics')} 
        />
        <div style={{ width: '48px' }}></div> {/* Space for FAB */}
        <NavItem 
          icon={<FileText size={24} />} 
          active={isActive('/history')} 
          onClick={() => navigate('/history')} 
        />
        <NavItem 
          icon={<Target size={24} />} 
          active={isActive('/goals')} 
          onClick={() => navigate('/goals')} 
        />
        
        {/* Walking GIF */}
        <img src="/di-bo-cute.gif" alt="walking character" className="walking-gif" />
      </div>
    </>
  );
};

const NavItem = ({ icon, active, onClick }) => (
  <button 
    style={{...styles.navItem, color: active ? 'var(--accent-primary)' : 'var(--text-secondary)'}}
    onClick={onClick}
  >
    {icon}
  </button>
);

const styles = {
  nav: {
    position: 'fixed',
    bottom: '0',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: '480px',
    height: '70px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 20px',
    borderRadius: '24px 24px 0 0',
    borderBottom: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    zIndex: 100,
  },
  navItem: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transition: 'var(--transition)',
  },
  fabContainer: {
    position: 'fixed',
    bottom: '35px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 101,
  },
  fab: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 8px 25px rgba(59, 130, 246, 0.5)',
  }
};

export default BottomNav;
