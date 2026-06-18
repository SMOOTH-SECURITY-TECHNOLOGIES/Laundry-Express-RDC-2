type NameParts = {
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

const GENERIC_DRIVER_PREFIX = /^driver$/i;

const splitFullName = (fullName?: string | null) => {
  const trimmed = fullName?.trim();
  if (!trimmed) return [] as string[];
  return trimmed.split(/\s+/).filter(Boolean);
};

/** Nom complet lisible (profil, listes, etc.) */
export const formatAccountDisplayName = (
  fullName?: string | null,
  profile?: { first_name?: string | null; last_name?: string | null } | null
): string => {
  const first = profile?.first_name?.trim();
  const last = profile?.last_name?.trim();

  if (first && last && GENERIC_DRIVER_PREFIX.test(first)) {
    return last;
  }
  if (first || last) {
    return [first, last].filter(Boolean).join(' ').trim();
  }

  const parts = splitFullName(fullName);
  if (parts.length >= 2 && GENERIC_DRIVER_PREFIX.test(parts[0])) {
    return parts.slice(1).join(' ');
  }
  return fullName?.trim() || '';
};

/** Prénom (ou nom familial) pour « Bonjour, … » */
export const resolveGreetingName = (
  options: NameParts & { fallback?: string }
): string => {
  const { fullName, firstName, lastName, fallback = 'Chauffeur' } = options;
  const displayName = formatAccountDisplayName(fullName, { first_name: firstName, last_name: lastName });
  const parts = splitFullName(displayName);
  if (parts.length > 0) {
    return parts[0];
  }
  return fallback;
};
