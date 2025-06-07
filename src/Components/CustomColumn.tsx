import React, { useState, useEffect } from "react"
import { Typography, Space, Alert } from "antd"
import { OpenAIService } from "../Services/OpenAIService"
import { ModelService } from "../Services/ModelService"
import { AcademicPaper } from "../Types/AcademicPaper"

export const CustomColumn = (props: {
  record: AcademicPaper
  detail: string
  updatePaperDetail: (paperId: string, columnName: string, value: any) => void
}) => {
  // Use state to hold the value returned from getDetailAboutPaper
  const [detail, setDetail] = useState(
    (props?.record?.[props?.detail || ""] as string) || ""
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Use useEffect to call the async function and update the state
  useEffect(() => {
    let isMounted = true

    // Don't fetch data if the property already exists
    if (
      props.record.hasOwnProperty(props.detail) ||
      props?.record[props?.detail]
    ) {
      return
    }

    // Check if we have proper model configuration
    const config = ModelService.getModelConfig()
    if (!config) {
      setError("No AI model configured")
      return
    }

    if (config.provider === 'anthropic') {
      const hasOpenAIKey = config.openaiEmbeddingsKey || localStorage.getItem("openAIKey");
      if (!hasOpenAIKey) {
        setError("Custom columns require OpenAI models. Please switch to OpenAI or add OpenAI key in advanced settings.")
        return
      }
    }

    setLoading(true)
    OpenAIService.getDetailAboutPaper(props?.record, props?.detail)
      .then((result) => {
        if (isMounted) {
          setDetail(result)
          setError(null)
          // Update the table data directly
          props.updatePaperDetail(
            props.record.id?.toString() || "",
            props.detail,
            result
          )
        }
      })
      .catch((error) => {
        console.error("Failed to get details:", error)
        if (isMounted) {
          setError("Failed to analyze paper")
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [props?.detail])

  if (error) {
    return (
      <Space size={0} direction={"vertical"} style={{ width: "300px" }}>
        <Alert message={error} type="warning" />
      </Space>
    )
  }

  return (
    <Space size={0} direction={"vertical"} style={{ width: "300px" }}>
      <Typography.Paragraph ellipsis={{ rows: 5 }} style={{ marginBottom: 0 }}>
        {loading ? "Analyzing..." : detail}
      </Typography.Paragraph>
    </Space>
  )
}
