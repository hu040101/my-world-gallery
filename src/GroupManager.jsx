import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getGroups, addGroup, deleteGroup, updateGroup, reorderGroups } from './store';

export default function GroupManager({ countryId, activeGroupId, onSelectGroup, onGroupsChanged }) {
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [adding, setAdding] = useState(false);

  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState({ visible: false, top: 0, left: 0, groupId: null });

  const fetchGroups = async () => {
    if (!countryId) return;
    const data = await getGroups(countryId);
    setGroups(data);
  };

  useEffect(() => {
    fetchGroups();
  }, [countryId]);

  useEffect(() => {
    const handleClick = () => setContextMenu({ visible: false, top: 0, left: 0, groupId: null });
    window.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleClick, { passive: true });
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleClick);
    };
  }, []);

  const handleAddGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    
    setAdding(true);
    try {
      await addGroup(countryId, newGroupName.trim());
      setNewGroupName('');
      fetchGroups();
    } catch (err) {
      console.error("Failed to add group:", err);
    } finally {
      setAdding(false);
    }
  };

  const handleContextMenu = (e, groupId) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    
    setContextMenu({
      visible: true,
      top: rect.top,
      left: rect.right + 10,
      groupId
    });
  };

  const handleDeleteGroup = async (groupId) => {
    if (confirm("确定要删除这个分类及它包含的所有图片吗？")) {
      try {
        await deleteGroup(countryId, groupId);
        if (activeGroupId === groupId) {
          onSelectGroup(null);
        }
        fetchGroups();
        if (onGroupsChanged) onGroupsChanged();
      } catch (err) {
        console.error("Failed to delete group:", err);
      }
    }
  };

  const handleRename = async (groupId) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    
    const newName = window.prompt("请输入新的名称:", group.name);
    if (newName && newName.trim() && newName !== group.name) {
      try {
        await updateGroup(countryId, groupId, newName.trim());
        fetchGroups();
      } catch (err) {
        console.error("Failed to rename group:", err);
      }
    }
  };

  // Drag and Drop logic
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newGroups = [...groups];
    const draggedItem = newGroups[draggedIndex];
    
    newGroups.splice(draggedIndex, 1);
    newGroups.splice(dropIndex, 0, draggedItem);

    try {
      await reorderGroups(countryId, newGroups);
      fetchGroups();
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
          onClick={(e) => { e.stopPropagation(); handleRename(contextMenu.groupId); setContextMenu({visible: false}); }}
        >
          ✏️ 重命名
        </button>
        <button 
          className="context-menu-btn delete"
          onClick={(e) => { e.stopPropagation(); handleDeleteGroup(contextMenu.groupId); setContextMenu({visible: false}); }}
        >
          🗑️ 删除
        </button>
      </div>,
      document.body
    );
  };

  return (
    <div className="group-tabs" style={{ position: 'relative' }}>
      <div 
        className={`group-tab ${activeGroupId === null ? 'active' : ''}`}
        onClick={() => onSelectGroup(null)}
      >
        全部图片
      </div>
      
      {groups.map((g, index) => (
        <div 
          key={g.id}
          className={`group-tab ${activeGroupId === g.id ? 'active' : ''}`}
          onClick={() => onSelectGroup(g.id)}
          onContextMenu={(e) => handleContextMenu(e, g.id)}
          draggable={true}
          onDragStart={(e) => handleDragStart(e, index)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          style={{ cursor: 'grab' }}
          title="长按拖拽排序，右键菜单"
        >
          <span style={{ pointerEvents: 'none' }}>{g.name}</span>
        </div>
      ))}

      <ContextMenuPortal />

      <form onSubmit={handleAddGroup} className="group-actions" style={{ display: 'flex', gap: '8px' }}>
        <input 
          type="text" 
          value={newGroupName} 
          onChange={(e) => setNewGroupName(e.target.value)} 
          placeholder="添加分类..."
          disabled={adding}
          style={{ width: '120px', padding: '6px 12px', fontSize: '0.95rem', fontFamily: 'var(--font-body)', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.5)' }}
        />
        <button type="submit" disabled={adding || !newGroupName.trim()} className="group-tab" style={{ cursor: 'pointer', padding: '6px 16px' }}>
          {adding ? '...' : '+ 添加'}
        </button>
      </form>
    </div>
  );
}
