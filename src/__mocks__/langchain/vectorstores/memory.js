export const MemoryVectorStore = {
  fromDocuments: jest.fn().mockResolvedValue({
    similaritySearch: jest.fn().mockResolvedValue([])
  })
};
