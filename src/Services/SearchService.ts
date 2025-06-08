// Import the SemanticScholar library
import type { PaginatedResults, Paper } from "semanticscholarjs"

export class SearchRepository {
  private static lastRequestTime = 0;
  private static readonly REQUEST_DELAY = 10000; // 10 seconds between requests

  private static async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.REQUEST_DELAY) {
      const waitTime = this.REQUEST_DELAY - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    this.lastRequestTime = Date.now();
  }

  public static searchPapers = async (
    query?: string
  ): Promise<PaginatedResults<Paper> | null> => {
    if (!query || query.trim().length === 0) {
      console.warn('SearchRepository: Empty query provided');
      return null;
    }

    // Rate limiting to prevent 429 errors
    await this.waitForRateLimit();

    try {
      // Use server proxy to avoid CORS issues
      const params = new URLSearchParams({
        query: query.trim(),
        fields: 'abstract,authors,citationCount,corpusId,externalIds,fieldsOfStudy,influentialCitationCount,isOpenAccess,journal,openAccessPdf,paperId,publicationDate,publicationTypes,publicationVenue,referenceCount,s2FieldsOfStudy,title,url,venue,year',
        offset: '0',
        limit: '100'
      });

      const url = `http://localhost:3001/api/semantic-scholar/graph/v1/paper/search?${params.toString()}`;
      console.log('🔍 SearchService: Making request to:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait 10+ seconds before searching again.');
        }
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Create a simple PaginatedResults-like object
      return {
        data: data.data || [],
        total: data.total || 0,
        offset: data.offset || 0,
        next: data.next || null,
        hasNextPage: () => !!data.next,
        nextPage: async () => {
          if (!data.next) return null;
          // data.next is typically an offset number, not a full path
          const nextParams = new URLSearchParams({
            query: query.trim(),
            fields: 'abstract,authors,citationCount,corpusId,externalIds,fieldsOfStudy,influentialCitationCount,isOpenAccess,journal,openAccessPdf,paperId,publicationDate,publicationTypes,publicationVenue,referenceCount,s2FieldsOfStudy,title,url,venue,year',
            offset: data.next.toString(),
            limit: '100'
          });
          const nextUrl = `http://localhost:3001/api/semantic-scholar/graph/v1/paper/search?${nextParams.toString()}`;
          const nextResponse = await fetch(nextUrl);
          return nextResponse.ok ? nextResponse.json() : null;
        }
      } as unknown as PaginatedResults<Paper>;
      
    } catch (error: any) {
      console.error('Semantic Scholar API Error:', error);
      throw new Error(`Search failed: ${error?.message || 'Unknown error'}`);
    }
  }
}
