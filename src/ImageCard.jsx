import { useState } from 'react';
import NoteModal from './NoteModal';

export default function ImageCard({ 
  image, country, groups, 
  onDelete, onUpdate, onImageClick,
  isSelectMode, isSelected, onToggleSelect
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Find category name for badge
  const categoryName = groups.find(g => g.id === image.groupId)?.name;

  return (
    <>
      <div 
        className={`image-card ${isSelectMode ? 'selectable' : ''} ${isSelected ? 'selected' : ''}`}
        onClick={() => {
          if (isSelectMode) {
            onToggleSelect(image.id);
          } else {
            onImageClick(image);
          }
        }}
      >
        <img 
          src={image.url} 
          alt={image.name} 
          loading="lazy" 
          style={{ cursor: isSelectMode ? 'pointer' : 'zoom-in' }}
        />
        
        {/* Category Badge */}
        {categoryName && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'var(--accent-color)',
            color: 'white',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '0.8rem',
            fontWeight: '600',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}>
            {categoryName}
          </div>
        )}

        {/* Hide overlay buttons in select mode to prevent accidental clicks */}
        {!isSelectMode && (
          <div className="image-overlay">
            <button 
              className="note-btn" 
              onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
            >
              Edit Details
            </button>

            <button 
              className="delete-btn" 
              style={{ background: 'rgba(0,0,0,0.5)', color: 'white', marginLeft: 'auto' }}
              onClick={(e) => { e.stopPropagation(); onDelete(image); }}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <NoteModal 
        isOpen={isModalOpen} 
        initialNote={image.note} 
        initialGroupId={image.groupId}
        groups={groups}
        onClose={() => setIsModalOpen(false)}
        onSave={(updates) => {
          onUpdate(image, updates);
          setIsModalOpen(false);
        }}
      />
    </>
  );
}
