// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it } from 'vitest';
import { ManualBonusModal } from './ManualBonusModal';
import { renderComponent, byText } from './test-utils';

describe('ManualBonusModal', () => {
  it('renders when open', () => {
    const { container } = renderComponent(
      <ManualBonusModal open onClose={() => {}} onSend={() => {}} />,
    );
    expect(byText(container, 'Envoyer bonus manuellement')).toBeTruthy();
  });
});
