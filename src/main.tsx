import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Les styles communs d'abord : la feuille de chaque section, importee par son
// composant, vient apres et peut donc les preciser.
import './styles/tokens.css';
import './styles/base.css';
import './styles/sections.css';
import './styles/boutons.css';
import './texte/texte.css';
import { LangProvider } from './i18n/useLang';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LangProvider>
      <App />
    </LangProvider>
  </StrictMode>,
);
