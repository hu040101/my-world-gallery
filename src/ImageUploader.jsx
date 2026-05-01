import { useState, useRef } from 'react';
import { addImage } from './store';

export default function ImageUploader({ countryId, groupId, onImageAdded }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setUploading(true);

    try {
      await addImage(countryId, groupId, file);
      if (onImageAdded) onImageAdded();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error("Upload process error:", err);
      alert("Failed to save image locally.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*"
        style={{ display: 'none' }}
      />
      <button 
        className="sleek-upload-btn"
        onClick={() => !uploading && fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <>
            <div className="loading-spinner" style={{ width: '14px', height: '14px', display: 'inline-block', marginRight: '8px', borderWidth: '2px' }}></div> 
            Saving...
          </>
        ) : (
          <>+ Upload Photo</>
        )}
      </button>
    </div>
  );
}
