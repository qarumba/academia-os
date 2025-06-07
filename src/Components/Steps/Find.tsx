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
  message,
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
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<AcademicPaper[]>([])
  const [uploadTourOpen, setUploadTourOpen] = useState<boolean>(false)
  const [loadingStage, setLoadingStage] = useState<'searching' | 'processing' | 'ranking'>('searching')

  const refUpload = useRef(null)

  const search = async (query: string) => {
    setSearchQuery(query)
    setSearchLoading(true)
    setLoadingStage('searching')
    props?.onLoadingChange?.(true)
    
    let searchResults = [] as AcademicPaper[]
    try {
      // Stage 1: Searching Semantic Scholar
      setLoadingStage('searching')
      const searchResponse = await SearchRepository.searchPapers(query)
      searchResults = searchResponse ? (await searchResponse.nextPage()) || [] : []
      
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
    } catch (error) {
      console.error('Search failed:', error)
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
                maxWidth: "400px",
                textAlign: "center",
              }}>
              <Form
                autoComplete='off'
                onFinish={(values) => search(values?.query)}>
                <Form.Item name='query'>
                  <Input
                    autoComplete='off'
                    autoFocus
                    disabled={searchLoading}
                    size='large'
                    placeholder='Search for Papers'
                  />
                </Form.Item>
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
