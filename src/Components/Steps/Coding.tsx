import { Button, Input, Space, Steps, App } from "antd"
import { AcademicPaper } from "../../Types/AcademicPaper"
import { PaperTable } from "../PaperTable"
import { useEffect, useState } from "react"
import { asyncMap } from "../../Helpers/asyncMap"
import { OpenAIService } from "../../Services/OpenAIService"
import { ChatService } from "../../Services/ChatService"
import { ModelService } from "../../Services/ModelService"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import Mermaid from "../Charts/Mermaid"
import { GioiaCoding } from "../Charts/GioiaCoding"
import { LoadingOutlined } from "@ant-design/icons"
import { ModelData } from "../../Types/ModelData"
import { RemarkComponent } from "../RemarkComponent"

const CodingStep = (props: {
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
      try {
        const model = await ChatService.createChatModel({ maxTokens: 3000 })
        
        // Use the same chunking logic as OpenAIService for consistency
        let fullText = newPaper?.fullText
        let chunks = []

        if ((newPaper?.fullText?.length || 0) > 5000) {
          const { CharacterTextSplitter } = await import("@langchain/textsplitters")
          const splitter = new CharacterTextSplitter({
            separator: " ",
            chunkSize: 10000,
            chunkOverlap: 50,
          })
          const output = await splitter.createDocuments(
            [`${newPaper?.title || ""} ${newPaper?.fullText || ""}`],
            [{ id: newPaper?.id || newPaper?.corpusId }]
          )
          chunks.push(...(output || []))
        } else {
          chunks.push({
            id: newPaper?.id || newPaper?.corpusId,
            pageContent: fullText,
          })
        }

        // Process chunks and collect codes
        let initialCodesArray = [] as string[]
        const { asyncForEach } = require("../../Helpers/asyncForEach")
        
        await asyncForEach(chunks, async (chunk: any, index: number) => {
          const result = await model.predictMessages(
            [
              new SystemMessage(
                'You are tasked with applying the initial coding phase of the Gioia method to the provided academic paper. In this phase, scrutinize the text to identify emergent themes, concepts, or patterns. Your output should be a JSON object with an array of strings no longer than 7 words, each representing a distinct initial code in the language of the raw source. For example, your output should be in this format: {"codes": string[]}. Ensure to return ONLY a proper JSON array of strings.'
              ),
              new HumanMessage(
                `${newPaper?.title}\n${
                  chunk.pageContent
                }\n\nPerform initial coding according to the Gioia method on the given paper.${
                  props.modelData?.remarks ? ` Remark: ${props.modelData?.remarks}. ` : ""
                } Return a JSON object.`
              ),
            ],
            { response_format: { type: "json_object" } }
          )

          try {
            const codes = result?.content
              ? JSON.parse((result?.content as string)?.replace(/\\n/g, " "))
                  ?.codes
              : []
            initialCodesArray.push(...codes)
          } catch (error) {
            console.log(error, result?.content)
          }
        })

        newPaper["Initial Codes"] = initialCodesArray
      } catch (error) {
        ChatService.handleError(error)
        newPaper["Initial Codes"] = []
      }
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
    
    try {
      const model = await ChatService.createChatModel({ maxTokens: 2000 })
      
      // Use the same chunking logic as OpenAIService for consistency
      let chunks = []
      const jsonString = JSON.stringify(codes)

      if ((jsonString.length || 0) > 5000) {
        const { CharacterTextSplitter } = await import("@langchain/textsplitters")
        const splitter = new CharacterTextSplitter({
          separator: " ",
          chunkSize: 5000,
          chunkOverlap: 50,
        })
        const output = await splitter.createDocuments([jsonString], [{}])
        chunks.push(...(output || []))
      } else {
        chunks.push({
          pageContent: jsonString,
        })
      }

      // Initialize array to hold codes for each chunk
      const secondOrderCodes = {} as any
      const { asyncForEach } = require("../../Helpers/asyncForEach")
      const { uniqBy } = require("../../Helpers/uniqBy")

      // Loop through each chunk and apply initial coding
      await asyncForEach(chunks, async (chunk: any, index: number) => {
        const result = await model.predictMessages(
          [
            new SystemMessage(
              'You are tasked with applying the 2nd Order Coding phase of the Gioia method. In this phase, identify higher-level themes or categories that aggregate the initial codes. Your output should be a JSON-formatted object mapping each higher-level theme to an array of initial codes that belong to it. As a general example, "employee sentiment" could be a 2nd order code to 1st level codes "Positive feelings toward new policy" and "Sense of control" Your output should look like this, where the keys are the higher-level concepts: {"Some higher-Level theme": ["some initial code", "another initial code"], "Another higher-level theme": ["some initial code"]}.'
            ),
            new HumanMessage(
              `Part of the initial codes are as follows: ${chunk.pageContent}\n\nPerform 2nd Order Coding according to the Gioia method and return a JSON object of 12 focus codes.`
            ),
          ],
          { response_format: { type: "json_object" } }
        )
        
        try {
          const newSecondOrderCodes = result?.content
            ? JSON.parse((result?.content as string)?.replace(/\\n/g, " "))
            : {}
          Object.keys(newSecondOrderCodes).forEach((key) => {
            secondOrderCodes[key] = uniqBy(
              [...(secondOrderCodes[key] || []), ...newSecondOrderCodes[key]],
              (item: any) => item
            )
          })
        } catch (error) {
          console.log(error)
        }
      })
      
      setFocusCodes(secondOrderCodes)
      setSecondOrderLoading(false)
      setCurrent(1)
      return secondOrderCodes
    } catch (error) {
      ChatService.handleError(error)
      setSecondOrderLoading(false)
      return {}
    }
  }

  const loadAggregateDimensions = async (codes: {
    [code: string]: string[]
  }) => {
    setAggregateLoading(true)
    
    try {
      const model = await ChatService.createChatModel({ maxTokens: 2000 })
      
      // Convert the JSON object of 2nd order codes into a JSON string
      const jsonString = JSON.stringify(Object.keys(codes))

      // Create a message prompt for the Aggregate Dimensions phase
      const result = await model.predictMessages(
        [
          new SystemMessage(
            'You are tasked with applying the Aggregate Dimensions phase of the Gioia method. In this phase, identify overarching theoretical dimensions (5-7) that aggregate the 2nd order codes. Your output should be a JSON-formatted object mapping each aggregate dimension to an array of 2nd order codes that belong to it. As a (probably unrelated) general example, "Policy Usability" could make for a good, quantifiable dimension. Your output should look like this, where the keys are the (quantifiable) dimensions: {"some dim": ["theme", "another theme"], "another dim": ["theme123"]}. Ensure that the aggregate dimensions are grounded in the themes and to return ONLY a proper JSON object.'
          ),
          new HumanMessage(
            `The 2nd order codes are as follows: ${jsonString}\n\nPerform aggregation into theoretical dimensions according to the Gioia method and return a JSON object.`
          ),
        ],
        { response_format: { type: "json_object" } }
      )

      // Parse the output and return
      try {
        const aggregateDimensions = result?.content
          ? JSON.parse((result?.content as string)?.replace(/\\n/g, " "))
          : {}
          
        setAggregateDimensions(aggregateDimensions)
        setAggregateLoading(false)
        setCurrent(2)
        return aggregateDimensions
      } catch (error) {
        console.log(error)
        setAggregateLoading(false)
        return {}
      }
    } catch (error) {
      ChatService.handleError(error)
      setAggregateLoading(false)
      return {}
    }
  }

  // Check model configuration before starting any stage
  const checkModelConfig = () => {
    const config = ModelService.getModelConfig()
    if (!config) {
      message.error("No AI model configured")
      return false
    }

    if (config.provider === 'anthropic') {
      const hasOpenAIKey = config.openaiEmbeddingsKey || localStorage.getItem("openAIKey");
      if (!hasOpenAIKey) {
        message.error("Coding analysis requires OpenAI models. Please switch to OpenAI or add OpenAI key in advanced settings.")
        return false
      }
    }
    return true
  }

  // Stage 1: Start 1st Order Coding only
  const startFirstOrderCoding = async () => {
    console.log("Starting 1st Order Coding")
    
    if (!checkModelConfig()) return

    try {
      const codes = await loadInitialCodes()
      if (codes.length > 0) {
        props?.onModelDataChange?.({
          firstOrderCodes: codes,
        })
        setCurrent(0) // Stay on 1st Order Coding step
      }
    } catch (error) {
      console.error("1st Order Coding failed:", error)
      message.error("Failed to analyze papers. Please check your configuration.")
      setFirstOrderLoading(false)
    }
  }

  // Stage 2: Start 2nd Order Coding 
  const startSecondOrderCoding = async () => {
    console.log("Starting 2nd Order Coding")
    
    if (!checkModelConfig()) return
    
    try {
      const focusCodes = await loadFocusCodes(initialCodes)
      if (Object.keys(focusCodes).length > 0) {
        props?.onModelDataChange?.({
          secondOrderCodes: focusCodes,
        })
        setCurrent(1) // Move to 2nd Order Coding step
      }
    } catch (error) {
      console.error("2nd Order Coding failed:", error)
      message.error("Failed to generate 2nd order codes. Please try again.")
      setSecondOrderLoading(false)
    }
  }

  // Stage 3: Start Aggregate Dimensions
  const startAggregateDimensions = async () => {
    console.log("Starting Aggregate Dimensions")
    
    if (!checkModelConfig()) return
    
    try {
      const aggregateDimensionCodes = await loadAggregateDimensions(focusCodes)
      props?.onModelDataChange?.({
        aggregateDimensions: aggregateDimensionCodes,
      })
      setCurrent(2) // Move to Aggregate Dimensions step
    } catch (error) {
      console.error("Aggregate Dimensions failed:", error)
      message.error("Failed to generate aggregate dimensions. Please try again.")
      setAggregateLoading(false)
    }
  }

  // Legacy function for restart - runs all stages
  const restartAllCoding = async () => {
    console.log("Restarting all coding stages")
    
    if (!checkModelConfig()) return

    try {
      const codes = await loadInitialCodes()
      if (codes.length > 0) {
        const focusCodes = await loadFocusCodes(codes)
        if (Object.keys(focusCodes).length > 0) {
          const aggregateDimensionCodes = await loadAggregateDimensions(focusCodes)
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
          <div style={{ display: "flex", alignItems: "flex-end", gap: "12px" }}>
            <RemarkComponent
              papers={props?.modelData?.papers || []}
              value={props.modelData?.remarks || ""}
              onValueChange={(e) => {
                props?.onModelDataChange?.({
                  remarks: e,
                })
              }}
            />
            <Button type="primary" onClick={startFirstOrderCoding}>Start Coding</Button>
          </div>
        ) : (
          <Space direction="vertical" style={{ width: "100%" }}>
            {/* Step-specific button section */}
            <div style={{ 
              backgroundColor: "#f8f9fa", 
              padding: "12px", 
              marginBottom: "16px", 
              borderRadius: "6px",
              border: "1px solid #e9ecef",
              textAlign: "center"
            }}>
              <Button 
                type={(secondOrderLoading || initialCodes.length === 0) ? "default" : "primary"}
                onClick={startSecondOrderCoding}
                disabled={secondOrderLoading || initialCodes.length === 0}
                loading={secondOrderLoading}
              >
                Next: Generate 2nd Order Codes
              </Button>
            </div>
            
            <PaperTable
              papers={props?.modelData?.papers || []}
              responsiveToUpdates={true}
              customColumns={["Initial Codes"]}
            />
          </Space>
        ),
    },
    {
      key: "focus",
      title: "2nd Order Coding",
      loading: secondOrderLoading,
      content: secondOrderLoading ? (
        <p>AcademiaOS is busy coding.</p>
      ) : Object.keys(focusCodes).length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          <p>Complete 1st Order Coding first, then proceed to generate 2nd Order Codes.</p>
        </div>
      ) : (
        <Space direction="vertical" style={{ width: "100%" }}>
          {/* Step-specific button section */}
          <div style={{ 
            backgroundColor: "#f8f9fa", 
            padding: "12px", 
            marginBottom: "16px", 
            borderRadius: "6px",
            border: "1px solid #e9ecef",
            textAlign: "center"
          }}>
            <Button 
              type={(aggregateLoading || Object.keys(focusCodes).length === 0) ? "default" : "primary"}
              onClick={startAggregateDimensions}
              disabled={aggregateLoading || Object.keys(focusCodes).length === 0}
              loading={aggregateLoading}
            >
              Next: Generate Aggregate Dimensions
            </Button>
          </div>
          
          <GioiaCoding
            firstOrderCodes={initialCodes || []}
            secondOrderCodes={focusCodes || {}}
            aggregateDimensions={{}}
          />
        </Space>
      ),
    },
    {
      key: "aggregate",
      title: "Aggregate Dimensions",
      loading: aggregateLoading,
      content: aggregateLoading ? (
        <p>AcademiaOS is generating aggregate dimensions.</p>
      ) : Object.keys(aggregateDimensions).length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          <p>Complete 2nd Order Coding first, then proceed to generate Aggregate Dimensions.</p>
        </div>
      ) : (
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
          type={props.modelData.firstOrderCodes ? "default" : "primary"}
          danger={props.modelData.firstOrderCodes ? true : false}
          loading={firstOrderLoading || secondOrderLoading || aggregateLoading}
          style={{ marginLeft: "20px" }}
          onClick={restartAllCoding}>
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

export default CodingStep
