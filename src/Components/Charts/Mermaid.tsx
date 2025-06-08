import React, { useEffect, useState, useRef } from "react"
import mermaid from "mermaid"
import { theme } from "antd"

const Mermaid = (props: { chart: any; onError?: (hasError: boolean) => void; id?: string }) => {
  const { useToken } = theme
  const { token } = useToken()
  const [hasError, setHasError] = useState(false)
  const [svgContent, setSvgContent] = useState('')
  const [isRendering, setIsRendering] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const chartIdRef = useRef<string>()
  
  // Generate stable chart ID only once
  if (!chartIdRef.current) {
    chartIdRef.current = `${props?.id || 'mermaid'}-${Math.random().toString(36).substr(2, 9)}`
  }
  
  // Initialize Mermaid once
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false, // We'll handle rendering manually
      theme: "dark",
      securityLevel: "loose",
      fontFamily: "Fira Code",
    })
  }, [])

  useEffect(() => {
    const renderChart = async () => {
      if (!props?.chart) return
      
      setIsRendering(true)
      
      try {
        // Reset error state
        setHasError(false)
        props?.onError?.(false)
        
        // Basic syntax cleanup for common issues
        let cleanChart = props.chart
          .trim()
          // Fix missing newlines after comments
          .replace(/(%%.*)([A-Z])/g, '$1\n  $2')
          // Remove invalid group syntax like (A & B & C & D)
          .replace(/\([A-Z\s&]+\)\s*-->/g, '')
          // Clean up extra whitespace
          .replace(/\n\s*\n/g, '\n')
        
        console.log(`🔍 Rendering Mermaid chart (${props?.id}):`, cleanChart)
        
        // Use Mermaid's render API directly
        const { svg } = await mermaid.render(chartIdRef.current!, cleanChart)
        setSvgContent(svg)
        
      } catch (error) {
        console.warn(`🚫 Mermaid syntax error (${props?.id}):`, error)
        setHasError(true)
        props?.onError?.(true)
        // Don't clear svgContent on error - keep previous content
      } finally {
        setIsRendering(false)
      }
    }
    
    renderChart()
  }, [props?.chart, props?.onError, props?.id])

  return (
    <div ref={containerRef} className='mermaid' style={{ 
      backgroundColor: '#f8f9fa',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #e9ecef'
    }}>
      {svgContent ? (
        <div 
          dangerouslySetInnerHTML={{ __html: svgContent }}
          style={{ opacity: isRendering ? 0.7 : 1, transition: 'opacity 0.2s ease' }}
        />
      ) : (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          color: '#666',
          fontStyle: 'italic'
        }}>
          {isRendering ? 'Rendering diagram...' : 'No diagram available'}
        </div>
      )}
    </div>
  )
}

export default Mermaid
