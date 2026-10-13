// Mock domain "upload": single and multiple file uploads.
// Mirrors backend/src/upload/upload.controller.ts.
//
// Rules enforced:
//   - Allowed types: JPEG, PNG, GIF, WebP (400 on other types)
//   - Max file size: 5MB (400 on file too large)
//   - Multiple: max 5 files
//   - Failure testing: simulates error (500) on 'fail' or 'abort' in filename (advancing to ~60% then aborting)
import { ApiError, registerMock } from '@/foundation';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function validateSingleFile(file) {
  if (!file || (!file.filename && !file.name)) {
    throw new ApiError(400, 'No file uploaded', { file: 'No file uploaded' });
  }

  const filename = file.filename || file.name || 'image.jpg';
  const mimetype = (file.mimetype || file.type || '').toLowerCase();
  const size = file.sizeBytes ?? file.size ?? 102400;

  // Unhappy path testing: midway failure simulation (checked by test suite to expect 500)
  if (filename.toLowerCase().includes('fail') || filename.toLowerCase().includes('abort')) {
    throw new ApiError(500, 'Upload interrupted or aborted', { file: 'Upload failed midway' });
  }

  // Type check: convenience check on client, but server DECIDES
  if (!mimetype || !ALLOWED_MIME_TYPES.includes(mimetype)) {
    throw new ApiError(
      400,
      'Invalid file type. Only JPEG, PNG, GIF, WebP are allowed.',
      { file: 'Unsupported file type. Only JPEG, PNG, GIF, WebP are allowed.' }
    );
  }

  // Size check: 5MB max
  if (size > MAX_FILE_SIZE) {
    throw new ApiError(400, 'File too large', { file: 'File too large. Maximum size is 5MB.' });
  }

  const ext = filename.split('.').pop() || 'jpg';
  const generatedId = `mock-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const relativePath = `/uploads/images/${generatedId}`;

  return {
    filename: generatedId,
    originalName: filename,
    mimetype,
    size,
    path: relativePath,
    url: relativePath,
  };
}

// ── Single image upload ───────────────────────────────────────────────────────
registerMock('POST', '/upload/single', (ctx) => {
  const fileData = ctx.body?.file || ctx.body;
  const result = validateSingleFile(fileData);
  return {
    success: true,
    message: 'File uploaded successfully',
    data: result,
  };
});

// ── Multiple image upload (max 5) ─────────────────────────────────────────────
registerMock('POST', '/upload/multiple', (ctx) => {
  const files = ctx.body?.files;
  if (!Array.isArray(files) || files.length === 0) {
    throw new ApiError(400, 'No files uploaded', { files: 'No files uploaded' });
  }
  if (files.length > 5) {
    throw new ApiError(400, 'Maximum 5 files allowed', { files: 'Cannot upload more than 5 files at once.' });
  }

  const uploadedFiles = files.map((file) => validateSingleFile(file));

  return {
    success: true,
    message: 'Files uploaded successfully',
    data: uploadedFiles,
  };
});
