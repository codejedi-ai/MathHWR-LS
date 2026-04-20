import { useState, useEffect } from 'react';

interface NavbarProps {
  screenWidth?: number;
}

const Navbar = ({ screenWidth }: NavbarProps = {}) => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [username, setUsername] = useState<string | null>(null);

  // Handle navigation
  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout/', { method: 'POST', headers: { 'X-CSRFToken': getCookie('csrftoken') || '' } });
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout failed', err);
      window.location.href = '/login';
    }
  };

  const getCookie = (name: string) => {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
  };

  // Listen for browser navigation and user status
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);

    fetch('/api/user/')
      .then(res => res.json())
      .then(data => {
        if (data.username) setUsername(data.username);
      })
      .catch(() => {});

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
  const navItems = [
    { path: '/demo', label: 'Canvas' },
    { path: '/step', label: 'MIPS Step' },
    { path: '/registers', label: 'Registers' },
    { path: '/hex', label: 'Hex Input' },
  ];

  return (
    <header 
      style={{
        position: "fixed", 
        top: 0,
        left: 0,
        width: "100%",
        background: "rgba(0, 0, 0, 0.9)",
        backdropFilter: "blur(10px)",
        color: "white",
        padding: "15px 0",
        zIndex: 1000,
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
      }}
    >
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        width: "100%",
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "0 20px",
        gap: "20px",
        boxSizing: "border-box"
      }}>
        {/* Left: Logo and Title */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "10px",
          flexShrink: 0,
          cursor: "pointer"
        }} onClick={() => navigate('/')}>
          <div style={{ 
            fontSize: "24px",
            fontWeight: "bold",
            color: "#00ffff"
          }}>
            DARCY128
          </div>
        </div>
        
        {/* Center: Navigation */}
        <nav style={{ 
          display: "flex", 
          gap: "20px",
          flex: 1,
          justifyContent: "center"
        }}>
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                background: currentPath === item.path ? "rgba(0, 255, 255, 0.2)" : "transparent",
                border: currentPath === item.path ? "1px solid rgba(0, 255, 255, 0.5)" : "1px solid transparent",
                color: currentPath === item.path ? "#00ffff" : "white",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: currentPath === item.path ? "600" : "400",
                transition: "all 0.2s ease",
                textDecoration: "none"
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
        
        {/* Right: User status & Version */}
        <div style={{ 
          display: "flex", 
          alignItems: "center",
          flexShrink: 0,
          gap: "20px"
        }}>
          {username && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '13px', color: '#00ffff' }}>{username}</span>
              <button 
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 68, 68, 0.5)',
                  color: '#ff4444',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Logout
              </button>
            </div>
          )}
          <div style={{ 
            fontSize: "12px",
            color: "#888"
          }}>
            v0.1.0-alpha
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
