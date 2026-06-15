import { DB } from '../../../constants';
import { Partner, PartnerMediaGallery, WorkingHours } from '../../../types';
import type { PartnerProfileWorkingHours } from '../../../services/real-api';

export const PARTNER_PHOTO_CATEGORIES = [
  { key: 'couverture', label: 'Couverture' },
  { key: 'boutique', label: 'Boutique' },
  { key: 'machines', label: 'Machines' },
  { key: 'equipe', label: 'Equipe' },
  { key: 'livraison', label: 'Livraison' },
  { key: 'avant-apres', label: 'Avant/Apres' },
] as const;

export type PartnerPhotoCategoryKey = (typeof PARTNER_PHOTO_CATEGORIES)[number]['key'];

export const emptyMediaGallery = (): PartnerMediaGallery => ({
  couverture: [],
  boutique: [],
  machines: [],
  equipe: [],
  livraison: [],
  'avant-apres': [],
});

export const normalizeMediaGallery = (
  gallery?: PartnerMediaGallery,
  legacyUrls?: string[],
): PartnerMediaGallery => {
  const base = emptyMediaGallery();
  if (gallery) {
    for (const { key } of PARTNER_PHOTO_CATEGORIES) {
      base[key] = [...(gallery[key] || [])];
    }
  }
  const hasAny = PARTNER_PHOTO_CATEGORIES.some(({ key }) => (base[key]?.length || 0) > 0);
  if (!hasAny && legacyUrls?.length) {
    base.couverture = [...legacyUrls];
  }
  return base;
};

export const flattenGallery = (gallery: PartnerMediaGallery): string[] => {
  const urls: string[] = [];
  for (const { key } of PARTNER_PHOTO_CATEGORIES) {
    urls.push(...(gallery[key] || []));
  }
  return [...new Set(urls.filter(Boolean))];
};

/** Prefer HTTPS URLs over legacy base64 blobs (often truncated in localStorage). */
export const pickFirstNonEmpty = (...values: (string | null | undefined)[]): string | undefined => {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
};

export const preferRemoteImageUrls = (urls: string[]): string[] => {
  const valid = urls.filter(isValidImageUrl);
  const remote = valid.filter((u) => u.startsWith('http://') || u.startsWith('https://'));
  const local = valid.filter((u) => !remote.includes(u));
  return [...new Set([...remote, ...local])];
};

/** Per category: API/primary wins when non-empty, otherwise fallback (e.g. localStorage). */
export const mergeMediaGalleries = (
  primary?: PartnerMediaGallery,
  fallback?: PartnerMediaGallery,
): PartnerMediaGallery => {
  const base = emptyMediaGallery();
  for (const { key } of PARTNER_PHOTO_CATEGORIES) {
    const primaryUrls = (primary?.[key] || []).filter(isValidImageUrl);
    const fallbackUrls = (fallback?.[key] || []).filter(isValidImageUrl);
    base[key] = primaryUrls.length > 0 ? primaryUrls : fallbackUrls;
  }
  return base;
};

export const readStoredPartnerMedia = (partner: Partner) => {
  const dbPartners = DB.get('partners') as Partner[];
  const stored = dbPartners.find((p) => p.id === partner.id);
  const gallery = normalizeMediaGallery(
    stored?.mediaGallery || partner.mediaGallery,
    stored?.imageUrls || partner.imageUrls,
  );
  return {
    mediaGallery: gallery,
    imageUrls: flattenGallery(gallery),
    videoUrl: stored?.videoUrl ?? partner.videoUrl ?? '',
  };
};

const DAY_KEYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export const mapWorkingHoursToApi = (hours: WorkingHours): PartnerProfileWorkingHours => {
  const mapped = {} as PartnerProfileWorkingHours;
  for (const day of DAY_KEYS) {
    const entry = hours[day];
    mapped[day] = {
      open: entry.open,
      close: entry.close,
      is_closed: entry.isClosed,
    };
  }
  return mapped;
};

export const mapApiWorkingHours = (api: PartnerProfileWorkingHours): WorkingHours => {
  const mapped = {} as WorkingHours;
  for (const day of DAY_KEYS) {
    const entry = api[day];
    mapped[day] = {
      open: entry.open,
      close: entry.close,
      isClosed: entry.is_closed,
    };
  }
  return mapped;
};

export const isDayOpen = (day?: { is_closed?: boolean; isClosed?: boolean }): boolean =>
  !!day && !(day.is_closed ?? day.isClosed);

export const isValidImageUrl = (url: string | undefined | null): boolean => {
  const t = url?.trim();
  if (!t) return false;
  if (t.startsWith('http://') || t.startsWith('https://')) return true;
  if (t.startsWith('/') && !t.startsWith('//')) return true;
  if (t.startsWith('data:image/')) {
    const comma = t.indexOf(',');
    if (comma < 0) return false;
    return t.slice(comma + 1).length >= 100;
  }
  return false;
};

export const isYoutubeUrl = (url: string): boolean =>
  /youtube\.com|youtu\.be/i.test(url);

export const toYoutubeEmbed = (url: string): string => {
  let videoId: string | undefined;
  const short = url.match(/youtu\.be\/([^?&/]+)/);
  if (short) videoId = short[1];
  if (!videoId) {
    const watch = url.match(/[?&]v=([^&]+)/);
    if (watch) videoId = watch[1];
  }
  if (!videoId) {
    const embed = url.match(/youtube\.com\/embed\/([^?&/]+)/);
    if (embed) videoId = embed[1];
  }
  if (videoId) return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
  return url;
};

const DAY_ORDER: (keyof WorkingHours)[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
];

export const buildGalleryItems = (partner: Partner): { src: string; label: string }[] => {
  const gallery = normalizeMediaGallery(partner.mediaGallery);
  const items: { src: string; label: string }[] = [];
  for (const category of PARTNER_PHOTO_CATEGORIES) {
    for (const url of gallery[category.key] || []) {
      const trimmed = url?.trim();
      if (trimmed && isValidImageUrl(trimmed)) {
        items.push({ src: trimmed, label: category.label });
      }
    }
  }
  return items;
};

export const getCoverImages = (partner: Partner, fallback = '/images/service-placeholder.jpg'): string[] => {
  const fromGallery = preferRemoteImageUrls(buildGalleryItems(partner).map((item) => item.src));
  if (fromGallery.length > 0) return fromGallery;

  const legacy = preferRemoteImageUrls(partner.imageUrls || []);
  if (legacy.length > 0) return legacy;
  return [fallback];
};

export const mapApiMediaGallery = (raw?: Record<string, string[]>): PartnerMediaGallery => {
  const base = emptyMediaGallery();
  if (!raw) return base;
  for (const { key } of PARTNER_PHOTO_CATEGORIES) {
    const altKey = key === 'avant-apres' ? 'avant_apres' : key;
    const values = raw[key] || raw[altKey] || [];
    base[key] = [...values].filter((url) => !!url?.trim());
  }
  return base;
};

export const getOpenStatusLabel = (workingHours?: WorkingHours): string => {
  if (!workingHours) return 'Horaires sur demande';
  const todayKey = DAY_ORDER[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const today = workingHours[todayKey];
  if (!today || today.isClosed) return "Ferme aujourd'hui";
  return `Ouvert maintenant · Ferme a ${today.close}`;
};
