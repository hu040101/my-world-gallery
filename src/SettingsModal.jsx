import { useState, useEffect, useRef } from 'react';
import { getBackgroundSettings, saveBackgroundSettings } from './store';

export default function SettingsModal({ isOpen, onClose, onSettingsChanged }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [opacity, setOpacity] = useState(1);
  const [blur, setBlur] = useState(0);
  const [position, setPosition] = useState({ x: 50, y: 50 });

  const fileInputRef = useRef(null);
  const previewRef = useRef(null);
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const bgStartPos = useRef({ x: 50, y: 50 });

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    } else {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [isOpen]);

  const loadSettings = async () => {
    const settings = await getBackgroundSettings();
    if (settings) {
      setFile(settings.file || null);
      if (settings.file) setPreviewUrl(URL.createObjectURL(settings.file));
      setOpacity(settings.opacity !== undefined ? settings.opacity : 1);
      setBlur(settings.blur !== undefined ? settings.blur : 0);
      
      if (settings.position && typeof settings.position === 'string' && settings.position.includes('%')) {
        const parts = settings.position.split('%');
        setPosition({ x: parseFloat(parts[0]) || 50, y: parseFloat(parts[1]) || 50 });
      } else {
        setPosition({ x: 50, y: 50 });
      }
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const handleSave = async () => {
    await saveBackgroundSettings({
      file,
      opacity,
      blur,
      position: `${position.x}% ${position.y}%` // Scale is implicitly 100vw auto now
    });
    if (onSettingsChanged) onSettingsChanged();
    onClose();
  };

  const handleReset = async () => {
    setFile(null);
    setPreviewUrl(null);
    setOpacity(1);
    setBlur(0);
    setPosition({ x: 50, y: 50 });
    await saveBackgroundSettings(null);
    if (onSettingsChanged) onSettingsChanged();
  };

  const handleMouseDown = (e) => {
    if (!previewUrl) return;
    isDragging.current = true;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    bgStartPos.current = { ...position };
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    
    // We only care about Y delta since width is 100% and X drag does nothing
    const dy = e.clientY - dragStartPos.current.y;
    
    // Convert pixel drag to percentage roughly.
    const newY = Math.max(0, Math.min(100, bgStartPos.current.y - (dy * 0.5)));
    
    setPosition({ x: 50, y: newY });
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mousemove', handleMouseMove);
    }
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isOpen, position]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 3000 }}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ width: '450px' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>主题设置</h3>

        <div style={{ marginBottom: '1.5rem' }}>
          <label className="setting-label">自定义背景图片</label>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            style={{ display: 'none' }}
          />
          
          {previewUrl ? (
            <div 
              ref={previewRef}
              onMouseDown={handleMouseDown}
              title="上下拖拽以调整图片显示位置"
              style={{ 
                position: 'relative', 
                marginBottom: '0.5rem',
                height: '180px',
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: 'ns-resize', // Vertical resize cursor indicates vertical drag
                border: '1px solid rgba(0,0,0,0.1)',
                background: `linear-gradient(-45deg, #fdfbf7, #f2e9dc, #e8dcc4, #f4eee0)`
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundImage: `url(${previewUrl})`,
                backgroundSize: '100% auto', // Width fills container, height maintains aspect ratio
                backgroundPosition: `center ${position.y}%`, // X is always center
                backgroundRepeat: 'no-repeat',
                opacity: opacity,
                filter: `blur(${blur}px)`,
                transform: blur ? 'scale(1.05)' : 'none'
              }} />

              <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(255,255,255,0.7)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, pointerEvents: 'none' }}>
                上下拖拽以调整高度位置
              </div>

              <button 
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                style={{ position: 'absolute', bottom: '10px', right: '10px', padding: '5px 10px', fontSize: '0.8rem' }}
              >
                更换图片
              </button>
            </div>
          ) : (
            <button 
              onClick={() => fileInputRef.current?.click()}
              style={{ width: '100%', padding: '20px', background: 'rgba(255,255,255,0.5)', border: '2px dashed var(--accent-color)' }}
            >
              + 上传自定义背景
            </button>
          )}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label className="setting-label">不透明度: {Math.round(opacity * 100)}%</label>
          <input type="range" min="0" max="1" step="0.05" value={opacity} onChange={e => setOpacity(parseFloat(e.target.value))} style={{ width: '100%' }} />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label className="setting-label">模糊度: {blur}px</label>
          <input type="range" min="0" max="50" step="1" value={blur} onChange={e => setBlur(parseInt(e.target.value))} style={{ width: '100%' }} />
        </div>

        <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
          <button className="cancel" onClick={handleReset} style={{ color: '#d9534f' }}>恢复默认</button>
          <div>
            <button className="cancel" onClick={onClose} style={{ marginRight: '10px' }}>取消</button>
            <button onClick={handleSave}>保存设置</button>
          </div>
        </div>
      </div>
    </div>
  );
}
