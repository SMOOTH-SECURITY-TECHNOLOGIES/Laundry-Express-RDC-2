// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderComponent, byText } from './test-utils';
import { QualityCenter } from './QualityCenter';

describe('QualityCenter', () => {
  it('renders quality rating', () => {
    const { container, unmount } = renderComponent(<QualityCenter quality={{
      qualityRating: 'high', qualityLabel: 'High', messagingLimit: '10000/jour',
      phoneStatus: 'connected', phoneStatusLabel: 'Connected', verificationStatus: 'verified',
      verificationLabel: 'Verified', alerts: [],
    }} />);
    expect(byText(container, 'High')).not.toBeNull();
    unmount();
  });
});
