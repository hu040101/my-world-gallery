import { useState, useEffect } from 'react';
import { getImages, deleteImage, updateImage, getGroups } from './store';
import GroupManager from './GroupManager';
import ImageCard from './ImageCard';
import Lightbox from './Lightbox';

export default function Gallery({ country, refreshTrigger }) {
  const [images, setImages] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  
  // Batch Select State
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedImageIds, setSelectedImageIds] = useState([]);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 24;

  const fetchImagesAndGroups = async () => {
    if (!country?.id) return;
    setLoading(true);
    
    // Fetch groups to pass to ImageCard
    const groupsData = await getGroups(country.id);
    setGroups(groupsData);

    const data = await getImages(country.id);
    
    // Revoke old object URLs
    images.forEach(img => {
      // Don't revoke if it's currently in lightbox to avoid breaking it, but ideally we revoke all except active
      if (img.url) URL.revokeObjectURL(img.url);
    });

    const imagesWithUrls = data.map(img => {
      let url = '';
      try {
        if (typeof img.file === 'string') {
          url = img.file;
        } else {
          url = URL.createObjectURL(img.file);
        }
      } catch (e) {
        console.error("Error creating URL for image", img, e);
      }
      return {
        ...img,
        url,
        name: img.name || '未命名图片'
      };
    });    
    imagesWithUrls.sort((a, b) => b.createdAt - a.createdAt);
    setImages(imagesWithUrls);
    setLoading(false);
  };

  useEffect(() => {
    fetchImagesAndGroups();
    // Reset selection, group selection, and pagination when country changes
    setActiveGroupId(null);
    setCurrentPage(1);
    setIsSelectMode(false);
    setSelectedImageIds([]);
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.url));
    };
  }, [country?.id, refreshTrigger]);

  // Clean up lightbox when navigating away
  useEffect(() => {
    setLightboxImage(null);
  }, [country?.id]);

  const handleDelete = async (image) => {
    try {
      await deleteImage(country.id, image.id);
      fetchImagesAndGroups();
    } catch (err) {
      console.error("Error deleting image:", err);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedImageIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedImageIds.length} selected images?`)) return;
    
    try {
      for (const id of selectedImageIds) {
        await deleteImage(country.id, id);
      }
      setSelectedImageIds([]);
      setIsSelectMode(false);
      fetchImagesAndGroups();
    } catch (err) {
      console.error("Error batch deleting:", err);
    }
  };

  const handleBatchMove = async (newGroupId) => {
    if (selectedImageIds.length === 0) return;
    const groupName = newGroupId === "" ? "Uncategorized" : groups.find(g => g.id === newGroupId)?.name;
    if (!window.confirm(`Move ${selectedImageIds.length} selected images to ${groupName}?`)) return;

    try {
      for (const id of selectedImageIds) {
        await updateImage(country.id, id, { groupId: newGroupId === "" ? null : newGroupId });
      }
      setSelectedImageIds([]);
      setIsSelectMode(false);
      fetchImagesAndGroups();
    } catch (err) {
      console.error("Error batch moving:", err);
    }
  };

  const handleUpdate = async (image, updates) => {
    try {
      await updateImage(country.id, image.id, updates);
      fetchImagesAndGroups();
    } catch (err) {
      console.error("Error updating image:", err);
    }
  };

  const displayedImages = activeGroupId 
    ? images.filter(img => img.groupId === activeGroupId)
    : images;

  // Pagination Logic
  const totalPages = Math.ceil(displayedImages.length / ITEMS_PER_PAGE);
  const paginatedImages = displayedImages.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>{country.name}</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isSelectMode && (
            <button 
              className="sidebar-btn" 
              onClick={() => {
                if (selectedImageIds.length === displayedImages.length) {
                  // Deselect all
                  setSelectedImageIds([]);
                } else {
                  // Select all displayed
                  setSelectedImageIds(displayedImages.map(img => img.id));
                }
              }}
              style={{ width: 'auto', background: 'rgba(255,255,255,0.4)', color: 'var(--text-color)' }}
            >
              {selectedImageIds.length === displayedImages.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
          <button 
            className="sidebar-btn" 
            onClick={() => {
              setIsSelectMode(!isSelectMode);
              setSelectedImageIds([]);
            }}
            style={{ width: 'auto', background: isSelectMode ? 'var(--accent-color)' : 'rgba(255,255,255,0.4)', color: isSelectMode ? 'white' : 'var(--text-color)' }}
          >
            {isSelectMode ? 'Cancel Selection' : 'Select Photos'}
          </button>
        </div>
      </div>

      <GroupManager 
        countryId={country.id}
        activeGroupId={activeGroupId}
        onSelectGroup={(id) => {
          setActiveGroupId(id);
          setCurrentPage(1); // Reset page on category change
        }}
        onGroupsChanged={fetchImagesAndGroups}
      />



      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}><div className="loading-spinner"></div></div>
      ) : displayedImages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
          No images found. Upload one above!
        </div>
      ) : (
        <>
          <div className="gallery-grid">
            {paginatedImages.map(img => (
              <ImageCard 
                key={img.id} 
                image={img} 
                country={country}
                groups={groups}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                onImageClick={setLightboxImage}
                isSelectMode={isSelectMode}
                isSelected={selectedImageIds.includes(img.id)}
                onToggleSelect={(id) => {
                  setSelectedImageIds(prev => 
                    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                  );
                }}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination-controls">
              <button 
                className="pagination-btn" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                &lt; 上一页
              </button>
              
              <span className="pagination-info">
                第 {currentPage} / {totalPages} 页
              </span>

              <button 
                className="pagination-btn" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                下一页 &gt;
              </button>
            </div>
          )}
        </>
      )}

      {/* Batch Action Bar */}
      {isSelectMode && selectedImageIds.length > 0 && (
        <div className="batch-action-bar">
          <span>{selectedImageIds.length} Selected</span>
          <button className="danger" onClick={handleBatchDelete}>Delete</button>
          
          <select 
            onChange={(e) => {
              if (e.target.value !== 'prompt') {
                handleBatchMove(e.target.value);
                e.target.value = 'prompt'; // reset select after action
              }
            }}
            defaultValue="prompt"
          >
            <option value="prompt" disabled>Move to...</option>
            <option value="">None (Uncategorized)</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Lightbox Overlay */}
      {lightboxImage && (
        <Lightbox 
          image={lightboxImage} 
          onClose={() => setLightboxImage(null)} 
          onNext={() => {
            const idx = displayedImages.findIndex(img => img.id === lightboxImage.id);
            const nextIdx = (idx + 1) % displayedImages.length;
            setLightboxImage(displayedImages[nextIdx]);
          }}
          onPrev={() => {
            const idx = displayedImages.findIndex(img => img.id === lightboxImage.id);
            const prevIdx = (idx - 1 + displayedImages.length) % displayedImages.length;
            setLightboxImage(displayedImages[prevIdx]);
          }}
        />
      )}
    </div>
  );
}
