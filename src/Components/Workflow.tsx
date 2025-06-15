import React, { useState, useEffect } from "react"
import { CheckCard } from "@ant-design/pro-components"

import {
  Divider,
  Steps,
  Button,
  Card,
  Space,
  Input,
  Row,
  Col,
  Table,
  Form,
  Typography,
  theme,
  Result,
  Tag,
  Modal,
  Upload,
  Alert,
} from "antd"
import {
  BookOutlined,
  CloudUploadOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  LoadingOutlined,
  PlusOutlined,
  UploadOutlined,
  BarChartOutlined,
} from "@ant-design/icons"
import { SearchRepository } from "../Services/SearchService"
import { useDispatch } from "react-redux"
import { renameTab, addTab } from "../Redux/actionCreators"
import { PaperComponent } from "./Paper"
import { RankingService } from "../Services/RankingService"
import { PaperTable } from "./PaperTable"
import { QualitativeAnalysisService } from "../Services/QualitativeAnalysisService"
import { ModelService } from "../Services/ModelService"
import StreamingComponent from "./StreamingComponent"

import { AcademicPaper } from "../Types/AcademicPaper"
import StepFind from "./Steps/Find"
import CodingStep from "./Steps/Coding"
import { ModelData } from "../Types/ModelData"
import ModelingStep from "./Steps/Modeling"
import { LangFuseMonitor } from "./LangFuseMonitor"
import { ChatService } from "../Services/ChatService"
import SearchLoadingState from "./SearchLoadingState"
const { useToken } = theme

const Workflow = (props: { tabKey?: string }) => {
  const [mode, setMode] = useState<
    "qualitative" | undefined | "literatureReview"
  >("qualitative")
  const [current, setCurrent] = useState(0)
  const [results, setResults] = useState<AcademicPaper[] | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const { token } = useToken()
  const [relevancyLoading, setRelevancyLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  const dispatch = useDispatch()

  const [isRestoreModalVisible, setIsRestoreModalVisible] = useState(false)
  const [langFuseVisible, setLangFuseVisible] = useState(false)
  const [currentOperation, setCurrentOperation] = useState('')

  const handleRenameTab = (key: string, newLabel: string) => {
    dispatch(renameTab(key, newLabel))
  }

  const handleAddTab = (newTab: any) => {
    dispatch(addTab(newTab))
  }

  const onChange = (value: number) => {
    setCurrent(value)
  }

  const [modelData, setModelData] = useState<ModelData>({})


  const evaluate = async (query: string, searchResults: AcademicPaper[]) => {
    setRelevancyLoading(true)
    setCurrentOperation('Ranking papers by relevance...')
    try {
      const relevantResults = query
        ? await RankingService.rankPapers(
            query,
            searchResults?.filter((paper) => paper?.fullText) || []
          )
        : searchResults?.filter((paper) => paper?.fullText)
      setModelData((prevValue) => ({ ...prevValue, papers: relevantResults }))
    } catch (error) {
      console.error('Paper ranking failed:', error)
      // Use original results if ranking fails
      setModelData((prevValue) => ({ 
        ...prevValue, 
        papers: searchResults?.filter((paper) => paper?.fullText) || []
      }))
    }
    setRelevancyLoading(false)
    setCurrentOperation('')
    
    // Add a 3-second pause before moving to Evaluate step to avoid disorientation
    await new Promise(resolve => setTimeout(resolve, 3000))
    setCurrent(2)
  }

  const saveToJsonFile = () => {
    const blob = new Blob([JSON.stringify(modelData)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "academia-os.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  // Function to handle file upload
  const handleFileUpload = (file: any) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e?.target?.result
      if (typeof content === "string") {
        const parsedContent = JSON.parse(content)
        setModelData(parsedContent)
        setIsRestoreModalVisible(false)
      } else {
        // Handle the case when content is not a string
        console.error("Uploaded file content is not a string")
      }
    }
    reader.readAsText(file)
    return false
  }

  const steps = [
    {
      key: "find",
      title: "Find",
      content: (
        <StepFind
          onLoadingChange={setSearchLoading}
          onFinish={async (payload) => {
            console.log(payload)
            handleRenameTab(
              props?.tabKey || "",
              payload.searchQuery || "File Analysis"
            )
            setModelData((prev) => ({ ...prev, query: payload.searchQuery }))
            setSearchQuery(payload.searchQuery)
            setResults(payload.searchResults)
            setCurrent(1)
            await evaluate(payload.searchQuery, payload.searchResults)
          }}
        />
      ),
    },
    {
      key: "explore",
      loading: searchLoading,
      title: `Explore${results?.length ? ` (${results?.length})` : ""}`,
      content:
        (results || [])?.length > 0 ? (
          <PaperTable
            onPapersChange={(papers) => setResults(papers)}
            papers={results || []}
          />
        ) : (
          <Alert
            message={
              "No results found. Try another search query. Try to be less specific or to write in keywords."
            }
          />
        ),
    },
    {
      key: "evaluate",
      loading: relevancyLoading,
      title: `Evaluate${
        modelData.papers?.length ? ` (${modelData.papers?.length})` : ""
      }`,
      content: (
        <>
          {relevancyLoading ? (
            <SearchLoadingState searchQuery={searchQuery} stage="ranking" />
          ) : (
            <>
              {ModelService.isModelConfigured() ? (
                (modelData.papers || [])?.length > 0 ? (
                  <PaperTable
                    onPapersChange={(papers) => {
                      setModelData((prevValue) => ({ ...prevValue, papers }))
                    }}
                    papers={modelData.papers || []}
                  />
                ) : (
                  <Alert
                    message={
                      "No results found. Try another search query. Try to be less specific or to write in keywords."
                    }
                  />
                )
              ) : (
                <Result
                  status='404'
                  title='AI Model Configuration Required'
                  subTitle='Please configure your AI model to unlock all features.'
                  extra={
                    <Button 
                      type="primary" 
                      onClick={() => window.location.reload()}
                    >
                      Configure Model
                    </Button>
                  }
                />
              )}
            </>
          )}
        </>
      ),
    },
    // {
    //   key: "work",
    //   title: "Work  ",
    //   content: (
    //     <>
    //       <CheckCard.Group
    //         onChange={(value) => {
    //           setMode(value as any)
    //         }}
    //         value={mode}>
    //         <CheckCard
    //           title='Qualitative Analysis'
    //           description='Analyze large amounts of qualitative data with the Gioia method.'
    //           value='qualitative'
    //         />
    //         <CheckCard
    //           title='Literature Review'
    //           description='Let AI write the complete Literature Review for you.'
    //           value='literatureReview'
    //         />
    //       </CheckCard.Group>
    //     </>
    //   ),
    // },
    ...(mode === "literatureReview"
      ? [
          {
            key: "litrev",
            title: "Literature Review",
            content: (
              <>
                {QualitativeAnalysisService.getOpenAIKey() ? (
                  <div>
                    Literature Review
                    <StreamingComponent
                      prompt={`${
                        modelData.papers
                          ?.map(
                            (paper) =>
                              `${paper?.authors
                                ?.map((author) => author?.name)
                                ?.join(", ")}, ${paper?.year}, ${
                                paper?.title
                              } write: ${paper?.fullText}`
                          )
                          ?.join("\n\n")
                          ?.substring(0, 6000) || ""
                      }\n\nNow, given these papers, write a short, academic literature review of the most important findings answering '${searchQuery}'. Follow APA7. Return only with the literature review and nothing else. No titles and subtitles.`}
                    />
                  </div>
                ) : (
                  <Result
                    status='404'
                    title='AI Model Configuration Required'
                    subTitle='Please configure your AI model to unlock all features.'
                    extra={
                      <Button 
                        type="primary" 
                        onClick={() => window.location.reload()}
                      >
                        Configure Model
                      </Button>
                    }
                  />
                )}
              </>
            ),
          },
        ]
      : []),
    ...(mode === "qualitative"
      ? [
          {
            key: "coding",
            title: `Coding${
              Object.keys(modelData?.aggregateDimensions || {}).length > 0
                ? ` (${
                    Object.keys(modelData?.aggregateDimensions || {}).length
                  })`
                : ""
            }`,
            content: (
              <CodingStep
                onModelDataChange={(data) => {
                  console.log(data)
                  setModelData((prev) => ({ ...prev, ...data }))
                }}
                modelData={modelData}
              />
            ),
          },
          {
            key: "modeling",
            title: "Modeling",
            content: (
              <ModelingStep
                onModelDataChange={(data) =>
                  setModelData((prev) => ({ ...prev, ...data }))
                }
                modelData={modelData}
              />
            ),
          },
        ]
      : []),
  ]

  const next = () => {
    setCurrent(current + 1)
  }

  const prev = () => {
    setCurrent(current - 1)
  }

  const items = steps.map((item) => ({
    key: item.title,
    title: item.title,
    icon: item.loading ? <LoadingOutlined /> : null,
  }))

  return (
    <>
      <Row gutter={10}>
        <Col xs={0} sm={0} md={6} lg={4} xl={3}>
          <Space direction='vertical'>
            {/* Previous/Next navigation in clean white box */}
            <div style={{ 
              backgroundColor: "white", 
              padding: "8px", 
              borderRadius: "6px",
              border: "1px solid #d9d9d9",
              textAlign: "center"
            }}>
              {current === 0 ? (
                // Show greyed out buttons on Find step
                <>
                  <Button size="small" disabled style={{ margin: "0 4px", color: "#ccc" }}>
                    Prev
                  </Button>
                  <Button size="small" disabled style={{ margin: "0 4px", color: "#ccc" }}>
                    Next
                  </Button>
                </>
              ) : (
                // Show functional buttons on other steps
                <>
                  {current > 0 && (
                    <Button size="small" style={{ margin: "0 4px" }} onClick={() => prev()}>
                      Prev
                    </Button>
                  )}
                  {current < steps.length - 1 && current !== 0 && (
                    <Button 
                      type={(current === 3 && (!modelData?.aggregateDimensions || Object.keys(modelData?.aggregateDimensions || {}).length === 0)) ? 'default' : 'primary'}
                      disabled={current === 3 && (!modelData?.aggregateDimensions || Object.keys(modelData?.aggregateDimensions || {}).length === 0)}
                      size="small"
                      onClick={() => next()}
                      style={{ margin: "0 4px" }}
                    >
                      Next
                    </Button>
                  )}
                </>
              )}
            </div>
            
            <Steps
              current={current}
              onChange={onChange}
              direction='vertical'
              size='small'
              items={items}
            />
            
            {/* Add monitoring buttons */}
            {ChatService.isLangFuseAvailable() && (
              <Button 
                icon={<BarChartOutlined />}
                onClick={() => setLangFuseVisible(true)}
                type={langFuseVisible ? "primary" : "default"}
                size="small"
              >
                AI Observatory
              </Button>
            )}
            
            <div>
              <a
                type='link'
                href='https://academia-os.canny.io/'
                target='_blank'
                rel='noreferrer'>
                Give Feedback or Request Feature
              </a>
            </div>
            <a onClick={saveToJsonFile}>Save Session</a>
            <a onClick={() => setIsRestoreModalVisible(true)}>
              Restore Session
            </a>
            <Modal
              title='Restore from JSON File'
              open={isRestoreModalVisible}
              onCancel={() => setIsRestoreModalVisible(false)}
              footer={null}>
              <Upload customRequest={({ file }) => handleFileUpload(file)}>
                <Button icon={<UploadOutlined />}>Upload JSON File</Button>
              </Upload>
            </Modal>
          </Space>
        </Col>
        <Col xs={24} sm={24} md={18} lg={20} xl={21}>
          <Card
            style={{
              width: "100%",
              maxHeight: "calc(100vh - 120px)",
              overflowY: "auto",
            }}>
            
            <div key={steps[current].key}>{steps[current].content}</div>
          </Card>
        </Col>
      </Row>
      
      {/* Add the monitoring components */}
      <LangFuseMonitor
        visible={langFuseVisible}
        onClose={() => setLangFuseVisible(false)}
        isProcessing={searchLoading || relevancyLoading || (steps[current]?.loading || false)}
        currentOperation={currentOperation}
      />
    </>
  )
}

export default Workflow
