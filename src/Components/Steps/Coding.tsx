import { Button, Input, Space, Steps, App } from "antd"
import { AcademicPaper } from "../../Types/AcademicPaper"
import { PaperTable } from "../PaperTable"
import { useEffect, useState } from "react"
import { asyncMap } from "../../Helpers/asyncMap"
import { OpenAIService } from "../../Services/OpenAIService"
import { ModelService } from "../../Services/ModelService"
import Mermaid from "../Charts/Mermaid"
import { GioiaCoding } from "../Charts/GioiaCoding"
import { LoadingOutlined } from "@ant-design/icons"
import { ModelData } from "../../Types/ModelData"
import { RemarkComponent } from "../RemarkComponent"

export const CodingStep = (props: {
  modelData: ModelData
  onModelDataChange: (modelData: ModelData) => void
}) => {
  const { message } = App.useApp();
  const [initialCodes, setInitialCodes] = useState<string[]>(
    props?.modelData?.firstOrderCodes || []
  )
  const [focusCodes, setFocusCodes] = useState<{ [code: string]: string[] }>(
    props?.modelData?.secondOrderCodes || {}
  )
  const [aggregateDimensions, setAggregateDimensions] = useState<{
    [code: string]: string[]
  }>(props?.modelData?.aggregateDimensions || {})
  const [firstOrderLoading, setFirstOrderLoading] = useState(false)
  const [secondOrderLoading, setSecondOrderLoading] = useState(false)
  const [aggregateLoading, setAggregateLoading] = useState(false)
  const [initialCodesCount, setInitialCodesCount] = useState(0)

  const loadInitialCodes = async () => {
    setFirstOrderLoading(true)
    let newPapers = [...(props.modelData.papers || [])]
    newPapers = await asyncMap(newPapers, async (paper, index) => {
      const newPaper = { ...paper } as AcademicPaper
      if (newPaper["Initial Codes"]) return newPaper
      newPaper["Initial Codes"] = await OpenAIService.initialCodingOfPaper(
        newPaper,
        props.modelData?.remarks
      )
      setInitialCodesCount((count) => count + newPaper["Initial Codes"].length)
      return newPaper
    })
    props.onModelDataChange({
      papers: newPapers,
    })
    const codes = Array.from(
      new Set(
        newPapers?.reduce((acc, paper) => {
          if (paper["Initial Codes"]) {
            acc.push(...(paper["Initial Codes"] || []))
          }
          return acc
        }, [] as string[])
      )
    )
    setInitialCodesCount(codes.length)
    setFirstOrderLoading(false)

    setInitialCodes(codes)
    return codes
  }

  const loadFocusCodes = async (codes: string[]) => {
    setSecondOrderLoading(true)
    const secondOrderCodes = await OpenAIService.secondOrderCoding(codes)
    setFocusCodes(secondOrderCodes)
    setSecondOrderLoading(false)
    setCurrent(1)
    return secondOrderCodes
  }

  const loadAggregateDimensions = async (codes: {
    [code: string]: string[]
  }) => {
    setAggregateLoading(true)
    const aggregateDimensions = await OpenAIService.aggregateDimensions(codes)
    setAggregateDimensions(aggregateDimensions)
    setAggregateLoading(false)
    setCurrent(2)
    return aggregateDimensions
  }

  const load = async () => {
    console.log("Loading started")
    
    // Check if we have proper model configuration
    const config = ModelService.getModelConfig()
    if (!config) {
      message.error("No AI model configured")
      return
    }

    if (config.provider === 'anthropic') {
      const hasOpenAIKey = config.openaiEmbeddingsKey || localStorage.getItem("openAIKey");
      if (!hasOpenAIKey) {
        message.error("Coding analysis requires OpenAI models. Please switch to OpenAI or add OpenAI key in advanced settings.")
        return
      }
    }

    try {
      const codes = await loadInitialCodes()
      if (codes.length > 0) {
        const focusCodes = await loadFocusCodes(codes)
        if (Object.keys(focusCodes).length > 0) {
          const aggregateDimensionCodes = await loadAggregateDimensions(
            focusCodes
          )
          props?.onModelDataChange?.({
            firstOrderCodes: codes,
            secondOrderCodes: focusCodes,
            aggregateDimensions: aggregateDimensionCodes,
          })
        }
      }
    } catch (error) {
      console.error("Coding analysis failed:", error)
      message.error("Failed to analyze papers. Please check your configuration.")
      // Reset loading states
      setFirstOrderLoading(false)
      setSecondOrderLoading(false)
      setAggregateLoading(false)
    }
  }

  // useEffect(() => {
  //   if (
  //     initialCodes?.length === 0 &&
  //     !firstOrderLoading &&
  //     !secondOrderLoading &&
  //     !aggregateLoading
  //   ) {
  //     load()
  //   }
  // }, [initialCodes, firstOrderLoading, secondOrderLoading, aggregateLoading])

  const steps = [
    {
      key: "initial",
      title: `1st Order Coding (${initialCodesCount || 0})`,
      loading: firstOrderLoading,
      content:
        !firstOrderLoading && initialCodes.length === 0 ? (
          <Space direction='horizontal'>
            <RemarkComponent
              papers={props?.modelData?.papers || []}
              value={props.modelData?.remarks || ""}
              onValueChange={(e) => {
                props?.onModelDataChange?.({
                  remarks: e,
                })
              }}
            />
            <Button onClick={load}>Start Coding</Button>
          </Space>
        ) : (
          <PaperTable
            papers={props?.modelData?.papers || []}
            responsiveToUpdates={true}
            customColumns={["Initial Codes"]}
          />
        ),
    },
    {
      key: "focus",
      title: "2nd Order Coding",
      loading: secondOrderLoading,
      content: secondOrderLoading ? (
        <p>AcademiaOS is busy coding.</p>
      ) : (
        <GioiaCoding
          firstOrderCodes={initialCodes || []}
          secondOrderCodes={focusCodes || {}}
          aggregateDimensions={{}}
        />
      ),
    },
    {
      key: "aggregate",
      title: "Aggregate Dimensions",
      loading: aggregateLoading,
      content: (
        <GioiaCoding
          firstOrderCodes={initialCodes || []}
          secondOrderCodes={focusCodes || {}}
          aggregateDimensions={aggregateDimensions || {}}
        />
      ),
    },
  ]

  const [current, setCurrent] = useState(0)

  return (
    <Space direction='vertical' style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}>
        <Steps
          current={current}
          onChange={setCurrent}
          direction='horizontal'
          size='small'
          items={steps.map((item) => ({
            key: item.title,
            title: item.title,
            icon: item.loading ? <LoadingOutlined /> : null,
          }))}
        />
        <Button
          loading={firstOrderLoading || secondOrderLoading || aggregateLoading}
          style={{ marginLeft: "20px" }}
          onClick={load}>
          {props.modelData.firstOrderCodes ? "Restart Coding" : "Start Coding"}
        </Button>
      </div>
      <div
        style={{ width: "100%", marginTop: "20px" }}
        key={steps[current].key}>
        {steps[current].content}
      </div>
    </Space>
  )
}
