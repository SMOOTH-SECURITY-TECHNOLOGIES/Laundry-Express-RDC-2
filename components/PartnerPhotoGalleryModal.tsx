import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import { isValidImageUrl } from '../pages/partner/profile/partnerMedia';

export type GalleryImage = { src: string; label: string };

const ModalImage: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const resolved = failed || !isValidImageUrl(src) ? '/images/service-placeholder.jpg' : src;
  return <img src={resolved} alt={alt} className={className} onError={() => setFailed(true)} />;
};

type Props = {
  open: boolean;
  images: GalleryImage[];
  index: number;
  partnerName: string;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

export const PartnerPhotoGalleryModal: React.FC<Props> = ({
  open,
  images,
  index,
  partnerName,
  onClose,
  onIndexChange,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onIndexChange((index - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') onIndexChange((index + 1) % images.length);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, index, images.length, onClose, onIndexChange]);

  if (!open || images.length === 0) return null;

  const current = images[index];
  const goPrev = () => onIndexChange((index - 1 + images.length) % images.length);
  const goNext = () => onIndexChange((index + 1) % images.length);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={`Galerie photos - ${partnerName}`}
    >
      <button
        type="button"
        aria-label="Fermer la galerie"
        className="absolute inset-0 bg-black/90"
        onClick={onClose}
      />
      <div className="relative z-10 flex flex-col h-full pointer-events-none">
        <div className="flex items-center justify-between px-4 py-3 text-white shrink-0 pointer-events-auto">
          <div>
            <p className="font-bold">{partnerName}</p>
            <p className="text-sm text-white/70">
              {index + 1} / {images.length} · {current.label}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full p-2 hover:bg-white/10 transition"
          >
            <Icon name="xmark" className="w-6 h-6" />
          </button>
        </div>

        <div className="relative flex flex-1 items-center justify-center px-12 md:px-16 min-h-0 pointer-events-auto">
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label="Photo precedente"
                className="absolute left-2 md:left-4 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 transition"
              >
                <Icon name="arrowLeft" className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Photo suivante"
                className="absolute right-2 md:right-4 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 transition"
              >
                <Icon name="arrowRight" className="w-5 h-5" />
              </button>
            </>
          )}
          <ModalImage
            key={current.src}
            src={current.src}
            alt={current.label}
            className="max-h-[calc(100vh-200px)] max-w-full rounded-lg object-contain shadow-2xl"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto px-4 py-3 shrink-0 pointer-events-auto">
          {images.map((img, i) => (
            <button
              key={`${img.src}-${i}`}
              type="button"
              onClick={() => onIndexChange(i)}
              aria-label={`Voir ${img.label}`}
              aria-current={i === index ? 'true' : undefined}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === index ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              <ModalImage src={img.src} alt={img.label} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
};
