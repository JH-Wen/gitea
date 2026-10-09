import {applySidebarState, clampSidebarWidth, readSidebarState, saveSidebarState, sidebarDefaultWidth, sidebarMaxWidth, sidebarMinWidth} from '../modules/hastur-sidebar-state.ts';

export function initHasturSidebar() {
  const navbar = document.querySelector<HTMLElement>('.hastur-signed #navbar');
  const toggle = navbar?.querySelector<HTMLButtonElement>('.hastur-sidebar-toggle');
  const resize = navbar?.querySelector<HTMLElement>('.hastur-sidebar-resize');
  if (!navbar || !toggle || !resize) return;

  const root = document.documentElement;
  const desktop = window.matchMedia('(min-width: 960px)');
  const state = readSidebarState();
  let drag: {pointerId: number; startX: number; width: number; direction: number} | undefined;
  const links = Array.from(navbar.querySelectorAll<HTMLAnchorElement>('.navbar-left a'));
  const labels = links.map((link) => ({link, title: link.getAttribute('title'), text: link.textContent.trim()}));

  const render = () => {
    applySidebarState(state);
    toggle.setAttribute('aria-expanded', String(!state.collapsed));
    toggle.setAttribute('aria-label', toggle.getAttribute(state.collapsed ? 'data-expand-label' : 'data-collapse-label')!);
    toggle.title = toggle.getAttribute('aria-label')!;
    resize.setAttribute('aria-valuenow', String(state.width));
    for (const {link, title, text} of labels) {
      if (state.collapsed && desktop.matches) link.title = text;
      else if (title !== null) link.title = title;
      else link.removeAttribute('title');
    }
  };
  const commit = () => {
    render();
    saveSidebarState(state);
  };
  const finishDrag = (cancel: boolean) => {
    if (!drag) return;
    const {pointerId, width} = drag;
    drag = undefined;
    if (cancel) state.width = width;
    if (resize.hasPointerCapture(pointerId)) resize.releasePointerCapture(pointerId);
    root.removeAttribute('data-hastur-sidebar-resizing');
    commit();
  };

  toggle.addEventListener('click', () => {
    finishDrag(true);
    state.collapsed = !state.collapsed;
    commit();
  });
  resize.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || !desktop.matches || state.collapsed || drag) return;
    e.preventDefault();
    resize.focus();
    drag = {pointerId: e.pointerId, startX: e.clientX, width: state.width, direction: getComputedStyle(navbar).direction === 'rtl' ? -1 : 1};
    resize.setPointerCapture(e.pointerId);
    root.setAttribute('data-hastur-sidebar-resizing', '');
  });
  resize.addEventListener('pointermove', (e) => {
    if (!drag || drag.pointerId !== e.pointerId) return;
    state.width = clampSidebarWidth(drag.width + (e.clientX - drag.startX) * drag.direction);
    render();
  });
  resize.addEventListener('pointerup', (e) => {
    if (drag?.pointerId === e.pointerId) finishDrag(false);
  });
  resize.addEventListener('pointercancel', () => finishDrag(true));
  resize.addEventListener('lostpointercapture', () => finishDrag(true));
  resize.addEventListener('dblclick', () => {
    state.width = sidebarDefaultWidth;
    commit();
  });
  resize.addEventListener('keydown', (e) => {
    const direction = getComputedStyle(navbar).direction === 'rtl' ? -1 : 1;
    if (e.key === 'Escape') finishDrag(true);
    else if (e.key === 'ArrowLeft') state.width = clampSidebarWidth(state.width - 16 * direction);
    else if (e.key === 'ArrowRight') state.width = clampSidebarWidth(state.width + 16 * direction);
    else if (e.key === 'Home') state.width = sidebarMinWidth;
    else if (e.key === 'End') state.width = sidebarMaxWidth;
    else return;
    e.preventDefault();
    commit();
  });
  desktop.addEventListener('change', () => {
    finishDrag(true);
    render();
  });
  render();
  requestAnimationFrame(() => root.setAttribute('data-hastur-sidebar-ready', ''));
}
