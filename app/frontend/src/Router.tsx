import { useState, useEffect } from 'preact/hooks';
import App from './App';
import FeaturesPage from './pages/pages/features';
import MIPS32CodeViewer from './components/MIPS32CodeViewer';
import RegisterView from './components/RegisterView';
import HexProgramInput from './components/HexProgramInput';
import LoginPage from './pages/LoginPage';

export default function Router() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    
    // Check authentication status
    fetch('/api/user/')
      .then(res => res.json())
      .then(data => {
        if (data.username) {
          setUser(data.username);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  const onLoginSuccess = (username: string) => {
    setUser(username);
    navigate('/');
  };

  if (loading) {
    return <div style={{ color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#000' }}>Loading...</div>;
  }

  if (currentPath === '/login') {
    return <LoginPage onLoginSuccess={onLoginSuccess} />;
  }

  // Protect routes
  if (!user) {
    return <LoginPage onLoginSuccess={onLoginSuccess} />;
  }

  // Route to canvas demo
  if (currentPath === '/demo' || currentPath === '/canvas') {
    return <App onNavigate={navigate} />;
  }

  // Route to MIPS instruction stepping (uses MIPS32CodeViewer)
  if (currentPath === '/step' || currentPath === '/mips-step') {
    return <MIPS32CodeViewer />;
  }

  // Route to Register View
  if (currentPath === '/registers' || currentPath === '/register-view') {
    return <RegisterView />;
  }

  // Route to Hex Program Input
  if (currentPath === '/hex' || currentPath === '/hex-input') {
    return <HexProgramInput />;
  }

  // Home -> Features (now hosts test suite)
  if (currentPath === '/' || currentPath === '/features') {
    return <FeaturesPage />;
  }

  // Default
  return <FeaturesPage />;
}
