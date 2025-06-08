import {
  Button,
  Col,
  Form,
  Input,
  Popover,
  Row,
  Space,
  Tag,
  Tour,
  Typography,
  App,
  Select,
  InputNumber,
} from "antd"
import { CheckCard } from "@ant-design/pro-components"
import React, { useEffect, useRef, useState } from "react"
import logo from "../../favicon.png"
import { PDFUpload } from "../PDFUpload"
import { AcademicPaper } from "../../Types/AcademicPaper"
import { SearchRepository } from "../../Services/SearchService"
import { GioiaCoding } from "../Charts/GioiaCoding"
import SearchLoadingState from "../SearchLoadingState"

const StepFind = (props: {
  onFinish: (payload: {
    searchQuery: string
    searchResults: AcademicPaper[]
  }) => void
  onLoadingChange?: (loading: boolean) => void
}) => {
  const { message } = App.useApp();
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<AcademicPaper[]>([])
  const [uploadTourOpen, setUploadTourOpen] = useState<boolean>(false)
  const [loadingStage, setLoadingStage] = useState<'searching' | 'processing' | 'ranking'>('searching')
  const [paperLimit, setPaperLimit] = useState<number>(() => {
    // Load saved paper limit from localStorage, default to 20 for cost efficiency
    const saved = localStorage.getItem('academiaos_paper_limit')
    if (saved) {
      const parsed = parseInt(saved)
      // Validate range: 1-100
      if (parsed >= 1 && parsed <= 100) {
        return parsed
      }
    }
    return 20 // Default fallback
  })
  const [inputValue, setInputValue] = useState<string>('')

  const refUpload = useRef(null)

  // Save paper limit preference to localStorage
  useEffect(() => {
    localStorage.setItem('academiaos_paper_limit', paperLimit.toString())
    console.log(`💾 Paper limit preference saved: ${paperLimit} papers`)
  }, [paperLimit])

  // Calculate dynamic width for search input based on content
  const calculateInputWidth = (text: string) => {
    const minWidth = 300 // Minimum width in pixels
    const maxWidth = 600 // Maximum width in pixels
    const charWidth = 8 // Approximate width per character in pixels
    const padding = 40 // Padding for input borders and spacing
    
    const calculatedWidth = Math.max(minWidth, Math.min(maxWidth, text.length * charWidth + padding))
    return calculatedWidth
  }

  const search = async (query: string) => {
    setSearchQuery(query)
    setSearchLoading(true)
    setLoadingStage('searching')
    props?.onLoadingChange?.(true)
    
    let searchResults = [] as AcademicPaper[]
    try {
      // Stage 1: Searching Semantic Scholar
      setLoadingStage('searching')
      console.log(`🔍 Find: Searching for ${paperLimit} papers with query: "${query}"`)
      const searchResponse = await SearchRepository.searchPapers(query, paperLimit)
      searchResults = searchResponse?.data || []
      
      // Stage 2: Processing results
      if (searchResults?.length > 0) {
        setLoadingStage('processing')
        // Add a small delay to show the processing stage
        await new Promise(resolve => setTimeout(resolve, 800))
        
        searchResults = searchResults?.map(
          (paper) =>
            ({
              fullText: paper?.fullText || paper?.abstract,
              id: paper?.corpusId,
              title: paper?.title,
              abstract: paper?.abstract,
              authors: paper?.authors,
              citationCount: paper?.citationCount,
              citations: paper?.citations,
              corpusId: paper?.corpusId,
              embedding: paper?.embedding,
              externalIds: paper?.externalIds,
              fieldsOfStudy: paper?.fieldsOfStudy,
              influentialCitationCount: paper?.influentialCitationCount,
              isOpenAccess: paper?.isOpenAccess,
              journal: paper?.journal,
              openAccessPdf: paper?.openAccessPdf,
              paperId: paper?.paperId,
              publicationDate: paper?.publicationDate,
              publicationTypes: paper?.publicationTypes,
              publicationVenue: paper?.publicationVenue,
              referenceCount: paper?.referenceCount,
              references: paper?.references,
              s2FieldsOfStudy: paper?.s2FieldsOfStudy,
              tldr: paper?.tldr,
              url: paper?.url,
              venue: paper?.venue,
              year: paper?.year,
            } as AcademicPaper)
        )
      }
    } catch (error: any) {
      console.error('Search failed:', error)
      message.error(error?.message || 'Search failed due to an unknown error')
      searchResults = []
    }
    
    if (!searchResults?.length) {
      // TODO: Use GPT to create a better search query instead
    }
    
    setResults(searchResults)
    setSearchLoading(false)
    props?.onLoadingChange?.(false)
    
    if (searchResults.length > 0) {
      props?.onFinish?.({ searchQuery: query, searchResults })
    } else {
      message.info("No results found. Try a different search query.")
    }
  }

  // Show loading state when searching
  if (searchLoading) {
    return <SearchLoadingState searchQuery={searchQuery} stage={loadingStage} />;
  }

  return (
    <>
      <div
        style={{
          width: "100%",
          textAlign: "center",
          padding: "40px 20px",
        }}>
        <img
          alt='AcademiaOS'
          src={logo}
          style={{
            width: "30px",
            height: "30px",
            marginBottom: "-30px",
            marginTop: "-30px",
          }}
        />
        <Typography.Title>AcademiaOS</Typography.Title>
        <Typography.Text 
          type="secondary" 
          style={{ 
            display: "block", 
            marginTop: "-10px", 
            marginBottom: "10px",
            fontSize: "14px"
          }}
        >
          AI Powered Grounded Theory Development with Human-in-the-Loop Processing
        </Typography.Text>
        <p style={{ marginTop: "0px", marginBottom: "20px" }}>
          <Tag>Open Source</Tag> <Tag>Powered by Foundation Models</Tag>
        </p>
      </div>
      <Row>
        <Col span={24}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
            <div
              style={{
                width: "100%",
                maxWidth: "700px",
                textAlign: "center",
                margin: "0 auto",
              }}>
              <Form
                autoComplete='off'
                onFinish={(values) => search(values?.query || inputValue)}>
                <Space style={{ width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '10px' }}>
                  <div style={{ position: 'relative' }}>
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      autoComplete='off'
                      autoFocus
                      disabled={searchLoading}
                      size='large'
                      placeholder='Search for Papers'
                      style={{ 
                        width: calculateInputWidth(inputValue || 'Search for Papers'),
                        transition: 'width 0.3s ease',
                        textAlign: 'left',
                        backgroundColor: '#f5f5f5'
                      }}
                      onPressEnter={() => search(inputValue)}
                    />
                  </div>
                  <InputNumber
                    value={paperLimit}
                    onChange={(value) => setPaperLimit(value || 20)}
                    disabled={searchLoading}
                    size='large'
                    min={1}
                    max={100}
                    style={{ width: 140, backgroundColor: '#f5f5f5' }}
                    placeholder="#"
                    addonAfter="papers"
                  />
                  <Button
                    type="primary"
                    size="large"
                    htmlType="submit"
                    disabled={searchLoading}
                    loading={searchLoading}
                  >
                    Search
                  </Button>
                </Space>
              </Form>
              <Space ref={refUpload}>
                <PDFUpload
                  onAllUploadsFinished={(completedUploads) => {
                    setSearchLoading(true)
                    const searchResults = completedUploads.map(
                      (upload) =>
                        ({
                          title: upload?.title,
                          fullText: upload?.text,
                          id: `PDF-ID-${upload?.title}`,
                        } as AcademicPaper)
                    )
                    setResults(searchResults)
                    setSearchLoading(false)
                    props?.onFinish({ searchQuery, searchResults })
                  }}
                />
                {/* <Button type='link' icon={<CloudUploadOutlined />}>
                      Upload PDFs
                    </Button>
                    <Button type='link' icon={<BookOutlined />}>
                      From Library
                    </Button> */}
              </Space>
            </div>
          </div>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: "50px" }}>
        <Col xs={24} sm={24} md={12} lg={8}>
          <CheckCard
            style={{ width: "100%" }}
            checked={false}
            onClick={() => search("Influence of AI on Society")}
            title={"Influence of AI on Society"}
            description={"Search academic papers"}
          />
        </Col>
        <Col xs={24} sm={24} md={12} lg={8}>
          <CheckCard
            style={{ width: "100%" }}
            checked={false}
            onClick={() => setUploadTourOpen(true)}
            title={"Explore Transcripts"}
            description={"Upload your own interview transcripts"}
          />
        </Col>
        <Col xs={24} sm={24} md={12} lg={8}>
          <CheckCard
            style={{ width: "100%" }}
            checked={false}
            onClick={() => search("Health Effects Cocoa")}
            title={"Health Effects Cocoa"}
            description={"Search academic papers"}
          />
        </Col>
        <Col xs={24} sm={24} md={12} lg={8}>
          <CheckCard
            style={{ width: "100%" }}
            checked={false}
            onClick={() => setUploadTourOpen(true)}
            title={"Analyze PDFs"}
            description={"Upload your own PDFs"}
          />
        </Col>
        <Col xs={24} sm={24} md={12} lg={8}>
          <CheckCard
            style={{ width: "100%" }}
            checked={false}
            onClick={() => search("AI Ethics")}
            title={"Develop Model on AI Ethics"}
            description={"Search academic papers"}
          />
        </Col>
        <Col xs={24} sm={24} md={12} lg={8}>
          <CheckCard
            style={{ width: "100%" }}
            checked={false}
            onClick={() => search("Management of Small Teams")}
            title={"Management of Small Teams"}
            description={"Search academic papers"}
          />
        </Col>
      </Row>
      <p>
        <a
          href='https://arxiv.org/abs/2403.08844'
          target='_blank'
          rel='noopener noreferrer'>
          Read Thomas Üllebecker's paper
        </a>
      </p>
      <p>
        To cite AcademiaOS, please use the following format: <br />
        <code>
          Übellacker Thomas. (2023). AcademiaOS: Automating Grounded Theory
          Development in Qualitative Research with Large Language Models.
          https://arxiv.org/abs/2403.08844
        </code>
      </p>
      {/* Tour Guide */}
      <Tour
        open={uploadTourOpen}
        onClose={() => setUploadTourOpen(false)}
        steps={[
          {
            title: "Upload File",
            description: "Here you can upload your PDFs, transcripts, etc.",
            target: () => refUpload.current,
          },
        ]}
      />
    </>
  )
}

export default StepFind
