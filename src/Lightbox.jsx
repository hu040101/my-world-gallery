import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Lightbox({ image, onClose, onNext, onPrev }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Reset zoom and position when image changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [image?.id]);

  if (!image) return null;

  // Handle Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') onNext?.();
      if (e.key === 'ArrowLeft') onPrev?.();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev, onClose]);

  // Handle Wheel Zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    const onWheel = (e) => {
      e.preventDefault();
      // Determine zoom direction and sensitivity
      const zoomFactor = -e.deltaY * 0.002;
      
      setScale(prev => {
        let newScale = prev + prev * zoomFactor;
        // Limit scale between 1x and 8x
        newScale = Math.min(Math.max(1, newScale), 8); 
        return newScale;
      });
    };
    
    // Non-passive listener required to prevent default body scrolling
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [image?.id]); // Re-bind if element changes (though it shouldn't)

  // Reset position if zoomed out to 1x
  useEffect(() => {
    if (scale <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  // Handle Dragging
  const handleMouseDown = (e) => {
    // Only drag if we are zoomed in
    if (scale > 1) {
      e.preventDefault();
      setIsDragging(true);
      dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const overlayContent = (
    <div 
      className="lightbox-overlay" 
      onClick={onClose}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <button className="lightbox-close" onClick={onClose} title="Close">✕</button>
      
      {onPrev && (
        <button 
          className="lightbox-nav prev" 
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          title="Previous"
        >
          ‹
        </button>
      )}

      {onNext && (
        <button 
          className="lightbox-nav next" 
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          title="Next"
        >
          ›
        </button>
      )}

      <div 
        className="lightbox-container" 
        ref={containerRef}
        onClick={(e) => e.stopPropagation()} 
      >
        <img 
          key={image.id}
          src={image.url} 
          alt={image.name} 
          className="lightbox-img"
          draggable="false"
          onMouseDown={handleMouseDown}
          onClick={() => {
            // Click to zoom in if at 1x
            if (scale === 1) setScale(2.5);
          }}
          onDoubleClick={(e) => {
            // Double click to reset
            e.stopPropagation();
            setScale(1);
          }}
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
          title={scale > 1 ? "Drag to pan, scroll to zoom, double-click to reset" : "Click to zoom in, scroll to zoom"}
        />
      </div>
      
      {image.note && (
        <div 
          className="museum-placard"
          onClick={(e) => e.stopPropagation()} // Prevent click from closing lightbox
          onWheel={(e) => e.stopPropagation()} // Prevent wheel from zooming image
          onMouseDown={(e) => e.stopPropagation()} // Prevent drag panning from starting on placard
        >
          <div className="placard-inner">
            <div className="placard-pin"></div>
            <div className="placard-content">
              {image.note}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(overlayContent, document.body);
}
