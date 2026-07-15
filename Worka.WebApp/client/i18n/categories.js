/**
 * Display helper for job categories.
 *
 * Category VALUES ('Plumbing', 'Electrical', ...) are stable English tokens:
 * they are sent to the API and used for image lookup, so they must never be
 * translated at the data level. This helper translates them at render time
 * only, falling back to the raw value for unknown categories and to
 * common.homeServices when the category is empty.
 */
const KNOWN_CATEGORIES = ['plumbing', 'electrical', 'painting', 'cleaning', 'garden', 'repairs'];

export const categoryLabel = (t, category) => {
  const code = String(category ?? '').trim().toLowerCase();
  if (KNOWN_CATEGORIES.includes(code)) {
    return t(`category.${code}`);
  }
  return category || t('common.homeServices');
};

export default categoryLabel;
