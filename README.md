# Agile PO & SOW Audit Agent

> **Still manually comparing vendor SOWs and technical specs? It might be time to automate that. 🚀**

A streamlined, modern, client-side web application designed for Product Owners (POs), contract auditors, and delivery leads to verify technical specifications against supplier SOW contracts & service level agreements (SLAs).

Deployed live at: [Vercel App Link](https://agile-po-agent-fo5iji8kp-wasiffrd-9040s-projects.vercel.app)

---

## 🌟 Key Features

*   **Active Document Bank**: Dynamic browser-memory document store where multiple technical specs, client SLAs, market intelligence files, or supplier agreements can be loaded and managed.
*   **Dual-Path Document Loaders**:
    1.  **PDF/TXT File Upload**: Drag-and-drop file zone that parses PDF documents locally in the browser.
    2.  **Copy-Paste Text Fallback**: A manual copy-paste text area ensuring document content can be added under any network conditions or file access limitations.
*   **Interactive Agent Chat**:
    *   **Simulation Mode (Default)**: Offline analysis using local keyword matching. Ready to test compliance queries regarding milestones, deliverables, payment terms, or SLAs.
    *   **Live Mode**: Enabled by entering a Google Gemini API Key. Sends multi-turn chat history and complete document context to Gemini for live, advanced PO reasoning.
*   **Quick Action Shortcuts**: Single-click actions to instantly run common PO audit tasks:
    *   📑 **Compile PRD**: Analyzes loaded documents to draft a unified Product Requirements Document.
    *   🔍 **SOW Audit**: Checks supplier agreements against technical specifications for gaps.
    *   💡 **Simplify Specs**: Simplifies complex technical documents into plain-English summaries.
    *   ⚡ **Audit SLAs**: Validates supplier SLAs against client obligations.
*   **Zero-Dependency Local Vercel Deployment**: A standalone PowerShell script (`deploy.ps1`) to push updates directly to Vercel via their REST API.

---

## 🛠️ Technology Stack

*   **HTML5**: Clean, semantic structure.
*   **CSS3**: High-end glassmorphism design system, tailored dark mode colors (HSL values), smooth transitions, custom scrollbars, and fully responsive layouts.
*   **JavaScript (ES6+)**: Pure vanilla JS for UI state management, Gemini API calling, and local simulation logic.
*   **PDF.js**: Client-side library to extract text from PDF files inside the browser.
*   **Google Gemini API**: Integration for deep generative AI document analysis.

---

## 🚀 How to Run Locally

Since this is a client-side application with zero external framework dependencies, you can run it instantly:

1.  Clone this repository or download the files.
2.  Open `index.html` directly in any web browser (Double-click or drag into your browser).
3.  *(Optional)* For the best experience (including file drops and custom local imports), serve it using a lightweight local server:
    ```bash
    # If you have Python installed:
    python -m http.server 8000
    
    # Or if you have Node/NPM:
    npx serve
    ```
4.  Navigate to `http://localhost:8000` (or the port specified by your local server).

---

## 🔑 Config Options

### Live Gemini Mode
To use advanced reasoning on your own documents:
1.  Obtain a free Gemini API key from [Google AI Studio](https://aistudio.google.com/).
2.  Paste it in the **Gemini LLM Integration** panel at the top of the app.
3.  Choose your model (e.g., `Gemini 2.5 Flash` or `Gemini 2.5 Pro` for complex reasoning).
4.  The indicator badge will switch from **Simulation Mode** to **Live Mode**.

---

## 🚢 Deploying to Vercel

If you want to deploy your own instance of this app to Vercel:
1.  Open PowerShell in the project directory.
2.  Run the deployment script:
    ```powershell
    .\deploy.ps1
    ```
3.  Follow the prompts to enter your Vercel Access Token (obtainable from your Vercel account settings).
