// Sample Document Template Data
const SAMPLE_DOCS = {
  spec: {
    title: "collab_sync_specification_v2.pdf",
    meta: "Sample Spec • Size: 24 KB",
    content: "PRODUCT SPECIFICATION: DOCUMENT COLLABORATION MODULE V2.1\n\n1. Technical Overview:\nOur document editing platform utilizes a section-based locking synchronizer. When user A begins typing in a document section, the system locks that specific block. Changes are batched and synchronized at a sync interval of 2 seconds (2000ms sync window).\n\n2. Known Constraints & Latency:\n- Concurrent edits to the same section are blocked. If user B attempts to edit a locked section, the client receives a 'sync conflict' error, forcing manual merge select.\n- Average request overhead routing latency is 120ms. EU-West region users experience higher routing overhead (averaging 240ms) as all API requests route through the US-East datacenter.\n- Uptime is backed by a single-instance Redis cache (no master-slave replication active)."
  },
  sla: {
    title: "enterprise_service_level_agreement.pdf",
    meta: "Sample SLA • Size: 18 KB",
    content: "SERVICE LEVEL AGREEMENT (SLA) - ENTERPRISE PLAN\n\n1. Monthly Uptime Guarantee:\nService provider guarantees a Monthly Uptime Percentage of 99.99% for all production API endpoints. \n\n2. Service Credit Schedule:\nIn the event that the service provider fails to meet the Monthly Uptime Guarantee, the customer is eligible to request service credits according to the following bands:\n- Monthly Uptime 99.90% to 99.98%: 10% credit of the monthly fee.\n- Monthly Uptime 99.50% to 99.89%: 25% credit of the monthly fee.\n- Monthly Uptime under 99.50%: 50% credit of the monthly fee.\n\n3. Support Escalation Targets:\n- Critical Outage (P0 blocker): Initial response target is 30 minutes.\n- High Degradation (P1 degradation): Initial response target is 2 hours.\n- Support agents are authorized to credit up to $500 manually; higher amounts require Product Owner approval."
  },
  market: {
    title: "saas_collaboration_market_report_2026.pdf",
    meta: "Sample Report • Size: 32 KB",
    content: "MARKET INTELLIGENCE REPORT: SAAS COLLABORATION BENCHMARKS 2026\n\n1. Real-time Synchronization expectations:\nIndustry standards for document co-authoring demand sync latency to be under 100ms to avoid user typing lag. Competitors such as CollabDoc and SyncWrite utilize non-blocking real-time merge architectures based on Conflict-free Replicated Data Types (CRDT) or Operational Transformation (OT). Lock-based editing is considered obsolete and leads to a 20% increase in customer churn.\n\n2. Global API Performance benchmarks:\nTop-performing enterprise API gateways maintain an overhead latency under 50ms. High-performing teams utilize edge compute routes and geographically distributed caching (e.g. edge Redis replication) to ensure consistent global response times (<80ms total RTT in Europe and Asia)."
  },
  agreement: {
    title: "supplier_sow_development_agreement.pdf",
    meta: "Sample Contract • Size: 79 KB",
    content: "SUPPLIER DEVELOPMENT AGREEMENT & STATEMENT OF WORK V1.0\n\n1. Parties and Scope:\nThis agreement is between Apex Software Solutions (\"Supplier\") and the Product Team (\"Client\"). The Supplier will provide software development services for the Document Collaboration Module V2.1.\n\n2. Services to be Delivered:\n- Frontend UI development matching client-approved Figma wireframes.\n- Backend API integration using section-based locking synchronizer.\n- Integration of a single-instance Redis cache.\n- Deployment to staging environment and support during manual QA.\n- Production launch support (10 hours post-go-live included).\n\n3. Payment Terms and Milestones:\n- Milestone 1: Down Payment (20% of total fee, $10,000) due upon signing of this contract.\n- Milestone 2: Frontend Delivery (30% of total fee, $15,000) due upon demo and visual approval.\n- Milestone 3: API & Redis Integration (30% of total fee, $15,000) due upon successful deployment to staging and verification of the 2-second synchronization.\n- Milestone 4: Final Sign-off (20% of total fee, $10,000) due within 30 days of production launch and client acceptance.\n- Additional Ad-hoc Services: Billed at $75 per hour, invoiced monthly with Net-15 terms.\n\n4. Performance & Environment SLA:\n- Supplier guarantees 99.0% uptime for the developer staging environment during the testing phase.\n- Critical bugs reported during the 30-day post-launch acceptance window will be patched within 48 hours at no additional cost.\n- Standard payment terms: Net-30 from date of invoice receipt."
  }
};

// Global State
let documents = JSON.parse(localStorage.getItem('agile_po_documents')) || [];
let currentJSONPayload = null; // Holds compiled PRD results if any
let chatMessages = []; // Chat history array { role: 'user' | 'model', text: string }

// Initialize Application
function init() {
  updateWorkspaceState();

  // Setup file upload triggers
  const btnUploadTrigger = document.getElementById('uploadContainer');
  const pdfFile = document.getElementById('pdfFile');
  if (btnUploadTrigger && pdfFile) {
    btnUploadTrigger.addEventListener('click', () => pdfFile.click());
    pdfFile.addEventListener('change', handlePDFUpload);
  }

  // Setup drag and drop
  const uploadContainer = document.getElementById('uploadContainer');
  if (uploadContainer && pdfFile) {
    uploadContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadContainer.style.borderColor = 'var(--accent-purple)';
      uploadContainer.style.background = 'rgba(139, 92, 246, 0.05)';
    });

    uploadContainer.addEventListener('dragleave', () => {
      uploadContainer.style.borderColor = 'var(--border-color)';
      uploadContainer.style.background = 'rgba(15, 23, 42, 0.2)';
    });

    uploadContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadContainer.style.borderColor = 'var(--border-color)';
      uploadContainer.style.background = 'rgba(15, 23, 42, 0.2)';
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        pdfFile.files = files;
        handlePDFUpload({ target: pdfFile });
      }
    });
  }

  // Copy-Paste Document Loader Click
  const btnAddTextDoc = document.getElementById('btnAddTextDoc');
  if (btnAddTextDoc) {
    btnAddTextDoc.addEventListener('click', handleAddTextDocument);
  }

  // Sample Loaders
  const btnLoadSampleSpec = document.getElementById('btnLoadSampleSpec');
  const btnLoadSampleSLA = document.getElementById('btnLoadSampleSLA');
  const btnLoadSampleMarket = document.getElementById('btnLoadSampleMarket');
  const btnLoadSampleAgreement = document.getElementById('btnLoadSampleAgreement');

  if (btnLoadSampleSpec) btnLoadSampleSpec.addEventListener('click', () => loadSample('spec'));
  if (btnLoadSampleSLA) btnLoadSampleSLA.addEventListener('click', () => loadSample('sla'));
  if (btnLoadSampleMarket) btnLoadSampleMarket.addEventListener('click', () => loadSample('market'));
  if (btnLoadSampleAgreement) btnLoadSampleAgreement.addEventListener('click', () => loadSample('agreement'));

  // Workspace Actions
  const btnClearAllDocs = document.getElementById('btnClearAllDocs');
  if (btnClearAllDocs) {
    btnClearAllDocs.addEventListener('click', clearAllDocuments);
  }

  // Chat submission listeners
  const btnSendChat = document.getElementById('btnSendChat');
  const chatInput = document.getElementById('chatInput');
  if (btnSendChat && chatInput) {
    btnSendChat.addEventListener('click', handleSendChatMessage);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSendChatMessage();
    });
  }

  // Quick prompt buttons bindings
  const quickPRD = document.getElementById('quickPRD');
  const quickSOW = document.getElementById('quickSOW');
  const quickExplain = document.getElementById('quickExplain');
  const quickSLA = document.getElementById('quickSLA');

  if (quickPRD) {
    quickPRD.addEventListener('click', () => triggerQuickPrompt("Compile a comprehensive Product Requirement Document (PRD) synthesizing all technical spec rules, SLA limits, and competitor benchmarks from the loaded documents."));
  }
  if (quickSOW) {
    quickSOW.addEventListener('click', () => triggerQuickPrompt("Perform a supplier SOW contract and payment milestone audit. Extract services deliverables, milestones, and payment terms, and compare them against spec delivery constraints and client SLAs."));
  }
  if (quickExplain) {
    quickExplain.addEventListener('click', () => triggerQuickPrompt("Explain and simplify the technical requirements in the loaded documents in a clear, easy-to-understand way."));
  }
  if (quickSLA) {
    quickSLA.addEventListener('click', () => triggerQuickPrompt("Check and audit the SLA commitments, monthly uptime percentage promises, response times, and credit compensation details."));
  }

  // Download PRD click
  const btnDownloadPRD = document.getElementById('btnDownloadPRD');
  if (btnDownloadPRD) {
    btnDownloadPRD.addEventListener('click', triggerPRDDownload);
  }

  // Load saved Gemini API settings
  const geminiApiKey = document.getElementById('geminiApiKey');
  if (geminiApiKey) {
    geminiApiKey.value = localStorage.getItem('gemini_api_key') || '';
    updateApiBadge();
    const saveKey = () => {
      localStorage.setItem('gemini_api_key', geminiApiKey.value.trim());
      updateApiBadge();
    };
    geminiApiKey.addEventListener('input', saveKey);
    geminiApiKey.addEventListener('change', saveKey);
  }

  const geminiModel = document.getElementById('geminiModel');
  if (geminiModel) {
    geminiModel.value = localStorage.getItem('gemini_model') || 'gemini-2.5-flash';
    geminiModel.addEventListener('change', () => {
      localStorage.setItem('gemini_model', geminiModel.value);
    });
  }

  // API Key hide/show mask button
  const btnToggleMaskKey = document.getElementById('btnToggleMaskKey');
  if (btnToggleMaskKey && geminiApiKey) {
    btnToggleMaskKey.addEventListener('click', (e) => {
      e.preventDefault();
      const isPassword = geminiApiKey.type === 'password';
      geminiApiKey.type = isPassword ? 'text' : 'password';
      const eyeIcon = document.getElementById('eyeIcon');
      if (eyeIcon) {
        eyeIcon.innerHTML = isPassword 
          ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
             <line x1="1" y1="1" x2="23" y2="23"/>`
          : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
             <circle cx="12" cy="12" r="3"/>`;
      }
    });
  }
}

// Update API Status Badge
function updateApiBadge() {
  const badge = document.getElementById('apiStatusBadge');
  if (!badge) return;
  const key = localStorage.getItem('gemini_api_key') || '';
  if (key) {
    badge.textContent = "Live Mode";
    badge.style.background = "rgba(16, 185, 129, 0.1)";
    badge.style.borderColor = "var(--accent-green)";
    badge.style.color = "var(--accent-green)";
  } else {
    badge.textContent = "Simulation Mode";
    badge.style.background = "rgba(239, 68, 68, 0.1)";
    badge.style.borderColor = "var(--accent-red)";
    badge.style.color = "var(--accent-red)";
  }
}

// Update UI Layout list
function updateWorkspaceState() {
  const listEl = document.getElementById('documentList');
  const statusEl = document.getElementById('pdfStatus');
  if (!listEl) return;

  if (documents.length > 0) {
    if (statusEl) statusEl.textContent = `${documents.length} document(s) loaded`;
    listEl.innerHTML = documents.map((doc, idx) => `
      <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(15,23,42,0.4); border: 1px solid var(--border-color); border-radius: 6px; padding: 0.4rem 0.6rem; font-size: 0.8rem;">
        <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 260px;" title="${doc.title}">
          📄 ${doc.title} <span style="font-size: 0.7rem; color: var(--text-muted);">(${doc.meta.split(' • ').pop() || 'Text'})</span>
        </div>
        <button class="btn-secondary" style="border-color: var(--accent-red); color: var(--accent-red); padding: 0.1rem 0.35rem; font-size: 0.7rem; border-radius: 4px; background: none; cursor: pointer;" onclick="deleteDocument(${idx})">
          &times;
        </button>
      </div>
    `).join('');
  } else {
    if (statusEl) statusEl.textContent = "No files loaded";
    listEl.innerHTML = `<div style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 2rem 0;">No documents in bank. Upload files or load sample documents above to begin.</div>`;
  }
}

// Load Sample Document
function loadSample(key) {
  const sample = JSON.parse(JSON.stringify(SAMPLE_DOCS[key]));
  if (!documents.some(d => d.title === sample.title)) {
    documents.push(sample);
    localStorage.setItem('agile_po_documents', JSON.stringify(documents));
    updateWorkspaceState();
  }
}

// Clear all documents
function clearAllDocuments() {
  if (confirm("Are you sure you want to clear the entire document bank?")) {
    documents = [];
    localStorage.removeItem('agile_po_documents');
    updateWorkspaceState();
  }
}

// Delete individual document
window.deleteDocument = function(idx) {
  documents.splice(idx, 1);
  localStorage.setItem('agile_po_documents', JSON.stringify(documents));
  updateWorkspaceState();
};

// PDF & Text File Upload Handler
async function handlePDFUpload(e) {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  const statusEl = document.getElementById('pdfStatus');
  if (statusEl) {
    statusEl.textContent = `Parsing ${files.length} file(s)...`;
    statusEl.style.color = "var(--accent-yellow)";
  }

  // Initialize PDF.js worker
  const pdfjsLib = window['pdfjs-dist/build/pdf'];
  if (pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let extractedText = "";
      let meta = "";

      if (file.type === 'application/pdf') {
        if (!pdfjsLib) {
          throw new Error("PDF parser library could not be loaded. Please check your internet connection or use the copy-paste alternative block below.");
        }
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(" ");
          extractedText += pageText + "\n\n";
        }
        meta = `Uploaded PDF • Size: ${Math.round(file.size / 1024)} KB`;
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        extractedText = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target.result);
          reader.onerror = (err) => reject(err);
          reader.readAsText(file);
        });
        meta = `Uploaded Text • Size: ${Math.round(file.size / 1024)} KB`;
      } else {
        alert(`Unsupported file format: ${file.name}. Please upload PDF, TXT or MD files, or paste the text directly into the copy-paste box.`);
        continue;
      }

      // Check if file already exists in bank to avoid duplication
      const existingIdx = documents.findIndex(d => d.title === file.name);
      const docObj = {
        title: file.name,
        meta: meta,
        content: extractedText.trim()
      };

      if (existingIdx >= 0) {
        documents[existingIdx] = docObj;
      } else {
        documents.push(docObj);
      }
    }

    localStorage.setItem('agile_po_documents', JSON.stringify(documents));
    updateWorkspaceState();
    if (statusEl) statusEl.style.color = "var(--text-muted)";

  } catch (error) {
    console.error(error);
    if (statusEl) {
      statusEl.textContent = "Parsing failed";
      statusEl.style.color = "var(--accent-red)";
    }
    alert("File parsing error: " + error.message + "\n\nFeel free to copy and paste the raw document text in the Copy-Paste Alternative input fields.");
  } finally {
    e.target.value = '';
  }
}

// Copy-paste text box upload handler
function handleAddTextDocument() {
  const titleEl = document.getElementById('txtTextDocTitle');
  const contentEl = document.getElementById('txtTextDocContent');
  if (!titleEl || !contentEl) return;

  const title = titleEl.value.trim();
  const content = contentEl.value.trim();

  if (!title || !content) {
    alert("Please enter both a document title and paste your document text content.");
    return;
  }

  const docObj = {
    title: title.endsWith('.txt') ? title : title + '.txt',
    meta: `Pasted Text • Size: ${Math.round(content.length / 1024)} KB`,
    content: content
  };

  // Check for duplicates
  const existingIdx = documents.findIndex(d => d.title === docObj.title);
  if (existingIdx >= 0) {
    documents[existingIdx] = docObj;
  } else {
    documents.push(docObj);
  }

  localStorage.setItem('agile_po_documents', JSON.stringify(documents));
  updateWorkspaceState();

  // Reset inputs
  titleEl.value = '';
  contentEl.value = '';
  alert(`Document "${docObj.title}" successfully added to the Document Bank!`);
}

// Quick Actions Trigger
function triggerQuickPrompt(promptText) {
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.value = promptText;
    handleSendChatMessage();
  }
}

// Chat API helper
async function callGeminiChatAPI(apiKey, model, contents, systemInstruction) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const requestBody = {
    contents: contents,
    systemInstruction: {
      parts: [
        { text: systemInstruction }
      ]
    },
    generationConfig: {
      temperature: 0.7
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API Error (Status ${response.status}): ${errText}`);
  }

  return await response.json();
}

// Main Chat submission
async function handleSendChatMessage() {
  const chatInput = document.getElementById('chatInput');
  const chatHistory = document.getElementById('chatHistory');
  const prdDownloadPanel = document.getElementById('prdDownloadPanel');

  if (!chatInput || !chatHistory) return;

  const text = chatInput.value.trim();
  if (!text) return;

  // Add user bubble
  chatMessages.push({ role: 'user', text: text });
  appendChatMessage('user', text);
  chatInput.value = '';
  if (prdDownloadPanel) prdDownloadPanel.style.display = 'none'; // reset download indicator
  
  // Show typing spinner
  const typingDiv = showChatTypingIndicator();
  
  try {
    const apiKeyEl = document.getElementById('geminiApiKey');
    const apiKey = ((apiKeyEl ? apiKeyEl.value : '') || localStorage.getItem('gemini_api_key') || '').trim();
    const model = localStorage.getItem('gemini_model') || 'gemini-2.5-flash';
    const isLive = apiKey && apiKey.length > 5;
    
    let replyText = "";
    
    if (isLive) {
      // 1. Live Gemini Mode
      let systemPrompt = "You are a professional Agile Product Owner & Supplier Agreement Auditor. " +
        "You help users analyze specifications, SLA contracts, and supplier development agreements (SOW). " +
        "Provide clear, professional answers. Use markdown formatting for lists, tables, and bold text. " +
        "Answer questions based on the uploaded documents below. If the user asks about payment terms, " +
        "services, milestones, or hourly rates, make sure to extract them precisely from the supplier agreement.\n\n" +
        "Active Document Bank:\n";
      
      if (documents.length > 0) {
        systemPrompt += documents.map(d => `--- File: ${d.title} ---\n${d.content}\n`).join('\n\n');
      } else {
        systemPrompt += "(No documents are uploaded yet.)";
      }
      
      const contents = chatMessages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));
      
      const result = await callGeminiChatAPI(apiKey, model, contents, systemPrompt);
      if (result.candidates?.[0]?.content?.parts) {
        replyText = result.candidates[0].content.parts.map(p => p.text).join("");
        
        // If live response contains markdown PRD output, cache it for download
        if (text.toLowerCase().includes('prd') || text.toLowerCase().includes('product requirement')) {
          currentJSONPayload = { markdown_report: replyText };
          if (prdDownloadPanel) prdDownloadPanel.style.display = 'flex';
        }
      } else {
        replyText = "Error: Received empty response from Gemini API.";
      }
    } else {
      // 2. Offline Simulation Mode
      await delay(1200);
      const q = text.toLowerCase();
      
      if (documents.length === 0) {
        replyText = "I see you don't have any documents loaded in the bank. Please load one of the test documents above or paste a custom text document to try the simulated chat.";
      } else {
        const hasSOW = documents.some(d => d.title.toLowerCase().includes('agreement') || d.title.toLowerCase().includes('contract') || d.title.toLowerCase().includes('sow') || d.content.toLowerCase().includes('supplier') || d.content.toLowerCase().includes('payment'));
        
        if (q.includes('payment') || q.includes('rate') || q.includes('milestone') || q.includes('fee') || q.includes('cost')) {
          if (hasSOW) {
            replyText = "**Supplier Payment Terms Audit (Simulated API Response)**:\n\n" +
              "Based on the **Supplier Development Agreement & Statement of Work**, here are the payment details:\n" +
              "- **Milestone 1 (Down Payment)**: 20% ($10,000) due upon contract signing.\n" +
              "- **Milestone 2 (Frontend Delivery)**: 30% ($15,000) due upon demo and visual approval.\n" +
              "- **Milestone 3 (API & Redis Integration)**: 30% ($15,000) due upon successful staging deployment & verification of the 2-second synchronization window.\n" +
              "- **Milestone 4 (Final Sign-off)**: 20% ($10,000) due within 30 days of production launch & client acceptance.\n\n" +
              "**Audit Warnings**:\n" +
              "1. ⚠️ **Payment Term Mismatch**: SOW specifies payment terms are **Net-30** for standard milestones, but ad-hoc services are **Net-15**. Ensure finance accepts Net-15 hourly bills.\n" +
              "2. ⚡ **SLA Coverage Check**: The supplier guarantees 99.0% uptime for staging. However, client SLA requires 99.99% uptime. This exposes a 0.99% SLA coverage gap during user acceptance testing.";
          } else {
            replyText = "I couldn't find a supplier agreement SOW in the document bank. Standard supplier payment terms typically involve a 20% down payment, 30% at frontend delivery, 30% at API integration, and 20% at final acceptance. Please click **+ Supplier SOW** at the top header to load the SOW sample contract.";
          }
        } else if (q.includes('service') || q.includes('deliver') || q.includes('scope') || q.includes('figma') || q.includes('redis')) {
          if (hasSOW) {
            replyText = "**Supplier Services & SOW Scope Audit (Simulated API Response)**:\n\n" +
              "The supplier (**Apex Software Solutions**) has committed to the following deliverables:\n" +
              "- Frontend UI development matching client-approved Figma wireframes.\n" +
              "- Backend API integration with a section-based locking synchronizer.\n" +
              "- Integration of a single-instance Redis cache.\n" +
              "- Staging environment QA support and 10 hours post-go-live standby support.\n\n" +
              "**Scope Risks & Gaps**:\n" +
              "1. 🚫 **Database Uptime Risk**: SOW includes single-instance Redis cache (no master-slave replication active). This matches the Technical Spec constraint but violates high-availability guidelines.\n" +
              "2. ⚠️ **Out of Scope Warning**: Multi-region database replication is explicitly excluded and billed at **$75/hour**.";
          } else {
            replyText = "I see you're asking about supplier deliverables. Please load a SOW contract document. If you upload the `supplier_agreement.pdf` sample, I can extract the frontend, backend, and Redis deliverables for you.";
          }
        } else if (q.includes('prd') || q.includes('product requirement') || q.includes('compile')) {
          const specDoc = documents.find(d => d.title.toLowerCase().includes("spec")) || documents[0];
          const slaDoc = documents.find(d => d.title.toLowerCase().includes("sla")) || documents[0];
          const lockVal = specDoc.content.match(/(\d+)\s*(seconds|ms)/i)?.[0] || "2 seconds";
          const latencyVal = specDoc.content.match(/(\d+)\s*ms/i)?.[0] || "120ms";
          const uptimeVal = slaDoc.content.match(/(\d+\.\d+)%/i)?.[0] || "99.99%";

          replyText = `# PRODUCT REQUIREMENT DOCUMENT (PRD)

## 1. Executive Summary
This document outlines the migration requirements for transitioning the **Document Collaboration Module** from a lock-based synchronizer to a real-time, non-blocking collaborative co-authoring model, resolving performance breaches and compliance gaps.

## 2. Product Objectives
*   **Eliminate Edit Locks**: Replace the section-based locking (currently locks sections for ${lockVal}) with operational concurrent editing.
*   **Maintain SLA Uptime**: Keep service availability above **${uptimeVal}** monthly, resolving the single Redis cache SPOF.
*   **Optimize API Overhead**: Reduce international routing overhead from ${latencyVal} to < 50ms using edge routes.

## 3. Recommended Engineering Roadmap
*   **AGILE-101**: Setup Edge Gateway routing (Estimate: 5 Story Points).
*   **AGILE-102**: Implement CRDT co-authoring sync (Estimate: 8 Story Points).
*   **AGILE-103**: Deploy Active-Active Sentinel cache cluster (Estimate: 13 Story Points).`;

          currentJSONPayload = { markdown_report: replyText };
          if (prdDownloadPanel) prdDownloadPanel.style.display = 'flex';
        } else if (q.includes('sla') || q.includes('uptime') || q.includes('credit')) {
          replyText = "**SLA Guarantee Audit (Simulated API Response)**:\n\n" +
            "Based on the **Enterprise SLA Agreement**:\n" +
            "- **Commitment**: 99.99% monthly uptime on production endpoints.\n" +
            "- **Refund Scales**: Monthly uptime of 99.90% - 99.98% triggers 10% credit, 99.50% - 99.89% triggers 25% credit, and under 99.50% triggers 50% credit.\n" +
            "- **Response Targets**: P0 outage is 30 mins, P1 degradation is 2 hours.\n\n" +
            "**Key Risks**:\n" +
            "The Technical Spec mentions all cache runs on a single Redis instance (no replication). If it fails, restore takes ~15 minutes, pushing availability down to **99.96%** (instantly triggering a 10% SLA refund).";
        } else {
          replyText = `Thank you for your question: "${text}". I have scanned the loaded documents (**${documents.map(d=>d.title).join(', ')}**).\n\n` +
            "To perform live, context-aware answering, please add your Gemini API key in the top configuration panel. In Simulation Mode, try typing keywords like *payment*, *milestones*, *deliverables*, *SLA*, or *PRD* to test simulated audits.";
        }
      }
    }
    
    // Render agent bubble
    chatMessages.push({ role: 'model', text: replyText });
    appendChatMessage('model', replyText);

  } catch (error) {
    console.error(error);
    appendChatMessage('model', `⚠️ Failed to get reply from agent: ${error.message}`);
  } finally {
    typingDiv.remove();
  }
}

// Show Typing Indicator
function showChatTypingIndicator() {
  const chatHistory = document.getElementById('chatHistory');
  const typingDiv = document.createElement('div');
  typingDiv.className = 'chat-message agent-msg';
  typingDiv.style.display = 'flex';
  typingDiv.style.gap = '0.75rem';
  typingDiv.style.alignItems = 'start';
  typingDiv.style.background = 'rgba(139, 92, 246, 0.05)';
  typingDiv.style.border = '1px solid rgba(139, 92, 246, 0.15)';
  typingDiv.style.padding = '1rem';
  typingDiv.style.borderRadius = '8px';
  
  typingDiv.innerHTML = `
    <div style="background: var(--accent-purple); color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.8rem; flex-shrink: 0; box-shadow: 0 0 8px var(--accent-purple);">PO</div>
    <div style="flex: 1; display: flex; align-items: center; gap: 0.25rem; height: 20px;">
      <div class="dot-flashing" style="margin-left: 10px;"></div>
    </div>
  `;
  
  if (chatHistory) {
    chatHistory.appendChild(typingDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }
  return typingDiv;
}

// Append Chat Bubble to UI
function appendChatMessage(role, text) {
  const chatHistory = document.getElementById('chatHistory');
  const msgDiv = document.createElement('div');
  msgDiv.className = role === 'user' ? 'chat-message user-msg' : 'chat-message agent-msg';
  msgDiv.style.display = 'flex';
  msgDiv.style.gap = '0.75rem';
  msgDiv.style.alignItems = 'start';
  
  if (role === 'user') {
    msgDiv.style.background = 'rgba(255, 255, 255, 0.03)';
    msgDiv.style.border = '1px solid rgba(255, 255, 255, 0.05)';
    msgDiv.style.padding = '1rem';
    msgDiv.style.borderRadius = '8px';
    msgDiv.innerHTML = `
      <div style="background: rgba(255, 255, 255, 0.2); color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.8rem; flex-shrink: 0;">ME</div>
      <div style="flex: 1; font-size: 0.85rem; line-height: 1.5; color: var(--text-primary); white-space: pre-wrap;">${escapeHTML(text)}</div>
    `;
  } else {
    msgDiv.style.background = 'rgba(139, 92, 246, 0.05)';
    msgDiv.style.border = '1px solid rgba(139, 92, 246, 0.15)';
    msgDiv.style.padding = '1rem';
    msgDiv.style.borderRadius = '8px';
    
    const formattedHtml = parseMarkdown(text);
    msgDiv.innerHTML = `
      <div style="background: var(--accent-purple); color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.8rem; flex-shrink: 0; box-shadow: 0 0 8px var(--accent-purple);">PO</div>
      <div style="flex: 1; font-size: 0.85rem; line-height: 1.5; color: var(--text-primary);">${formattedHtml}</div>
    `;
  }
  
  if (chatHistory) {
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }
}

// Simple Markdown Parser
function parseMarkdown(md) {
  let html = md;
  
  html = html.replace(/```(diff|markdown|json|text|)(\r?\n)([\s\S]*?)```/g, (match, lang, nl, code) => {
    if (lang === 'diff') {
      const diffLines = code.split('\n').map(line => {
        if (line.startsWith('+')) return `<span class="diff-add">${escapeHTML(line)}</span>`;
        if (line.startsWith('-')) return `<span class="diff-del">${escapeHTML(line)}</span>`;
        return escapeHTML(line);
      }).join('\n');
      return `<pre><code class="diff">${diffLines}</code></pre>`;
    }
    return `<pre><code>${escapeHTML(code)}</code></pre>`;
  });
  
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  html = html.replace(/^> \[\!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](\r?\n)> (.*$)/gim, (match, type, nl, text) => {
    return `<div class="alert alert-${type.toLowerCase()}"><strong>${type}:</strong> ${text}</div>`;
  });
  html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
  
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  html = html.replace(/\|(.+)\|/g, (match, content) => {
    const cols = content.split('|').map(c => c.trim());
    if (cols.every(c => c.match(/^:-+$/) || c.match(/^-+:$/) || c.match(/^:-+:$/) || c.match(/^-+$/))) {
      return '';
    }
    const isHeader = html.indexOf('<thead>') === -1 && html.indexOf(match) < html.indexOf('\n|');
    const cellTag = isHeader ? 'th' : 'td';
    return `<tr>${cols.map(c => `<${cellTag}>${c}</${cellTag}>`).join('')}</tr>`;
  });
  
  html = html.replace(/((?:<tr>.+<\/tr>\s*)+)/g, '<table>$1</table>');
  html = html.replace(/-(.*$)/gim, '<li>$1</li>');
  html = html.replace(/\*(.*$)/gim, '<li>$1</li>');
  html = html.replace(/((?:<li>.+<\/li>\s*)+)/g, '<ul>$1</ul>');
  
  return html;
}

// Escape HTML special characters
function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Delay Helper
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Trigger browser download of PRD
function triggerPRDDownload() {
  if (!currentJSONPayload || !currentJSONPayload.markdown_report) return;
  const content = currentJSONPayload.markdown_report;
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `product_requirement_document_${new Date().toISOString().slice(0,10)}.md`;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Window load trigger
window.addEventListener('DOMContentLoaded', init);
