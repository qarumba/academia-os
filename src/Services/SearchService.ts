// Import the SemanticScholar library
import type { PaginatedResults, Paper } from "semanticscholarjs"
import { SemanticScholar } from "semanticscholarjs"

export class SearchRepository {
  private static lastRequestTime = 0;
  private static readonly REQUEST_DELAY = 1000; // 1 second between requests

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

    const sch = new SemanticScholar()
    try {
      const paginatedResults = await sch.search_paper(
        encodeURIComponent(query.trim())
      )
      return paginatedResults
    } catch (error: any) {
      // Enhanced error handling
      if (error?.response?.status === 429) {
        console.warn('Semantic Scholar rate limit reached. Please wait before making another request.');
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      } else if (error?.code === 'ERR_NETWORK' || error?.message?.includes('CORS')) {
        console.error('Network/CORS error with Semantic Scholar API. This is a known limitation when running in development mode.');
        throw new Error('Network error: This feature requires a production environment or proxy server due to CORS restrictions.');
      } else {
        console.error('Semantic Scholar API Error:', error);
        throw new Error(`Search failed: ${error?.message || 'Unknown error'}`);
      }
    }
  }
}
