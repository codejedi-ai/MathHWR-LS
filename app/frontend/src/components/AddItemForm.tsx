import React, { useState } from 'react';

interface AddItemFormProps {
  onSubmit: (title: string, description: string, link: string, buttonColor: string, type: 'event' | 'community', time?: string) => void;
  onCancel: () => void;
  screenWidth: number;
}

export default function AddItemForm({ onSubmit, onCancel, screenWidth }: AddItemFormProps) {
  const [type, setType] = useState<'event' | 'community'>('event');
  const [time, setTime] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    onSubmit(
      formData.get('title') as string,
      formData.get('description') as string,
      formData.get('link') as string,
      formData.get('buttonColor') as string,
      type,
      type === 'event' ? time : undefined
    );
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 2000
    }}>
      <div style={{
        background: "white",
        padding: screenWidth < 768 ? "15px" : "20px",
        borderRadius: "8px",
        width: screenWidth < 768 ? "90vw" : "400px",
        maxWidth: "400px"
      }}>
        <h3>Add New {type === 'event' ? 'Event' : 'Community'}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "10px" }}>
            <label>Type:</label>
            <select 
              value={type} 
              onChange={(e) => setType((e.target as HTMLSelectElement).value as 'event' | 'community')}
              style={{ width: "100%", padding: "5px", marginTop: "5px" }}
            >
              <option value="event">Event</option>
              <option value="community">Community</option>
            </select>
          </div>
          
          <div style={{ marginBottom: "10px" }}>
            <label>Title:</label>
            <input name="title" required style={{ width: "100%", padding: "5px", marginTop: "5px" }} />
          </div>
          
          <div style={{ marginBottom: "10px" }}>
            <label>Description:</label>
            <textarea name="description" required style={{ width: "100%", padding: "5px", marginTop: "5px", height: "60px" }} />
          </div>
          
          {type === 'event' && (
            <div style={{ marginBottom: "10px" }}>
              <label>Time:</label>
              <input 
                type="datetime-local" 
                value={time} 
                onChange={(e) => setTime((e.target as HTMLInputElement).value)}
                style={{ width: "100%", padding: "5px", marginTop: "5px" }} 
              />
            </div>
          )}
          
          <div style={{ marginBottom: "10px" }}>
            <label>
              {type === 'event' ? 'Event Link (Luma or GetRiver):' : 'Community Link:'}
            </label>
            <input 
              name="link" 
              type="url" 
              placeholder={type === 'event' ? 'https://lu.ma/your-event or https://app.getriver.io/your-event' : 'https://your-website.com or https://discord.gg/invite'} 
              style={{ width: "100%", padding: "5px", marginTop: "5px" }} 
            />
            {type === 'event' && (
              <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                💡 We'll automatically detect if it's Luma or GetRiver
              </div>
            )}
          </div>
          
          <div style={{ marginBottom: "10px" }}>
            <label>Button Color:</label>
            <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
              <input name="buttonColor" type="color" defaultValue="#4CAF50" style={{ width: "50px", height: "30px", border: "none", borderRadius: "4px" }} />
              <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                {["#4CAF50", "#5865F2", "#FF6B35", "#E51937", "#9C27B0", "#FF9800", "#2196F3", "#F44336"].map(color => (
                  <div
                    key={color}
                    style={{
                      width: "20px",
                      height: "20px",
                      backgroundColor: color,
                      borderRadius: "3px",
                      cursor: "pointer",
                      border: "2px solid #ccc"
                    }}
                    onClick={() => {
                      const colorInput = document.querySelector('input[name="buttonColor"]') as HTMLInputElement;
                      if (colorInput) colorInput.value = color;
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="submit" style={{ background: "#8B4513", color: "white", border: "none", padding: "8px 16px", borderRadius: "4px", cursor: "pointer" }}>
              Add {type === 'event' ? 'Event' : 'Community'}
            </button>
            <button type="button" onClick={onCancel} style={{ background: "#ccc", border: "none", padding: "8px 16px", borderRadius: "4px", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
