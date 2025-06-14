/* eslint-disable react-hooks/rules-of-hooks */
import {
  AutoComplete,
  Button,
  Space,
  Table,
  Tag,
  Typography,
  theme,
  App,
} from "antd"
import { useDispatch } from "react-redux"
import { renameTab, addTab } from "../Redux/actionCreators"
import { PaperComponent } from "./Paper"
import {
  DownloadOutlined,
  FilePdfOutlined,
  LinkOutlined,
  PlusOutlined,
} from "@ant-design/icons"
import { useEffect, useState } from "react"
import { OpenAIService } from "../Services/OpenAIService"
import { ModelService } from "../Services/ModelService"
import { CustomColumn } from "./CustomColumn"
import { AcademicPaper } from "../Types/AcademicPaper"
import { asyncForEach } from "../Helpers/asyncForEach"
const { useToken } = theme

export const PaperTable = (props: {
  papers: AcademicPaper[]
  customColumns?: string[]
  responsiveToUpdates?: boolean
  onPapersChange?: (papers: AcademicPaper[]) => void
}) => {
  const dispatch = useDispatch()
  const { token } = useToken()
  const { message } = App.useApp()
  const [columnAddSearchQuery, setColumnAddSearchQuery] = useState("")
  const handleRenameTab = (key: string, newLabel: string) => {
    dispatch(renameTab(key, newLabel))
  }

  const [customColumns, setCustomColumns] = useState<any[]>(
    props.customColumns || []
  )

  const [updatedPapers, setUpdatedPapers] = useState<AcademicPaper[]>(
    props.papers
  )

  useEffect(() => {
    props?.responsiveToUpdates && setUpdatedPapers(props.papers)
  }, [props?.papers])

  const handleAddTab = (newTab: any) => {
    dispatch(addTab(newTab))
  }

  const convertToCSV = (papers: AcademicPaper[]): string => {
    const header = Object.keys(papers[0]).join(",")
    const rows = papers.map((paper) => {
      return Object.values(paper)
        .map((value) => {
          if (value === null) return ""
          if (Array.isArray(value)) return `"${value.join("; ")}"`
          return typeof value === "string" ? `"${value}"` : value
        })
        .join(",")
    })

    return `${header}\n${rows.join("\n")}`
  }

  const convertToBIB = (papers: AcademicPaper[]): string => {
    return papers
      .map((paper) => {
        return `@article{${paper.id},
  title={${paper.title}},
  author={${(paper.authors?.map((author) => author.name) || []).join(", ")}},
  journal={${paper.journal}},
  year={${paper.year}}
}`
      })
      .join("\n\n")
  }

  const downloadCSV = () => {
    const csvString = convertToCSV(updatedPapers)
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "papers.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadBIB = () => {
    const bibString = convertToBIB(updatedPapers)
    const blob = new Blob([bibString], { type: "text/plain;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "papers.bib")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Space direction='vertical' style={{ width: "100%" }}>
      <Space direction='horizontal'>
        <AutoComplete
          styles={{
            popup: {
              root: { width: 300 }
            }
          }}
          className="custom-autocomplete"
          options={[
            ...(columnAddSearchQuery
              ? [
                  {
                    value: columnAddSearchQuery,
                    label: (
                      <span>
                        What is the <b>{columnAddSearchQuery}</b> of the paper?
                      </span>
                    ),
                  },
                ]
              : []),
            { value: "Key Findings", label: "Key Findings" },
            { value: "Limitations", label: "Limitations" },
            { value: "Recommendations", label: "Recommendations" },
            { value: "Research Questions", label: "Research Questions" },
            { value: "Variables Studied", label: "Variables Studied" },
            { value: "Data Sources", label: "Data Sources" },
            { value: "Sample Size", label: "Sample Size" },
            { value: "Statistical Methods", label: "Statistical Methods" },
            { value: "Implications", label: "Implications" },
            { value: "Study Design", label: "Study Design" },
            { value: "Research Instruments", label: "Research Instruments" },
            {
              value: "Ethical Considerations",
              label: "Ethical Considerations",
            },
            { value: "Funding Sources", label: "Funding Sources" },
            { value: "Keywords", label: "Keywords" },
            { value: "Conflict of Interest", label: "Conflict of Interest" },
            { value: "Timeframe", label: "Timeframe" },
            { value: "Conclusion", label: "Conclusion" },
            { value: "Main Argument", label: "Main Argument" },
            { value: "Theoretical Framework", label: "Theoretical Framework" },
          ]}
          filterOption={(inputValue, option) =>
            option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
          }
          style={{ 
            width: 200, 
            border: '2px solid #1890ff',
            borderRadius: '6px',
            color: 'rgba(24, 144, 255, 0.8)'
          }}
          popupClassName="custom-autocomplete-popup"
          value={columnAddSearchQuery}
          onSelect={async (value) => {
            // Check if we can use OpenAI features
            const config = ModelService.getModelConfig()
            if (!config) {
              message.error("No AI model configured")
              return
            }

            if (config.provider === 'anthropic') {
              const hasOpenAIKey = config.openaiEmbeddingsKey || localStorage.getItem("openAIKey");
              if (!hasOpenAIKey) {
                message.error("Custom columns require OpenAI models. Please switch to OpenAI or add OpenAI key in advanced settings.")
                return
              }
            }

            setCustomColumns([...customColumns, value])
            let newPapers = [...updatedPapers]
            
            // Count papers that need processing
            const papersToProcess = newPapers.filter(paper => !paper[value])
            console.log(`🔍 Custom Column Processing: Starting analysis of ${papersToProcess.length} papers for column "${value}"`)
            
            if (papersToProcess.length === 0) {
              console.log(`✅ Custom Column Processing: All papers already have "${value}" data`)
              return
            }
            
            // Show progress message
            const hideMessage = message.loading(`Analyzing ${papersToProcess.length} papers for "${value}"... Please wait`, 0)
            
            try {
              let processedCount = 0
              
              await asyncForEach(newPapers, async (paper, index) => {
                const newPaper = { ...paper } as AcademicPaper
                if (newPaper[value]) return // Skip if already has data
                
                try {
                  console.log(`📝 Processing paper ${processedCount + 1}/${papersToProcess.length}: "${paper.title?.substring(0, 50)}..."`)
                  
                  newPaper[value] = await OpenAIService.getDetailAboutPaper(
                    newPaper,
                    value
                  )
                  
                  processedCount++
                  console.log(`✅ Completed paper ${processedCount}/${papersToProcess.length}`)
                  
                  // Rate limiting: 1 second per 4 papers (5 seconds per 20 papers)
                  if (processedCount < papersToProcess.length && processedCount % 4 === 0) {
                    console.log(`⏳ Rate limiting: Waiting 1 second after processing ${processedCount} papers...`)
                    await new Promise(resolve => setTimeout(resolve, 1000))
                  }
                  
                } catch (error) {
                  console.error(`❌ Failed to get ${value} for paper "${paper.title}":`, error)
                  newPaper[value] = "Analysis failed"
                  processedCount++
                }
                
                // Update papers array with the new data
                newPapers[index] = newPaper
                
                // Update UI every few papers to show progress
                if (processedCount % 3 === 0 || processedCount === papersToProcess.length) {
                  setUpdatedPapers([...newPapers])
                }
              })
              
              hideMessage()
              message.success(`Successfully analyzed ${processedCount} papers for "${value}"`)
              console.log(`🎉 Custom Column Processing Complete: Analyzed ${processedCount} papers for "${value}"`)
              
            } catch (error) {
              hideMessage()
              console.error("❌ Failed to process custom column:", error)
              message.error("Failed to analyze papers. Please check your configuration.")
            }
            setColumnAddSearchQuery("")
          }}
          onSearch={(text) => setColumnAddSearchQuery(text)}
          suffixIcon={<PlusOutlined />}
          placeholder={!columnAddSearchQuery ? 'Add a Custom Column' : ''}
        />

        <Button icon={<DownloadOutlined />} onClick={downloadCSV}>
          Download CSV
        </Button>
        <Button icon={<DownloadOutlined />} onClick={downloadBIB}>
          Download BIB
        </Button>
      </Space>
      <Table
        // rowSelection={{ type: "checkbox" }}
        style={{ maxHeight: "calc(100vh - 270px)", overflowY: "auto" }}
        size='small'
        pagination={false}
        rowKey={(record) => record.id || record.paperId || `row-${Math.random()}`}
        dataSource={updatedPapers || []}
        columns={[
          {
            title: "Paper",
            dataIndex: "paper",
            key: "paper",
            render: (text, record, index) => (
              <Space size={0} direction={"vertical"} style={{ width: "300px" }}>
                <Typography.Link
                  onClick={() => {
                    const newActiveKey = `newTab${Date.now()}`
                    handleAddTab({
                      label: record.title?.substring(0, 30) || "Paper",
                      children: (
                        <PaperComponent paper={record} tabKey={newActiveKey} />
                      ),
                      key: newActiveKey,
                    })
                  }}
                  style={{
                    marginBottom: 0,
                    color: token.colorText,
                  }}>
                  {record.title}
                </Typography.Link>
                <Typography.Paragraph
                  type='secondary'
                  style={{ marginBottom: 0, fontSize: "9pt" }}>
                  {record.authors?.map((author) => author.name).join(", ")}
                </Typography.Paragraph>
                <Typography.Paragraph
                  type='secondary'
                  style={{ marginBottom: 0, fontSize: "9pt" }}>
                  {record?.journal?.name}
                </Typography.Paragraph>
                <Typography.Paragraph
                  type='secondary'
                  strong
                  style={{ marginBottom: 0, fontSize: "9pt" }}>
                  <span style={{ marginRight: 20 }}>{record?.year}</span>
                  <span style={{ marginRight: 20 }}>
                    {(record?.citationCount ?? 0).toLocaleString("en-US")}{" "}
                    citations
                  </span>
                  <span style={{ marginRight: 20 }}>
                    {(record?.url as any) && (
                      <a target={"_blank"} href={record?.url as any}>
                        <LinkOutlined /> URL
                      </a>
                    )}
                  </span>
                  <span style={{ marginRight: 20 }}>
                    {(record?.openAccessPdf as any)?.status === "GREEN" && (
                      <a
                        target={"_blank"}
                        href={(record?.openAccessPdf as any)?.url}>
                        <FilePdfOutlined /> PDF
                      </a>
                    )}
                  </span>
                </Typography.Paragraph>
              </Space>
            ),
          },
          {
            title: "Abstract",
            dataIndex: "abstract",
            key: "abstract",
            render: (text, record, index) => (
              <Space
                title={record.abstract}
                size={0}
                direction={"vertical"}
                style={{ width: "300px" }}>
                <Typography.Paragraph
                  ellipsis={{ rows: 5 }}
                  style={{ marginBottom: 0 }}>
                  {record.abstract || record?.fullText}
                </Typography.Paragraph>
              </Space>
            ),
          },
          ...customColumns.map((column) => ({
            title: column,
            dataIndex: column,
            key: column,
            width: column.includes('Question') || column.includes('Argument') || column.includes('Abstract') ? 400 : 300,
            render: (text: string, record: AcademicPaper, index: number) => {
              let isArray = false
              try {
                if (
                  Array.isArray(record[column]) ||
                  Array.isArray(JSON.parse(record[column]))
                ) {
                  isArray = true
                }
              } catch (error) {}
              
              // Determine display settings based on column type
              const isTextHeavy = column.includes('Question') || column.includes('Argument') || column.includes('Abstract');
              const isKeywords = column.toLowerCase().includes('keyword');
              const columnWidth = isTextHeavy ? "400px" : "300px";
              const ellipsisRows = isTextHeavy ? 8 : 5;
              
              // Clean up keywords by removing common preambles
              const cleanKeywords = (text: string) => {
                if (!isKeywords || typeof text !== 'string') return text;
                
                // Common patterns to remove
                const patterns = [
                  /^Based on the abstract,?\s*(the\s*)?keywords?\s*(would\s*)?(likely\s*)?(include|be):?\s*/i,
                  /^Keywords?\s*(for this paper\s*)?(would\s*)?(likely\s*)?(include|be):?\s*/i,
                  /^The\s*keywords?\s*(would\s*)?(likely\s*)?(include|be):?\s*/i,
                  /^Some\s*keywords?\s*(would\s*)?(likely\s*)?(include|be):?\s*/i,
                  /^Relevant\s*keywords?\s*(would\s*)?(likely\s*)?(include|be):?\s*/i,
                  /^Key\s*terms?\s*(would\s*)?(likely\s*)?(include|be):?\s*/i
                ];
                
                let cleaned = text;
                patterns.forEach(pattern => {
                  cleaned = cleaned.replace(pattern, '');
                });
                
                return cleaned.trim();
              };
              
              return (
                <Space
                  title={
                    record[column]
                      ? typeof record[column] === "string"
                        ? record[column]
                        : JSON.stringify(record[column])
                      : "No data available"
                  }
                  size={0}
                  direction={"vertical"}
                  style={{ width: columnWidth }}>
                  <Typography.Paragraph
                    ellipsis={{ rows: ellipsisRows, expandable: true, symbol: 'more' }}
                    style={{ marginBottom: 0 }}>
                    {record[column]
                      ? typeof record[column] === "string"
                        ? cleanKeywords(record[column])
                        : Array.isArray(record[column])
                        ? record[column].map((item: any, index: number) => (
                            <Tag key={index} style={{ fontSize: "6pt" }}>{item}</Tag>
                          ))
                        : JSON.stringify(record[column])
                      : (isKeywords ? "Keywords not extracted" : "Processing...")}
                  </Typography.Paragraph>
                </Space>
              )
            },
          })),
        ]}
      />
    </Space>
  )
}
