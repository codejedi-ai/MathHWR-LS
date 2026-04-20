import { useState, useRef, useEffect } from 'preact/hooks';

interface DropdownItem {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  variant?: 'default' | 'danger';
}

interface DropdownMenuProps {
  items: DropdownItem[];
  buttonIcon: string;
  buttonTitle: string;
}

export default function DropdownMenu({ items, buttonIcon, buttonTitle }: DropdownMenuProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect((): (() => void) => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return (): void => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (action: () => void): void => {
    action();
    setIsOpen(false);
  };

  const handleButtonClick = (): void => {
    setIsOpen(!isOpen);
  };

  const handleItemMouseOver = (e: MouseEvent, item: DropdownItem): void => {
    const target = e.currentTarget as HTMLButtonElement;
    target.style.backgroundColor = item.variant === 'danger' ? '#ff4444' : '#444444';
    target.style.color = 'white';
  };

  const handleItemMouseOut = (e: MouseEvent, item: DropdownItem): void => {
    const target = e.currentTarget as HTMLButtonElement;
    target.style.backgroundColor = 'transparent';
    target.style.color = item.variant === 'danger' ? '#ff6b6b' : 'white';
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Dropdown Button */}
      <button
        className="navbar-buttons"
        onClick={handleButtonClick}
        title={buttonTitle}
        style={{
          background: isOpen ? '#444444' : '#333333',
          borderColor: isOpen ? '#666666' : '#555555'
        }}
      >
        {buttonIcon}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: '60px',
          right: '20px',
          backgroundColor: '#2c2c2c',
          border: '2px solid #555555',
          borderRadius: '8px',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
          minWidth: '200px',
          overflow: 'hidden'
        }}>
          {items.map((item: DropdownItem, index: number) => (
            <button
              key={item.id}
              onClick={(): void => handleItemClick(item.action)}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'transparent',
                color: item.variant === 'danger' ? '#ff6b6b' : 'white',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s ease',
                borderBottom: index < items.length - 1 ? '1px solid #444444' : 'none'
              }}
              onMouseOver={(e: MouseEvent): void => handleItemMouseOver(e, item)}
              onMouseOut={(e: MouseEvent): void => handleItemMouseOut(e, item)}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
