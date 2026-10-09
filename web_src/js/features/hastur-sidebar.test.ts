import {initHasturSidebar} from './hastur-sidebar.ts';
import {clampSidebarWidth, restoreHasturSidebar} from '../modules/hastur-sidebar-state.ts';
import {localUserSettings} from '../modules/user-settings.ts';

const settings = new Map<string, string>();

function mountSidebar() {
  document.body.className = 'hastur-signed';
  document.body.innerHTML = `<nav id="navbar">
    <div class="navbar-left"><a href="/issues">Issues</a></div>
    <button class="hastur-sidebar-toggle" data-expand-label="Expand" data-collapse-label="Collapse"></button>
    <div class="hastur-sidebar-resize" tabindex="0"></div>
  </nav>`;
  initHasturSidebar();
  return {
    toggle: document.querySelector<HTMLButtonElement>('.hastur-sidebar-toggle')!,
    resize: document.querySelector<HTMLElement>('.hastur-sidebar-resize')!,
  };
}

beforeEach(() => {
  settings.clear();
  document.documentElement.setAttribute('data-theme', 'hastur-dark');
  vi.spyOn(localUserSettings, 'getString').mockImplementation((key, fallback = '') => settings.get(key) ?? fallback);
  vi.spyOn(localUserSettings, 'setString').mockImplementation((key, value) => { settings.set(key, value) });
  const media = window.matchMedia('(min-width: 960px)');
  vi.spyOn(media, 'matches', 'get').mockReturnValue(true);
  vi.spyOn(window, 'matchMedia').mockReturnValue(media);
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
  document.body.className = '';
  for (const attr of ['data-theme', 'data-hastur-sidebar-collapsed', 'data-hastur-sidebar-ready', 'data-hastur-sidebar-resizing']) document.documentElement.removeAttribute(attr);
  document.documentElement.style.removeProperty('--hastur-sidebar-expanded-width');
});

test('collapse preserves the resized width across page initialization', () => {
  settings.set('/hastur-sidebar/width', '312');
  const {toggle, resize} = mountSidebar();
  resize.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight'}));
  toggle.click();
  expect(settings.get('/hastur-sidebar/width')).toBe('328');
  expect(settings.get('/hastur-sidebar/collapsed')).toBe('true');
  restoreHasturSidebar();
  const next = mountSidebar();
  expect(next.toggle.getAttribute('aria-expanded')).toBe('false');
  next.toggle.click();
  expect(document.documentElement.hasAttribute('data-hastur-sidebar-collapsed')).toBe(false);
  expect(document.documentElement.style.getPropertyValue('--hastur-sidebar-expanded-width')).toBe('328px');
});

test('cancelled pointer resize restores width without persisting the dragged value', () => {
  const {resize} = mountSidebar();
  vi.spyOn(resize, 'setPointerCapture').mockImplementation(() => {});
  vi.spyOn(resize, 'hasPointerCapture').mockReturnValue(false);
  resize.dispatchEvent(new PointerEvent('pointerdown', {pointerId: 1, clientX: 224, button: 0}));
  resize.dispatchEvent(new PointerEvent('pointermove', {pointerId: 1, clientX: 900}));
  expect(resize.getAttribute('aria-valuenow')).toBe('400');
  expect(settings.size).toBe(0);
  resize.dispatchEvent(new PointerEvent('pointercancel', {pointerId: 1}));
  expect(resize.getAttribute('aria-valuenow')).toBe('224');
  expect(settings.get('/hastur-sidebar/width')).toBe('224');
  expect(document.documentElement.hasAttribute('data-hastur-sidebar-resizing')).toBe(false);
});

test('invalid stored widths cannot break the page layout', () => {
  expect(clampSidebarWidth(NaN)).toBe(224);
  expect(clampSidebarWidth(Infinity)).toBe(224);
  expect(clampSidebarWidth(-50)).toBe(200);
  expect(clampSidebarWidth(5000)).toBe(400);
});
