import { useState } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import ImagePreviewDialog from '@/components/common/ImagePreviewDialog';

export default function DayShifts({ date, shifts }) {
  const [previewImage, setPreviewImage] = useState(null);

  if (!date) return null;
  const dayShifts = shifts
    .filter(s => s.date === date)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

  return (
    <>
      <div className="px-6 mt-6">
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">
          {format(new Date(date + 'T00:00:00'), 'EEEE, MMMM d')}
        </p>

        {dayShifts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground italic">No ambassadors scheduled.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {dayShifts.map((s, idx) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * idx }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border"
              >
                {s.staff_image_url && (
                  <button
                    type="button"
                    onClick={() => setPreviewImage({ url: s.staff_image_url, alt: s.staff_name })}
                    className="flex-shrink-0 rounded-full cursor-zoom-in"
                    aria-label={`Open photo of ${s.staff_name}`}
                  >
                    <img
                      src={s.staff_image_url}
                      alt={s.staff_name}
                      className="w-11 h-11 rounded-full object-cover"
                    />
                  </button>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{s.staff_name}</p>
                  {s.staff_role && (
                    <p className="text-xs text-muted-foreground truncate">{s.staff_role}</p>
                  )}
                </div>
                {(s.start_time || s.end_time) && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{s.start_time}–{s.end_time}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <ImagePreviewDialog
        imageUrl={previewImage?.url}
        alt={previewImage?.alt}
        onClose={() => setPreviewImage(null)}
      />
    </>
  );
}