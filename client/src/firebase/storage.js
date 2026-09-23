import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from './config.js';

export async function uploadFileToStorage(file, folder = 'uploads') {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${folder}/${timestamp}_${safeName}`;
  const fileRef = ref(storage, filePath);

  const snapshot = await uploadBytes(fileRef, file);
  const downloadUrl = await getDownloadURL(snapshot.ref);

  return {
    downloadUrl,
    filePath,
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
  };
}

export async function deleteFileFromStorage(filePath) {
  const fileRef = ref(storage, filePath);
  await deleteObject(fileRef);
}

export { storage };
