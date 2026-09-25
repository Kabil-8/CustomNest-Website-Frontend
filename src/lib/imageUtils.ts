/**
 * imageUtils.ts — Browser image compression and HEIC conversion utilities.
 * Handles Apple HEIC/HEIF files transparently and compresses photos to web dimensions.
 */

/**
 * Detects if a file is an Apple HEIC / HEIF image by MIME type or extension.
 */
export function isHeicFile(file: File): boolean {
  const name = (file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();
  return (
    name.endsWith('.heic') ||
    name.endsWith('.heif') ||
    type === 'image/heic' ||
    type === 'image/heif' ||
    type === 'image/heic-sequence' ||
    type === 'image/heif-sequence'
  );
}

/**
 * Converts a HEIC / HEIF file into a standard JPEG File object in the browser.
 * If the file is already a standard image (JPEG, PNG, WEBP), it returns the file as-is.
 */
export async function ensureWebImageFile(file: File): Promise<File> {
  if (!isHeicFile(file)) {
    return file;
  }

  try {
    const heic2anyModule: any = await import('heic2any');
    const heic2any = heic2anyModule.default || heic2anyModule;
    const blobOrBlobs = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9,
    });
    const blob: Blob = Array.isArray(blobOrBlobs) ? blobOrBlobs[0] : blobOrBlobs;
    const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
    return new File([blob], newName, { type: 'image/jpeg' });
  } catch (err) {
    console.warn('HEIC to JPEG conversion encountered an issue:', err);
    // If conversion fails, return original file as fallback
    return file;
  }
}

/**
 * Compresses and resizes an image file in the browser using HTML5 Canvas.
 * Supports standard images and Apple HEIC/HEIF photos.
 * Shrinks multi-megabyte camera photos (e.g. 5MB–15MB) down to ~80KB–180KB
 * while maintaining high visual fidelity for e-commerce catalog display.
 */
export async function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82
): Promise<string> {
  // Convert HEIC / HEIF to JPEG if needed before loading into Canvas
  const readyFile = await ensureWebImageFile(file);

  return new Promise((resolve, reject) => {
    if (!readyFile.type.startsWith('image/')) {
      return reject(new Error('Please select a valid image file.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image for processing.'));
      img.onload = () => {
        try {
          let { width, height } = img;

          // Scale down proportionally if larger than maximum boundaries
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve(e.target?.result as string);
          }

          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Export as clean JPEG with balanced compression
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(readyFile);
  });
}
