// Import the SemanticScholar library
import { Document } from "@langchain/core/documents"
import { CharacterTextSplitter } from "@langchain/textsplitters"
import { asyncForEach } from "../Helpers/asyncForEach"
import { MemoryVectorStore } from "langchain/vectorstores/memory"
import { uniqBy } from "../Helpers/uniqBy"
import { EmbeddingService } from "./EmbeddingService"
import { AcademicPaper } from "../Types/AcademicPaper"

export class RankingService {
  public static rankPapers = async (
    queryString?: string,
    papers?: AcademicPaper[]
  ): Promise<AcademicPaper[]> => {
    if (!queryString) {
      return papers || []
    }
    try {
      const documents = [] as Document[]
      await asyncForEach(papers || [], async (paper) => {
        const splitter = new CharacterTextSplitter({
          separator: " ",
          chunkSize: 1000,
          chunkOverlap: 50,
        })
        const output = await splitter.createDocuments(
          [`${paper?.title || ""} ${paper?.fullText || ""}`],
          [{ id: paper?.id }]
        )
        documents.push(...(output || []))
      })

      // Create embeddings
      const embeddings = await EmbeddingService.createEmbeddings()
      // Create the Voy store.
      const store = new MemoryVectorStore(embeddings)

      // Add two documents with some metadata.
      await store.addDocuments(documents)

      const query = await embeddings.embedQuery(queryString || "")

      // Perform a similarity search.
      const resultsWithScore = await store.similaritySearchVectorWithScore(
        query,
        30
      )
      console.log("query string", queryString)
      // Print the results.
      console.log(JSON.stringify(resultsWithScore, null, 2))

      return (
        (uniqBy(
          resultsWithScore.map(([result, score]) => {
            return papers?.find((paper) => paper?.id === result?.metadata?.id)
          }),
          (paper) => paper?.id || ""
        )?.filter((paper) => paper) as AcademicPaper[]) || []
      )
    } catch (error) {
      console.error('Ranking Service Error:', error)
      // Return original papers if ranking fails
      return papers || []
    }
  }
}
