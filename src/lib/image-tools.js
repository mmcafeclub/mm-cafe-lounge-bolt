export async function compressAndResizeImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = () => {
      let width = img.width;
      let height = img.height;
      const maxSize = 800;

      if (width > height && width > maxSize) {
        height = Math.round((height * maxSize) / width);
        width = maxSize;
      } else if (height > maxSize) {
        width = Math.round((width * maxSize) / height);
        height = maxSize;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);

      let quality = 0.9;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      let sizeKB = Math.round((dataUrl.length * 3) / 4 / 1024);
      let tries = 0;

      while (sizeKB > 220 && quality > 0.3 && tries < 15) {
        quality -= 0.07;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
        sizeKB = Math.round((dataUrl.length * 3) / 4 / 1024);
        tries += 1;
      }

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Could not create smaller image'));
          return;
        }

        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
          type: 'image/jpeg',
          lastModified: Date.now(),
        }));
      }, 'image/jpeg', quality);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not load image'));
    };
  });
}