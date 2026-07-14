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
  { code: 'pl', label: 'Polski' },
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
  },
  pl: {
    'landing.eyebrow': 'Worka dla ekspatów',
    'landing.heroTitle': 'Załatw sprawy z kimś, kto mówi w Twoim języku.',
    'landing.heroText':
      'Znajdź zaufane osoby do napraw, przeprowadzek, sprzątania, formalności, montażu i codziennych zleceń — z dopasowaniem językowym od samego początku.',
    'landing.signIn': 'Zaloguj się',
    'landing.joinWaitlist': 'Dołącz do listy',
    'landing.benefit1Title': 'Wspólny język',
    'landing.benefit1Text': 'Znajdź osoby, które jasno wytłumaczą zakres pracy.',
    'landing.benefit2Title': 'Praktyczna pomoc na miejscu',
    'landing.benefit2Text': 'Naprawy, sprzątanie, przeprowadzki, formalności, montaż i drobne zlecenia.',
    'landing.benefit3Title': 'Stworzone dla ekspatów',
    'landing.benefit3Text': 'Na momenty, gdy lokalne systemy wydają się obce.',
    'waitlist.kicker': 'Zgłoś zainteresowanie',
    'waitlist.title': 'Dołącz do listy oczekujących.',
    'waitlist.text': 'Napisz, gdzie jesteś, jaki język jest ważny i czy potrzebujesz pomocy, czy możesz jej udzielić.',
    'waitlist.join': 'Dołącz do listy',
    'settings.language': 'Język',
    'settings.languageHint': 'Wybierz język, w którym Worka ma z Tobą rozmawiać.',
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
  },
};
