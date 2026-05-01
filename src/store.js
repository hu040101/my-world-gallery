import localforage from 'localforage';

localforage.config({
  name: 'CountryGallery',
  storeName: 'gallery_data'
});

// Cache for static data
let staticData = null;

async function getStaticData() {
  if (staticData) return staticData;
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}gallery.json`);
    if (!response.ok) throw new Error('Not found');
    staticData = await response.json();
  } catch (err) {
    console.warn("Could not load public/gallery.json, falling back to local only mode.");
    staticData = { countries: [], groups: [], images: [], settings: {} };
  }
  return staticData;
}

// Helper to merge static and local data
async function getMerged(key, storageKey) {
  const data = await getStaticData();
  const staticItems = data[key] || [];
  const localItems = await localforage.getItem(storageKey) || [];
  
  // Combine and deduplicate by ID if necessary (static items win)
  const combined = [...staticItems];
  localItems.forEach(local => {
    if (!combined.some(s => s.id === local.id)) {
      combined.push(local);
    }
  });
  return combined;
}

export async function getCountries() {
  return await getMerged('countries', 'countries');
}

export async function addCountry(name) {
  const countries = await localforage.getItem('countries') || [];
  const newCountry = { id: 'local_' + Date.now().toString(), name, createdAt: Date.now() };
  countries.push(newCountry);
  await localforage.setItem('countries', countries);
  return newCountry;
}

export async function deleteCountry(id) {
  // We can only delete local countries from local storage
  let countries = await localforage.getItem('countries') || [];
  countries = countries.filter(c => c.id !== id);
  await localforage.setItem('countries', countries);
  
  await localforage.removeItem(`images_${id}`);
  await localforage.removeItem(`groups_${id}`);
}

export async function updateCountry(id, newName) {
  let countries = await localforage.getItem('countries') || [];
  const index = countries.findIndex(c => c.id === id);
  if (index !== -1) {
    countries[index].name = newName;
    await localforage.setItem('countries', countries);
  }
}

export async function reorderCountries(newList) {
  // Save the full list as local overrides
  await localforage.setItem('countries', newList);
}

// --- GROUPS ---
export async function getGroups(countryId) {
  const data = await getStaticData();
  const staticGroups = (data.groups || []).filter(g => g.countryId === countryId);
  const localGroups = await localforage.getItem(`groups_${countryId}`) || [];
  return [...staticGroups, ...localGroups];
}

export async function addGroup(countryId, name) {
  const groups = await localforage.getItem(`groups_${countryId}`) || [];
  const newGroup = { id: 'local_' + Date.now().toString(), countryId, name, createdAt: Date.now() };
  groups.push(newGroup);
  await localforage.setItem(`groups_${countryId}`, groups);
  return newGroup;
}

export async function deleteGroup(countryId, groupId) {
  let groups = await localforage.getItem(`groups_${countryId}`) || [];
  groups = groups.filter(g => g.id !== groupId);
  await localforage.setItem(`groups_${countryId}`, groups);
}

export async function updateGroup(countryId, groupId, newName) {
  let groups = await localforage.getItem(`groups_${countryId}`) || [];
  const index = groups.findIndex(g => g.id === groupId);
  if (index !== -1) {
    groups[index].name = newName;
    await localforage.setItem(`groups_${countryId}`, groups);
  }
}

export async function reorderGroups(countryId, newList) {
  await localforage.setItem(`groups_${countryId}`, newList);
}

// --- IMAGES ---
export async function getImages(countryId) {
  const data = await getStaticData();
  const staticImages = (data.images || []).filter(img => img.countryId === countryId);
  const localImages = await localforage.getItem(`images_${countryId}`) || [];
  const deletedIds = await localforage.getItem(`deleted_images_${countryId}`) || [];
  
  // Format static images and filter out locally deleted ones
  const formattedStatic = staticImages
    .filter(img => !deletedIds.includes(img.id))
    .map(img => ({
      ...img,
      file: `${import.meta.env.BASE_URL}${img.url}` 
    }));

  return [...formattedStatic, ...localImages];
}

export async function addImage(countryId, groupId, file) {
  const images = await localforage.getItem(`images_${countryId}`) || [];
  const newImage = {
    id: 'local_' + Date.now().toString(),
    countryId,
    groupId: groupId || null,
    file, 
    name: file.name,
    note: '',
    createdAt: Date.now()
  };
  images.push(newImage);
  await localforage.setItem(`images_${countryId}`, images);
  return newImage;
}

export async function deleteImage(countryId, imageId) {
  // 1. Try deleting from local images
  let localImages = await localforage.getItem(`images_${countryId}`) || [];
  const isLocal = localImages.some(img => img.id === imageId);
  
  if (isLocal) {
    localImages = localImages.filter(img => img.id !== imageId);
    await localforage.setItem(`images_${countryId}`, localImages);
  } else {
    // 2. If not local, it must be static. Mark as deleted.
    const deletedIds = await localforage.getItem(`deleted_images_${countryId}`) || [];
    if (!deletedIds.includes(imageId)) {
      deletedIds.push(imageId);
      await localforage.setItem(`deleted_images_${countryId}`, deletedIds);
    }
  }
}

export async function updateImage(countryId, imageId, updates) {
  let images = await localforage.getItem(`images_${countryId}`) || [];
  const index = images.findIndex(img => img.id === imageId);
  if (index !== -1) {
    images[index] = { ...images[index], ...updates };
    await localforage.setItem(`images_${countryId}`, images);
  }
}

// Background Settings
export async function getBackgroundSettings() {
  const data = await getStaticData();
  const localSettings = await localforage.getItem('site_background');
  return localSettings || data.settings?.site_background || null;
}

export async function saveBackgroundSettings(settings) {
  await localforage.setItem('site_background', settings);
}
