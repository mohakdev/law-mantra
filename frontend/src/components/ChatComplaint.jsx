import { useState, useEffect, useRef } from "react";
import { sendChatMessage } from "../services/api";

const SCAM_LABELS = {
  phishing: "Phishing Attack",
  upi_fraud: "UPI Fraud",
  job_scam: "Job Scam",
  lottery_scam: "Lottery Scam",
  unknown: "Suspicious Message",
};

const REQUIRED_FIELDS = ["fullName", "phone", "email", "aadhaarLast4", "address", "dateOfIncident", "description"];

const FIELD_LABELS = {
  fullName: "Full Name",
  phone: "Phone",
  email: "Email",
  aadhaarLast4: "Aadhaar (last 4)",
  aadhaarFull: "Aadhaar (full)",
  pan: "PAN Card",
  address: "Address",
  dateOfIncident: "Date of Incident",
  description: "Description",
};

export default function ChatComplaint({ scamResult, onComplete }) {
  const scamLabel = SCAM_LABELS[scamResult.scamType] || "Cybercrime";
  const scamContext = `${scamLabel}: ${scamResult.explanation || ""}`;

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `I've detected a **${scamLabel}** in your screenshot. I'll help you file a cybercrime complaint step by step.\n\nFirst, I need a few personal details. What is your **full name**?`,
    },
  ]);
  const [collectedFields, setCollectedFields] = useState({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [allCollected, setAllCollected] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading]);

  const completedCount = REQUIRED_FIELDS.filter((f) => collectedFields[f]).length;
  const progressPct = Math.round((completedCount / REQUIRED_FIELDS.length) * 100);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading || allCollected) return;

    const userMsg = { role: "user", content: text };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput("");
    setLoading(true);

    try {
      const groqHistory = updatedHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const result = await sendChatMessage(groqHistory, scamContext, collectedFields);

      const newFields = { ...collectedFields, ...result.extractedFields };
      setCollectedFields(newFields);
      setMessages((prev) => [...prev, { role: "assistant", content: result.message }]);

      if (result.allCollected) {
        setAllCollected(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I had trouble connecting. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderMessage = (content) => {
    return content.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i} className="text-white font-semibold">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <div className="card overflow-hidden animate-fade-up">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-safe animate-pulse" />
          <span className="font-display font-semibold text-sm text-slate-200">
            Complaint Assistant
          </span>
        </div>
        {/* Progress */}
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-safe rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="font-mono text-xs text-muted">{completedCount}/{REQUIRED_FIELDS.length}</span>
        </div>
      </div>

      {/* Collected fields pills */}
      {Object.keys(collectedFields).length > 0 && (
        <div className="px-5 py-2.5 border-b border-border bg-slate-900/40 flex flex-wrap gap-1.5">
          {Object.entries(collectedFields).map(([key, val]) => (
            <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-safe/10 border border-safe/20 text-xs font-mono text-safe">
              <span className="text-safe/60">✓</span>
              {FIELD_LABELS[key] || key}
            </span>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="h-72 overflow-y-auto px-4 py-4 flex flex-col gap-3 scroll-smooth">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-up`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5 text-xs">
                ⚖
              </div>
            )}
            <div
              className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm font-body leading-relaxed ${
                msg.role === "user"
                  ? "bg-accent text-white rounded-br-sm"
                  : "bg-slate-800 border border-border text-slate-300 rounded-bl-sm"
              }`}
            >
              {renderMessage(msg.content)}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0 mr-2 text-xs">⚖</div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-slate-800 border border-border flex gap-1 items-center">
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce"
                  style={{ animationDelay: `${d * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border">
        {allCollected ? (
          <button
            onClick={() => onComplete(collectedFields)}
            className="w-full py-3 rounded-xl bg-safe text-white font-display font-bold text-sm hover:bg-green-600 active:scale-[0.98] transition-all shadow-lg shadow-green-900/20 flex items-center justify-center gap-2"
          >
            <span>👁</span> Preview Complaint
          </button>
        ) : (
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type your reply... (Enter to send)"
              disabled={loading}
              rows={1}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900/60 border border-border text-slate-200 text-sm font-body
                         placeholder:text-slate-600 focus:outline-none focus:border-slate-500 transition-colors resize-none
                         disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className={`px-4 rounded-xl text-sm font-semibold transition-all ${
                input.trim() && !loading
                  ? "bg-accent text-white hover:bg-red-600 active:scale-95"
                  : "bg-slate-800 text-slate-600 cursor-not-allowed"
              }`}
            >
              →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
