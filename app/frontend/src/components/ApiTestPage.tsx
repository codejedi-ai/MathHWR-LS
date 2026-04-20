import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { Event } from '../types/Event';

const ApiTestPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testUpdate, setTestUpdate] = useState<{ pageId: string; x: number; y: number } | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedEvents = await apiService.fetchPages();
      setEvents(fetchedEvents);
      console.log('Fetched events:', fetchedEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const testUpdateCoordinates = async (event: Event) => {
    const newX = Math.floor(Math.random() * 500) + 100;
    const newY = Math.floor(Math.random() * 300) + 100;
    
    setTestUpdate({ pageId: event.id, x: newX, y: newY });
    
    try {
      await apiService.updateWorkerCoordinates(event.id, newX, newY);
      console.log(`Updated ${event.title} to (${newX}, ${newY})`);
      // Refresh events to see the update
      await fetchEvents();
    } catch (err) {
      console.error('Error updating coordinates:', err);
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>API Test Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={fetchEvents} 
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Loading...' : 'Fetch Events from API'}
        </button>
      </div>

      {error && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '10px', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          Error: {error}
        </div>
      )}

      <div>
        <h2>Events from Notion API ({events.length})</h2>
        {events.length === 0 && !loading && (
          <p>No events found. Make sure your Notion database has pages with the correct properties.</p>
        )}
        
        {events.map((event, index) => (
          <div 
            key={event.id} 
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '10px',
              backgroundColor: event.color || '#f8f9fa'
            }}
          >
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{event.title}</h3>
            <p style={{ margin: '0 0 10px 0', color: '#666' }}>{event.description}</p>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
              <div>ID: {event.id}</div>
              <div>Type: {event.type}</div>
              <div>Position: ({event.x}, {event.y})</div>
              <div>Created: {event.createdAt.toLocaleDateString()}</div>
              {event.link && <div>Link: <a href={event.link} target="_blank" rel="noopener noreferrer">{event.link}</a></div>}
            </div>
            
            <button
              onClick={() => testUpdateCoordinates(event)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Test Update Coordinates
            </button>
          </div>
        ))}
      </div>

      {testUpdate && (
        <div style={{
          backgroundColor: '#d4edda',
          color: '#155724',
          padding: '10px',
          borderRadius: '4px',
          marginTop: '20px'
        }}>
          Last update: Page {testUpdate.pageId} moved to ({testUpdate.x}, {testUpdate.y})
        </div>
      )}
    </div>
  );
};

export default ApiTestPage;