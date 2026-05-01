import { useState, useEffect } from 'react';
import { getGroups, addCountry, addGroup, addImage } from './store';

export default function GlobalUploadModal({ isOpen, onClose, countries, onUploadComplete }) {
  const [files, setFiles] = useState([]);
  
  const [selectedCountryId, setSelectedCountryId] = useState('');
  const [newCountryName, setNewCountryName] = useState('');
  
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Fetch groups when a valid existing country is selected
  useEffect(() => {
    if (selectedCountryId && selectedCountryId !== 'new') {
      getGroups(selectedCountryId).then(setGroups);
    } else {
      setGroups([]);
      setSelectedGroupId('');
    }
  }, [selectedCountryId]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) return alert("请先选择图片");
    if (!selectedCountryId) return alert("请选择或创建一个地区");
    if (selectedCountryId === 'new' && !newCountryName.trim()) return alert("请输入新地区名称");
    if (selectedGroupId === 'new' && !newGroupName.trim()) return alert("请输入新分类名称");

    setUploading(true);
    setProgress(0);

    try {
      let targetCountryId = selectedCountryId;
      let targetGroupId = selectedGroupId;

      // Create new country if requested
      if (selectedCountryId === 'new') {
        const newCountry = await addCountry(newCountryName.trim());
        targetCountryId = newCountry.id;
      }

      // Create new group if requested
      if (selectedGroupId === 'new') {
        const newGroup = await addGroup(targetCountryId, newGroupName.trim());
        targetGroupId = newGroup.id;
      }

      // Process and upload all files
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await addImage(targetCountryId, targetGroupId || null, file);
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }

      // Reset form
      setFiles([]);
      setSelectedCountryId('');
      setNewCountryName('');
      setSelectedGroupId('');
      setNewGroupName('');
      
      // Notify parent to refresh
      onUploadComplete(targetCountryId);
      onClose();

    } catch (err) {
      console.error("Upload failed:", err);
      alert("上传失败，请重试");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="modal-overlay" onClick={!uploading ? onClose : undefined}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ width: '500px' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>全局上传照片</h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* File Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="setting-label">选择图片 ({files.length} 张)</label>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleFileChange}
              disabled={uploading}
              style={{ padding: '10px', background: 'rgba(255,255,255,0.3)', borderRadius: '8px' }}
            />
          </div>

          {/* Region Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="setting-label">目标地区</label>
            <select 
              value={selectedCountryId} 
              onChange={(e) => setSelectedCountryId(e.target.value)}
              disabled={uploading}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.7)', fontFamily: 'inherit' }}
            >
              <option value="">-- 请选择地区 --</option>
              {countries.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              <option value="new">+ 创建新地区...</option>
            </select>
            
            {selectedCountryId === 'new' && (
              <input 
                type="text" 
                placeholder="输入新地区名称" 
                value={newCountryName}
                onChange={e => setNewCountryName(e.target.value)}
                disabled={uploading}
                style={{ marginTop: '0.5rem', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.7)' }}
              />
            )}
          </div>

          {/* Category Selection */}
          {selectedCountryId && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label className="setting-label">目标分类 (可选)</label>
              <select 
                value={selectedGroupId} 
                onChange={(e) => setSelectedGroupId(e.target.value)}
                disabled={uploading}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.7)', fontFamily: 'inherit' }}
              >
                <option value="">-- 不指定分类 (全部图片) --</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
                <option value="new">+ 创建新分类...</option>
              </select>

              {selectedGroupId === 'new' && (
                <input 
                  type="text" 
                  placeholder="输入新分类名称" 
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  disabled={uploading}
                  style={{ marginTop: '0.5rem', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.7)' }}
                />
              )}
            </div>
          )}

          {/* Upload Status & Submit */}
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center' }}>
            {uploading && <span style={{ fontSize: '0.9rem', color: '#666' }}>上传中: {progress}%</span>}
            <button 
              type="button" 
              onClick={onClose} 
              disabled={uploading}
              style={{ background: 'transparent', color: 'var(--text-color)', boxShadow: 'none' }}
            >
              取消
            </button>
            <button 
              type="submit" 
              className="primary" 
              disabled={uploading || files.length === 0 || !selectedCountryId}
            >
              {uploading ? '处理中...' : '开始上传'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
