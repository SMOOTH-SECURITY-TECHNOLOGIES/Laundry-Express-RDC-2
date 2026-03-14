export const features = {
  enableFirebase: import.meta.env.VITE_ENABLE_FIREBASE === 'true',
  useMockApi: import.meta.env.VITE_USE_MOCK_API === 'true'
};
