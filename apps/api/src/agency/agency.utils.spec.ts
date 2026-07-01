import { mergeJsonObjects } from './agency.utils';

describe('mergeJsonObjects', () => {
  it('deep merges nested settings objects', () => {
    const merged = mergeJsonObjects(
      {
        onboarding: { enabled: true, requireCreatorApproval: false },
        extensions: { legacy: true },
      },
      {
        onboarding: { requireCreatorApproval: true },
        recruiting: { autoAssignRecruiter: true },
      },
    );

    expect(merged).toEqual({
      onboarding: { enabled: true, requireCreatorApproval: true },
      extensions: { legacy: true },
      recruiting: { autoAssignRecruiter: true },
    });
  });
});
