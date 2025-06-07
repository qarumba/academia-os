export const CharacterTextSplitter = jest.fn().mockImplementation(() => ({
  splitText: jest.fn().mockResolvedValue(['chunk1', 'chunk2']),
  splitDocuments: jest.fn().mockResolvedValue([])
}));
