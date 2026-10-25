import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Upload,
  FileText,
  Sparkles,
  Bot,
  User,
  Trash2,
  BookOpen,
  Info,
  CheckCircle,
  HelpCircle,
  Layers,
  ChevronDown,
  Paperclip,
} from 'lucide-react';
import { api } from '../services/api';

export default function ChatPage({ initialQuery }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: "Hello! I am your AI Study Assistant. I answer questions grounded strictly in your uploaded course lecture notes and textbooks.\n\nTry asking me:\n- *'Explain the difference between OSI and TCP/IP.'*\n- *'Explain Cyclic Redundancy Check (CRC) in simple English.'*\n- *'Generate practice MCQs from my notes.'*\n- *'What are the most important exam topics for Computer Networks?'*",
      sources: [],
      grounded: true,
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [promptMode, setPromptMode] = useState('normal');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadDocuments();
    if (initialQuery) {
      setInputMessage(`Explain ${initialQuery} in detail`);
    }
  }, [initialQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadDocuments = async () => {
    try {
      const docs = await api.getDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents', err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      setUploadSuccessMsg('');
      const res = await api.uploadDocument(formData);
      setUploadSuccessMsg(res.message);
      await loadDocuments();
      setTimeout(() => setUploadSuccessMsg(''), 5000);
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Delete this study document? Chunks will be removed from vector index.')) return;
    try {
      await api.deleteDocument(docId);
      await loadDocuments();
      if (selectedDocId === String(docId)) setSelectedDocId('');
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const query = inputMessage.trim();
    if (!query || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      mode: promptMode,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await api.sendChatMessage({
        message: query,
        document_id: selectedDocId ? parseInt(selectedDocId) : null,
        prompt_mode: promptMode,
        top_k: 4,
      });

      const assistantMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: response.answer,
        sources: response.sources || [],
        grounded: response.grounded,
        confidence: response.confidence_score,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'assistant',
          text: `An error occurred while retrieving answer: ${err.message}`,
          sources: [],
          grounded: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (mode, label) => {
    setPromptMode(mode);
    if (!inputMessage) {
      setInputMessage(label);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-6 pb-4">
      {/* Left Chat Window */}
      <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {/* Chat Control Toolbar */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-bold text-white">RAG Course Tutor</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Grounded in Notes
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter by Document */}
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Uploaded Notes</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.filename.length > 24 ? d.filename.slice(0, 24) + '...' : d.filename}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Mode Filters */}
        <div className="px-5 py-2 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0 mr-1">Modes:</span>
          {[
            { id: 'normal', label: 'Standard RAG' },
            { id: 'simple', label: 'Simple English' },
            { id: 'example', label: 'With Example' },
            { id: 'summary', label: 'Summarize Unit' },
            { id: 'mcq', label: 'Generate MCQs' },
            { id: 'exam_topics', label: 'Exam Topics' },
            { id: 'compare', label: 'Compare Concepts' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setPromptMode(m.id)}
              className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition-all cursor-pointer ${
                promptMode === m.id
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shrink-0 shadow-md">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none space-y-3'
                }`}
              >
                {/* Text Content */}
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Grounding Citations */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="pt-3 border-t border-slate-800/80 space-y-2">
                    <p className="text-[11px] font-bold text-indigo-400 flex items-center gap-1 uppercase tracking-wider">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Verified Course Citations ({msg.sources.length}):</span>
                    </p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {msg.sources.map((src, i) => (
                        <div
                          key={i}
                          className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-xs text-slate-300 space-y-1"
                        >
                          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                            <span className="text-indigo-300 font-semibold">{src.document_name}</span>
                            <span>Page {src.page_number}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 italic line-clamp-2">
                            "{src.snippet}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center text-white shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-slate-400 text-xs">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-2xl">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                <span>Searching vector store & synthesizing cited answer...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Box */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center gap-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              promptMode === 'simple'
                ? 'Enter topic to explain in simple English...'
                : promptMode === 'example'
                ? 'Enter topic to explain with a real-world example...'
                : promptMode === 'compare'
                ? 'Enter concepts to compare (e.g. OSI vs TCP/IP)...'
                : 'Ask a question from your study notes...'
            }
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || loading}
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm transition-all flex items-center gap-2 shadow-md shadow-indigo-600/30 cursor-pointer disabled:cursor-not-allowed"
          >
            <span>Ask</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Right Sidebar: Document Uploader & Chunks Inspector */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
        {/* Document Ingestion Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Study Materials (RAG)</h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {documents.length} Files
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Upload notes in <strong>PDF, TXT, or DOCX</strong> format. Text is split into overlapping chunks and indexed into the vector store.
          </p>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt,.md"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full py-3 px-4 rounded-xl border border-dashed border-indigo-500/50 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Parsing & Indexing Chunks...' : 'Upload Notes (.PDF, .TXT, .DOCX)'}</span>
          </button>

          {uploadSuccessMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{uploadSuccessMsg}</span>
            </div>
          )}

          {/* Uploaded Documents List */}
          <div className="space-y-2 max-h-60 overflow-y-auto pt-2">
            {documents.length > 0 ? (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5 overflow-hidden">
                    <p className="text-xs font-semibold text-slate-200 truncate" title={doc.filename}>
                      {doc.filename}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {doc.chunk_count} Chunks &bull; {Math.round(doc.file_size / 1024)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors cursor-pointer"
                    title="Remove document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">No documents uploaded yet.</p>
            )}
          </div>
        </div>

        {/* Helpful Prompt Templates Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>Suggested Prompts</span>
          </h4>
          <div className="space-y-1.5">
            {[
              "Explain CRC error detection with an example.",
              "What is the difference between OSI and TCP/IP?",
              "Summarize Unit 3 Data Link Layer framing.",
              "What are the most important exam topics in Networks?",
              "How many usable hosts are in a /26 subnet?",
            ].map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => setInputMessage(prompt)}
                className="w-full text-left p-2 rounded-lg bg-slate-950 hover:bg-slate-800/80 text-[11px] text-slate-300 hover:text-indigo-300 border border-slate-800/60 transition-all cursor-pointer"
              >
                &ldquo;{prompt}&rdquo;
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
