import { useLang } from '../i18n/useLang';
import './pied.css';

/** LE PIED DE PAGE : la signature, et une ligne sur le trou noir. */
export default function Pied() {
  const { t } = useLang();
  return (
    <footer className="pied">
      <span>{t.pied.signature}</span>
      <span>{t.pied.credit}</span>
    </footer>
  );
}
