// Domain service for image uploads, built on the shared request().
// Real backend: POST /upload/single and POST /upload/multiple (multipart/form-data).
// In mock mode: sends JSON body to mock handlers via request(), with simulated progress.
// Pages never call fetch/axios directly — they go through this service only.
import { request } from '@/foundation';

function isMockMode() {
  const flag = (import.meta.env.VITE_MOCKS || '').trim();
  return flag === 'all' || flag.split(',').map((d) => d.trim()).includes('upload');
}

/**
 * Upload a single image file.
 * In mock mode: sends { filename, mimetype, sizeBytes } via request(), simulating progress.
 * In real mode: sends FormData via XMLHttpRequest for accurate progress events.
 *
 * @param {File|{ name: string, type: string, size: number }} file - Browser File or mock file object
 * @param {function(number):void} [onProgress] - Called with 0–100 as upload progresses
 * @returns {Promise<{ url: string }>}
 */
export async function uploadSingle(file, onProgress) {
  if (!file) throw new Error('No file provided');

  const isMock = isMockMode() || !file.arrayBuffer;

  if (isMock) {
    // Mock path: simulate progressive upload steps
    if (onProgress) {
      onProgress(20);
      await new Promise((r) => setTimeout(r, 70));
      onProgress(55);
      await new Promise((r) => setTimeout(r, 70));
    }

    const filename = file.name || file.filename || 'image.jpg';
    const mimetype = file.type || file.mimetype || 'image/jpeg';
    const sizeBytes = file.size ?? file.sizeBytes ?? 102400;

    const result = await request('/upload/single', {
      method: 'POST',
      body: { filename, mimetype, sizeBytes },
    });

    if (onProgress) onProgress(100);
    return { url: result?.data?.url ?? result?.data?.path ?? result?.url ?? '' };
  }

  // Real path: FormData multipart upload via XMLHttpRequest
  const formData = new FormData();
  formData.append('file', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    xhr.open('POST', `${apiUrl}/upload/single`);

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          resolve({ url: json?.data?.url ?? json?.data?.path ?? '' });
        } catch (_) {
          resolve({ url: '' });
        }
      } else {
        let message = 'Upload failed';
        try {
          message = JSON.parse(xhr.responseText)?.message ?? message;
        } catch (_) {}
        reject(new Error(message));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });
}

/**
 * Upload multiple image files (max 5).
 * In mock mode: sends { files: [...] } via request().
 * @param {Array<File|Object>} files
 * @param {function(number):void} [onProgress]
 * @returns {Promise<Array<{ url: string }>>}
 */
export async function uploadMultiple(files, onProgress) {
  if (!Array.isArray(files) || files.length === 0) return [];

  const isMock = isMockMode() || !files[0]?.arrayBuffer;

  if (isMock) {
    if (onProgress) {
      onProgress(25);
      await new Promise((r) => setTimeout(r, 70));
      onProgress(65);
      await new Promise((r) => setTimeout(r, 70));
    }

    const payloadFiles = files.map((f) => ({
      filename: f.name || f.filename || 'image.jpg',
      mimetype: f.type || f.mimetype || 'image/jpeg',
      sizeBytes: f.size ?? f.sizeBytes ?? 102400,
    }));

    const result = await request('/upload/multiple', {
      method: 'POST',
      body: { files: payloadFiles },
    });

    if (onProgress) onProgress(100);
    return (result?.data ?? []).map((d) => ({ url: d.url ?? d.path ?? '' }));
  }

  // Real path: FormData multipart upload
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const response = await fetch(`${apiUrl}/upload/multiple`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.message ?? 'Upload failed');
  }

  const json = await response.json();
  if (onProgress) onProgress(100);
  return (json?.data ?? []).map((d) => ({ url: d.url ?? d.path ?? '' }));
}
