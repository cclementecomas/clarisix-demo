// Tiny event bus so a global keyboard shortcut (e.g. "f then m") can open a
// specific filter dropdown whose open-state lives locally inside its component.
// Each filter listens for its own label; the shortcut handler dispatches it.

const FILTER_OPEN_EVENT = 'clarisix:open-filter';

export function openFilter(label: string) {
  window.dispatchEvent(new CustomEvent(FILTER_OPEN_EVENT, { detail: label }));
}

export function onOpenFilter(handler: (label: string) => void): () => void {
  const cb = (e: Event) => handler((e as CustomEvent).detail as string);
  window.addEventListener(FILTER_OPEN_EVENT, cb);
  return () => window.removeEventListener(FILTER_OPEN_EVENT, cb);
}
