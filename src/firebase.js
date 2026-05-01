import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  projectId: "countrygallery-350a1",
  appId: "1:933442211244:web:4a63109f118943e9e33e09",
  storageBucket: "countrygallery-350a1.firebasestorage.app",
  apiKey: "AIzaSyBNL9hUHHxNfjWnJKAY-sJlq-SfxLmdaTA",
  authDomain: "countrygallery-350a1.firebaseapp.com",
  messagingSenderId: "933442211244",
  measurementId: "G-PLRWG82K12"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
