/** Keyboard target for the ARIA tabs pattern (wrapping arrows, Home/End). */
export function tabKeyTarget(key: string, current: number, total: number): number | null {
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return (current + 1) % total;
    case 'ArrowLeft':
    case 'ArrowUp':
      return (current - 1 + total) % total;
    case 'Home':
      return 0;
    case 'End':
      return total - 1;
    default:
      return null;
  }
}

/** Enhances a list of <details> into ARIA tabs on wide screens; narrow screens keep the accordion. */
export function initTabs(root: HTMLElement): void {
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
  if (tabs.length === 0) return;

  const select = (i: number, focus: boolean) => {
    tabs.forEach((t, j) => {
      const on = i === j;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      panels[j]!.hidden = !on;
    });
    if (focus) tabs[i]!.focus();
  };

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i, false));
    t.addEventListener('keydown', (e) => {
      const target = tabKeyTarget(e.key, i, tabs.length);
      if (target === null) return;
      e.preventDefault();
      select(target, true);
    });
  });

  root.dataset.enhanced = 'true';
  select(0, false);
}
