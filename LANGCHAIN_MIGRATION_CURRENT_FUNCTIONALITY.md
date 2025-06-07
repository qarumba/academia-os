# LANGCHAIN MIGRATION - CURRENT FUNCTIONALITY DOCUMENTATION

## Current Working State (v0.0.190)

**Created**: June 8, 2025  
**Purpose**: Document current working functionality before LangChain v0.3 migration  
**Backup Branch**: `langchain-migration-backup`  

## Current LangChain Version
- `langchain: ^0.0.190` (March 2023)
- `@langchain/anthropic: ^0.3.21` (version conflict)

## Working Features

### 1. Multi-Provider AI Chat Models
**Location**: `src/Services/ChatService.ts`  
**Status**: ✅ Working  
**Features**:
- OpenAI GPT-3.5/GPT-4 models
- Anthropic Claude with graceful fallback
- Helicone integration for both providers
- Model configuration validation

**Key Methods**:
- `createChatModel(options)` - Creates configured chat model
- `simpleChat(system, user, options)` - Basic chat interaction
- `getEmbeddings()` - OpenAI embeddings access

### 2. Embeddings & Vector Search
**Location**: `src/Services/EmbeddingService.ts`, `src/Services/RankingService.ts`  
**Status**: ✅ Working  
**Features**:
- OpenAI embeddings for similarity search
- MemoryVectorStore for semantic search
- Paper relevance ranking by vector similarity
- Document chunking with overlap

**Key Functionality**:
- Academic paper ranking by query relevance
- Vector similarity search for evidence gathering
- Text chunking for large documents

### 3. Gioia Methodology Implementation
**Location**: `src/Services/OpenAIService.ts`  
**Status**: ✅ Working  
**Features**:
- Complete qualitative analysis workflow
- First-order coding with document chunking
- Second-order coding (theme aggregation)
- Aggregate dimensions identification
- Theory construction and critique
- Mermaid diagram generation

**Key Methods**:
- `initialCodingOfPaper(paper, remarks)` - First-order coding
- `secondOrderCoding(codes)` - Theme aggregation
- `aggregateDimensions(secondOrderCodes)` - Theoretical dimensions
- `modelConstruction(modelData, remarks)` - Theory building
- `modelVisualization(modelData)` - Mermaid charts

### 4. Streaming AI Responses
**Location**: `src/Services/OpenAIService.ts:44`  
**Status**: ✅ Working  
**Features**:
- Real-time token streaming for long operations
- Progress feedback during analysis
- Callback-based streaming implementation

### 5. Component Integration
**Location**: `src/Components/Steps/Coding.tsx`, `src/Components/Steps/Modeling.tsx`  
**Status**: ✅ Working  
**Features**:
- React component integration with LangChain services
- Progress tracking through qualitative analysis steps
- Error handling and loading states

## Current Import Patterns

### Direct Imports (Need Migration)
```typescript
// Chat Models
import { ChatOpenAI } from "langchain/chat_models/openai"

// Message Schema  
import { HumanMessage, SystemMessage } from "langchain/schema"

// Embeddings
import { OpenAIEmbeddings } from "langchain/embeddings/openai"

// Text Processing
import { CharacterTextSplitter } from "langchain/text_splitter"
import { Document } from "langchain/document"

// Vector Stores
import { MemoryVectorStore } from "langchain/vectorstores/memory"
```

### Require Patterns (Runtime Loading)
```typescript
// Used in components for dynamic loading
const { CharacterTextSplitter } = require("langchain/text_splitter")
const { MemoryVectorStore } = require("langchain/vectorstores/memory")
const { OpenAIEmbeddings } = require("langchain/embeddings/openai")
```

## Critical Dependencies

### Working Integrations
- **Helicone Monitoring**: Tracks costs and usage for both OpenAI and Anthropic
- **Semantic Scholar API**: Academic paper search functionality
- **PDF Processing**: Text extraction from uploaded papers
- **Mermaid Visualization**: Theory model diagrams

### Configuration System
- Model provider selection (OpenAI/Anthropic)
- API key management (primary + embeddings fallback)
- Helicone endpoint configuration
- Redis state management

## Performance Characteristics

### Document Processing
- **Chunk Size**: 10,000 characters for initial coding
- **Overlap**: 50 characters
- **Vector Search**: Top 4 results for evidence gathering
- **Embedding Model**: OpenAI text-embedding-ada-002

### Streaming Configuration
- **Max Tokens**: 800-3000 depending on operation
- **Temperature**: Default (not explicitly set)
- **Callback System**: Non-blocking token streaming

## Error Handling Patterns
- Graceful fallback from Anthropic to OpenAI
- JSON parsing with error recovery
- Network error handling for external APIs
- User-friendly error messages

## Regression Testing Checklist

### Core Functionality Tests
- [ ] Multi-provider model switching
- [ ] Helicone cost tracking
- [ ] Academic paper search and ranking
- [ ] Complete Gioia methodology workflow
- [ ] First-order coding with chunking
- [ ] Second-order coding aggregation
- [ ] Theory construction and visualization
- [ ] Streaming responses with progress feedback
- [ ] Vector similarity search
- [ ] Error handling and fallbacks

### Integration Tests
- [ ] OpenAI + Helicone integration
- [ ] Anthropic + OpenAI embeddings hybrid
- [ ] PDF upload and processing
- [ ] Mermaid diagram generation
- [ ] Component state management
- [ ] Configuration persistence

## Migration Risk Areas

### High Risk
1. **Callback System**: Streaming implementation may break
2. **Import Paths**: All langchain/* imports need restructuring
3. **Vector Stores**: MemoryVectorStore API changes
4. **Message Schema**: HumanMessage/SystemMessage structure

### Medium Risk  
1. **Peer Dependencies**: @langchain/core version conflicts
2. **TypeScript Types**: Breaking changes in type definitions
3. **Configuration**: Model configuration patterns

### Low Risk
1. **Business Logic**: Gioia methodology implementation
2. **React Components**: UI layer should be unaffected
3. **External APIs**: Helicone, Semantic Scholar integrations

## Migration Strategy

### Phase 1: Dependency Updates
1. Install @langchain/core as peer dependency
2. Update to @langchain/openai and @langchain/anthropic
3. Configure package.json overrides

### Phase 2: Import Migration
1. Update all import paths to @langchain/* patterns  
2. Test each service independently
3. Update require() statements to new paths

### Phase 3: API Updates
1. Update callback system for non-blocking behavior
2. Verify vector store compatibility
3. Test streaming implementations
4. Validate Helicone integration

## Backup & Recovery
- **Full backup**: `langchain-migration-backup` branch
- **Rollback command**: `git checkout langchain-migration-backup`
- **Core Documentation**: All 5 files preserved in backup
- **Configuration**: Model configs documented in backup commit

Last Updated: June 8, 2025