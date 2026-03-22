import { useState, useEffect, useRef } from "react";
import { sendLegalChatMessage } from "../services/api";

const SUGGESTIONS = [
  "What are my Fundamental Rights?",
  "What is Article 21?",
  "How do I file an RTI?",
  "What is the IT Act 66C?",
  "What are consumer rights in India?",
];

const renderMarkdown = (text) => {
  // Bold
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i} className="text-white font-semibold">{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>
  );
};

const MessageBubble = ({ msg }) => {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} gap-2 animate-fade-up`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">
          ⚖
        </div>
      )}
      <div
        className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm font-body leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-accent text-white rounded-br-sm"
            : "bg-slate-800 border border-border text-slate-300 rounded-bl-sm"
        }`}
      >
        {isUser ? msg.content : renderMarkdown(msg.content)}
      </div>
    </div>
  );
};

export default function LegalChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Namaste! 🙏 I'm your Indian Legal Assistant.\n\nAsk me anything about the Indian Constitution, IPC, your rights, or legal procedures.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const history = updated.map((m) => ({ role: m.role, content: m.content }));
      const reply = await sendLegalChatMessage(history);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      if (!open) setUnread((n) => n + 1);
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
      send();
    }
  };

  const useSuggestion = (s) => {
    setInput(s);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-24 right-5 z-50 w-[360px] flex flex-col rounded-2xl shadow-2xl border border-border overflow-hidden"
          style={{ height: "520px", background: "#0f172a" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-slate-900/80 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-base">
                ⚖
              </div>
              <div>
                <p className="font-display font-semibold text-sm text-white leading-tight">Legal Assistant</p>
                <p className="text-xs text-muted font-body">Indian Constitution & Law</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-slate-300 hover:bg-slate-800 transition-colors text-sm"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}

            {loading && (
              <div className="flex justify-start gap-2">
                <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-xs">⚖</div>
                <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-slate-800 border border-border flex gap-1 items-center">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: `${d * 150}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions — shown only at start */}
          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex gap-1.5 flex-wrap flex-shrink-0">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => useSuggestion(s)}
                  className="text-xs px-2.5 py-1.5 rounded-full bg-slate-800 border border-border text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors font-body"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 border-t border-border flex-shrink-0 flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about Indian law..."
              disabled={loading}
              rows={1}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-border text-slate-200 text-sm font-body
                         placeholder:text-slate-600 focus:outline-none focus:border-slate-500 transition-colors resize-none disabled:opacity-50"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className={`px-3.5 rounded-xl text-sm font-bold transition-all flex-shrink-0 ${
                input.trim() && !loading
                  ? "bg-amber-500 text-white hover:bg-amber-400 active:scale-95"
                  : "bg-slate-800 text-slate-600 cursor-not-allowed"
              }`}
            >
              →
            </button>
          </div>
        </div>
      )}

      {/* FAB trigger button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`fixed bottom-5 right-5 z-50 w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center transition-all duration-300 active:scale-95 ${
          open
            ? "bg-slate-700 border border-border"
            : "bg-amber-500 hover:bg-amber-400 shadow-amber-900/30"
        }`}
        title="Ask a legal question"
      >
        {open ? (
          <span className="text-slate-300 text-lg">✕</span>
        ) : (
          <span className="text-white text-2xl">⚖</span>
        )}
        {/* Unread badge */}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-white text-xs font-mono flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
    </>
  );
}
