// Import the SemanticScholar library
import type { PaginatedResults, Paper } from "semanticscholarjs"

export class SearchRepository {
  private static lastRequestTime = 0;
  private static readonly REQUEST_DELAY = 5000; // Increased to 5 seconds between requests
  private static rateLimitResetTime = 0;

  private static async waitForRateLimit() {
    const now = Date.now();
    
    // If we hit a rate limit recently, wait longer
    if (this.rateLimitResetTime > now) {
      const waitTime = this.rateLimitResetTime - now;
      console.log(`⏳ Rate limit cooldown: waiting ${Math.ceil(waitTime / 1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Normal rate limiting
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.REQUEST_DELAY) {
      const waitTime = this.REQUEST_DELAY - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${Math.ceil(waitTime / 1000)}s before next request...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    this.lastRequestTime = Date.now();
  }

  private static handleRateLimit() {
    // Set a 15-second cooldown after hitting rate limit
    this.rateLimitResetTime = Date.now() + 15000;
    console.warn('🚫 Hit Semantic Scholar rate limit - implementing 15s cooldown');
  }

  public static searchPapers = async (
    query?: string,
    limit: number = 20
  ): Promise<PaginatedResults<Paper> | null> => {
    if (!query || query.trim().length === 0) {
      console.warn('SearchRepository: Empty query provided');
      return null;
    }

    // Rate limiting to prevent 429 errors
    await this.waitForRateLimit();

    try {
      // Use server proxy to avoid CORS issues
      console.log(`🔍 SearchService: Searching for ${limit} papers with query: "${query.trim()}"`)
      
      const params = new URLSearchParams({
        query: query.trim(),
        fields: 'abstract,authors,citationCount,corpusId,externalIds,fieldsOfStudy,influentialCitationCount,isOpenAccess,journal,openAccessPdf,paperId,publicationDate,publicationTypes,publicationVenue,referenceCount,s2FieldsOfStudy,title,url,venue,year',
        offset: '0',
        limit: limit.toString()
      });

      const url = `http://localhost:3001/api/semantic-scholar/graph/v1/paper/search?${params.toString()}`;
      console.log('🔍 SearchService: Making request to:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 429) {
          this.handleRateLimit();
          throw new Error('Rate limit exceeded. Please wait 15+ seconds before searching again.');
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
            limit: limit.toString()
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
