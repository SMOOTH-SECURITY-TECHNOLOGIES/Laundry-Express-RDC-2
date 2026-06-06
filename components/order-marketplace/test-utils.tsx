import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

export const renderComponent = (component: React.ReactElement) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  let root: Root;

  act(() => {
    root = createRoot(container);
    root.render(component);
  });

  return {
    container,
    click: (element: Element) => {
      act(() => {
        element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
    },
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
};

export const byText = (container: HTMLElement, text: string) => {
  const matches = Array.from(container.querySelectorAll('*')).filter((element) =>
    element.textContent?.includes(text)
  );
  return matches[0] || null;
};

export const buttonByText = (container: HTMLElement, text: RegExp) =>
  Array.from(container.querySelectorAll('button')).find((button) => text.test(button.textContent || '')) || null;
