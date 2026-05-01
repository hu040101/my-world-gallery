import { useState, useEffect } from 'react';
import { getBackgroundSettings } from './store';

export default function BackgroundManager({ refreshTrigger }) {
  const [bgSettings, setBgSettings] = useState(null);
  const [bgUrl, setBgUrl] = useState(null);
  const [scrollY, setScrollY] = useState(0);

  // Handle Parallax Scrolling
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let currentUrl = null;

    const loadBg = async () => {
      const settings = await getBackgroundSettings();
      setBgSettings(settings);

      if (settings?.file) {
        currentUrl = URL.createObjectURL(settings.file);
        setBgUrl(currentUrl);
      } else {
        setBgUrl(null);
      }
    };

    loadBg();

    return () => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [refreshTrigger]);

  if (!bgSettings || !bgUrl) return null;

  // Extract base Y from position string (e.g., "50% 50%")
  let posY = "50%";
  if (bgSettings.position && typeof bgSettings.position === 'string') {
    const parts = bgSettings.position.split(' ');
    if (parts.length === 2) {
      posY = parts[1];
    }
  }

  // Parallax calculation: Move background at 30% the speed of normal scrolling
  // At scrollY = 0, this is exactly the preset posY
  const parallaxPositionY = `calc(${posY} - ${scrollY * 0.3}px)`;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1, 
        backgroundImage: `url(${bgUrl})`,
        // Force width to 100vw, height to auto (maintains aspect ratio)
        backgroundSize: '100vw auto',
        // Center horizontally, use user preset + parallax vertically
        backgroundPosition: `center ${parallaxPositionY}`,
        backgroundRepeat: 'no-repeat',
        opacity: bgSettings.opacity !== undefined ? bgSettings.opacity : 1,
        filter: `blur(${bgSettings.blur || 0}px)`,
        transform: bgSettings.blur ? 'scale(1.05)' : 'none', 
        transition: 'opacity 0.3s ease-out, filter 0.3s ease-out' 
      }}
    />
  );
}
