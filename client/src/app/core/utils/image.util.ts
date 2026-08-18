// Client-side image downscaling before an ad photo is sent to the server.
// Since ads are stored as base64 inside a single JSON file (no separate file
// storage - spec 4.5), keeping uploaded images small is what keeps ads.json
// itself from ballooning. We resize to a reasonable max dimension and
// re-encode as JPEG at a moderate quality before turning it into base64.
const MAX_DIMENSION_PX = 1280;
const JPEG_QUALITY = 0.82;
export const MAX_IMAGE_SOURCE_BYTES = 8 * 1024 * 1024; // reject absurdly large source files outright

export class ImageTooLargeError extends Error {}

export function resizeImageToBase64(file: File): Promise<string> {
  if (file.size > MAX_IMAGE_SOURCE_BYTES) {
    return Promise.reject(new ImageTooLargeError('הקובץ גדול מדי (מעל 8MB).'));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('קריאת הקובץ נכשלה.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('לא ניתן לפענח את התמונה שנבחרה.'));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION_PX / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('לא ניתן לעבד את התמונה בדפדפן זה.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
