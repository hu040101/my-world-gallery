import { useState, useEffect } from 'react';
import './App.css';
import CountryManager from './CountryManager';
import Gallery from './Gallery';
import BackgroundManager from './BackgroundManager';
import SettingsModal from './SettingsModal';
import GlobalUploadModal from './GlobalUploadModal';
import { getCountries } from './store';

function App() {
  const [countries, setCountries] = useState([]);
  const [activeCountryId, setActiveCountryId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [bgRefresh, setBgRefresh] = useState(0);
  const [galleryRefresh, setGalleryRefresh] = useState(0);

  const fetchCountries = async (newActiveId = null) => {
    const data = await getCountries();
    setCountries(data);
    if (newActiveId) {
      setActiveCountryId(newActiveId);
    } else if (data.length > 0 && !activeCountryId) {
      setActiveCountryId(data[0].id);
    } else if (data.length === 0) {
      setActiveCountryId(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  const handleUploadComplete = async (targetCountryId) => {
    await fetchCountries(targetCountryId); // Refresh regions and select the new/updated one
    setGalleryRefresh(r => r + 1); // Force gallery to refresh images
  };

  const activeCountry = countries.find(c => c.id === activeCountryId);

  return (
    <>
      <BackgroundManager refreshTrigger={bgRefresh} />
      
      <header className="header" style={{ position: 'relative' }}>
        <h1>World Gallery</h1>
        <p>Your beautifully curated collection of places</p>
      </header>
      
      <div className="app-container">
        <aside className="sidebar glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2>Regions</h2>
          <CountryManager 
            countries={countries} 
            activeCountryId={activeCountryId} 
            onSelect={setActiveCountryId} 
            loading={loading}
            onCountriesChange={fetchCountries}
          />

          <div style={{ marginTop: 'auto', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            <button 
              className="sidebar-btn" 
              onClick={() => setIsUploadOpen(true)}
            >
              + 上传照片
            </button>

            <button 
              className="sidebar-btn"
              onClick={() => setIsSettingsOpen(true)}
            >
              ⚙ 主题设置
            </button>
          </div>
        </aside>

        <main className="main-content glass-panel" style={{ padding: '2rem' }}>
          {activeCountry ? (
            <Gallery country={activeCountry} refreshTrigger={galleryRefresh} />
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: '#888' }}>
              {loading ? <div className="loading-spinner"></div> : "请在左侧选择或添加一个地区"}
            </div>
          )}
        </main>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onSettingsChanged={() => setBgRefresh(r => r + 1)} 
      />

      <GlobalUploadModal 
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        countries={countries}
        onUploadComplete={handleUploadComplete}
      />
    </>
  );
}

export default App;
