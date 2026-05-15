import { useEffect, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { compressAndResizeImage } from '@/lib/image-tools';
import ImageCropDialog from '@/components/admin/ImageCropDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function EditableItemForm({ item, mode, labels, onCancel, onSubmit }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState('0');
  const [imageUrl, setImageUrl] = useState('');
  const [preview, setPreview] = useState('');
  const [rawImageSrc, setRawImageSrc] = useState('');
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTitle(item?.title || item?.name || '');
    setDescription(item?.content || item?.description || '');
    setPoints(String(item?.points_required ?? 0));
    setImageUrl(item?.image_url || '');
    setPreview(item?.image_url || '');
  }, [item]);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert('Image must be under 25MB');
      event.target.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setRawImageSrc(reader.result);
      setShowCropDialog(true);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleCropComplete = async (croppedFile) => {
    setIsUploading(true);
    const compressed = await compressAndResizeImage(croppedFile);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(compressed);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: compressed });
    setImageUrl(file_url);
    setIsUploading(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    await onSubmit({ title, description, image_url: imageUrl, points_required: Number(points) || 0 });
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-card border border-primary/25 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-lg text-foreground">{mode === 'edit' ? `Edit ${labels.singular}` : `Add ${labels.singular}`}</p>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex gap-4">
        <label className="w-28 h-28 rounded-2xl bg-muted border border-dashed border-border flex-shrink-0 overflow-hidden cursor-pointer relative group">
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImagePlus className="w-7 h-7 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-medium">
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Change'}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </label>

        <div className="flex-1 space-y-3">
          <Input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={labels.titlePlaceholder}
            className="rounded-xl bg-background"
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={labels.descriptionPlaceholder}
            rows={4}
            className="rounded-xl bg-background resize-none"
          />
          {labels.pointsPlaceholder && (
            <Input
              required
              type="number"
              min="0"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder={labels.pointsPlaceholder}
              className="rounded-xl bg-background"
            />
          )}
        </div>
      </div>

      <Button type="submit" disabled={isSaving || isUploading} className="w-full rounded-xl">
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
      </Button>

      <ImageCropDialog
        open={showCropDialog}
        onOpenChange={setShowCropDialog}
        imageSrc={rawImageSrc}
        onCropComplete={handleCropComplete}
      />
    </form>
  );
}