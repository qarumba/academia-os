// Import the SemanticScholar library
import type { PaginatedResults, Paper } from "semanticscholarjs"

export class SearchRepository {
  // Server-side rate limiting - no client-side rate limiting needed
  
  private static async checkRateLimitStatus() {
    try {
      const response = await fetch('http://localhost:3001/api/semantic-scholar-rate-limit-status');
      const status = await response.json();
      return status;
    } catch (error) {
      console.warn('⚠️ Could not check rate limit status:', error);
      return { canMakeRequest: true }; // Assume we can make request if status check fails
    }
  }

  public static searchPapers = async (
    query?: string,
    limit: number = 20
  ): Promise<PaginatedResults<Paper> | null> => {
    if (!query || query.trim().length === 0) {
      console.warn('SearchRepository: Empty query provided');
      return null;
    }

    // Check server-side rate limiting status
    const rateLimitStatus = await this.checkRateLimitStatus();
    if (!rateLimitStatus.canMakeRequest) {
      const waitTime = rateLimitStatus.cooldownEndsAt 
        ? Math.ceil((rateLimitStatus.cooldownEndsAt - Date.now()) / 1000)
        : Math.ceil((rateLimitStatus.nextRequestAllowedAt - Date.now()) / 1000);
      
      throw new Error(`Rate limit active. Please wait ${waitTime}+ seconds before searching again.`);
    }

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
        // Server handles rate limiting now, just pass through the error
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.message || `Search failed: ${response.status} ${response.statusText}`);
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
