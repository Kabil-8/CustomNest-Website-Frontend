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
    if (!readyFile.type.startsWith('image/') && !isValidImageFile(readyFile)) {
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

/**
 * Known image extensions across desktop and mobile devices.
 */
export const VALID_IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.heic',
  '.heif',
  '.avif',
  '.gif',
  '.bmp',
  '.tiff',
  '.tif',
  '.svg',
];

/**
 * Checks if a file is an image by MIME type or known extension.
 */
export function isValidImageFile(file: File): boolean {
  if (!file) return false;
  const name = (file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();
  if (type.startsWith('image/')) return true;
  if (isHeicFile(file)) return true;
  return VALID_IMAGE_EXTENSIONS.some((ext) => name.endsWith(ext));
}

/**
 * Validates and processes a screenshot file:
 * 1. Validates that the file is an image (PNG, JPG, HEIC, WEBP, AVIF, GIF, BMP, TIFF, SVG, etc.).
 * 2. Transparently converts Apple HEIC/HEIF into standard JPEG.
 * 3. Enforces the maximum size (default 5MB).
 * 4. If an image exceeds 5MB (e.g. ultra high-res 4K/HDR phone screenshot or photo),
 *    it attempts client-side compression/downscaling into a JPEG under 5MB.
 * 5. Throws a clear, friendly error if the file is invalid or cannot be reduced below maxMb.
 */
export async function processScreenshotFile(file: File, maxMb = 5): Promise<File> {
  if (!file) {
    throw new Error('Please select a payment screenshot.');
  }

  if (!isValidImageFile(file)) {
    throw new Error('Please upload a valid image (PNG, JPG, HEIC, WEBP, AVIF, GIF, BMP, etc.).');
  }

  const maxBytes = maxMb * 1024 * 1024;

  // Step 1: If HEIC/HEIF, convert to standard JPEG
  let processed = file;
  if (isHeicFile(file)) {
    processed = await ensureWebImageFile(file);
  }

  // Step 2: If already within max size (<= 5MB), keep as-is!
  if (processed.size <= maxBytes) {
    return processed;
  }

  // Step 3: If > 5MB, attempt browser canvas downscaling/compression to fit within 5MB
  try {
    const compressedDataUrl = await compressImage(processed, 1920, 1920, 0.85);
    const res = await fetch(compressedDataUrl);
    const blob = await res.blob();

    if (blob.size <= maxBytes) {
      const baseName = processed.name.replace(/\.[^/.]+$/, '');
      return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
    }
  } catch (err) {
    console.warn('Screenshot compression attempt:', err);
  }

  // If still over limit
  const currentMb = (processed.size / (1024 * 1024)).toFixed(1);
  throw new Error(`Screenshot size cannot exceed ${maxMb}MB. Selected file is ${currentMb}MB. Please choose a smaller image.`);
}

