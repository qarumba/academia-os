<p align="center">
  <img src="./src/favicon.png" alt="AcademiaOS logo" width="50"/>
</p>
<h1 align="center">AcademiaOS 2.0</h1>

Welcome to **AcademiaOS 2.0**, your solution for academic information retrieval and reasoning! We've built this modernised fork of AcademiaOS on Thomas Üllebecker's [AcademiaOS](https://github.com/thomasuebi/academia-os), a robust large language model platform equipped with a bouquet of features dedicated to providing unrivalled assistance for researchers.

**AcademiaOS 2.0** includes the ability to choose from Anthropic and OpenAI's foundation models for inference, as well as a number of UI improvements such as better transparency to user regarding processes as they are invoked, allowing researchers the opportunity to review and critique key steps in the process, helping to scaffold research integrity and observability into the AI-assisted research process. It also includes improved error handling, a shift from Helicone to LangFuse integration for observability of inference, including a sidebar to monitor cost and usage. There are other critical updates under the hood such as major upgrades to LangChain, OpenAI SDK, and addition of Anthropic SDK, as well as a critical PDF.js security upgrade.

For a deeper understanding of the underlying technology and concepts, you can refer to Thomas Üllebecker's ground-breaking paper: [AcademiaOS: Automating Grounded Theory Development in Qualitative Research with Large Language Models](https://arxiv.org/abs/2403.08844).

<p align="center">
    <img src="public\overview.gif"  alt="Demo" width="400"/>
</p>

Live-Demo of AcademiaOS 1.0: [academia-os.org](https://academia-os.org/)

Join Thomas Üllebecker's [Slack Community](https://join.slack.com/t/academiaos/shared_invite/zt-23730lsp0-Qlkv_0Bs3hgMY2FGTC~HnQ)!

## 🌟 Features 

* **Choose your AI Model**: From Anthropic or OpenAI by adding your API Keys (an OpenAI key is always required for embeddings)
* **Source Academic Literature**: Building on the SemanticScholar corpus and OpenAI embeddings, AcademiaOS finds and ranks relevant papers to your search queries.
* **Instantly Extract Key Data from Papers**: View the Title and Abstract of papers and add columns for Findings, Variables etc. with a click.
* **Upload PDFs**: If you have curated papers or other qualitative documents (such as interview transcripts) as PDFs, you can upload them for downstream tasks. Text-PDFs are handled in-browser while scanned PDFs are OCRd using Adobe PDF Extract API.
* **Information Extraction at Scale**: Structurally extract information (such as a paper's sentiment towards your thesis or information such as the count of study participants) from papers at scale.
* **Thematic Literature Analysis**: Navigate literature via Semantic Scholar with a clean and intuitive interface, and auto-code themes.
* **Coding of Qualitative Data**: Let AI preliminarily code your interviews, social media posts or other qualitative literature, and export as .csv for refinement in your CAQDAS software.
* **Proposed Theory Construction**: Output a proposed theoretical model from your qualitative data, as a Mermaid diagram, in just a few steps and apply your own human-in-the-loop critique to outputs.
* **Monitor Inference with Helicone**: Updated async integration with HeliconeAI's open-source LLM observability platform for developers to monitor, debug, and improve production-ready applications.

## 🔧 Getting Started 

Tech Stack:
- ReactJS
- AntDesign (Component Library)
- LangChainJS (Composability with Large Language Models)
- SemanticScholarJS (Interaction with Semantic Scholar)
- Anthropic and/or OpenAI (Extract theoretical propositions via NLP)

To get started with AcademiaOS, you require [Node.js](https://nodejs.org/en/download) installed in your machine.

1. Use `git clone` to clone this repository. 
2. Run `npm install`.

## 👨‍💻 Development Mode  

### Full Stack Development (Recommended)

**Quick Setup:**
```bash
npm run setup    # Install all dependencies (client + server)
npm run dev      # Start both React client and Helicone server
```

This starts:
- React client on [http://localhost:3000](http://localhost:3000)
- Helicone API server on [http://localhost:3001](http://localhost:3001)

### Individual Components

**Client Only:**
```bash
npm start        # React development server only
npm test         # Test runner in interactive watch mode
npm run build    # Production build
```

**Server Only (Helicone API Proxy):**
```bash
npm run server:install  # Install server dependencies
npm run server:dev      # Start server with auto-restart
npm run server          # Start server (production mode)
```

### Helicone Integration Requirements

⚠️ **Important**: The Helicone monitoring features require the server to be running due to CORS restrictions. The server proxies API requests to Helicone's endpoints.

- **Real-time cost tracking**: Requires server
- **API monitoring dashboard**: Requires server  
- **Connection testing**: Requires server

Without the server, Helicone configuration is still used for AI model requests but monitoring features are disabled.

## 🏭 Production Build 

### `npm run build`

Compiles the application for production into the `build` folder.\
Efficiently bundles React in the production mode and optimizes the build to deliver optimum performance.

The build is minified, and the filenames include the hashes.\
Your application is now ready for deployment!

Visit the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for an in-depth understanding.

## 💡 Contributing 

Thomas Üllebecker eagerly awaits your valuable contributions to the core AcademiaOS project, and we do too! Feel free to brainstorm ideas, recommend suggestions, or report bugs. You're always invited to open an issue or submit a pull request over at [AcademiaOS 1.0](https://github.com/thomasuebi/academia-os) or here on our fork!

## ⚖️ License 

This endeavor is under the aegis of an open-source License. Refer to the [LICENSE](./LICENSE) file for detailed information.

----------

Crafted with passion and commitment by Thomas Übellacker, A Helme and Claude 4 Sonnet❣️ 
Happy coding! ⌨️💡
