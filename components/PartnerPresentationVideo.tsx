import React from 'react';
import { isYoutubeUrl, toYoutubeEmbed } from '../pages/partner/profile/partnerMedia';

type Props = {
  videoUrl: string;
  partnerName: string;
  className?: string;
};

export const PartnerPresentationVideo: React.FC<Props> = ({ videoUrl, partnerName, className = '' }) => {
  const src = videoUrl.trim();
  if (!src) return null;

  return (
    <div className={`aspect-video overflow-hidden rounded-2xl border border-slate-100 bg-black shadow-sm ${className}`}>
      {isYoutubeUrl(src) ? (
        <iframe
          title={`Video de presentation - ${partnerName}`}
          src={toYoutubeEmbed(src)}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <video src={src} controls className="h-full w-full object-cover" playsInline />
      )}
    </div>
  );
};
