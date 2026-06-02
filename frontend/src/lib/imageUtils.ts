export async function compressToJpeg(
  base64: string,
  mimeType: string,
  maxPx = 1024,
  quality = 0.82,
): Promise<{ base64: string; mimeType: 'image/jpeg' }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
    };
    img.onerror = () => resolve({ base64, mimeType: 'image/jpeg' });
    img.src = `data:${mimeType};base64,${base64}`;
  });
}
