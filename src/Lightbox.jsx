import { useState, useEffect, useRef } from 'react';

export default function Lightbox({ image, images = [], onClose, onNext, onPrev }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Find index for the counter
  const currentIndex = images.findIndex(img => img.id === image.id);
  const totalImages = images.length;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && onNext) onNext();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev]);

  // Reset scale/position when image changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [image.id]);

  const handleZoom = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setScale(prev => Math.min(Math.max(1, prev + delta), 4));
  };

  const startDrag = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      dragStart.current = {
        x: (e.clientX || e.touches[0].clientX) - position.x,
        y: (e.clientY || e.touches[0].clientY) - position.y
      };
    }
  };

  const onDrag = (e) => {
    if (isDragging) {
      setPosition({
        x: (e.clientX || e.touches[0].clientX) - dragStart.current.x,
        y: (e.clientY || e.touches[0].clientY) - dragStart.current.y
      });
    }
  };

  const stopDrag = () => setIsDragging(false);

  return (
    <div 
      className="lightbox-overlay" 
      onClick={(e) => e.target === containerRef.current && onClose()}
      onWheel={handleZoom}
      ref={containerRef}
    >
      <div className="lightbox-controls">
        <button className="lightbox-close" onClick={onClose}>×</button>
        {onPrev && <button className="lightbox-nav prev" onClick={onPrev}>‹</button>}
        {onNext && <button className="lightbox-nav next" onClick={onNext}>›</button>}
      </div>

      <div className="lightbox-info">
        {totalImages > 0 && (
          <div className="image-counter">
            {currentIndex + 1} / {totalImages}
          </div>
        )}
        <div className="close-hint">Esc 退出</div>
      </div>

      <div 
        className="lightbox-content"
        style={{ 
          cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
        }}
        onMouseDown={startDrag}
        onMouseMove={onDrag}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onTouchStart={startDrag}
        onTouchMove={onDrag}
        onTouchEnd={stopDrag}
      >
        <img 
          src={image.url} 
          alt={image.name} 
          draggable="false"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.3s ease'
          }}
        />
        <div className="lightbox-caption">
          <h3>{image.name}</h3>
          {image.description && <p>{image.description}</p>}
        </div>
      </div>
    </div>
  );
}
