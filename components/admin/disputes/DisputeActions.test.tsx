// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DisputeQuickActions } from './DisputeQuickActions';
import { renderComponent, byText, buttonByText } from './test-utils';

describe('DisputeQuickActions', () => {
  it('renders quick action buttons and fires callbacks', () => {
    const onAction = vi.fn();
    const { container, click } = renderComponent(<DisputeQuickActions onAction={onAction} />);
    expect(byText(container, 'Actions rapides')).toBeTruthy();
    expect(byText(container, 'Nouvelle demande manuelle')).toBeTruthy();
    const auditBtn = buttonByText(container, /Auditer litiges/);
    expect(auditBtn).toBeTruthy();
    if (auditBtn) click(auditBtn);
    expect(onAction).toHaveBeenCalledWith('audit');
  });
});
