import { useState } from 'preact/hooks';
import type { DayMenu } from '../domain/crous';

const MAIN = /traditionnel|plat/i;

export function MenuCard({ day, restaurant }: { day: DayMenu; restaurant: string }) {
  const [open, setOpen] = useState(false);
  return (
    <section class="menu-card" aria-label={`Menu ${restaurant}`}>
      {day.meals.map((meal) => {
        const main = meal.sections.filter((s) => MAIN.test(s.title));
        const shown = open || main.length === 0 ? meal.sections : main;
        const hasMore = main.length > 0 && main.length < meal.sections.length;
        return (
          <div>
            <div class="menu-head">
              <strong>{restaurant}</strong>
              <span>{meal.title}</span>
            </div>
            {shown.map((s) => (
              <div class="menu-section">
                {(open || main.length === 0) && <h3>{s.title}</h3>}
                <ul>
                  {s.items.map((i) => (
                    <li>{i}</li>
                  ))}
                </ul>
              </div>
            ))}
            {open && meal.subjectToChange && <p class="menu-note">Sous réserve de changement.</p>}
            {hasMore && (
              <button class="btn btn-ghost menu-more" aria-expanded={open} onClick={() => setOpen(!open)}>
                {open ? 'Masquer entrées et desserts' : 'Voir entrées et desserts'}
              </button>
            )}
          </div>
        );
      })}
    </section>
  );
}
