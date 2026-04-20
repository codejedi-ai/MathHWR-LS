import { useState, useEffect } from 'preact/hooks';
import ApiTestPage from '../components/ApiTestPage';

interface AdminStats {
  totalEvents: number;
  totalPapers: number;
  apiCalls: number;
  lastDeployment: string;
}

interface AdminPageProps {
  onNavigate?: (path: string) => void;
}

export default function AdminPage({ onNavigate }: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'api-test' | 'events' | 'settings'>('api-test');
  const [stats, setStats] = useState<AdminStats>({
    totalEvents: 0,
    totalPapers: 0,
    apiCalls: 0,
    lastDeployment: 'Unknown'
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load admin stats
  useEffect(() => {
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    setIsLoading(true);
    try {
      // Simulate loading stats - in a real app, these would come from your API
      const mockStats: AdminStats = {
        totalEvents: Math.floor(Math.random() * 100) + 50,
        totalPapers: Math.floor(Math.random() * 200) + 100,
        apiCalls: Math.floor(Math.random() * 1000) + 500,
        lastDeployment: new Date().toLocaleString()
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to load admin stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStats = () => {
    loadAdminStats();
  };

  const renderOverview = () => (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ margin: 0, color: '#333' }}>📊 Admin Overview</h2>
        <button
          onClick={refreshStats}
          disabled={isLoading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          {isLoading ? '⏳ Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
          <p>Loading admin statistics...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #28a745'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#28a745' }}>📅 Total Events</h3>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>{stats.totalEvents}</div>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>Active events on the board</p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #17a2b8'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#17a2b8' }}>📄 Total Papers</h3>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>{stats.totalPapers}</div>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>Paper items created</p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #ffc107'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#ffc107' }}>🔌 API Calls</h3>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>{stats.apiCalls}</div>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>Total API requests made</p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #6f42c1'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#6f42c1' }}>🚀 Last Deployment</h3>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>{stats.lastDeployment}</div>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>Most recent site update</p>
          </div>
        </div>
      )}

      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>🛠️ Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <button
            onClick={() => setActiveTab('api-test')}
            style={{
              padding: '15px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
          >
            🧪 Test API Endpoints
          </button>
          <button
            onClick={() => setActiveTab('events')}
            style={{
              padding: '15px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1e7e34'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
          >
            📅 Manage Events
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              padding: '15px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#545b62'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6c757d'}
          >
            ⚙️ Settings
          </button>
        </div>
      </div>
    </div>
  );

  const renderEvents = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>📅 Event Management</h2>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '15px' }}>🚧</div>
        <h3 style={{ color: '#666', marginBottom: '10px' }}>Coming Soon</h3>
        <p style={{ color: '#666' }}>Event management features will be available here.</p>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>⚙️ Admin Settings</h2>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>🔧 Configuration</h3>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>API Base URL:</label>
          <input
            type="text"
            value={window.location.origin}
            readOnly
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#f8f9fa'
            }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Environment:</label>
          <input
            type="text"
            value={window.location.hostname === 'localhost' ? 'Development' : 'Production'}
            readOnly
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#f8f9fa'
            }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Version:</label>
          <input
            type="text"
            value="1.0.0"
            readOnly
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#f8f9fa'
            }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#343a40',
        color: 'white',
        padding: '15px 20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '24px' }}>🧪 API Test Panel</h1>
          <button
            onClick={() => onNavigate?.('/')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← Back to App
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #dee2e6',
        padding: '0 20px'
      }}>
        <div style={{ display: 'flex', gap: '0' }}>
          {[
            { id: 'overview', label: '📊 Overview', icon: '📊' },
            { id: 'api-test', label: '🧪 API Test', icon: '🧪' },
            { id: 'events', label: '📅 Events', icon: '📅' },
            { id: 'settings', label: '⚙️ Settings', icon: '⚙️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '15px 20px',
                backgroundColor: activeTab === tab.id ? '#007bff' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#333',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                borderBottom: activeTab === tab.id ? '3px solid #0056b3' : '3px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'api-test' && <ApiTestPage />}
        {activeTab === 'events' && renderEvents()}
        {activeTab === 'settings' && renderSettings()}
      </main>
    </div>
  );
}
