import { X } from 'lucide-react';

export default function ImagePreviewDialog({ imageUrl, alt = 'Preview image', onClose }) {
  if (!imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-4xl max-h-[90vh]" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-700 transition"
          aria-label="Close image preview"
        >
          <X className="w-5 h-5" />
        </button>
        <img
          src={imageUrl}
          alt={alt}
          className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl bg-white"
        />
      </div>
    </div>
  );
}