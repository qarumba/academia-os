# UserWorkflow & AI Model Usage Report

## Executive Summary

Academia OS implements a 5-step AI-powered qualitative research workflow using the Gioia methodology. The application employs a hybrid AI model architecture where users can choose between Anthropic Claude or OpenAI GPT for chat/reasoning tasks, while OpenAI embeddings are required for all vector-based operations regardless of the primary model choice.

## Workflow Overview

The Academia OS workflow guides researchers through systematic academic paper analysis with AI assistance at key steps. The workflow is tab-based, allowing researchers to manage multiple research projects simultaneously.

## AI Model Usage by Workflow Step

| Workflow Step | AI Model Used | Purpose | Implementation Details |
|---------------|---------------|---------|----------------------|
| **Step 1 [Find]** | None | PDF upload OR search via Semantic Scholar API | No AI model calls - pure API integration |
| **Step 2 [Explore]** | None | Display paper metadata (title, URL, abstract) | No AI model calls - data presentation |
| **Step 3 [Evaluate]** | **Chat Model** + **OpenAI Embeddings** | Generate custom column content (Keywords, Research Questions) + paper similarity ranking | `LangChainService` + `EmbeddingService` + `RankingService` |
| **Step 4 [Coding]** | **Chat Model** + **OpenAI Embeddings** | Initial Codes → 2nd Order Coding → Aggregate Dimensions → Mermaid diagram generation | `LangChainService` + `EmbeddingService` |
| **Step 5 [Modeling]** | **Chat Model** + **OpenAI Embeddings** | Theory table generation → Interrelationships analysis → Theoretical model visualization | `LangChainService` + `EmbeddingService` |

## Detailed Step Analysis

### Step 1: Find
- **User Action**: Upload PDFs OR enter search terms and press enter
- **System Response**: Loading animation with scaffolding during search
- **AI Usage**: None - utilizes Semantic Scholar API for academic paper discovery
- **Output**: Collection of academic papers ready for analysis

### Step 2: Explore  
- **User Action**: Review loaded content
- **System Response**: Papers displayed with title, URL, and abstract
- **AI Usage**: None - pure data presentation layer
- **Output**: Researcher gains overview of available papers

### Step 3: Evaluate
- **User Action**: Add custom columns (e.g., "Keywords", "Research Questions") by clicking empty text field and pressing enter
- **System Response**: AI immediately generates content for these columns based on paper analysis
- **AI Usage**: 
  - **Chat Model**: Analyzes papers and generates column content
  - **OpenAI Embeddings**: Powers similarity ranking and relevance scoring
- **Implementation**: `EmbeddingService.ts`, `RankingService.ts`, `LangChainService.ts`
- **Output**: Enriched paper table with AI-generated metadata

### Step 4: Coding (Gioia Methodology Implementation)
- **User Action**: Add/choose research question from suggestion list, click "Start Coding"
- **System Response**: Sequential AI-powered coding process
- **AI Usage**:
  - **Chat Model**: Generates Initial Codes, performs 2nd Order Coding, creates Aggregate Dimensions
  - **OpenAI Embeddings**: Enables similarity analysis between codes and dimensions
- **Process Flow**:
  1. Initial Codes generated from abstracts (immediate)
  2. 2nd Order Coding begins automatically
  3. Aggregate Dimensions generated automatically  
  4. Mermaid.js diagram visualization appears
- **Output**: Systematic qualitative coding with visual dimension mapping

### Step 5: Modeling (Theory Development)
- **User Action**: Enter research question or remarks, click "Start Modeling"
- **System Response**: Theory development with visualization
- **AI Usage**:
  - **Chat Model**: Generates theory table (Theory, Description, Related Dimensions, Research Questions)
  - **OpenAI Embeddings**: Finds interrelationships between theoretical concepts
- **Process Flow**:
  1. Theory table generation (immediate)
  2. Interrelationships analysis (hidden from user)
  3. Theoretical model visualization via Mermaid.js
- **Gap Identified**: Missing human-in-the-loop critique functionality for theoretical model refinement

## AI Model Architecture

### Hybrid Model Strategy
- **Primary Chat Model**: User choice between Anthropic Claude or OpenAI GPT
- **Embeddings**: Always OpenAI (Anthropic doesn't provide embeddings API)
- **Configuration**: Managed through `ModelConfiguration.tsx` with clear guidance

### Model Configuration Requirements

#### When Using OpenAI:
- Single API key handles both chat and embeddings
- Streamlined configuration process

#### When Using Anthropic:
- **Anthropic API Key**: Required for chat/reasoning tasks
- **OpenAI API Key**: Required for embeddings (separate field)
- **User Guidance**: Clear messaging explains why both keys are needed

### Technical Implementation

#### EmbeddingService.ts Architecture
```typescript
// Anthropic provider with OpenAI embeddings
if (config.provider === 'anthropic') {
  const openAIKey = config.openaiEmbeddingsKey || localStorage.getItem("openAIKey");
  if (!openAIKey) {
    throw new Error('OpenAI API key required for embeddings when using Anthropic models');
  }
  return new OpenAIEmbeddings({ openAIApiKey: openAIKey });
}
```

#### Error Handling
- Clear error messages explain embeddings requirements
- Graceful fallback to legacy configuration if needed
- Validation prevents provider/key mismatches

## Service Layer Integration

### LangChainService.ts
- Singleton pattern manages model interactions
- Handles both Anthropic and OpenAI chat models
- Currently contains placeholder methods for future LangChain integration

### EmbeddingService.ts  
- Dedicated service for vector operations
- Abstracts embedding complexity from workflow components
- Consistent OpenAI embeddings regardless of chat model choice

### SearchService.ts & RankingService.ts
- Leverage embeddings for semantic paper search
- Enable relevance scoring and similarity ranking
- Critical for Steps 3-5 functionality

## User Experience Considerations

### Configuration Transparency
- Advanced options clearly explain embeddings requirement
- Status indicators show configuration completeness
- Helpful error messages guide users to solutions

### Workflow Continuity
- Seamless experience regardless of model choice
- No workflow interruptions due to model switching
- Consistent performance across all AI-powered steps

## Technical Gaps & Recommendations

### Current Limitations
1. **Step 5 Missing Feature**: No human-in-the-loop critique for theoretical models
2. **LangChain Integration**: Service contains placeholder methods awaiting full implementation
3. **Model Switching**: No runtime model switching without reconfiguration

### Recommended Enhancements
1. Implement theoretical model critique interface in Step 5
2. Complete LangChain integration for enhanced prompt engineering
3. Add model performance analytics and usage tracking
4. Consider supporting additional embedding providers when available

## Conclusion

Academia OS successfully implements a sophisticated hybrid AI architecture that maximizes researcher choice while maintaining technical functionality. The clear separation between chat and embedding responsibilities allows the application to leverage the strengths of different AI providers while providing a consistent user experience throughout the qualitative research workflow.

The 5-step workflow effectively guides researchers through systematic academic analysis, with AI assistance strategically deployed at points where automation adds the most value while preserving human oversight and academic rigor.