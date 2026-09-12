import React, { useState, useRef, useEffect } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import './CustomSelect.css';

const CustomSelect = ({ value, onChange, options, placeholder, style, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const containerRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        if (query !== value) {
          onChange({ target: { value: query } });
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [query, value, onChange]);

  const handleSelect = (val) => {
    setQuery(val);
    onChange({ target: { value: val } });
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onChange({ target: { value: query } });
      setIsOpen(false);
    }
  };

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes((query || '').toLowerCase())
  );
  
  const showCustomOption = query && !options.some(opt => opt.label.toLowerCase() === query.toLowerCase());

  return (
    <div className={`custom-select-container ${className || ''}`} ref={containerRef} style={style}>
      <div 
        className={`custom-select-header ${isOpen ? 'open' : ''}`} 
        onClick={() => setIsOpen(true)}
      >
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Select or type...'}
          style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, color: 'inherit', fontSize: 'inherit', padding: 0, fontFamily: 'inherit' }}
        />
        <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}>
          <FiChevronDown className={`custom-select-icon ${isOpen ? 'open' : ''}`} />
        </div>
      </div>
      {isOpen && (
        <div className="custom-select-dropdown">
          <ul className="custom-select-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => (
                <li 
                  key={idx} 
                  className={`custom-select-option ${value === opt.value ? 'selected' : ''}`}
                  onClick={() => handleSelect(opt.value)}
                >
                  {opt.label}
                </li>
              ))
            ) : !showCustomOption ? (
              <li className="custom-select-option" style={{ color: 'var(--text-3)', pointerEvents: 'none' }}>No options found</li>
            ) : null}
            {showCustomOption && (
              <li 
                className="custom-select-option"
                onClick={() => handleSelect(query)}
                style={{ color: 'var(--blue)', fontWeight: 500 }}
              >
                Use "{query}"
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
