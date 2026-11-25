import { useEffect, useState } from 'preact/hooks';
import { getIcsHtml } from '../api/flop';
import { FLOP_BASE, LANG } from '../config';
import { splitGroupKey } from '../domain/groups';
import { parseIcsLinks } from '../domain/ics';
import { loadPrefs, savePrefs, type Theme } from '../state/prefs';
import { navigate } from './hooks';

type Props = { theme: Theme; setTheme(t: Theme): void; onPrefsChange(): void };

const THEMES: { value: Theme; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' },
];

export function SettingsView({ theme, setTheme, onPrefsChange }: Props) {
  const prefs = loadPrefs();
  const [ics, setIcs] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const group = prefs.group ? splitGroupKey(prefs.group) : null;

  useEffect(() => {
    if (!prefs.dept || !group) return;
    let alive = true;
    getIcsHtml(prefs.dept).then(
      (html) => alive && setIcs(parseIcsLinks(html).groups.get(group.name) ?? null),
      () => {},
    );
    return () => {
      alive = false;
    };
  }, [prefs.dept, prefs.group]);

  const copy = async () => {
    if (!ics) return;
    try {
      await navigator.clipboard.writeText(ics);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard refused: the link stays visible to copy by hand */
    }
  };

  return (
    <main class="main">
      <div class="settings">
        <h1 style="margin:16px 0 0;font-size:1.75rem">Réglages</h1>

        <section>
          <h2>Thème</h2>
          <div class="segmented" role="group" aria-label="Thème">
            {THEMES.map((t) => (
              <button aria-pressed={theme === t.value} onClick={() => setTheme(t.value)}>
                {t.label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2>Affichage</h2>
          <label class="switch-row">
            <span>Semaine compacte (5 jours côte à côte)</span>
            <input
              type="checkbox"
              checked={prefs.compactWeek}
              onChange={(e) => {
                savePrefs({ compactWeek: (e.target as HTMLInputElement).checked });
                onPrefsChange();
              }}
            />
          </label>
          <label class="switch-row">
            <span>Menu du Resto U' Blagnac sous les cours</span>
            <input
              type="checkbox"
              checked={prefs.showMenu}
              onChange={(e) => {
                savePrefs({ showMenu: (e.target as HTMLInputElement).checked });
                onPrefsChange();
              }}
            />
          </label>
        </section>

        <section>
          <h2>Mon groupe</h2>
          <div class="switch-row">
            <span>{group && prefs.dept ? `${prefs.dept} · ${group.promo} · ${group.name}` : 'Aucun groupe choisi'}</span>
            <button
              class="btn"
              onClick={() => {
                savePrefs({ group: null });
                navigate('#/');
              }}
            >
              Changer
            </button>
          </div>
        </section>

        {ics && (
          <section>
            <h2>Agenda du téléphone</h2>
            <p style="margin:0 0 8px;color:var(--muted)">
              Ajoute ce lien comme calendrier abonné (iCal) dans ton agenda pour voir tes cours hors du site.
            </p>
            <p style="margin:0 0 8px;word-break:break-all" class="num">
              {ics}
            </p>
            <button class="btn" onClick={copy}>
              {copied ? 'Lien copié' : 'Copier le lien'}
            </button>
          </section>
        )}

        <section>
          <h2>À propos</h2>
          <p style="margin:0;color:var(--muted)">
            Les données viennent en direct de{' '}
            <a href={`${FLOP_BASE}/${LANG}/edt/${prefs.dept ?? 'RT'}/`} target="_blank" rel="noopener">
              flopEDT
            </a>
            . BetterFlop ne fait que les afficher autrement.
          </p>
        </section>
      </div>
    </main>
  );
}
