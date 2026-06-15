import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

export const renderComponent = (el: React.ReactElement) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  let root: Root;
  act(() => { root = createRoot(container); root.render(el); });
  return { container, click: (e: Element) => act(() => e.dispatchEvent(new MouseEvent('click', { bubbles: true }))), unmount: () => { act(() => root.unmount()); container.remove(); } };
};

export const byText = (c: HTMLElement, t: string) =>
  Array.from(c.querySelectorAll('*')).find((el) => el.textContent?.includes(t)) ?? null;
