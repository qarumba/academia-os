export const OpenAIEmbeddings = jest.fn().mockImplementation(() => ({
  embedQuery: jest.fn().mockResolvedValue([0.1, 0.2, 0.3])
}));
