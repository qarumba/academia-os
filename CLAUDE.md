# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm start` - Start development server on http://localhost:3000
- `npm test` - Run tests in interactive watch mode  
- `npm run build` - Build production bundle
- `npm install` - Install dependencies

## Architecture Overview

AcademiaOS is a React/TypeScript application for academic research automation and qualitative analysis. The app uses AI models (OpenAI/Anthropic) via LangChain for academic paper analysis, literature reviews, and theory development.

### Core Architecture Patterns

**Model Configuration System**: The app requires AI model setup before use. `ModelConfigurationGuard` wraps the main app and redirects to `ModelConfiguration` component if no model is configured. Configuration is stored in Redux (`modelSlice`) and localStorage.

**Redux State Management**: Two main slices:
- `tabs` - Tab-based navigation state
- `model` - AI model configuration (provider, model, apiKey)

**Service Layer Pattern**: Centralized services handle specific domains:
- `LangChainService` - Singleton managing AI model interactions and chains
- `PDFService` - PDF processing and text extraction
- `SearchService` - Academic paper search via Semantic Scholar
- `RankingService` - Paper relevance ranking

**Workflow-Based UI**: Main interface organized around research workflows:
- Literature search and upload (`Find.tsx`)
- Qualitative coding (`Coding.tsx`) 
- Theory modeling (`Modeling.tsx`)

### Key Integrations

- **LangChain**: Manages AI model interactions across providers
- **Semantic Scholar API**: Academic paper search and metadata
- **Ant Design**: UI component library with theme support
- **PDF.js**: Client-side PDF text extraction
- **Mermaid**: Diagram generation for theory models

### File Organization

- `Components/` - React components organized by feature
- `Services/` - Business logic and external API integrations  
- `Redux/` - State management (store, reducers, actions)
- `Types/` - TypeScript type definitions
- `Helpers/` - Utility functions

The app supports both light/dark themes via `ThemeContext` and is designed for academic researchers doing qualitative analysis and literature reviews.