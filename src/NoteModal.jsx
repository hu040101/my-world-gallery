import { useState } from 'react';
import { createPortal } from 'react-dom';

export default function NoteModal({ isOpen, initialNote, initialGroupId, groups, onClose, onSave }) {
  const [note, setNote] = useState(initialNote || '');
  const [groupId, setGroupId] = useState(initialGroupId || '');

  if (!isOpen) return null;

  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
        <h3>Edit Image Details</h3>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-color)' }}>
            Category
          </label>
          <select 
            value={groupId} 
            onChange={(e) => setGroupId(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: '8px', 
              border: '1px solid rgba(0,0,0,0.1)',
              background: 'rgba(255,255,255,0.8)',
              outline: 'none',
              fontFamily: 'inherit',
              color: 'var(--text-color)'
            }}
          >
            <option value="">None (Uncategorized)</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-color)' }}>
            Remark / Note
          </label>
          <textarea 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a beautiful remark for this image..."
            style={{ marginBottom: 0 }}
          />
        </div>

        <div className="modal-actions">
          <button className="cancel" onClick={onClose}>Cancel</button>
          <button onClick={() => onSave({ note, groupId: groupId || null })}>Save</button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
