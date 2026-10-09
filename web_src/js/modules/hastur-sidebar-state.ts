import {localUserSettings} from './user-settings.ts';

export const sidebarMinWidth = 200;
export const sidebarMaxWidth = 400;
export const sidebarDefaultWidth = 224;

export function clampSidebarWidth(width: number): number {
  return Number.isFinite(width) ? Math.round(Math.min(sidebarMaxWidth, Math.max(sidebarMinWidth, width))) : sidebarDefaultWidth;
}

export function readSidebarState() {
  const key = `${window.config.appSubUrl}/hastur-sidebar`;
  const width = Number(localUserSettings.getString(`${key}/width`, String(sidebarDefaultWidth)));
  return {width: clampSidebarWidth(width), collapsed: localUserSettings.getBoolean(`${key}/collapsed`)};
}

export function applySidebarState(state: ReturnType<typeof readSidebarState>) {
  document.documentElement.style.setProperty('--hastur-sidebar-expanded-width', `${state.width}px`);
  document.documentElement.toggleAttribute('data-hastur-sidebar-collapsed', state.collapsed);
}

export function saveSidebarState(state: ReturnType<typeof readSidebarState>) {
  const key = `${window.config.appSubUrl}/hastur-sidebar`;
  localUserSettings.setString(`${key}/width`, String(state.width));
  localUserSettings.setBoolean(`${key}/collapsed`, state.collapsed);
}

export function restoreHasturSidebar() {
  if (document.documentElement.getAttribute('data-theme')?.startsWith('hastur-')) applySidebarState(readSidebarState());
}
