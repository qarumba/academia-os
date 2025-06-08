import React, { useEffect, useState } from "react"
import mermaid from "mermaid"
import { theme } from "antd"

const Mermaid = (props: { chart: any; onError?: (hasError: boolean) => void; id?: string }) => {
  const { useToken } = theme
  const { token } = useToken()
  const [hasError, setHasError] = useState(false)
  const [cleanedChart, setCleanedChart] = useState('')
  
  mermaid.initialize({
    startOnLoad: true,
    theme: "dark",
    securityLevel: "loose",
    fontFamily: "Fira Code",
  })

  useEffect(() => {
    const renderChart = async () => {
      try {
        // Reset error state
        setHasError(false)
        props?.onError?.(false)
        
        // Try to parse and render the chart
        if (props?.chart) {
          // Basic syntax cleanup for common issues
          let cleanChart = props.chart
            .trim()
            // Fix missing newlines after comments
            .replace(/(%%.*)([A-Z])/g, '$1\n  $2')
            // Remove invalid group syntax like (A & B & C & D)
            .replace(/\([A-Z\s&]+\)\s*-->/g, '')
            // Clean up extra whitespace
            .replace(/\n\s*\n/g, '\n')
          
          console.log(`🔍 Cleaned Mermaid chart (${props?.id}):`, cleanChart)
          setCleanedChart(cleanChart)
          
          // Validate syntax first
          await mermaid.parse(cleanChart)
          
          // Let Mermaid handle the rendering naturally
          setTimeout(() => {
            mermaid.contentLoaded()
          }, 100)
        }
      } catch (error) {
        console.warn(`🚫 Mermaid syntax error (${props?.id}):`, error)
        setHasError(true)
        props?.onError?.(true)
        // If parsing fails, still display the original chart
        setCleanedChart(props?.chart || '')
      }
    }
    
    renderChart()
  }, [props?.chart, props?.onError, props?.id])

  return (
    <div 
      key={`${props?.id || 'mermaid'}-${props?.chart?.substring(0, 50)}`} 
      className='mermaid'
      id={props?.id || `mermaid-${Math.random().toString(36).substr(2, 9)}`}
    >
      {cleanedChart || props?.chart}
    </div>
  )
}

export default Mermaid
