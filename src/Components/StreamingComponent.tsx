// StreamingComponent.js
import React, { useEffect, useState } from "react"
import { Button, Typography } from "antd"
import { QualitativeAnalysisService } from "../Services/QualitativeAnalysisService"

const { Paragraph } = Typography

const StreamingComponent = (props: { prompt: string }) => {
  const [output, setOutput] = useState("")
  const [requestStarted, setRequestStarted] = useState(false)
  const handleStream = async () => {
    setRequestStarted(true)
    setOutput("")
    await QualitativeAnalysisService.streamCompletion(props?.prompt, (token: string) => {
      setOutput((prevOutput) => prevOutput + token)
    })
  }

  //   useEffect(() => {
  //     if (!requestStarted) {
  //       setRequestStarted(true)

  //       handleStream()
  //     }
  //   }, [props?.prompt])

  return (
    <>
      <Paragraph>{output}</Paragraph>
      {!requestStarted && <Button onClick={handleStream}>Stream</Button>}
    </>
  )
}

export default StreamingComponent
