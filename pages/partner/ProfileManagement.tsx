import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAppContext } from '../../context/AppContext';
import { Partner, WorkingHours, PartnerSection } from '../../types';
import { findPartner } from '../../utils/findPartner';
import { Icon } from '../../components/Icon';
import { CatalogPartnerService, PartnerProfileDetailResponse, realApi } from '../../services/real-api';
import { PartnerMediaGallery } from '../../types';
import { features } from '../../config/features';
import { appEvents } from '../../utils/events';
import { PartnerMediaModal } from './profile/PartnerMediaModal';
import { PartnerProfileEditModal, PartnerProfileFormValues } from './profile/PartnerProfileEditModal';
import { PartnerWorkingHoursModal } from './profile/PartnerWorkingHoursModal';
import { PartnerCatalogServiceModal } from './profile/PartnerCatalogServiceModal';
import {
  isYoutubeUrl,
  normalizeMediaGallery,
  PARTNER_PHOTO_CATEGORIES,
  PartnerPhotoCategoryKey,
  isDayOpen,
  flattenGallery,
  mapApiMediaGallery,
  mapApiWorkingHours,
  mapWorkingHoursToApi,
  readStoredPartnerMedia,
  toYoutubeEmbed,
} from './profile/partnerMedia';

type ProfileAction = 'info' | 'media-cover' | 'media-video' | 'services' | 'hours';

type DayKey = keyof WorkingHours;

const getDefaultWorkingHours = (): WorkingHours => ({
  monday: { open: '09:00', close: '18:00', isClosed: false },
  tuesday: { open: '09:00', close: '18:00', isClosed: false },
  wednesday: { open: '09:00', close: '18:00', isClosed: false },
  thursday: { open: '09:00', close: '18:00', isClosed: false },
  friday: { open: '09:00', close: '18:00', isClosed: false },
  saturday: { open: '10:00', close: '16:00', isClosed: false },
  sunday: { open: '10:00', close: '16:00', isClosed: true },
});

const dayNames: Record<DayKey, string> = {
  monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi',
  thursday: 'Jeudi', friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche',
};
const dayOrder: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

interface ProfileProps { setSection?: (section: PartnerSection) => void; }

export const ProfileManagement: React.FC<ProfileProps> = ({ setSection }) => {
  const {
    user,
    partners,
    services,
    reviews,
    addNotification,
    apiUpdatePartnerMedia,
    updatePartner,
  } = useAppContext();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [workingHours, setWorkingHours] = useState<WorkingHours | undefined>(undefined);
  const [mediaGallery, setMediaGallery] = useState<PartnerMediaGallery>(normalizeMediaGallery());
  const [videoUrl, setVideoUrl] = useState('');
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);
  const [isCatalogServiceOpen, setIsCatalogServiceOpen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaModalTab, setMediaModalTab] = useState<PartnerPhotoCategoryKey>('couverture');
  const [catalogServiceToEdit, setCatalogServiceToEdit] = useState<CatalogPartnerService | null>(null);
  const [catalogServices, setCatalogServices] = useState<CatalogPartnerService[]>([]);
  const [activePhotoTab, setActivePhotoTab] = useState<PartnerPhotoCategoryKey>('couverture');
  const [profileDetail, setProfileDetail] = useState<PartnerProfileDetailResponse | null>(null);

  useEffect(() => {
    if (!user?.partnerId) return;
    const p = findPartner(partners, user.partnerId);
    if (!p) return;
    const stored = readStoredPartnerMedia(p);
    setPartner({ ...p, imageUrls: stored.imageUrls, videoUrl: stored.videoUrl, mediaGallery: stored.mediaGallery });
    setMediaGallery(stored.mediaGallery);
    setVideoUrl(stored.videoUrl);
    setWorkingHours(p.workingHours || getDefaultWorkingHours());
  }, [user, partners]);

  const loadProfileDetail = useCallback(async () => {
    if (!user?.partnerId) return;
    try {
      const detail = await realApi.getPartnerProfileDetail(user.partnerId);
      setProfileDetail(detail);
      if (detail.media_gallery || detail.image_urls?.length) {
        const gallery = mapApiMediaGallery(detail.media_gallery);
        const urls = detail.image_urls?.length ? detail.image_urls : flattenGallery(gallery);
        setMediaGallery(gallery);
        setVideoUrl(detail.video_url || '');
        setPartner((prev) =>
          prev
            ? { ...prev, mediaGallery: gallery, imageUrls: urls, videoUrl: detail.video_url || undefined }
            : prev,
        );
      } else if (detail.video_url) {
        setVideoUrl(detail.video_url);
      }
      if (detail.working_hours) setWorkingHours(mapApiWorkingHours(detail.working_hours));
    } catch {
      /* profil API indisponible — on garde les donnees locales */
    }
  }, [user?.partnerId]);

  const loadCatalogServices = useCallback(async () => {
    if (!partner?.id || features.useMockApi) return;
    try {
      const items = await realApi.getPartnerCatalogServices(partner.id, {
        availableOnly: false,
        activeOnly: false,
      });
      setCatalogServices(items);
    } catch {
      setCatalogServices([]);
    }
  }, [partner?.id]);

  useEffect(() => {
    loadProfileDetail();
  }, [loadProfileDetail]);

  useEffect(() => {
    loadCatalogServices();
  }, [loadCatalogServices]);

  const persistMedia = useCallback(
    async (payload: { mediaGallery: PartnerMediaGallery; imageUrls: string[]; videoUrl: string }) => {
      if (!partner) return;
      try {
        if (!features.useMockApi && user?.partnerId) {
          await realApi.updatePartnerProfileMedia(user.partnerId, {
            media_gallery: payload.mediaGallery as Record<string, string[]>,
            image_urls: payload.imageUrls,
            video_url: payload.videoUrl || null,
          });
        }
        await apiUpdatePartnerMedia(
          partner.id,
          {
            mediaGallery: payload.mediaGallery,
            imageUrls: payload.imageUrls,
            videoUrl: payload.videoUrl || null,
          },
          partner,
        );
        setMediaGallery(payload.mediaGallery);
        setVideoUrl(payload.videoUrl);
        setPartner((prev) =>
          prev
            ? {
                ...prev,
                mediaGallery: payload.mediaGallery,
                imageUrls: payload.imageUrls,
                videoUrl: payload.videoUrl || undefined,
              }
            : prev,
        );
        appEvents.emit('data_changed');
        addNotification('Photos et videos enregistrees', 'success');
        setIsMediaModalOpen(false);
      } catch {
        addNotification('Impossible de sauvegarder les medias.', 'error');
      }
    },
    [partner, apiUpdatePartnerMedia, addNotification],
  );

  const partnerServices = useMemo(() => partner?.serviceIds ? services.filter(s => partner.serviceIds!.includes(s.id)) : [], [partner, services]);
  const partnerReviews = useMemo(() => reviews.filter(r => r.partnerId === user?.partnerId), [reviews, user]);
  const shareUrl = useMemo(() => {
    if (!partner?.id) return '';
    if (import.meta.env.DEV) {
      return `${window.location.origin}/partner-detail?partnerId=${partner.id}`;
    }
    return partner.slug ? `https://laundry.app/partner/${partner.slug}` : '';
  }, [partner]);

  const profileFormValues = useMemo<PartnerProfileFormValues>(
    () => ({
      name: profileDetail?.name || partner?.name || '',
      address: profileDetail?.address || partner?.address || '',
      city: profileDetail?.city || '',
      commune: profileDetail?.commune || '',
    }),
    [profileDetail, partner],
  );

  const handleSaveProfile = useCallback(
    async (values: PartnerProfileFormValues) => {
      if (!partner || !user?.partnerId) return;
      try {
        const updated = await realApi.updatePartnerProfileDetail(user.partnerId, {
          name: values.name.trim(),
          address: values.address.trim(),
          city: values.city.trim() || null,
          commune: values.commune.trim() || null,
        });
        setProfileDetail(updated);
        const nextPartner: Partner = {
          ...partner,
          name: updated.name,
          address: updated.address,
        };
        setPartner(nextPartner);
        await updatePartner(nextPartner);
        appEvents.emit('data_changed');
        addNotification('Informations enregistrees', 'success');
        setIsProfileEditOpen(false);
      } catch (error) {
        addNotification(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde', 'error');
      }
    },
    [partner, user?.partnerId, updatePartner, addNotification],
  );

  const handleToggleCatalogService = useCallback(
    async (service: CatalogPartnerService) => {
      if (!partner) return;
      try {
        await realApi.updatePartnerCatalogService(partner.id, service.id, {
          is_available: !service.is_available,
        });
        await loadCatalogServices();
        await loadProfileDetail();
        addNotification(service.is_available ? 'Service desactive' : 'Service active', 'success');
      } catch {
        addNotification('Impossible de modifier ce service.', 'error');
      }
    },
    [partner, loadCatalogServices, loadProfileDetail, addNotification],
  );

  const openMediaModal = useCallback((tab: PartnerPhotoCategoryKey = 'couverture') => {
    setMediaModalTab(tab);
    setIsMediaModalOpen(true);
  }, []);

  const runProfileAction = useCallback((action: ProfileAction) => {
    switch (action) {
      case 'info':
        setIsProfileEditOpen(true);
        break;
      case 'media-cover':
        openMediaModal('couverture');
        break;
      case 'media-video':
        openMediaModal('couverture');
        break;
      case 'services':
        setCatalogServiceToEdit(null);
        setIsCatalogServiceOpen(true);
        break;
      case 'hours':
        setIsHoursModalOpen(true);
        break;
      default:
        break;
    }
  }, [openMediaModal]);

  const totalPhotoCount = useMemo(
    () => PARTNER_PHOTO_CATEGORIES.reduce((sum, cat) => sum + (mediaGallery[cat.key]?.length || 0), 0),
    [mediaGallery],
  );

  const activeCategoryPhotos = useMemo(
    () => mediaGallery[activePhotoTab] || [],
    [mediaGallery, activePhotoTab],
  );

  const hasConfiguredHours = useMemo(() => {
    if (!profileDetail?.working_hours) return false;
    return Object.values(profileDetail.working_hours).some((day) =>
      isDayOpen(day as { is_closed?: boolean; isClosed?: boolean }),
    );
  }, [profileDetail?.working_hours]);

  const activeCatalogServices = catalogServices.filter((s) => s.is_available);
  const serviceCount = Math.max(
    activeCatalogServices.length,
    partnerServices.length,
    profileDetail?.service_count || 0,
  );

  const scoreChecklist = useMemo(
    () => [
      {
        label: 'Informations de base',
        done: !!(partner?.name && (partner?.address || profileDetail?.address)),
        weight: 15,
        action: 'info' as ProfileAction,
      },
      {
        label: 'Contact (telephone ou email)',
        done: !!(
          profileDetail?.phone?.trim()
          || profileDetail?.email?.trim()
          || user?.phone?.trim()
          || user?.email?.trim()
        ),
        weight: 10,
        action: 'info' as ProfileAction,
      },
      {
        label: 'Photo de couverture',
        done: (mediaGallery.couverture?.length || 0) > 0,
        weight: 15,
        action: 'media-cover' as ProfileAction,
      },
      {
        label: 'Galerie complete (5+ photos)',
        done: totalPhotoCount >= 5,
        weight: 10,
        action: 'media-cover' as ProfileAction,
      },
      {
        label: 'Video de presentation',
        done: !!videoUrl,
        weight: 15,
        action: 'media-video' as ProfileAction,
      },
      {
        label: 'Services actifs',
        done: serviceCount > 0,
        weight: 20,
        action: 'services' as ProfileAction,
      },
      {
        label: 'Horaires configures',
        done: hasConfiguredHours,
        weight: 15,
        action: 'hours' as ProfileAction,
      },
    ],
    [
      partner,
      profileDetail,
      mediaGallery.couverture,
      totalPhotoCount,
      videoUrl,
      serviceCount,
      hasConfiguredHours,
      user,
    ],
  );

  const profileScore = useMemo(
    () => Math.min(100, scoreChecklist.filter((item) => item.done).reduce((sum, item) => sum + item.weight, 0)),
    [scoreChecklist],
  );

  const handleSaveHours = useCallback(
    async (hours: WorkingHours) => {
      if (!partner || !user?.partnerId) return;
      try {
        const detail = await realApi.updatePartnerWorkingHours(user.partnerId, {
          working_hours: mapWorkingHoursToApi(hours),
        });
        const mapped = mapApiWorkingHours(detail.working_hours);
        setWorkingHours(mapped);
        setProfileDetail(detail);
        const nextPartner = { ...partner, workingHours: mapped };
        setPartner(nextPartner);
        await updatePartner(nextPartner);
        appEvents.emit('data_changed');
        addNotification('Horaires enregistres avec succes', 'success');
        setIsHoursModalOpen(false);
      } catch (error) {
        addNotification(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde', 'error');
      }
    },
    [partner, user?.partnerId, updatePartner, addNotification],
  );

  const firstIncompleteItem = useMemo(
    () => scoreChecklist.find((item) => !item.done),
    [scoreChecklist],
  );

  const handleCompleteProfile = useCallback(() => {
    if (!firstIncompleteItem) {
      addNotification('Felicitations, votre profil est complet a 100% !', 'success');
      return;
    }
    runProfileAction(firstIncompleteItem.action);
    addNotification(`Prochaine etape : ${firstIncompleteItem.label}`, 'info');
  }, [firstIncompleteItem, runProfileAction, addNotification]);

  const aiTips = useMemo(
    () => [
      {
        action: 'Ajoutez une video de presentation',
        gain: '+15% visibilite',
        icon: 'play' as const,
        done: !!videoUrl,
        onClick: () => openMediaModal('couverture'),
      },
      {
        action: totalPhotoCount >= 5 ? 'Galerie complete' : `Ajoutez ${Math.max(0, 5 - totalPhotoCount)} photo(s)`,
        gain: '+10% visibilite',
        icon: 'photo' as const,
        done: totalPhotoCount >= 5,
        onClick: () => openMediaModal('couverture'),
      },
      {
        action: 'Configurez vos horaires',
        gain: '+15% confiance',
        icon: 'calendar' as const,
        done: hasConfiguredHours,
        onClick: () => setIsHoursModalOpen(true),
      },
      {
        action: 'Activez au moins un service',
        gain: '+20% commandes',
        icon: 'shoppingBag' as const,
        done: serviceCount > 0,
        onClick: () => { setCatalogServiceToEdit(null); setIsCatalogServiceOpen(true); },
      },
    ],
    [videoUrl, totalPhotoCount, hasConfiguredHours, serviceCount, openMediaModal],
  );

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    addNotification('Lien copie !', 'success');
  };

  const handleShare = () => {
    if (navigator.share) navigator.share({ title: partner?.name, url: shareUrl });
    else handleCopyLink();
  };

  if (!partner) return <div className="text-center py-20 text-slate-400">Chargement...</div>;

  const avgRating = partnerReviews.length > 0 ? partnerReviews.reduce((s, r) => s + r.rating, 0) / partnerReviews.length : partner.rating;

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A]">Mon profil</h1>
          <p className="text-sm text-slate-500 mt-1">Gerez votre profil public et developpez votre activite sur Laundry Express.</p>
        </div>
      </div>

      {/* ─── Score + Apercu profil public ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-[#0F172A] mb-1">Completion du profil</h2>
          <div className="flex items-end gap-3 mb-4">
            <span className="text-5xl font-extrabold text-brand-blue">{profileScore}%</span>
            <span className="text-sm text-slate-500 mb-1">{profileScore >= 80 ? 'Votre profil est bien rempli !' : 'Completez votre profil pour plus de visibilite'}</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-5">
            <div className="h-full bg-gradient-to-r from-brand-blue to-[#22C55E] rounded-full transition-all duration-700" style={{ width: `${profileScore}%` }} />
          </div>
          <div className="space-y-2 mb-5">
            {scoreChecklist.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => !item.done && runProfileAction(item.action)}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition ${
                  item.done ? '' : 'hover:bg-slate-50 cursor-pointer'
                }`}
              >
                <Icon name={item.done ? 'check' : 'xmark'} className={`w-4 h-4 ${item.done ? 'text-[#22C55E]' : 'text-slate-300'}`} />
                <span className={item.done ? 'text-[#0F172A]' : 'text-slate-400'}>{item.label}</span>
                {item.done ? (
                  <span className="ml-auto text-[10px] font-bold text-[#22C55E]">+{item.weight}%</span>
                ) : (
                  <span className="ml-auto text-[10px] font-bold text-brand-blue">Completer</span>
                )}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleCompleteProfile}
            className="w-full py-2.5 bg-brand-blue text-white text-sm font-bold rounded-xl hover:bg-brand-blue-700 transition active:scale-[0.98]"
          >
            {firstIncompleteItem ? 'Completer mon profil →' : 'Profil complet ✓'}
          </button>
        </div>

        {/* Apercu profil public */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="relative h-40">
            <img src={mediaGallery.couverture?.[0] || partner.imageUrls?.[0] || 'https://images.unsplash.com/photo-1545173153-5dd9215b6f57?w=800&q=80'} alt={partner.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute top-3 right-3 flex gap-1.5">
              <span className="px-2 py-1 bg-white/90 text-[10px] font-bold text-brand-blue rounded-lg">Apercu reel</span>
            </div>
            <div className="absolute bottom-3 left-3 right-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-12 h-12 rounded-xl bg-white/90 flex items-center justify-center text-brand-blue font-extrabold text-lg overflow-hidden">
                  {mediaGallery.couverture?.[0] || partner.imageUrls?.[0] ? (
                    <img src={mediaGallery.couverture?.[0] || partner.imageUrls?.[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    partner.name.charAt(0)
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white drop-shadow">{partner.name}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 bg-[#22C55E] text-white text-[9px] font-bold rounded flex items-center gap-0.5"><Icon name="badge-check" className="w-2.5 h-2.5" />Verifie</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="star" className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-bold text-[#0F172A]">{avgRating.toFixed(1)}</span>
              <span className="text-xs text-slate-400">({partner.reviewCount} avis)</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {['Livraison rapide', 'Qualite garantie', 'Service client 24/7'].map((tag, i) => (
                <span key={i} className="px-2 py-1 bg-slate-50 text-[10px] font-bold text-slate-600 rounded-full">{tag}</span>
              ))}
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
              <span className="flex items-center gap-1"><Icon name="mapPin" className="w-3 h-3" />{partner.address?.split(',')[1] || 'Gombe'}</span>
              <span className="flex items-center gap-1"><Icon name="clock" className="w-3 h-3" />Livraison 24h</span>
              <span className="flex items-center gap-1"><Icon name="check" className="w-3 h-3 text-[#22C55E]" />Ouvert maintenant</span>
            </div>
            <div className="flex gap-2">
              <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 bg-brand-blue text-white text-xs font-bold rounded-xl hover:bg-brand-blue-700 transition text-center">Voir mon profil public</a>
              <button onClick={handleShare} className="px-3 py-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition"><Icon name="share" className="w-4 h-4 text-slate-600" /></button>
              <button onClick={handleCopyLink} className="px-3 py-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition"><Icon name="document" className="w-4 h-4 text-slate-600" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Business Health + Recommandations IA ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-[#0F172A] mb-3">Sante de votre activite</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeDasharray="88 12" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold text-[#0F172A]">88</span>
                <span className="text-[9px] text-slate-400">/100</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                {[1,2,3,4,5].map(s => <Icon key={s} name="star" className={`w-4 h-4 ${s <= 4 ? 'text-yellow-400' : 'text-slate-200'}`} />)}
                <span className="text-xs font-bold text-[#0F172A] ml-1">Excellent</span>
              </div>
              <p className="text-xs text-slate-500 mb-1">Classement : <strong className="text-[#0F172A]">#3 Gombe</strong> — Top 12%</p>
              <p className="text-xs text-slate-500">Reponse moyenne : <strong className="text-[#22C55E]">5 min</strong></p>
              <p className="text-xs text-slate-500">Commandes reussies : <strong className="text-[#22C55E]">98%</strong></p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Note', value: '4.8', color: 'bg-yellow-50 text-yellow-700' },
              { label: 'Reponse', value: '5 min', color: 'bg-green-50 text-[#22C55E]' },
              { label: 'Litiges', value: '0.8%', color: 'bg-green-50 text-[#22C55E]' },
            ].map((b, i) => (
              <div key={i} className={`p-2 rounded-xl text-center ${b.color}`}>
                <p className="text-lg font-extrabold">{b.value}</p>
                <p className="text-[10px] font-medium">{b.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-brand-blue to-brand-blue-700 rounded-2xl p-6 text-white">
          <h2 className="text-lg font-bold mb-1">Conseils pour recevoir plus de commandes</h2>
          <p className="text-xs text-white/70 mb-4">Recommandations personnalisees pour ameliorer votre profil</p>
          <div className="space-y-2.5">
            {aiTips.map((item, i) => (
              <div key={i} className={`flex items-center justify-between p-2.5 rounded-xl ${item.done ? 'bg-white/10' : 'bg-white/5'}`}>
                <div className="flex items-center gap-2">
                  <Icon name={item.done ? 'check' : item.icon} className={`w-4 h-4 ${item.done ? 'text-[#22C55E]' : 'text-white/80'}`} />
                  <div>
                    <p className="text-xs font-medium">{item.action}</p>
                    <p className="text-[10px] text-white/60">{item.gain}</p>
                  </div>
                </div>
                {item.done ? (
                  <span className="text-[10px] font-bold text-[#22C55E]">Fait</span>
                ) : (
                  <button type="button" onClick={item.onClick} className="px-2.5 py-1 text-[10px] font-bold bg-white/20 rounded-lg hover:bg-white/30 transition">Ajouter</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Informations etablissement + Reseaux sociaux ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0F172A]">Informations de l'etablissement</h2>
            <button type="button" onClick={() => setIsProfileEditOpen(true)} className="px-3 py-1.5 text-xs font-bold text-brand-blue border border-brand-blue/20 rounded-lg hover:bg-brand-blue/5 transition flex items-center gap-1.5"><Icon name="pencil" className="w-3 h-3" />Modifier</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: 'building', label: 'Nom commercial', value: profileDetail?.name || partner.name },
              { icon: 'mapPin', label: 'Adresse', value: profileDetail?.address || partner.address || 'Non renseignee' },
              { icon: 'mapPin', label: 'Ville', value: profileDetail?.city || 'Kinshasa' },
              { icon: 'mapPin', label: 'Commune', value: profileDetail?.commune || partner.address?.split(',')[1]?.trim() || '—' },
              { icon: 'phone', label: 'Telephone', value: profileDetail?.phone || '—' },
              { icon: 'envelope', label: 'Email', value: profileDetail?.email || '—' },
              { icon: 'shoppingBag', label: 'Services actifs', value: String(serviceCount) },
              { icon: 'clock', label: 'Statut', value: profileDetail?.is_accepting_orders ? 'Accepte les commandes' : 'Pause' },
            ].map((field, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl">
                <Icon name={field.icon as any} className="w-4 h-4 text-slate-400 mt-0.5" />
                <div><p className="text-[10px] text-slate-400 mb-0.5">{field.label}</p><p className="text-sm font-medium text-[#0F172A]">{field.value}</p></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0F172A]">Reseaux sociaux</h2>
            <button className="px-3 py-1.5 text-xs font-bold text-brand-blue border border-brand-blue/20 rounded-lg hover:bg-brand-blue/5 transition flex items-center gap-1.5"><Icon name="pencil" className="w-3 h-3" />Modifier</button>
          </div>
          <div className="space-y-2">
            {[
              { icon: 'facebook', label: 'Facebook', value: 'Prestige Pressing', connected: true, color: 'text-blue-600' },
              { icon: 'logo', label: 'Instagram', value: '@prestige_pressing', connected: true, color: 'text-pink-500' },
              { icon: 'logo', label: 'TikTok', value: '@prestige_pressing', connected: false, color: 'text-[#0F172A]' },
              { icon: 'globe', label: 'Site web', value: 'www.prestige-pressing.cd', connected: true, color: 'text-brand-blue' },
            ].map((social, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center ${social.color}`}><Icon name={social.icon as any} className="w-4 h-4" /></div>
                  <div><p className="text-xs font-bold text-[#0F172A]">{social.label}</p><p className="text-[10px] text-slate-400">{social.value}</p></div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${social.connected ? 'bg-green-50 text-[#22C55E]' : 'bg-slate-100 text-slate-400'}`}>
                  {social.connected ? '✓ Connecte' : '✗ Non configure'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Photos & videos + Horaires ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0F172A]">Photos & videos</h2>
            <button
              type="button"
              onClick={() => openMediaModal(activePhotoTab)}
              className="text-xs font-bold text-brand-blue hover:underline"
            >
              Gerer ({totalPhotoCount})
            </button>
          </div>
          <div className="flex gap-1.5 overflow-x-auto mb-3">
            {PARTNER_PHOTO_CATEGORIES.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActivePhotoTab(tab.key)}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg whitespace-nowrap transition ${activePhotoTab === tab.key ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                {tab.label}
                {(mediaGallery[tab.key]?.length || 0) > 0 && (
                  <span className="ml-1 opacity-80">({mediaGallery[tab.key]?.length})</span>
                )}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 min-h-[280px]">
            {activeCategoryPhotos.length === 0 ? (
              <div className="col-span-full flex h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
                <Icon name="photo" className="mb-2 h-10 w-10 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">Aucune photo dans cette categorie</p>
                <button
                  type="button"
                  onClick={() => openMediaModal(activePhotoTab)}
                  className="mt-3 rounded-lg bg-brand-blue px-4 py-2 text-xs font-bold text-white hover:bg-brand-blue-700"
                >
                  Ajouter des photos
                </button>
              </div>
            ) : (
              <>
                <div className="col-span-2 row-span-2 overflow-hidden rounded-xl bg-slate-100">
                  <img src={activeCategoryPhotos[0]} alt="" className="h-full w-full object-cover" />
                </div>
                {activeCategoryPhotos.slice(1, 4).map((img, i) => (
                  <div key={i} className="overflow-hidden rounded-xl bg-slate-100">
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </>
            )}
          </div>
          <div className="mt-2 rounded-xl bg-slate-50 p-3">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue/10">
                <Icon name="play" className="h-4 w-4 text-brand-blue" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-[#0F172A]">Video de presentation</p>
                <p className="text-[10px] text-slate-400">
                  {videoUrl ? 'Video configuree' : 'Ajoutez une video pour presenter votre pressing'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openMediaModal('couverture')}
                className="rounded-lg border border-brand-blue/20 px-3 py-1.5 text-[10px] font-bold text-brand-blue hover:bg-brand-blue/5 transition"
              >
                {videoUrl ? 'Modifier' : 'Ajouter'}
              </button>
            </div>
            {videoUrl && (
              <div className="aspect-video overflow-hidden rounded-lg bg-black">
                {isYoutubeUrl(videoUrl) ? (
                  <iframe
                    title="Video presentation"
                    src={toYoutubeEmbed(videoUrl)}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video src={videoUrl} controls className="h-full w-full object-cover" />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0F172A]">Horaires d'ouverture</h2>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-[#22C55E]/10 text-[#22C55E] text-[10px] font-bold rounded-full">Ouvert maintenant</span>
              <button type="button" onClick={() => setIsHoursModalOpen(true)} className="text-xs font-bold text-brand-blue hover:underline">Modifier</button>
            </div>
          </div>
          <div className="space-y-2">
            {dayOrder.map(day => {
              const hours = workingHours?.[day];
              const isToday = day === dayOrder[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
              return (
                <div key={day} className={`flex items-center justify-between py-2 px-3 rounded-xl ${isToday ? 'bg-brand-blue/5 border border-brand-blue/20' : ''}`}>
                  <div className="flex items-center gap-2">
                    <Icon name={hours?.isClosed ? 'xmark' : 'check'} className={`w-4 h-4 ${hours?.isClosed ? 'text-slate-300' : 'text-[#22C55E]'}`} />
                    <span className={`text-sm font-medium ${isToday ? 'text-brand-blue' : 'text-[#0F172A]'}`}>{dayNames[day]}{isToday ? " (aujourd'hui)" : ''}</span>
                  </div>
                  <span className="text-sm font-bold text-[#0F172A]">{hours?.isClosed ? 'Ferme' : `${hours?.open} – ${hours?.close}`}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Zones de livraison + Services ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0F172A]">Zones de livraison</h2>
            <button className="text-xs font-bold text-brand-blue hover:underline">Gerer</button>
          </div>
          <div className="h-32 bg-slate-100 rounded-xl mb-3 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 19px, #cbd5e1 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, #cbd5e1 20px)', backgroundSize: '20px 20px' }} />
            <div className="absolute inset-0 flex items-center justify-center"><Icon name="mapPin" className="w-8 h-8 text-brand-blue" /></div>
          </div>
          <div className="space-y-1.5">
            {[
              { zone: 'Gombe', price: 'Gratuit', delay: '24 min' },
              { zone: 'Ngaliema', price: '1.00 $', delay: '30 min' },
              { zone: 'Limete', price: '1.00 $', delay: '35 min' },
              { zone: 'Kintambo', price: '2.00 $', delay: '40 min' },
              { zone: 'Bandalungwa', price: '2.00 $', delay: '45 min' },
            ].map((z, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 text-xs">
                <span className="font-medium text-[#0F172A]">{z.zone}</span>
                <span className="text-slate-500">{z.price} • {z.delay}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0F172A]">Mes services & tarifs</h2>
            <button
              type="button"
              onClick={() => { setCatalogServiceToEdit(null); setIsCatalogServiceOpen(true); }}
              className="px-3 py-1.5 text-xs font-bold text-white bg-brand-blue rounded-lg hover:bg-brand-blue-700 transition flex items-center gap-1.5"
            >
              <Icon name="plus" className="w-3 h-3" />Ajouter
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100">
                <th className="text-left py-2 text-[10px] text-slate-500">SERVICE</th>
                <th className="text-left py-2 text-[10px] text-slate-500">PRIX</th>
                <th className="text-left py-2 text-[10px] text-slate-500">DELAI</th>
                <th className="text-center py-2 text-[10px] text-slate-500">STATUT</th>
                <th className="text-center py-2 text-[10px] text-slate-500">ACTIONS</th>
              </tr></thead>
              <tbody>
                {catalogServices.length === 0 && partnerServices.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                      Aucun service actif. Ajoutez votre premier service pour apparaitre aux clients.
                    </td>
                  </tr>
                )}
                {catalogServices.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 font-medium text-[#0F172A] text-xs">
                      {s.service_type_name || s.service_category_name || 'Service'}
                    </td>
                    <td className="py-2.5 text-xs font-bold text-brand-blue">
                      {Number(s.base_price).toFixed(2)}$ ({s.pricing_mode === 'kg' ? 'au kg' : s.pricing_mode === 'fixed' ? 'forfait' : "a l'unite"})
                    </td>
                    <td className="py-2.5 text-xs text-slate-500">{s.estimated_turnaround_hours}h</td>
                    <td className="py-2.5 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.is_available ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-slate-100 text-slate-400'}`}>
                        {s.is_available ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button type="button" onClick={() => { setCatalogServiceToEdit(s); setIsCatalogServiceOpen(true); }} className="p-1 hover:bg-slate-100 rounded"><Icon name="pencil" className="w-3 h-3 text-slate-400" /></button>
                        <button type="button" onClick={() => handleToggleCatalogService(s)} className="p-1 hover:bg-slate-100 rounded" title={s.is_available ? 'Desactiver' : 'Activer'}>
                          <Icon name={s.is_available ? 'xmark' : 'check'} className={`w-3 h-3 ${s.is_available ? 'text-red-400' : 'text-[#22C55E]'}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── FAQ + Reputation ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0F172A]">Questions frequentes</h2>
            <button className="text-xs font-bold text-brand-blue hover:underline">Gerer</button>
          </div>
          <div className="space-y-2">
            {['Nettoyez-vous les costumes ?', 'Faites-vous du nettoyage express ?', 'Lavez-vous le dimanche ?', 'Comment se passe le ramassage ?'].map((q, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <span className="text-xs font-medium text-[#0F172A]">{q}</span>
                <Icon name="chevron-down" className="w-4 h-4 text-slate-400" />
              </div>
            ))}
          </div>
          <button className="w-full mt-3 py-2 text-xs font-bold text-brand-blue border border-brand-blue/20 rounded-lg hover:bg-brand-blue/5 transition">Ajouter une question</button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0F172A]">Reputation</h2>
            <button onClick={() => setSection?.('orders')} className="text-xs font-bold text-brand-blue hover:underline">Voir tous les avis</button>
          </div>
          <div className="text-center mb-4">
            <p className="text-4xl font-extrabold text-[#0F172A]">{avgRating.toFixed(1)}</p>
            <div className="flex items-center justify-center gap-0.5 mt-1">
              {[1,2,3,4,5].map(s => <Icon key={s} name="star" className={`w-5 h-5 ${s <= Math.round(avgRating) ? 'text-yellow-400' : 'text-slate-200'}`} />)}
            </div>
            <p className="text-xs text-slate-400 mt-1">{partnerReviews.length || partner.reviewCount} avis</p>
          </div>
          <div className="space-y-1.5 mb-4">
            {[5,4,3,2,1].map(stars => {
              const count = partnerReviews.filter(r => r.rating === stars).length || (stars === 5 ? 95 : stars === 4 ? 20 : stars === 3 ? 5 : stars === 2 ? 1 : 0);
              const total = partnerReviews.length || 121;
              return (
                <div key={stars} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-slate-500 text-right">{stars}</span>
                  <Icon name="star" className="w-3 h-3 text-yellow-400" />
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-yellow-400 rounded-full" style={{ width: `${(count / total) * 100}%` }} /></div>
                  <span className="w-6 text-right text-slate-400">{count}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1"><Icon name="clock" className="w-3 h-3 text-slate-400" />5 min</span>
            <span className="flex items-center gap-1"><Icon name="check" className="w-3 h-3 text-[#22C55E]" />98%</span>
            <span className="flex items-center gap-1"><Icon name="shield-check" className="w-3 h-3 text-slate-400" />0.8%</span>
          </div>
        </div>
      </div>

      {/* ─── SEO + Sous-domaine + Performance ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-[#0F172A] mb-3">Comment les clients vous trouvent</h2>
          <div className="space-y-2">
            {[
              { kw: 'Pressing Gombe', imp: '1 243', clicks: '156', pos: '2.1' },
              { kw: 'Nettoyage a sec Gombe', imp: '938', clicks: '112', pos: '2.8' },
              { kw: 'Blanchisserie Kinshasa', imp: '721', clicks: '89', pos: '3.3' },
              { kw: 'Lavage costume Kinshasa', imp: '612', clicks: '73', pos: '4.0' },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 text-xs">
                <span className="font-medium text-[#0F172A]">{row.kw}</span>
                <div className="flex items-center gap-3 text-slate-500">
                  <span>{row.imp}</span><span>{row.clicks}</span><span className="font-bold text-brand-blue">#{row.pos}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 bg-blue-50 rounded-xl flex items-center gap-2">
            <Icon name="sparkles" className="w-4 h-4 text-brand-blue" />
            <p className="text-[10px] text-brand-blue font-medium">Conseil SEO : Ajoutez plus de photos et repondez aux avis.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-[#0F172A] mb-3">Sous-domaine personnalise</h2>
          <div className="p-4 bg-slate-50 rounded-xl mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-[#22C55E]/10 text-[#22C55E] text-[10px] font-bold rounded-full">Actif</span>
            </div>
            <p className="text-xl font-extrabold text-[#0F172A] mb-0.5">{partner.slug}</p>
            <p className="text-xs text-slate-400">laundry.app</p>
            <p className="text-sm font-bold text-brand-blue mt-1">https://{partner.slug}.laundry.app</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCopyLink} className="flex-1 py-2 text-xs font-bold border border-slate-200 rounded-lg hover:bg-slate-50 transition">Copier URL</button>
            <a
              href={shareUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 text-xs font-bold bg-brand-blue text-white rounded-lg hover:bg-brand-blue-700 transition text-center"
            >
              Tester
            </a>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-[#0F172A] mb-3">Performance du profil</h2>
          <div className="space-y-3">
            {[
              { icon: 'user', label: 'Visites du profil', value: '2 341', change: '+18%' },
              { icon: 'chatBubble', label: 'Demandes recues', value: '150', change: '+22%' },
              { icon: 'shoppingBag', label: 'Commandes', value: '46', change: '+15%' },
              { icon: 'chartBar', label: 'Taux conversion', value: '6.4%', change: '+0.8%' },
              { icon: 'trophy', label: 'Classement', value: '#3 Gombe', change: '↑2' },
            ].map((kpi, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2"><Icon name={kpi.icon as any} className="w-4 h-4 text-slate-400" /><span className="text-xs text-slate-600">{kpi.label}</span></div>
                <div className="text-right"><span className="text-sm font-bold text-[#0F172A]">{kpi.value}</span><span className="text-[10px] font-bold text-[#22C55E] ml-1">{kpi.change}</span></div>
              </div>
            ))}
          </div>
          {setSection && <button onClick={() => setSection('analytics')} className="w-full mt-3 py-2 text-xs font-bold text-brand-blue border border-brand-blue/20 rounded-lg hover:bg-brand-blue/5 transition">Voir statistiques detaillees</button>}
        </div>
      </div>

      {/* ─── CTA Final sticky ─── */}
      <div className="bg-gradient-to-r from-brand-blue to-brand-blue-700 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-3xl">🚀</span>
          <div>
            <h3 className="text-base font-extrabold text-white">Developpez votre activite</h3>
            <p className="text-xs text-white/80">Un profil complete attire plus de clients et augmente vos commandes.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-white/80">Profil complete a <strong className="text-white">{profileScore}%</strong></span>
          <button
            type="button"
            onClick={handleCompleteProfile}
            className="px-5 py-2.5 bg-white text-brand-blue font-bold rounded-xl text-sm hover:bg-white/90 transition active:scale-[0.98]"
          >
            {firstIncompleteItem ? 'Completer mon profil' : 'Profil complet ✓'}
          </button>
        </div>
      </div>

      {createPortal(
        <>
          <PartnerProfileEditModal
            open={isProfileEditOpen}
            initial={profileFormValues}
            profileDetail={profileDetail}
            onClose={() => setIsProfileEditOpen(false)}
            onSave={handleSaveProfile}
          />
          <PartnerWorkingHoursModal
            open={isHoursModalOpen}
            initial={workingHours || getDefaultWorkingHours()}
            onClose={() => setIsHoursModalOpen(false)}
            onSave={handleSaveHours}
          />
          {partner && (
            <PartnerCatalogServiceModal
              open={isCatalogServiceOpen}
              partnerId={partner.id}
              service={catalogServiceToEdit}
              onClose={() => { setIsCatalogServiceOpen(false); setCatalogServiceToEdit(null); }}
              onSaved={async () => {
                await loadCatalogServices();
                await loadProfileDetail();
                addNotification('Service enregistre', 'success');
              }}
            />
          )}
          <PartnerMediaModal
            open={isMediaModalOpen}
            initialGallery={mediaGallery}
            initialVideoUrl={videoUrl}
            initialTab={mediaModalTab}
            onClose={() => setIsMediaModalOpen(false)}
            onSave={persistMedia}
          />
        </>,
        document.body,
      )}
    </div>
  );
};
