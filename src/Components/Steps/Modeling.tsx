import {
  Alert,
  Button,
  Input,
  Space,
  Steps,
  Table,
  Typography,
  message,
} from "antd"
import { AcademicPaper } from "../../Types/AcademicPaper"
import { PaperTable } from "../PaperTable"
import { useEffect, useState } from "react"
import { asyncMap } from "../../Helpers/asyncMap"
import { OpenAIService } from "../../Services/OpenAIService"
import { ChatService } from "../../Services/ChatService"
import { HumanMessage, SystemMessage } from "langchain/schema"
import Mermaid from "../Charts/Mermaid"
import { GioiaCoding } from "../Charts/GioiaCoding"
import { LoadingOutlined } from "@ant-design/icons"
import { ModelData } from "../../Types/ModelData"
import { RemarkComponent } from "../RemarkComponent"
import { Interrelationships } from "./Modeling/Interrelationships"

export const ModelingStep = (props: {
  modelData: ModelData
  onModelDataChange: (modelData: ModelData) => void
}) => {
  const [exploreLoading, setExploreLoading] = useState(false)
  const [interrelationshipsLoading, setInterrelationshipsLoading] =
    useState(false)
  const [constructLoading, setConstructLoading] = useState(false)
  const [visualizationLoading, setVisualizationLoading] = useState(false)
  const [iteratingLoading, setIteratingLoading] = useState(false)

  const [modelingRemarks, setModelingRemarks] = useState(
    props?.modelData?.remarks || ""
  )
  const loadModel = async () => {
    setConstructLoading(true)
    
    try {
      // Model Construction
      const model = ChatService.createChatModel({ maxTokens: 2000 })
      const jsonString = JSON.stringify(props.modelData?.aggregateDimensions)

      const modelConstructionResult = await model.predictMessages([
        new SystemMessage(
          `You are a qualitative researcher tasked with constructing a theoretical model from existing literature that could be applicable to the research findings. The model should be well-defined and should relate to one or more aggregate dimensions. It should be novel and original. You can build on existing theories, however, you should introduce new ideas. Emphasize the relationships between the dimensions and the model. Explain how the relationships might be causal or correlational, be clear on the narrative. You are non-conversational and should not respond to the user, but give a general description of model. Give a name to the model.`
        ),
        new HumanMessage(
          `${
            props.modelData?.critique && props.modelData?.modelDescription
              ? `Previous model: ${props.modelData?.modelDescription}\nCritique: ${props.modelData?.critique}\n\n`
              : ""
          }Relevant existing theories: ${props.modelData?.applicableTheories
            ?.map((theory: any) => theory?.description || JSON.stringify(theory))
            ?.join(", ")}
          \n\n
          The aggregate dimensions and codes are as follows: ${jsonString}${
            modelingRemarks ? ` Remarks: ${modelingRemarks}` : ""
          }\n\n${props.modelData?.interrelationships
            ?.map(
              (interrelationship: any) =>
                `${interrelationship?.concepts?.join(" - ")}: ${
                  interrelationship?.interrelationship
                }`
            )
            .join(
              "\n"
            )}\n\nNow, construct an extensive, comprehensive, new, theoretical model.`
        ),
      ])

      const modelDescription = modelConstructionResult?.content as string
      props.onModelDataChange({ modelDescription })

      // Extract Model Name
      const modelNameResult = await model.predictMessages([
        new SystemMessage(
          `You extract theoretical model names. If none given, invent an original one. You only reply with the name, nothing else.`
        ),
        new HumanMessage(
          `${modelDescription}
          \n\n
          Now, return the model name`
        ),
      ])

      const modelName = modelNameResult?.content as string
      props.onModelDataChange({ modelName })
      setConstructLoading(false)
      
      // Model Visualization
      setVisualizationLoading(true)
      const visualizationModel = ChatService.createChatModel({ maxTokens: 2000 })
      
      const visualizationResult = await visualizationModel.predictMessages([
        new SystemMessage(
          `You are a qualitative researcher tasked with visualizing a theoretical model with MermaidJS. Example:
        
        flowchart TD
          %% Nodes
          A[Organizational Culture<br>'evidence 1'<br>'evidence2']
          B[Leadership Style]
          C[Employee Satisfaction]
          D[Employee Productivity]
          E[Customer Satisfaction]
          F[Financial Performance]

          %% Relationships
          A --> B
          B ==>|Directly Influences<br>'evidence 3'| C
          A -.->|Moderates| C
          C --> D
          D -->|Impacts| E
          E --- F
          C -.->|Partially Mediates| F
          


        As we have seen in above diagram, ==> is used to indicate a strong direct influence, --> is used to indicate a weaker influence, -.-> is used to indicate a moderating relationship, and --- is used to indicate a correlation.
        Evidence can be cited by adding a line break and then the evidence in single quotes. Use first-order codes or second-order codes as evidence only, preferably not as their own nodes.
        Now, given a model description, you should generate a MermaidJS diagram like the one above, showing the interrelationship between different concepts. Keep it simple and effective. You are non-conversational and should not respond to the user, only return the MermaidJS code, nothing else.`
        ),
        new HumanMessage(
          `${
            (props.modelData?.firstOrderCodes?.length || 0) > 200
              ? `Second-order codes: ${Object.keys(
                  props.modelData?.secondOrderCodes || {}
                )?.join(", ")}`
              : `First-order codes: ${props.modelData?.firstOrderCodes?.join(", ")}`
          }\n\n${modelDescription}${
            props.modelData?.remarks ? `\n\nRemarks: ${props.modelData?.remarks}` : ""
          }`
        ),
      ])

      let visualization = ""
      if (visualizationResult?.content) {
        let normalizedContent = visualizationResult.content as string
        const startIndex = normalizedContent.indexOf("flowchart ")
        if (startIndex !== -1) {
          normalizedContent = normalizedContent.substring(startIndex)
        }
        visualization = normalizedContent.replace(/```/g, "").trim()
      }

      setCurrent(2)
      props.onModelDataChange({
        modelVisualization: visualization,
      })
      setCurrent(3)
      setVisualizationLoading(false)
      
      // Model Critique
      setIteratingLoading(true)
      const critiqueModel = ChatService.createChatModel({ maxTokens: 1000 })
      
      const critiqueResult = await critiqueModel.predictMessages([
        new SystemMessage(
          `You are a qualitative researcher tasked with critiquing a theoretical model. Offer your comments on novelty, conciseness, clarity and theoretical insight and brainstorm potential new patterns to discover in the data. You are non-conversational and should not respond to the user, only return the critique, nothing else.`
        ),
        new HumanMessage(
          `${
            (props.modelData?.firstOrderCodes?.length || 0) < 50
              ? `First order codes: ${props.modelData?.firstOrderCodes?.join(", ")}`
              : ""
          }
          ${JSON.stringify(props.modelData?.interrelationships)}
          \n\n
          Model: ${modelName}\n
          ${modelDescription}
          Now, return your critique`
        ),
      ])

      const critique = critiqueResult?.content as string
      props.onModelDataChange({ critique })
      setIteratingLoading(false)
    } catch (error) {
      ChatService.handleError(error)
      setConstructLoading(false)
      setVisualizationLoading(false)
      setIteratingLoading(false)
    }
  }

  const load = async () => {
    if (props?.modelData?.aggregateDimensions) {
      try {
        setExploreLoading(true)
        
        // Brainstorm Applicable Theories
        const theoriesModel = ChatService.createChatModel({ maxTokens: 2000 })
        const jsonString = JSON.stringify(props?.modelData?.aggregateDimensions)

        const theoriesResult = await theoriesModel.predictMessages(
          [
            new SystemMessage(
              `Your task is to brainstorm theoretical models from existing literature that could be applicable to the research findings. Each theory should be well-defined and should relate to one or more aggregate dimensions. The output should be a JSON-object with an array following this schema: 
            {"theories": {"theory": string, "description": string, "relatedDimensions": string[], "possibleResearchQuestions": string[]}[]}
            `
            ),
            new HumanMessage(
              `Our research aims to understand specific phenomena within a given context. We have identified multiple aggregate dimensions and second-order codes that emerged from our data. Could you suggest theories that could help explain these dimensions and codes? The aggregate dimensions and codes are as follows: ${jsonString}`
            ),
          ],
          { response_format: { type: "json_object" } }
        )

        try {
          const applicableTheories = theoriesResult?.content
            ? JSON.parse((theoriesResult?.content as string)?.replace(/\\n/g, " "))
                ?.theories
            : []
          props.onModelDataChange({ applicableTheories })
        } catch (error) {
          console.log(error)
          props.onModelDataChange({ applicableTheories: [] })
        }

        setExploreLoading(false)

        setInterrelationshipsLoading(true)
        
        // Concept Tuples
        const tuplesModel = ChatService.createChatModel({ maxTokens: 2000 })
        const conceptTuplesResult = await tuplesModel.predictMessages(
          [
            new SystemMessage(
              `Your task is to hypothesize which concepts could be related to each other. Return a JSON-object with an array of tuple arrays, where each tuple array represents a possible relationship between two concepts. The output should be a JSON-formatted array following this schema: {"tuples": [[string, string], [string, string], ...]}. E.g. {"tuples": [["Knowledge Management", "Organizational Performance"]]}. This allows us to in the next step research the relationship between the concepts in the literature.`
            ),
            new HumanMessage(
              `Our research aims to understand ${
                props.modelData?.query || "specific phenomena within a given context"
              }.${
                props.modelData?.remarks ? `Remarks: ${props.modelData?.remarks}.` : ""
              } We have identified multiple aggregate dimensions and second-order codes that emerged from our data.
            ${jsonString}
            Now, hypothesize which concepts could be related to each other and return only the JSON-formatted array of 10 - 20 tuples.`
            ),
          ],
          { response_format: { type: "json_object" } }
        )

        let tuples: [string, string][] = []
        try {
          tuples = conceptTuplesResult?.content
            ? JSON.parse((conceptTuplesResult?.content as string)?.replace(/\\n/g, " "))
                ?.tuples
            : []
        } catch (error) {
          console.log(error)
        }

        props.onModelDataChange({
          interrelationships: tuples.map((tuple) => ({ concepts: tuple })),
        })
        setCurrent(1)

        // Find Relevant Paragraphs and Summarize
        if (tuples.length > 0) {
          const { MemoryVectorStore } = require("langchain/vectorstores/memory")
          const embeddings = ChatService.getEmbeddings()
          const store = new MemoryVectorStore(embeddings)
          const documents: any[] = []
          const { asyncForEach } = require("../../Helpers/asyncForEach")
          const { asyncMap } = require("../../Helpers/asyncMap")

          // Split text and prepare documents
          await asyncForEach(props.modelData?.papers || [], async (paper: any) => {
            const { CharacterTextSplitter } = require("langchain/text_splitter")
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

          // Add documents to store
          await store.addDocuments(documents)

          const interrelationShips = await asyncMap(
            tuples,
            async ([concept1, concept2]: [string, string]) => {
              const query1 = await embeddings.embedQuery(
                `${concept1} - ${concept2} relationship`
              )

              const resultsWithScore = await store.similaritySearchVectorWithScore(
                query1,
                4
              )

              const relevantParagraphs1 = resultsWithScore
                .map(([result, score]: [any, number]) => {
                  return result.pageContent
                })
                ?.join("\n\n")

              // Summarize the interrelationship
              const summaryModel = ChatService.createChatModel({ maxTokens: 200 })
              const summaryResult = await summaryModel.predictMessages([
                new SystemMessage(
                  `Your task is to summarize the interrelationship between ${concept1} and ${concept2} in one short sentence. If evidence, include information about correlation or causation, direct, mediated or conditional interaction, static or dynamic relationship, feedback loops, uni- or bi-directional, strong or weak.`
                ),
                new HumanMessage(
                  `${relevantParagraphs1}\n\nNow, provide a summary in one short sentence.`
                ),
              ])

              return {
                concepts: [concept1, concept2],
                interrelationship: `${summaryResult?.content}`,
                evidence: relevantParagraphs1,
              }
            }
          )

          props.onModelDataChange({ interrelationships: interrelationShips })
        }
        
        setInterrelationshipsLoading(false)

        await loadModel()
      } catch (error) {
        ChatService.handleError(error)
        setExploreLoading(false)
        setInterrelationshipsLoading(false)
      }
    } else {
      message.error("Please finish the previous steps first.")
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
      key: "explore",
      title: "Applicable Theories",
      loading: exploreLoading,
      content:
        !exploreLoading &&
        (props.modelData.applicableTheories || [])?.length === 0 ? (
          <Space>
            <RemarkComponent
              papers={props.modelData.papers || []}
              value={props.modelData?.remarks || ""}
              onValueChange={(e) => {
                props?.onModelDataChange?.({
                  remarks: e,
                })
              }}
            />
            <Button onClick={load}>Start Modeling</Button>
          </Space>
        ) : (
          <Table
            dataSource={props.modelData.applicableTheories || []}
            columns={[
              { title: "Theory", dataIndex: "theory" },
              { title: "Description", dataIndex: "description" },
              {
                title: "Related Dimensions",
                dataIndex: "relatedDimensions",
                render: (row, record) => row?.join(",\n"),
              },
              {
                title: "Possible Research Questions",
                dataIndex: "possibleResearchQuestions",
                render: (row, record) => row?.join("\n"),
              },
            ]}
          />
        ),
    },
    {
      key: "interrelationships",
      title: "Interrelationships",
      loading: interrelationshipsLoading,
      content: (
        <Interrelationships
          modelData={props.modelData}
          onModelDataChange={props.onModelDataChange}
        />
      ),
    },
    {
      key: "model",
      title: "Construct",
      loading: constructLoading,
      content: (
        <Space direction='vertical'>
          <Space direction='horizontal'>
            <Input
              style={{ width: "300px" }}
              value={modelingRemarks}
              onChange={(e) => setModelingRemarks(e.target.value)}
              placeholder='Free-text remarks for the modeling ...'
            />
            <Button loading={constructLoading} onClick={loadModel}>
              Build Model
            </Button>
          </Space>
          <Typography.Paragraph
            editable={{
              onChange: (e) =>
                props.onModelDataChange &&
                props.onModelDataChange({ modelDescription: e }),
              text: props?.modelData?.modelDescription,
            }}>
            {props?.modelData?.modelDescription || "No model developed yet."}
          </Typography.Paragraph>
        </Space>
      ),
    },
    {
      key: "visualization",
      title: "Visualization",
      loading: visualizationLoading,
      content: (
        <Space direction='vertical' style={{ width: "100%" }}>
          <Typography.Title level={3}>
            {props.modelData?.modelName}
          </Typography.Title>
          <Mermaid chart={props?.modelData?.modelVisualization} />
          <Alert
            type='info'
            message='If you see the message "Syntax error in text" it means that there
            was an error in creating the visualization. You can hit "Start Modeling" to try again.'
          />
        </Space>
      ),
    },
    {
      key: "iterating",
      title: "Iterating",
      loading: iteratingLoading,
      content: (
        <Space direction='vertical' style={{ width: "100%" }}>
          <Typography.Title level={5}>Critique</Typography.Title>
          <Typography.Paragraph
            editable={{
              onChange: (e) =>
                props.onModelDataChange &&
                props.onModelDataChange({ critique: e }),
              text: props?.modelData?.critique,
            }}>
            {props?.modelData?.critique || "No critique developed yet."}
          </Typography.Paragraph>
          <Button onClick={() => loadModel()}>
            Use Critique for Another Modeling Iteration
          </Button>
        </Space>
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
          style={{ flex: 1 }} // Take up as much space as possible
          items={steps.map((item) => ({
            key: item.title,
            title: item.title,
            icon: item.loading ? <LoadingOutlined /> : null,
          }))}
        />
        <Button
          loading={
            exploreLoading ||
            constructLoading ||
            visualizationLoading ||
            interrelationshipsLoading
          }
          style={{ marginLeft: "20px" }}
          onClick={load}>
          {props.modelData.applicableTheories
            ? "Restart Modeling"
            : "Start Modeling"}
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
