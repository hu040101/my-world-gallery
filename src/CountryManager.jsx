import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { addCountry, deleteCountry, updateCountry, reorderCountries } from './store';

export default function CountryManager({ countries, activeCountryId, onSelect, loading, onCountriesChange }) {
  const [newCountry, setNewCountry] = useState('');
  const [adding, setAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [draggedIndex, setDraggedIndex] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, top: 0, left: 0, countryId: null });

  useEffect(() => {
    const handleClick = () => setContextMenu({ visible: false, top: 0, left: 0, countryId: null });
    window.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleClick, { passive: true });
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleClick);
    };
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCountry.trim()) return;
    
    setAdding(true);
    try {
      await addCountry(newCountry.trim());
      setNewCountry('');
      onCountriesChange();
    } catch (err) {
      console.error("Failed to add country:", err);
    } finally {
      setAdding(false);
    }
  };

  const handleContextMenu = (e, countryId) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    
    setContextMenu({
      visible: true,
      top: rect.top,
      left: rect.right + 10,
      countryId
    });
  };

  const handleDelete = async (id) => {
    if (confirm("确定要删除这个地区及它包含的所有图片吗？")) {
      try {
        await deleteCountry(id);
        onCountriesChange();
      } catch (err) {
        console.error("Failed to delete country:", err);
      }
    }
  };

  const handleRename = async (id) => {
    const country = countries.find(c => c.id === id);
    if (!country) return;
    
    const newName = window.prompt("请输入新的名称:", country.name);
    if (newName && newName.trim() && newName !== country.name) {
      try {
        await updateCountry(id, newName.trim());
        onCountriesChange();
      } catch (err) {
        console.error("Failed to rename country:", err);
      }
    }
  };

  const handleDragStart = (e, index) => {
    if (searchTerm) return; // Prevent drag during search
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e) => {
    if (searchTerm) return;
    e.target.style.opacity = '1';
    setDraggedIndex(null);
  };

  const handleDragOver = (e, index) => {
    if (searchTerm) return;
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, dropIndex) => {
    if (searchTerm) return;
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newCountries = [...countries];
    const draggedItem = newCountries[draggedIndex];
    
    newCountries.splice(draggedIndex, 1);
    newCountries.splice(dropIndex, 0, draggedItem);

    try {
      await reorderCountries(newCountries);
      onCountriesChange();
    } catch (err) {
      console.error("Failed to reorder:", err);
    }
  };

  const ContextMenuPortal = () => {
    if (!contextMenu.visible) return null;
    
    return createPortal(
      <div 
        className="glass-panel"
        style={{
          position: 'fixed',
          top: contextMenu.top,
          left: contextMenu.left,
          zIndex: 9999,
          padding: '8px 0',
          minWidth: '120px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <button 
          className="context-menu-btn"
          onClick={(e) => { e.stopPropagation(); handleRename(contextMenu.countryId); setContextMenu({visible: false}); }}
        >
          ✏️ 重命名
        </button>
        <button 
          className="context-menu-btn delete"
          onClick={(e) => { e.stopPropagation(); handleDelete(contextMenu.countryId); setContextMenu({visible: false}); }}
        >
          🗑️ 删除
        </button>
      </div>,
      document.body
    );
  };

  const filteredCountries = countries.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* Search Bar */}
      <div style={{ marginBottom: '1rem' }}>
        <input 
          type="text" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          placeholder="搜索地区..."
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '0.9rem',
            background: 'rgba(255, 255, 255, 0.4)',
            border: 'none',
            borderRadius: '8px',
            color: 'var(--text-color)',
            outline: 'none'
          }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center' }}><div className="loading-spinner"></div></div>
      ) : (
        <ul 
          className="country-list" 
          style={{ 
            position: 'relative',
            maxHeight: '230px', /* Exactly limits to ~5 items depending on line height and padding */
            overflowY: 'auto',
            /* Styles to hide scrollbar are in App.css */
            margin: 0,
            padding: 0
          }}
        >
          {filteredCountries.length === 0 && searchTerm ? (
            <li className="country-item" style={{ pointerEvents: 'none', opacity: 0.6, fontSize: '0.9rem' }}>
              未找到地区
            </li>
          ) : (
            filteredCountries.map((country, index) => (
              <li 
                key={country.id} 
                className={`country-item ${activeCountryId === country.id ? 'active' : ''}`}
                onClick={() => onSelect(country.id)}
                onContextMenu={(e) => handleContextMenu(e, country.id)}
                draggable={!searchTerm} // Only allow dragging if not searching
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                style={{ cursor: searchTerm ? 'pointer' : 'grab' }}
                title={searchTerm ? "右键菜单" : "长按拖拽排序，右键菜单"}
              >
                <span style={{ pointerEvents: 'none' }}>{country.name}</span>
              </li>
            ))
          )}
        </ul>
      )}

      <ContextMenuPortal />

      <form onSubmit={handleAdd} className="add-country-form" style={{ marginTop: 'auto', paddingTop: '2rem' }}>
        <input 
          type="text" 
          value={newCountry} 
          onChange={(e) => setNewCountry(e.target.value)} 
          placeholder="添加新地区..."
          disabled={adding}
        />
        <button type="submit" disabled={adding || !newCountry.trim()}>
          {adding ? '...' : '+ 添加'}
        </button>
      </form>
    </div>
  );
}
