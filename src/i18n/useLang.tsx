import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import fr from './fr.json';
import en from './en.json';

export type Lang = 'fr' | 'en';
export type Dict = typeof fr;

const dicts: Record<Lang, Dict> = { fr, en: en as Dict };

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: Dict }>({
  lang: 'fr',
  setLang: () => {},
  t: fr,
});

export function LangProvider({ children }: { children: ReactNode }) {
  // La langue du navigateur decide au premier chargement, le choix est ensuite garde.
  const [lang, setLang] = useState<Lang>(() => {
    try {
      const garde = localStorage.getItem('lang');
      if (garde === 'fr' || garde === 'en') return garde;
    } catch {
      /* stockage indisponible : on retombe sur le navigateur */
    }
    return navigator.language.startsWith('fr') ? 'fr' : 'en';
  });

  // La langue du document, le titre de l'onglet et la description suivent le choix.
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = dicts[lang].meta.titre;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', dicts[lang].meta.description);
    try {
      localStorage.setItem('lang', lang);
    } catch {
      /* rien a faire, le choix vaudra pour la session */
    }
  }, [lang]);

  return (
    <Ctx.Provider value={{ lang, setLang, t: dicts[lang] }}>{children}</Ctx.Provider>
  );
}

export const useLang = () => useContext(Ctx);
