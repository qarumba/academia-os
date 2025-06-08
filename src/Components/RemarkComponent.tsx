import React, { useState, useEffect } from "react"
import { AutoComplete, Input } from "antd"
import { OpenAIService } from "../Services/OpenAIService"
import { ModelService } from "../Services/ModelService"
import { ModelData } from "../Types/ModelData"
import { AcademicPaper } from "../Types/AcademicPaper"
import { LoadingOutlined } from "@ant-design/icons"

export const RemarkComponent = (props: {
  papers: AcademicPaper[]
  value: string
  onValueChange: (val: string) => void
}) => {
  const [researchQuestions, setResearchQuestions] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  // Call the findTentativeResearchQuestions method whenever papers are updated
  useEffect(() => {
    const fetchQuestions = async () => {
      // Check if we have proper model configuration
      const config = ModelService.getModelConfig()
      if (!config) {
        console.log("No AI model configured, skipping research questions")
        return
      }

      if (config.provider === 'anthropic') {
        const hasOpenAIKey = config.openaiEmbeddingsKey || localStorage.getItem("openAIKey");
        if (!hasOpenAIKey) {
          console.log("Research questions require OpenAI models when using Anthropic")
          return
        }
      }

      if (!props?.papers || props.papers.length === 0) {
        return
      }

      setLoading(true)
      try {
        const questions = await OpenAIService.findTentativeResearchQuestions(
          props?.papers
        )
        setResearchQuestions(questions)
      } catch (error) {
        console.error("Failed to fetch research questions:", error)
        setResearchQuestions([])
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [props?.papers])

  return (
    <div>
      <AutoComplete
        suffixIcon={loading && <LoadingOutlined />}
        style={{ width: 500 }}
        options={researchQuestions.map((question) => ({ value: question }))}
        value={props.value}
        onChange={(value) => {
          props?.onValueChange?.(value)
          console.log(value)
        }}
        placeholder='Free-text remarks or tentative research question ...'>
        <Input.TextArea rows={5} />
      </AutoComplete>
    </div>
  )
}
