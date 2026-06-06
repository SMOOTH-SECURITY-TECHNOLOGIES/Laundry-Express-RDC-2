import React, { useMemo, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Icon } from '../components/Icon';
import { PartnerType } from '../types';
import { trackEvent } from '../utils/tracking';
import { sendServerSideEvent } from '../utils/capi';

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');
const inputClass =
  'w-full rounded-xl border border-[#dbe7fb] bg-white px-4 py-3 text-sm text-[#06105f] outline-none transition focus:border-[#005bd8] focus:ring-4 focus:ring-[#dcecff]';

const communes = [
  'Gombe',
  'Limete',
  'Ngaliema',
  'Kintambo',
  'Lemba',
  'Bandalungwa',
  'Kasa-Vubu',
  'Matete',
  'Mont-Ngafula',
  'Kinshasa',
];

const serviceOptions = [
  { id: 'dry_cleaning', label: 'Nettoyage à sec' },
  { id: 'ironing', label: 'Repassage' },
  { id: 'washing', label: 'Lavage' },
  { id: 'carpets', label: 'Tapis' },
];

const scheduleOptions = [
  { value: 'morning', label: 'Matin (7h–12h)' },
  { value: 'afternoon', label: 'Après-midi (12h–18h)' },
  { value: 'both', label: 'Journée complète (7h–18h)' },
];

interface DocumentFile {
  name: string;
  size: string;
  base64: string;
  type: 'image' | 'pdf';
  previewUrl?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1048576).toFixed(1)} Mo`;
};

const estimatorDefaults: Record<PartnerType, { activity: number; price: number }> = {
  [PartnerType.PRESSING]: { activity: 15, price: 15000 },
  [PartnerType.LAVANDIER]: { activity: 80, price: 2500 },
  [PartnerType.LOGISTICS]: { activity: 25, price: 3500 },
};

export const BecomePartnerPage: React.FC = () => {
  const { setCurrentPage, submitPartnerApplication, addNotification, applicationSettings, t } = useAppContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [dailyVolume, setDailyVolume] = useState(estimatorDefaults[PartnerType.PRESSING].activity);
  const [averagePrice, setAveragePrice] = useState(estimatorDefaults[PartnerType.PRESSING].price);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    partnerType: null as PartnerType | null,
    contactName: '',
    phone: '',
    email: '',
    address: '',
    commune: '',
    capacity: '',
    message: '',
  });
  const [documents, setDocuments] = useState<{
    logo: DocumentFile | null;
    idPiece: DocumentFile | null;
    commerceRegister: DocumentFile | null;
  }>({ logo: null, idPiece: null, commerceRegister: null });
  const [services, setServices] = useState<string[]>([]);
  const [schedule, setSchedule] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const applicationFormRef = useRef<HTMLFormElement | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const activeEstimatorType = formData.partnerType || PartnerType.PRESSING;
  const estimatorConfig = useMemo(() => {
    switch (activeEstimatorType) {
      case PartnerType.LAVANDIER:
        return {
          title: 'Estimez vos revenus blanchisserie',
          volumeLabel: 'Kg traites par jour',
          priceLabel: 'Prix moyen par kg (CDF)',
          volumeMin: 10,
          volumeMax: 300,
          volumeStep: 5,
          priceMin: 1000,
          priceMax: 8000,
          priceStep: 250,
          formula: 'kg/jour x prix/kg x 30 jours',
        };
      case PartnerType.LOGISTICS:
        return {
          title: 'Estimez vos revenus logistiques',
          volumeLabel: 'Courses par jour',
          priceLabel: 'Revenu moyen par course (CDF)',
          volumeMin: 1,
          volumeMax: 120,
          volumeStep: 1,
          priceMin: 1000,
          priceMax: 15000,
          priceStep: 500,
          formula: 'courses/jour x revenu/course x 30 jours',
        };
      case PartnerType.PRESSING:
      default:
        return {
          title: 'Estimez vos revenus pressing',
          volumeLabel: 'Commandes par jour',
          priceLabel: 'Panier moyen par commande (CDF)',
          volumeMin: 1,
          volumeMax: 60,
          volumeStep: 1,
          priceMin: 3000,
          priceMax: 60000,
          priceStep: 1000,
          formula: 'commandes/jour x panier moyen x 30 jours',
        };
    }
  }, [activeEstimatorType]);
  const dailyRevenue = dailyVolume * averagePrice;
  const monthlyRevenue = dailyRevenue * 30;

  const partnerTypeOptions = useMemo(
    () => [
      {
        type: PartnerType.PRESSING,
        icon: 'shirt',
        title: 'Nettoyage a sec',
        shortTitle: 'Je suis un pressing',
        description: "Pour les entreprises specialisees dans le nettoyage a sec, le repassage et l'entretien textile haut de gamme.",
        benefits: ['Plus de clients', 'Paiements securises', 'Gestion simplifiee'],
        color: 'blue',
        enabled: applicationSettings[PartnerType.PRESSING],
      },
      {
        type: PartnerType.LAVANDIER,
        icon: 'wash',
        title: 'Lessive',
        shortTitle: 'Je suis une blanchisserie',
        description: 'Pour les blanchisseries proposant lavage, sechage et pliage au kilo.',
        benefits: ['Augmentation du volume', 'Gestion digitale', 'Suivi des commandes'],
        color: 'teal',
        enabled: applicationSettings[PartnerType.LAVANDIER],
      },
      {
        type: PartnerType.LOGISTICS,
        icon: 'truck',
        title: 'Partenaire logistique',
        shortTitle: 'Je suis transporteur',
        description: "Pour les entreprises de livraison disposant de chauffeurs ou d'une flotte.",
        benefits: ['Courses quotidiennes', 'Revenus recurrents', 'Planification optimisee'],
        color: 'violet',
        enabled: applicationSettings[PartnerType.LOGISTICS],
      },
    ],
    [applicationSettings]
  );

  const availablePartnerTypes = useMemo(() => partnerTypeOptions.filter((opt) => opt.enabled), [partnerTypeOptions]);

  const selectedPartnerLabel = useMemo(() => {
    return partnerTypeOptions.find((option) => option.type === formData.partnerType)?.title || '';
  }, [formData.partnerType, partnerTypeOptions]);

  const handleTypeSelect = (type: PartnerType, shouldScrollToForm = false) => {
    if (type === PartnerType.LOGISTICS) {
      setCurrentPage({ name: 'logistics-partnership' });
      return;
    }
    setFormData((prev) => ({ ...prev, partnerType: type }));
    setDailyVolume(estimatorDefaults[type].activity);
    setAveragePrice(estimatorDefaults[type].price);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.partnerType;
      return next;
    });
    if (shouldScrollToForm) {
      window.setTimeout(() => {
        applicationFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value as any }));
  };

  const handleServiceToggle = (serviceId: string) => {
    setServices((prev) =>
      prev.includes(serviceId) ? prev.filter((s) => s !== serviceId) : [...prev, serviceId]
    );
  };

  const readDocumentFile = (file: File): Promise<DocumentFile> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const isImage = file.type.startsWith('image/');
        resolve({
          name: file.name,
          size: formatFileSize(file.size),
          base64,
          type: isImage ? 'image' : 'pdf',
          previewUrl: isImage ? base64 : undefined,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (docKey: 'logo' | 'idPiece' | 'commerceRegister', file: File) => {
    const maxSize = docKey === 'logo' ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrors((prev) => ({ ...prev, [docKey]: `Fichier trop volumineux. Maximum: ${docKey === 'logo' ? '2 Mo' : '5 Mo'}.` }));
      return;
    }

    if (docKey !== 'logo' && !['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setErrors((prev) => ({ ...prev, [docKey]: 'Format non supporté. Utilisez PDF ou JPG.' }));
      return;
    }

    if (docKey === 'logo' && !file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, [docKey]: 'Le logo doit être une image (JPG ou PNG).' }));
      return;
    }

    try {
      const doc = await readDocumentFile(file);
      setDocuments((prev) => ({ ...prev, [docKey]: doc }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[docKey];
        return next;
      });
    } catch {
      setErrors((prev) => ({ ...prev, [docKey]: 'Erreur lors de la lecture du fichier.' }));
    }
  };

  const handleRemoveDocument = (docKey: 'logo' | 'idPiece' | 'commerceRegister') => {
    setDocuments((prev) => ({ ...prev, [docKey]: null }));
    if (fileInputRefs.current[docKey]) {
      fileInputRefs.current[docKey]!.value = '';
    }
  };

  const handleFileInput = (docKey: 'logo' | 'idPiece' | 'commerceRegister') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(docKey, file);
  };

  const handleDrop = (docKey: 'logo' | 'idPiece' | 'commerceRegister') => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(docKey, file);
  };

  const handleDragOver = (docKey: string) => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(docKey);
  };

  const handleDragLeave = () => setDragOver(null);

  const validateStep = (step: number): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (step === 1) {
      if (!formData.partnerType) newErrors.partnerType = 'Selectionnez un type de partenariat.';
      if (!formData.companyName.trim()) newErrors.companyName = t('validation.required');
      if (!formData.commune.trim()) newErrors.commune = t('validation.required');
    }

    if (step === 2) {
      if (!formData.contactName.trim()) newErrors.contactName = t('validation.required');
      if (!formData.phone.trim()) {
        newErrors.phone = t('validation.required');
      } else if (!/^(0?8\d{8}|\+243\s?8\d{8})$/.test(formData.phone.replace(/\s+/g, ''))) {
        newErrors.phone = t('validation.invalidPhone');
      }
      if (!formData.email.trim()) {
        newErrors.email = t('validation.required');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = t('validation.invalidEmail');
      }
    }

    if (step === 4) {
      if (!formData.capacity.trim()) newErrors.capacity = t('validation.required');
      if (!acceptedTerms) newErrors.terms = "Vous devez accepter les conditions avant d'envoyer la demande.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      window.scrollTo({ top: applicationFormRef.current?.offsetTop || 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: applicationFormRef.current?.offsetTop || 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) {
      return;
    }
    setIsLoading(true);

    try {
      const docLines: string[] = [];
      if (documents.logo) docLines.push(`Logo: ${documents.logo.name}`);
      if (documents.idPiece) docLines.push(`Piece d'identite: ${documents.idPiece.name}`);
      if (documents.commerceRegister) docLines.push(`Registre de commerce: ${documents.commerceRegister.name}`);

      await submitPartnerApplication({
        companyName: formData.companyName,
        partnerType: formData.partnerType,
        contactName: formData.contactName,
        phone: formData.phone,
        email: formData.email,
        address: [formData.address, formData.commune].filter(Boolean).join(', '),
        message: [
          formData.message,
          formData.capacity ? `Capacite journaliere: ${formData.capacity}` : '',
          selectedPartnerLabel ? `Type demande: ${selectedPartnerLabel}` : '',
          services.length ? `Services: ${services.map((s) => serviceOptions.find((o) => o.id === s)?.label).join(', ')}` : '',
          schedule ? `Horaires: ${scheduleOptions.find((o) => o.value === schedule)?.label}` : '',
          docLines.length ? `Documents: ${docLines.join(' | ')}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
      } as any);

      trackEvent('Lead', {
        lead_type: 'Partner Application',
        partner_type: formData.partnerType,
        value: 50,
        currency: 'USD',
      });

      const [firstName, ...lastNameParts] = formData.contactName.split(' ');
      sendServerSideEvent('Lead', {
        value: 50,
        currency: 'USD',
        content_name: 'Partner Application',
        user_data: {
          email: formData.email,
          phone_number: formData.phone,
          address: {
            first_name: firstName,
            last_name: lastNameParts.join(' '),
          },
        },
      });

      setSubmitted(true);
    } catch (err) {
      addNotification(t('becomePartnerPage.submitError', { default: "Une erreur s'est produite. Veuillez reessayer." }), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="mx-auto max-w-3xl bg-[#f7fbff] px-4 py-16">
        <section className="rounded-[2rem] border border-[#dbe7fb] bg-white p-8 text-center shadow-xl shadow-[#dbe7fb]/70">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f8f3] text-[#00a884]">
            <Icon name="check" className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black text-[#06105f]">Demande envoyee</h1>
          <p className="mx-auto mt-3 max-w-xl text-[#4b587c]">
            Merci. Notre equipe va verifier vos informations et vous contacter pour finaliser votre inscription partenaire.
          </p>
          <button
            onClick={() => setCurrentPage({ name: 'home' })}
            className="mt-8 rounded-xl bg-[#005bd8] px-8 py-3 font-bold text-white shadow-lg shadow-[#005bd8]/20 transition hover:bg-[#004bb5] focus:outline-none focus:ring-4 focus:ring-[#dcecff]"
          >
            Retour a l'accueil
          </button>
        </section>
      </main>
    );
  }

  const trustBadges = [
    ['users', '+10 000', 'Clients potentiels'],
    ['shoppingBag', '+500', 'Commandes mensuelles'],
    ['clock', '24h/24', 'Visibilite en ligne'],
    ['star', '98%', 'Clients satisfaits'],
  ] as const;

  const reasons = [
    ['chartBar', 'Plus de commandes', 'Accedez a des milliers de clients chaque mois.'],
    ['shield-check', 'Paiements securises', 'Recevez vos paiements en toute securite.'],
    ['device-phone-mobile', 'Gestion centralisee', 'Gerez vos commandes, articles et clients en un seul endroit.'],
    ['star', 'Visibilite accrue', 'Votre etablissement est mis en avant aupres des clients.'],
    ['truck', 'Livraison optimisee', 'Nos partenaires logistiques assurent des livraisons rapides.'],
    ['chartBar', 'Rapports & stats', 'Suivez vos performances et developpez votre activite.'],
  ] as const;

  const stepsInfo = [
    ['user', 'Inscription', 'Remplissez le formulaire et envoyez votre demande.'],
    ['document-text', 'Validation du dossier', 'Notre equipe verifie votre activite et vos informations.'],
    ['building', 'Publication du profil', 'Votre etablissement est publie sur la plateforme.'],
    ['shoppingBag', 'Reception des commandes', 'Recevez des commandes et gerez-les facilement.'],
    ['wallet', 'Paiement et croissance', 'Soyez paye regulierement et developpez votre entreprise.'],
  ] as const;

  const testimonials = [
    ['Prestige Pressing', 'Gombe', "Depuis Laundry Express, nous avons augmente notre volume de commandes de 40%."],
    ['Clean Express', 'Limete', 'La gestion des commandes est simple et les paiements toujours a temps.'],
    ['Livraison Express', 'Kintambo', "Les courses sont regulieres et l'application nous facilite beaucoup la planification."],
  ];

  const faqs = [
    'Comment devenir partenaire ?',
    "Combien coute l'inscription ?",
    'Quand suis-je paye ?',
    'Qui gere la livraison ?',
    'Comment sont calculees les commissions ?',
  ];

  const stepTitles = ['Entreprise', 'Contact', 'Documents', 'Details'];

  const renderDocumentUpload = (
    docKey: 'logo' | 'idPiece' | 'commerceRegister',
    label: string,
    accept: string,
    maxSizeLabel: string
  ) => {
    const doc = documents[docKey];
    return (
      <div className="space-y-2">
        <label className="text-sm font-bold text-[#243056]">{label}</label>
        <div
          onDrop={handleDrop(docKey)}
          onDragOver={handleDragOver(docKey)}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRefs.current[docKey]?.click()}
          className={cn(
            'relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 transition',
            dragOver === docKey
              ? 'border-[#005bd8] bg-[#eef6ff]'
              : doc
                ? 'border-[#b8efe0] bg-[#ecfbf7]'
                : 'border-[#dbe7fb] bg-[#f8fbff] hover:border-[#a9c8f5] hover:bg-[#eef6ff]'
          )}
        >
          <input
            ref={(el) => { fileInputRefs.current[docKey] = el; }}
            type="file"
            accept={accept}
            onChange={handleFileInput(docKey)}
            className="hidden"
          />
          {doc ? (
            <div className="flex w-full items-center gap-3">
              {doc.previewUrl ? (
                <img src={doc.previewUrl} alt={doc.name} className="h-14 w-14 rounded-lg object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#eef6ff]">
                  <Icon name="document-text" className="h-7 w-7 text-[#005bd8]" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[#06105f]">{doc.name}</p>
                <p className="text-xs text-[#4b587c]">{doc.size}</p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleRemoveDocument(docKey); }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500 transition hover:bg-red-100"
              >
                <Icon name="xmark" className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <Icon name="arrow-down-tray" className="h-8 w-8 text-[#a9c8f5]" />
              <p className="mt-2 text-sm font-bold text-[#4b587c]">
                Cliquez ou déposez un fichier
              </p>
              <p className="mt-1 text-xs text-[#a9c8f5]">
                Max: {maxSizeLabel}
              </p>
            </>
          )}
        </div>
        {errors[docKey] && <p className="text-xs font-semibold text-red-600">{errors[docKey]}</p>}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="md:col-span-2">
              <h3 className="text-lg font-black text-[#06105f]">Informations de l'entreprise</h3>
              <p className="mt-1 text-sm text-[#4b587c]">Décrivez votre activité et localisation.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nom de l'entreprise" error={errors.companyName}>
                <input id="companyName" name="companyName" value={formData.companyName} onChange={handleChange} className={inputClass} placeholder="Ex: Prestige Pressing" />
              </Field>
              <Field label="Commune" error={errors.commune}>
                <select id="commune" name="commune" value={formData.commune} onChange={handleChange} className={inputClass}>
                  <option value="">Selectionnez votre commune</option>
                  {communes.map((commune) => (
                    <option key={commune} value={commune}>
                      {commune}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Adresse détaillée (optionnel)">
              <input id="address" name="address" value={formData.address} onChange={handleChange} placeholder="Avenue, quartier, reference" className={inputClass} />
            </Field>
            {errors.partnerType && <p className="text-sm font-semibold text-red-600">{errors.partnerType}</p>}
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="md:col-span-2">
              <h3 className="text-lg font-black text-[#06105f]">Coordonnées du responsable</h3>
              <p className="mt-1 text-sm text-[#4b587c]">Nous aurons besoin de vos coordonnées pour vous contacter.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nom du responsable" error={errors.contactName}>
                <input id="contactName" name="contactName" value={formData.contactName} onChange={handleChange} className={inputClass} placeholder="Prénom et nom" />
              </Field>
              <Field label="Telephone" error={errors.phone}>
                <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+243 81 234 5678" className={inputClass} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Email" error={errors.email}>
                  <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="exemple@email.com" className={inputClass} />
                </Field>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-black text-[#06105f]">Documents requis</h3>
              <p className="mt-1 text-sm text-[#4b587c]">Téléchargez vos documents pour valider votre dossier.</p>
            </div>
            {renderDocumentUpload('logo', "Logo de l'entreprise", 'image/*', '2 Mo')}
            {renderDocumentUpload('idPiece', "Pièce d'identité", '.pdf,.jpg,.jpeg,.png', '5 Mo')}
            {renderDocumentUpload('commerceRegister', 'Registre de commerce', '.pdf,.jpg,.jpeg,.png', '5 Mo')}
          </div>
        );
      case 4:
        return (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-black text-[#06105f]">Détails de l'activité</h3>
              <p className="mt-1 text-sm text-[#4b587c]">Complétez les informations sur vos services.</p>
            </div>
            <Field label="Capacité journalière" error={errors.capacity}>
              <input
                id="capacity"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                placeholder="ex: 50 kg, 20 pieces, 8 courses"
                className={inputClass}
              />
            </Field>
            <div>
              <label className="text-sm font-bold text-[#243056]">Services proposés</label>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {serviceOptions.map((service) => (
                  <label
                    key={service.id}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border p-3 text-sm transition cursor-pointer',
                      services.includes(service.id)
                        ? 'border-[#005bd8] bg-[#eef6ff] text-[#06105f]'
                        : 'border-[#dbe7fb] bg-white text-[#4b587c] hover:border-[#a9c8f5]'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={services.includes(service.id)}
                      onChange={() => handleServiceToggle(service.id)}
                      className="h-4 w-4 rounded border-[#a9c8f5] text-[#005bd8] focus:ring-[#005bd8]"
                    />
                    {service.label}
                  </label>
                ))}
              </div>
            </div>
            <Field label="Horaires d'ouverture">
              <select value={schedule} onChange={(e) => setSchedule(e.target.value)} className={inputClass}>
                <option value="">Selectionnez vos horaires</option>
                {scheduleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <div>
              <label htmlFor="message" className="text-sm font-bold text-[#243056]">
                Message / notes (optionnel)
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                value={formData.message}
                onChange={handleChange}
                placeholder="Informations complémentaires..."
                className="mt-2 w-full rounded-xl border border-[#dbe7fb] bg-white px-4 py-3 text-sm text-[#06105f] outline-none transition focus:border-[#005bd8] focus:ring-4 focus:ring-[#dcecff]"
              />
            </div>
            <label className="flex items-start gap-3 text-sm text-[#4b587c]">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[#a9c8f5] text-[#005bd8] focus:ring-[#005bd8]"
              />
              <span>J'accepte les conditions generales d'utilisation et la politique de confidentialite.</span>
            </label>
            {errors.terms && <p className="text-sm font-semibold text-red-600">{errors.terms}</p>}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="bg-[#f7fbff] text-[#06105f]">
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-12 pt-14 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:px-8">
        <div>
          <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-normal text-[#06105f] sm:text-5xl lg:text-6xl">
            Developpez votre activite avec <span className="text-[#005bd8]">Laundry Express</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#4b587c]">
            Recevez plus de commandes, simplifiez votre gestion et augmentez vos revenus grace a la premiere plateforme de blanchisserie connectee en RDC.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#partner-application"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#005bd8] px-6 py-4 text-sm font-black text-white shadow-lg shadow-[#005bd8]/25 transition hover:bg-[#004bb5] focus:outline-none focus:ring-4 focus:ring-[#dcecff]"
            >
              Devenir partenaire
              <Icon name="arrowRight" className="h-4 w-4" />
            </a>
            <a
              href="tel:+243812345678"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#a9c8f5] bg-white px-6 py-4 text-sm font-black text-[#06105f] transition hover:border-[#005bd8] hover:text-[#005bd8] focus:outline-none focus:ring-4 focus:ring-[#dcecff]"
            >
              Parler a un conseiller
              <Icon name="phone" className="h-4 w-4" />
            </a>
          </div>
          <div className="mt-8 grid gap-3 text-sm font-semibold text-[#4b587c] sm:grid-cols-3">
            {['Inscription gratuite', 'Sans engagement', 'Paiements securises'].map((label) => (
              <span key={label} className="inline-flex items-center gap-2">
                <Icon name="check" className="h-4 w-4 rounded-full bg-[#dcecff] p-0.5 text-[#005bd8]" />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] bg-transparent">
          <img
            src="/partner-hero-illustration.svg"
            alt="Pressing partenaire Laundry Express avec application de commande et livraison"
            className="h-auto w-full object-contain"
            loading="eager"
            decoding="async"
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 rounded-2xl border border-[#dbe7fb] bg-white p-4 shadow-xl shadow-[#dbe7fb]/70 sm:grid-cols-2 lg:grid-cols-4">
          {trustBadges.map(([icon, value, label]) => (
            <div key={label} className="flex items-center justify-center gap-4 border-[#e8f0ff] py-5 lg:border-r last:border-r-0">
              <Icon name={icon as any} className="h-8 w-8 text-[#005bd8]" />
              <div>
                <p className="text-2xl font-black text-[#005bd8]">{value}</p>
                <p className="text-sm text-[#4b587c]">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-black text-[#06105f]">Choisissez votre type de partenariat</h2>
        {errors.partnerType && <p className="mt-3 text-center text-sm font-semibold text-red-600">{errors.partnerType}</p>}
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {availablePartnerTypes.map((option) => {
            const isSelected = formData.partnerType === option.type;
            const theme =
              option.color === 'teal'
                ? {
                    card: 'from-[#ecfbf7] to-[#f7fffd] border-[#b8efe0]',
                    selected: 'border-[#00a884] ring-[#c9f6ea]',
                    icon: 'text-[#00a884]',
                    iconBg: 'bg-white shadow-[#b8efe0]/80',
                    checkBg: 'bg-[#dff8f1]',
                    button: 'bg-[#00a884] hover:bg-[#008f72] shadow-[#00a884]/25',
                  }
                : option.color === 'violet'
                  ? {
                      card: 'from-[#f4efff] to-[#fbf9ff] border-[#d7ccff]',
                      selected: 'border-[#6b4ce6] ring-[#ddd6ff]',
                      icon: 'text-[#6b4ce6]',
                      iconBg: 'bg-white shadow-[#d7ccff]/80',
                      checkBg: 'bg-[#eeeaff]',
                      button: 'bg-[#6b4ce6] hover:bg-[#5638d0] shadow-[#6b4ce6]/25',
                    }
                  : {
                      card: 'from-[#eef6ff] to-[#f8fbff] border-[#c7dcfb]',
                      selected: 'border-[#005bd8] ring-[#dcecff]',
                      icon: 'text-[#005bd8]',
                      iconBg: 'bg-white shadow-[#c7dcfb]/80',
                      checkBg: 'bg-[#dcecff]',
                      button: 'bg-[#005bd8] hover:bg-[#004bb5] shadow-[#005bd8]/25',
                    };
            return (
              <button
                key={option.type}
                type="button"
                onClick={() => handleTypeSelect(option.type, true)}
                className={cn(
                  'group rounded-2xl border bg-gradient-to-br p-6 text-left shadow-lg transition hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus:ring-4',
                  theme.card,
                  isSelected ? `${theme.selected} ring-4` : 'ring-transparent'
                )}
                aria-pressed={isSelected}
              >
                <div className={cn('mx-auto flex h-20 w-20 items-center justify-center rounded-full shadow-lg', theme.iconBg)}>
                  <Icon name={option.icon as any} className={cn('h-10 w-10', theme.icon)} />
                </div>
                <h3 className="mt-5 text-center text-2xl font-black text-[#06105f]">{option.title}</h3>
                {isSelected && (
                  <span className="mx-auto mt-3 flex w-fit items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-black text-[#06105f] shadow-sm">
                    <Icon name="check" className={cn('h-4 w-4', theme.icon)} />
                    Selectionne
                  </span>
                )}
                <p className="mx-auto mt-3 max-w-xs text-center text-sm leading-6 text-[#4b587c]">{option.description}</p>
                <div className="mt-5 space-y-3">
                  {option.benefits.map((benefit) => (
                    <span key={benefit} className="flex items-center gap-2 text-sm font-bold text-[#243056]">
                      <Icon name="check" className={cn('h-5 w-5 rounded-full p-1', theme.checkBg, theme.icon)} />
                      {benefit}
                    </span>
                  ))}
                </div>
                <span className={cn('mt-6 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black text-white shadow-lg transition', theme.button)}>
                  {option.shortTitle}
                  <Icon name="arrowRight" className="h-4 w-4" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-black text-[#06105f]">Pourquoi rejoindre Laundry Express ?</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {reasons.map(([icon, title, description]) => (
            <div key={title} className="text-center">
              <Icon name={icon as any} className="mx-auto h-10 w-10 text-[#005bd8]" />
              <h3 className="mt-4 text-sm font-black text-[#06105f]">{title}</h3>
              <p className="mt-2 text-xs leading-5 text-[#4b587c]">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-black text-[#06105f]">Comment ca marche ?</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-5">
          {stepsInfo.map(([icon, title, description], index) => (
            <div key={title} className="relative text-center">
              {index < stepsInfo.length - 1 && <div className="absolute left-1/2 top-10 hidden h-px w-full bg-[#c8daf8] md:block" />}
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#eef6ff] shadow-inner">
                <Icon name={icon as any} className="h-9 w-9 text-[#005bd8]" />
              </div>
              <div className="mx-auto -mt-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#005bd8] text-sm font-black text-white">{index + 1}</div>
              <h3 className="mt-4 font-black text-[#06105f]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#4b587c]">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-12 sm:px-6 lg:grid-cols-[0.9fr_1.4fr] lg:px-8">
        <div className="rounded-2xl border border-[#dbe7fb] bg-white p-6 shadow-lg shadow-[#dbe7fb]/70">
          <h2 className="text-center text-2xl font-black text-[#06105f]">{estimatorConfig.title}</h2>
          <p className="mt-2 text-center text-sm text-[#4b587c]">
            Estimation directe: volume quotidien x prix moyen
          </p>
          <label className="mt-6 block text-sm font-bold text-[#243056]">
            {estimatorConfig.volumeLabel}
            <span className="float-right rounded-lg bg-[#eef6ff] px-4 py-1 text-[#005bd8]">{dailyVolume}</span>
          </label>
          <input
            type="range"
            min={estimatorConfig.volumeMin}
            max={estimatorConfig.volumeMax}
            step={estimatorConfig.volumeStep}
            value={dailyVolume}
            onChange={(event) => setDailyVolume(Number(event.target.value))}
            className="mt-4 w-full accent-[#005bd8]"
          />
          <label className="mt-6 block text-sm font-bold text-[#243056]">
            {estimatorConfig.priceLabel}
            <span className="float-right rounded-lg bg-[#eef6ff] px-4 py-1 text-[#005bd8]">{averagePrice.toLocaleString('fr-FR')}</span>
          </label>
          <input
            type="range"
            min={estimatorConfig.priceMin}
            max={estimatorConfig.priceMax}
            step={estimatorConfig.priceStep}
            value={averagePrice}
            onChange={(event) => setAveragePrice(Number(event.target.value))}
            className="mt-4 w-full accent-[#005bd8]"
          />
          <div className="mt-6 rounded-2xl bg-[#eef6ff] p-5 text-center">
            <Icon name="wallet" className="mx-auto h-8 w-8 text-[#005bd8]" />
            <p className="mt-2 text-sm font-bold text-[#4b587c]">Revenu brut estime par jour</p>
            <p className="mt-1 text-3xl font-black text-[#005bd8]">{dailyRevenue.toLocaleString('fr-FR')} CDF</p>
            <p className="mt-2 text-sm font-black text-[#06105f]">
              Projection mensuelle: {monthlyRevenue.toLocaleString('fr-FR')} CDF
            </p>
            <p className="mt-2 text-xs font-semibold text-[#4b587c]">
              Estimation indicative avant commissions, charges et variations de volume.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#dbe7fb] bg-white p-6 shadow-lg shadow-[#dbe7fb]/70">
          <h2 className="text-center text-2xl font-black text-[#06105f]">Ils nous font confiance</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {testimonials.map(([name, area, quote]) => (
              <article key={name} className="rounded-2xl border border-[#e8f0ff] p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dcecff] font-black text-[#005bd8]">{name.charAt(0)}</div>
                  <div>
                    <h3 className="font-black text-[#06105f]">{name}</h3>
                    <p className="text-sm text-[#4b587c]">{area}</p>
                  </div>
                </div>
                <p className="mt-3 text-[#ffb703]">★★★★★</p>
                <p className="mt-3 text-sm leading-6 text-[#4b587c]">"{quote}"</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="partner-application" className="mx-auto grid max-w-7xl gap-6 px-4 pb-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div className="rounded-2xl border border-[#dbe7fb] bg-white p-6 shadow-lg shadow-[#dbe7fb]/70">
          <h2 className="text-center text-2xl font-black text-[#06105f]">Questions frequentes</h2>
          <div className="mt-5 space-y-3">
            {faqs.map((question) => (
              <details key={question} className="rounded-xl border border-[#dbe7fb] bg-[#f8fbff] p-4">
                <summary className="cursor-pointer text-sm font-black text-[#06105f]">{question}</summary>
                <p className="mt-3 text-sm leading-6 text-[#4b587c]">
                  Notre equipe vous accompagne et valide chaque dossier avant publication sur la plateforme.
                </p>
              </details>
            ))}
          </div>
        </div>

        <form
          ref={applicationFormRef}
          onSubmit={handleSubmit}
          className="scroll-mt-24 rounded-2xl border border-[#dbe7fb] bg-white p-6 shadow-lg shadow-[#dbe7fb]/70"
        >
          <h2 className="text-center text-2xl font-black text-[#06105f]">Commencez aujourd'hui</h2>

          <div className="mt-6">
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4].map((step) => (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full text-sm font-black transition',
                        currentStep >= step
                          ? 'bg-[#005bd8] text-white'
                          : 'bg-[#eef6ff] text-[#a9c8f5]'
                      )}
                    >
                      {currentStep > step ? (
                        <Icon name="check" className="h-5 w-5" />
                      ) : (
                        step
                      )}
                    </div>
                    <span
                      className={cn(
                        'mt-2 text-xs font-bold',
                        currentStep >= step ? 'text-[#005bd8]' : 'text-[#a9c8f5]'
                      )}
                    >
                      {stepTitles[step - 1]}
                    </span>
                  </div>
                  {step < 4 && (
                    <div
                      className={cn(
                        'mb-6 h-0.5 w-8 sm:w-12',
                        currentStep > step ? 'bg-[#005bd8]' : 'bg-[#eef6ff]'
                      )}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="mx-auto mt-4 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-[#eef6ff]">
              <div
                className="h-full rounded-full bg-[#005bd8] transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
          </div>

          <div className="mt-6">{renderStepContent()}</div>

          <div className="mt-6 flex items-center justify-between gap-3">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevious}
                className="flex items-center gap-2 rounded-xl border border-[#dbe7fb] bg-white px-5 py-3 text-sm font-bold text-[#06105f] transition hover:border-[#a9c8f5] focus:outline-none focus:ring-4 focus:ring-[#dcecff]"
              >
                <Icon name="arrowLeft" className="h-4 w-4" />
                Précédent
              </button>
            ) : (
              <div />
            )}
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 rounded-xl bg-[#005bd8] px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#005bd8]/25 transition hover:bg-[#004bb5] focus:outline-none focus:ring-4 focus:ring-[#dcecff]"
              >
                Suivant
                <Icon name="arrowRight" className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 rounded-xl bg-[#005bd8] px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#005bd8]/25 transition hover:bg-[#004bb5] focus:outline-none focus:ring-4 focus:ring-[#dcecff] disabled:cursor-wait disabled:bg-slate-400"
              >
                {isLoading ? t('buttons.loading') : 'Envoyer ma demande'}
                {!isLoading && <Icon name="arrowRight" className="h-4 w-4" />}
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 rounded-2xl border border-[#dbe7fb] bg-white p-4 shadow-lg shadow-[#dbe7fb]/70 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ['shield-check', 'Paiement securise', 'Transactions 100% protegees'],
            ['archive-box', 'Articles assures', 'Vos articles sont couverts'],
            ['badge-check', 'Partenaires verifies', 'Selectionnes avec soin'],
            ['lifebuoy', 'Support 24/7', 'Assistance a tout moment'],
            ['hand-thumb-up', 'Satisfait ou rembourse', 'Garantie satisfaction'],
          ].map(([icon, title, description]) => (
            <div key={title} className="flex items-center gap-3">
              <Icon name={icon as any} className="h-8 w-8 text-[#005bd8]" />
              <div>
                <p className="text-sm font-black text-[#06105f]">{title}</p>
                <p className="text-xs text-[#4b587c]">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

const Field: React.FC<{ label: string; error?: string; children: React.ReactNode }> = ({ label, error, children }) => (
  <div>
    <label className="text-sm font-bold text-[#243056]">{label}</label>
    <div className="mt-2">{children}</div>
    {error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}
  </div>
);
