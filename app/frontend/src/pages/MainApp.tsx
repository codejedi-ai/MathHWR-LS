import { useState, useRef, useEffect } from 'react';
import { Event } from '../types/Event';
import { Paper } from '../types/PageEntity';
import { workerManager } from '../utils/workerManager';

export default function MainApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load events from worker
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setIsLoading(true);
        const loadedEvents = await workerManager.fetchEvents();
        setEvents(loadedEvents);
        setPapers(loadedEvents.map(event => new Paper(event)));
      } catch (error) {
        console.error('Failed to load events:', error);
        // Fallback to empty state
        setEvents([]);
        setPapers([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();

    // Cleanup workers on unmount
    return () => {
      workerManager.destroy();
    };
  }, []);

  useEffect(() => {
    draw();
  }, [events, papers, selectedEvent]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 80;

    // Clear canvas with cork board background
    ctx.fillStyle = '#D2B48C';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw cork texture
    ctx.fillStyle = '#C19A6B';
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 3 + 1;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw wood grain lines
    ctx.strokeStyle = '#A0522D';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const y = (canvas.height / 8) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw papers using Paper class
    papers.forEach(paper => {
      paper.draw(ctx);
    });
  };




  const getEventAt = (x: number, y: number): { event: Event; index: number } | null => {
    for (let i = papers.length - 1; i >= 0; i--) {
      const paper = papers[i];
      if (paper.hitTest(x, y)) {
        return { event: events[i], index: i };
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const result = getEventAt(x, y);
    if (result) {
      const { event, index } = result;
      setSelectedEvent(event);
      setIsDragging(true);
      setDraggedEvent(event);
      setDragOffset({
        x: x - event.x,
        y: y - event.y
      });
    } else {
      setSelectedEvent(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !draggedEvent) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newX = x - dragOffset.x;
    const newY = y - dragOffset.y;

    // Update event position
    setEvents(prev => prev.map(event => 
      event.id === draggedEvent.id 
        ? { ...event, x: newX, y: newY }
        : event
    ));
    
    // Update papers array
    setPapers(prev => prev.map(paper => 
      paper.event.id === draggedEvent.id 
        ? new Paper({ ...draggedEvent, x: newX, y: newY })
        : paper
    ));
  };

  const handleMouseUp = async () => {
    if (draggedEvent) {
      try {
        // Use the latest coordinates from state (draggedEvent may be stale)
        const latest = events.find(e => e.id === draggedEvent.id);
        if (latest) {
          const oldX = draggedEvent.x;
          const oldY = draggedEvent.y;
          const newX = latest.x;
          const newY = latest.y;
          // Log movement with UUID
          console.log(`📌 Notion page ${latest.id} moved: (${oldX}, ${oldY}) → (${newX}, ${newY})`);
          await workerManager.updateEvent(latest.id, {
            x: newX,
            y: newY,
            // pass old coordinates along for worker-side logging
            // (these fields are ignored by Notion API but useful for diagnostics)
            // @ts-expect-error extra diagnostic fields for worker logging
            oldX,
            // @ts-expect-error extra diagnostic fields for worker logging
            oldY
          });
          console.log(`✅ Update enqueued for ${latest.id}`);
        }
      } catch (error) {
        console.error('Failed to update event coordinates:', error);
      }
    }
    
    setIsDragging(false);
    setDraggedEvent(null);
  };

  return (
    <div style={{ 
      height: '100vh', 
      backgroundColor: '#8B4513',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#654321',
        color: '#F5DEB3',
        padding: '15px 20px',
        borderBottom: '3px solid #8B4513',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontSize: '32px' }}>📌</div>
          <h1 style={{ 
            margin: 0, 
            fontSize: '28px', 
            fontWeight: 'bold',
            fontFamily: '"Comic Sans MS", cursive',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            UW-Rizzlers
          </h1>
          <span style={{
            backgroundColor: '#FF6B6B',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontFamily: '"Comic Sans MS", cursive',
            transform: 'rotate(-2deg)',
            boxShadow: '2px 2px 4px rgba(0,0,0,0.2)'
          }}>
            Community Board
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              backgroundColor: '#FF6B6B',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontFamily: '"Comic Sans MS", cursive',
              transform: 'rotate(1deg)',
              boxShadow: '3px 3px 6px rgba(0,0,0,0.2)',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'rotate(1deg) scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'rotate(1deg) scale(1)'}
          >
            📝 Post Event
          </button>
          
          <div style={{
            backgroundColor: '#DEB887',
            color: '#654321',
            padding: '8px 15px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '2px 2px 4px rgba(0,0,0,0.2)',
            border: '2px solid #CD853F'
          }}>
            <span style={{ fontSize: '20px' }}>🎓</span>
            <span style={{ 
              fontSize: '14px', 
              fontWeight: 'bold',
              fontFamily: '"Comic Sans MS", cursive'
            }}>
              UW Student
            </span>
          </div>
        </div>
      </header>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          cursor: isDragging ? 'grabbing' : 'grab',
          backgroundColor: '#D2B48C'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />

      {/* Sidebar */}
      {selectedEvent && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          width: '300px',
          backgroundColor: '#FFF8DC',
          color: '#654321',
          padding: '20px',
          borderRadius: '15px',
          boxShadow: '5px 5px 15px rgba(0,0,0,0.3)',
          border: '3px solid #DEB887',
          transform: 'rotate(-1deg)',
          maxHeight: '70vh',
          overflowY: 'auto',
          fontFamily: '"Comic Sans MS", cursive'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: '22px', 
              fontWeight: 'bold',
              color: '#8B4513'
            }}>
              {selectedEvent.title}
            </h3>
            <button
              onClick={() => setSelectedEvent(null)}
              style={{
                backgroundColor: '#FF6B6B',
                color: 'white',
                border: 'none',
                fontSize: '16px',
                cursor: 'pointer',
                padding: '5px 8px',
                borderRadius: '50%',
                fontWeight: 'bold'
              }}
            >
              ×
            </button>
          </div>
          
          <div style={{
            backgroundColor: '#FFE4B5',
            color: '#8B4513',
            padding: '6px 12px',
            borderRadius: '15px',
            display: 'inline-block',
            fontSize: '12px',
            fontWeight: 'bold',
            marginBottom: '15px',
            border: '2px solid #DEB887'
          }}>
            {selectedEvent.type}
          </div>
          
          <p style={{ 
            marginBottom: '15px', 
            lineHeight: '1.6', 
            color: '#654321',
            fontSize: '14px'
          }}>
            {selectedEvent.description}
          </p>
          
          <div style={{ marginBottom: '20px', color: '#8B4513' }}>
            <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📅</span>
              <span style={{ fontWeight: 'bold' }}>{selectedEvent.createdAt.toLocaleDateString()}</span>
            </div>
            {selectedEvent.time && (
              <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🕐</span>
                <span style={{ fontWeight: 'bold' }}>{selectedEvent.time}</span>
              </div>
            )}
            {selectedEvent.link && (
              <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔗</span>
                <span style={{ fontWeight: 'bold' }}>Has Link</span>
              </div>
            )}
          </div>
          
          
          {selectedEvent.link ? (
            <button
              onClick={() => window.open(selectedEvent.link, '_blank')}
              style={{
                backgroundColor: '#4ECDC4',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                width: '100%',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                fontFamily: '"Comic Sans MS", cursive',
                boxShadow: '3px 3px 6px rgba(0,0,0,0.2)',
                transform: 'rotate(0.5deg)'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'rotate(0.5deg) scale(1.02)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'rotate(0.5deg) scale(1)'}
            >
              🔗 Open Link
            </button>
          ) : (
            <div style={{
              backgroundColor: '#DEB887',
              color: '#8B4513',
              padding: '12px 24px',
              width: '100%',
              borderRadius: '20px',
              fontSize: '16px',
              fontWeight: 'bold',
              fontFamily: '"Comic Sans MS", cursive',
              textAlign: 'center',
              border: '2px solid #CD853F'
            }}>
              📝 No Link Available
            </div>
          )}
        </div>
      )}

      {/* Add Event Form Modal */}
      {showAddForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#FFF8DC',
            padding: '30px',
            borderRadius: '20px',
            width: '400px',
            maxWidth: '90vw',
            boxShadow: '10px 10px 20px rgba(0,0,0,0.3)',
            border: '3px solid #DEB887',
            transform: 'rotate(-1deg)',
            fontFamily: '"Comic Sans MS", cursive'
          }}>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              color: '#8B4513',
              fontSize: '24px',
              textAlign: 'center'
            }}>
              📝 Post New Event
            </h3>
            <p style={{ 
              color: '#654321', 
              textAlign: 'center', 
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              Share your event with the UW community!
            </p>
            <button
              onClick={() => setShowAddForm(false)}
              style={{
                backgroundColor: '#FF6B6B',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontFamily: '"Comic Sans MS", cursive',
                width: '100%',
                fontSize: '16px',
                boxShadow: '3px 3px 6px rgba(0,0,0,0.2)'
              }}
            >
              Close for Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}