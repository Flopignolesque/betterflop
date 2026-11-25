import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { Icon } from './Icon';

type Props = {
  title: string;
  onClose(): void;
  onBack?: () => void;
  children: ComponentChildren;
};

/** Bottom sheet on mobile, centred dialog on wide screens. */
export function Sheet({ title, onClose, onBack, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, []);

  return (
    <div class="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="sheet" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <div class="sheet-handle" />
        <div class="sheet-head">
          {onBack && (
            <button class="btn btn-ghost icon-btn" onClick={onBack} aria-label="Retour">
              <Icon name="back" />
            </button>
          )}
          <h2>{title}</h2>
          <button class="btn btn-ghost icon-btn" onClick={onClose} aria-label="Fermer">
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
