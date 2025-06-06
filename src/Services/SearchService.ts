// Import the SemanticScholar library
import type { PaginatedResults, Paper } from "semanticscholarjs"
import { SemanticScholar } from "semanticscholarjs"

export class SearchRepository {
  public static searchPapers = async (
    query?: string
  ): Promise<PaginatedResults<Paper> | null> => {
    const sch = new SemanticScholar()
    try {
      const paginatedResults = await sch.search_paper(
        encodeURIComponent(query || "")
      )
      return paginatedResults
    } catch (error) {
      console.error('Semantic Scholar API Error:', error)
      return null
    }
  }
}
