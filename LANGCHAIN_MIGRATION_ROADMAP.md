# LANGCHAIN MIGRATION ROADMAP
## From v0.0.190 to v0.3.27

**Created**: June 8, 2025  
**Migration Target**: LangChain v0.3.27  
**Estimated Time**: 16-24 hours across 3 phases  

## Import Mapping Guide

### Chat Models
```typescript
// OLD (v0.0.190)
import { ChatOpenAI } from "langchain/chat_models/openai"

// NEW (v0.3.27)
import { ChatOpenAI } from "@langchain/openai"
```

### Message Schema
```typescript
// OLD (v0.0.190)
import { HumanMessage, SystemMessage } from "langchain/schema"

// NEW (v0.3.27)
import { HumanMessage, SystemMessage } from "@langchain/core/messages"
```

### Embeddings
```typescript
// OLD (v0.0.190)
import { OpenAIEmbeddings } from "langchain/embeddings/openai"

// NEW (v0.3.27)
import { OpenAIEmbeddings } from "@langchain/openai"
```

### Text Processing
```typescript
// OLD (v0.0.190)
import { CharacterTextSplitter } from "langchain/text_splitter"
import { Document } from "langchain/document"

// NEW (v0.3.27)
import { CharacterTextSplitter } from "@langchain/textsplitters"
import { Document } from "@langchain/core/documents"
```

### Vector Stores
```typescript
// OLD (v0.0.190)
import { MemoryVectorStore } from "langchain/vectorstores/memory"

// NEW (v0.3.27)
import { MemoryVectorStore } from "langchain/vectorstores/memory"
// Note: May still be in main package or move to @langchain/community
```

## Migration Phases

### Phase 1: Dependency Management (2-4 hours)

#### 1.1 Remove Legacy Dependencies
```bash
npm uninstall langchain
```

#### 1.2 Install New Dependencies
```bash
npm install @langchain/core @langchain/openai @langchain/anthropic @langchain/community @langchain/textsplitters
```

#### 1.3 Update package.json
```json
{
  "dependencies": {
    "@langchain/core": "^0.3.0",
    "@langchain/openai": "^0.5.12", 
    "@langchain/anthropic": "^0.3.21",
    "@langchain/community": "^0.3.0",
    "@langchain/textsplitters": "^0.3.0"
  },
  "overrides": {
    "@langchain/core": "^0.3.0"
  }
}
```

#### 1.4 Verify Dependency Resolution
```bash
npm ls @langchain/core
# Should show single version across all packages
```

### Phase 2: Import Migration (6-8 hours)

#### 2.1 Service Layer Migration

**File**: `src/Services/ChatService.ts`
- Update ChatOpenAI import
- Update message schema imports
- Update embeddings import
- Test model creation and chat functionality

**File**: `src/Services/EmbeddingService.ts`  
- Update OpenAIEmbeddings import
- Test embedding generation

**File**: `src/Services/RankingService.ts`
- Update Document and CharacterTextSplitter imports
- Update MemoryVectorStore import
- Test vector similarity search

**File**: `src/Services/OpenAIService.ts`
- Update all LangChain imports
- Update streaming callback syntax (if changed)
- Test complete Gioia methodology workflow

#### 2.2 Component Layer Migration

**File**: `src/Components/Steps/Coding.tsx`
- Update dynamic require() statements to new import paths
- Test qualitative coding workflow

**File**: `src/Components/Steps/Modeling.tsx`  
- Update dynamic require() statements
- Test theory construction and visualization

#### 2.3 Import Pattern Updates

**Static Imports**: Update all `import` statements
**Dynamic Requires**: Update all `require()` calls to new paths

### Phase 3: API Compatibility & Testing (8-12 hours)

#### 3.1 Callback System Updates
- **Issue**: Callbacks now non-blocking by default
- **Action**: Update streaming implementations
- **Test**: Verify real-time token streaming still works

```typescript
// May need to add explicit callback handling
await chat.call([new HumanMessage(prompt)], {
  callbacks: [/* callback config */]
})
```

#### 3.2 Vector Store Compatibility
- **Test**: MemoryVectorStore creation and similarity search
- **Verify**: Document chunking and embedding workflow
- **Check**: Performance characteristics unchanged

#### 3.3 Helicone Integration
- **Verify**: Headers and configuration still work
- **Test**: Cost tracking for both OpenAI and Anthropic
- **Check**: Proxy endpoints remain functional

#### 3.4 Configuration Validation
- **Test**: Model switching (OpenAI ↔ Anthropic)
- **Verify**: API key management  
- **Check**: localStorage persistence

## Service-by-Service Migration Plan

### Priority 1: Core Services
1. **ChatService** - Multi-provider chat model management
2. **EmbeddingService** - Vector embeddings functionality  
3. **OpenAIService** - Complete Gioia methodology

### Priority 2: Supporting Services
4. **RankingService** - Paper relevance scoring
5. **LangChainService** - Framework integration (currently simplified)

### Priority 3: Component Integration
6. **Coding.tsx** - Qualitative analysis interface
7. **Modeling.tsx** - Theory construction interface

## Risk Mitigation Strategies

### High-Risk Areas
1. **Streaming Callbacks**: Have fallback to synchronous calls if streaming breaks
2. **Vector Stores**: Keep MemoryVectorStore logic as fallback
3. **Import Paths**: Use try/catch for require() statements during transition

### Testing Strategy
1. **Unit Tests**: Test each service method independently
2. **Integration Tests**: Full Gioia workflow end-to-end
3. **Performance Tests**: Ensure no significant slowdowns
4. **Regression Tests**: All current functionality working

### Rollback Plan
- **Immediate**: `git checkout langchain-migration-backup`
- **Dependencies**: `npm install` (will restore package-lock.json)
- **Verification**: Run existing tests to confirm rollback success

## Dependencies Coordination

### Package Version Matrix
| Package | Current | Target | Peer Dependency |
|---------|---------|--------|----------------|
| langchain | 0.0.190 | REMOVE | - |
| @langchain/core | - | ^0.3.0 | Required by all |
| @langchain/openai | - | ^0.5.12 | @langchain/core ^0.3.0 |
| @langchain/anthropic | 0.3.21 | ^0.3.21 | @langchain/core ^0.3.0 |
| @langchain/community | - | ^0.3.0 | @langchain/core ^0.3.0 |

### Version Conflict Resolution
```json
{
  "overrides": {
    "@langchain/core": "^0.3.0"
  },
  "resolutions": {
    "@langchain/core": "^0.3.0"  
  }
}
```

## Quality Assurance Checklist

### Phase 1 Completion
- [ ] All new dependencies installed
- [ ] Single @langchain/core version resolved
- [ ] No dependency conflicts in npm ls
- [ ] Build succeeds with new packages

### Phase 2 Completion  
- [ ] All import statements updated
- [ ] All require() calls updated
- [ ] No compilation errors
- [ ] TypeScript types resolve correctly

### Phase 3 Completion
- [ ] Multi-provider chat models working
- [ ] Embedding generation functional
- [ ] Vector similarity search working
- [ ] Complete Gioia workflow functional
- [ ] Streaming responses working
- [ ] Helicone integration working
- [ ] Error handling preserved
- [ ] Performance within acceptable range

## Success Criteria

### Functional Requirements
1. All current features working with v0.3 packages
2. No regression in analysis quality or accuracy  
3. Helicone monitoring continues to function
4. Performance impact < 20% slowdown
5. Error handling maintains user experience

### Technical Requirements
1. Clean dependency tree with single @langchain/core version
2. TypeScript compilation without errors
3. All import paths follow v0.3 conventions
4. Code maintainability preserved or improved

### Future Compatibility
1. Easy integration of new LangChain features
2. Support for LangGraph workflows (future enhancement)
3. Compatibility with upcoming security updates
4. Reduced technical debt from legacy imports

Last Updated: June 8, 2025