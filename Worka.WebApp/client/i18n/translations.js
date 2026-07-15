/**
 * Worka UI translations.
 *
 * Rollout approach: every user-facing string should move into these
 * dictionaries and be rendered through t('key'). The landing page and
 * shared chrome are covered first (that is the first touch for
 * non-English speakers); workspace screens follow key-by-key.
 * Missing keys fall back to English, so partial dictionaries are safe.
 *
 * Right-to-left languages (Arabic, Hebrew) additionally need
 * I18nManager/RTL layout work — add them only with proper RTL testing.
 */
export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'ro', label: 'Română' },
];

export const translations = {
  en: {
    'landing.eyebrow': 'Worka for expats',
    'landing.heroTitle': 'Get things done by someone who speaks your language.',
    'landing.heroText':
      'Find trusted local people for repairs, moving, cleaning, paperwork, installs, and everyday jobs—with language fit built in from the start.',
    'landing.signIn': 'Sign in',
    'landing.joinWaitlist': 'Join waitlist',
    'landing.benefit1Title': 'Language matched',
    'landing.benefit1Text': 'Find people who can explain the work clearly.',
    'landing.benefit2Title': 'Local practical help',
    'landing.benefit2Text': 'Repairs, cleaning, moving, paperwork, installs, and odd jobs.',
    'landing.benefit3Title': 'Built for expats',
    'landing.benefit3Text': 'Designed for the moments when local systems feel unfamiliar.',
    'waitlist.kicker': 'Register interest',
    'waitlist.title': 'Join the expat waitlist.',
    'waitlist.text': 'Tell us where you are, which language matters, and whether you need help or can offer it.',
    'waitlist.join': 'Join the list',
    'settings.language': 'Language',
    'settings.languageHint': 'Choose the language Worka uses for you.',
    'quote.feeLine': 'Worka fee {fee}. You pay {total}. The professional receives {price}.',
    'quote.detailFeeLine': 'You pay {total}. The professional receives {price}. Worka earns {fee}.',
    'quote.securePayment': 'Secure checkout supports wallets and cards where enabled in Stripe. Professional payouts are handled through Stripe Connect.',
    'quote.by': 'Quote from {name}',
  },
  es: {
    'landing.eyebrow': 'Worka para expats',
    'landing.heroTitle': 'Consigue que lo haga alguien que habla tu idioma.',
    'landing.heroText':
      'Encuentra personas locales de confianza para reparaciones, mudanzas, limpieza, trámites, instalaciones y tareas cotidianas, con el idioma garantizado desde el principio.',
    'landing.signIn': 'Iniciar sesión',
    'landing.joinWaitlist': 'Unirse a la lista',
    'landing.benefit1Title': 'Mismo idioma',
    'landing.benefit1Text': 'Encuentra personas que pueden explicarte el trabajo con claridad.',
    'landing.benefit2Title': 'Ayuda práctica local',
    'landing.benefit2Text': 'Reparaciones, limpieza, mudanzas, trámites, instalaciones y encargos.',
    'landing.benefit3Title': 'Hecho para expats',
    'landing.benefit3Text': 'Pensado para cuando los sistemas locales resultan poco familiares.',
    'waitlist.kicker': 'Registra tu interés',
    'waitlist.title': 'Únete a la lista de espera.',
    'waitlist.text': 'Cuéntanos dónde estás, qué idioma importa y si necesitas ayuda o puedes ofrecerla.',
    'waitlist.join': 'Unirme a la lista',
    'settings.language': 'Idioma',
    'settings.languageHint': 'Elige el idioma que Worka usa contigo.',
    'quote.feeLine': 'Comisión de Worka {fee}. Pagas {total}. El profesional recibe {price}.',
    'quote.detailFeeLine': 'Pagas {total}. El profesional recibe {price}. Worka gana {fee}.',
    'quote.securePayment': 'El pago seguro admite carteras y tarjetas según Stripe. Los pagos al profesional se gestionan con Stripe Connect.',
    'quote.by': 'Presupuesto de {name}',
  },
  fr: {
    'landing.eyebrow': 'Worka pour les expats',
    'landing.heroTitle': 'Faites faire les choses par quelqu\'un qui parle votre langue.',
    'landing.heroText':
      'Trouvez des personnes locales de confiance pour les réparations, les déménagements, le ménage, les démarches, les installations et les petits travaux — avec la langue prise en compte dès le départ.',
    'landing.signIn': 'Se connecter',
    'landing.joinWaitlist': 'Rejoindre la liste',
    'landing.benefit1Title': 'La même langue',
    'landing.benefit1Text': 'Trouvez des personnes qui peuvent vous expliquer le travail clairement.',
    'landing.benefit2Title': 'Une aide pratique locale',
    'landing.benefit2Text': 'Réparations, ménage, déménagements, démarches, installations et petits travaux.',
    'landing.benefit3Title': 'Conçu pour les expats',
    'landing.benefit3Text': 'Pensé pour les moments où les systèmes locaux semblent peu familiers.',
    'waitlist.kicker': 'Enregistrez votre intérêt',
    'waitlist.title': 'Rejoignez la liste d\'attente.',
    'waitlist.text': 'Dites-nous où vous êtes, quelle langue compte et si vous cherchez de l\'aide ou pouvez en offrir.',
    'waitlist.join': 'Rejoindre la liste',
    'settings.language': 'Langue',
    'settings.languageHint': 'Choisissez la langue que Worka utilise avec vous.',
    'quote.feeLine': 'Frais Worka {fee}. Vous payez {total}. Le professionnel reçoit {price}.',
    'quote.detailFeeLine': 'Vous payez {total}. Le professionnel reçoit {price}. Worka gagne {fee}.',
    'quote.securePayment': 'Le paiement sécurisé accepte cartes et portefeuilles selon Stripe. Les versements au professionnel passent par Stripe Connect.',
    'quote.by': 'Devis de {name}',
  },
  ro: {
    'landing.eyebrow': 'Worka pentru expați',
    'landing.heroTitle': 'Rezolvă treburile cu cineva care vorbește limba ta.',
    'landing.heroText':
      'Găsește oameni locali de încredere pentru reparații, mutări, curățenie, acte, instalări și treburi de zi cu zi — cu potrivire lingvistică de la început.',
    'landing.signIn': 'Autentificare',
    'landing.joinWaitlist': 'Intră pe listă',
    'landing.benefit1Title': 'Aceeași limbă',
    'landing.benefit1Text': 'Găsește oameni care îți pot explica lucrarea clar.',
    'landing.benefit2Title': 'Ajutor practic local',
    'landing.benefit2Text': 'Reparații, curățenie, mutări, acte, instalări și treburi mărunte.',
    'landing.benefit3Title': 'Creat pentru expați',
    'landing.benefit3Text': 'Pentru momentele când sistemele locale par nefamiliare.',
    'waitlist.kicker': 'Înregistrează-ți interesul',
    'waitlist.title': 'Intră pe lista de așteptare.',
    'waitlist.text': 'Spune-ne unde ești, ce limbă contează și dacă ai nevoie de ajutor sau îl poți oferi.',
    'waitlist.join': 'Intră pe listă',
    'settings.language': 'Limbă',
    'settings.languageHint': 'Alege limba în care Worka vorbește cu tine.',
    'quote.feeLine': 'Comision Worka {fee}. Plătești {total}. Profesionistul primește {price}.',
    'quote.detailFeeLine': 'Plătești {total}. Profesionistul primește {price}. Worka câștigă {fee}.',
    'quote.securePayment': 'Plata securizată acceptă carduri și portofele conform Stripe. Plățile către profesionist trec prin Stripe Connect.',
    'quote.by': 'Ofertă de la {name}',
  },
};
