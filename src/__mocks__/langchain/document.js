export const Document = jest.fn().mockImplementation((content, metadata) => ({
  pageContent: content,
  metadata: metadata || {}
}));
