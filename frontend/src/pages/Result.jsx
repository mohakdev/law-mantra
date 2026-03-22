import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ResultCard from "../components/ResultCard";
import ActionList from "../components/ActionList";
import ChatComplaint from "../components/ChatComplaint";
import ComplaintPreview from "../components/ComplaintPreview";

// Flow stages
const STAGE = {
  ANALYSIS: "analysis",   // show scam result summary
  CHAT: "chat",           // collect personal details via chat
  PREVIEW: "preview",     // live preview + edit + download
};

const RISK_COLORS = { HIGH: "text-accent", MEDIUM: "text-warn", LOW: "text-highlight" };

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const { result, fileName, imageBase64 } = location.state || {};

  const [stage, setStage] = useState(STAGE.ANALYSIS);
  const [collectedFields, setCollectedFields] = useState(null);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-muted font-body">No analysis result found.</p>
        <button onClick={() => navigate("/")} className="btn-primary">← Go Back</button>
      </div>
    );
  }

  const handleChatComplete = (fields) => {
    setCollectedFields(fields);
    setStage(STAGE.PREVIEW);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border/50 sticky top-0 bg-ink/90 backdrop-blur-sm z-10">
        <button
          onClick={() => {
            if (stage === STAGE.PREVIEW) setStage(STAGE.CHAT);
            else if (stage === STAGE.CHAT) setStage(STAGE.ANALYSIS);
            else navigate("/");
          }}
          className="flex items-center gap-2 text-sm text-muted hover:text-slate-300 transition-colors font-body"
        >
          ← {stage === STAGE.ANALYSIS ? "New Analysis" : "Back"}
        </button>

        <div className="flex items-center gap-3">
          {/* Stage breadcrumb */}
          {["analysis", "chat", "preview"].map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-border text-xs">›</span>}
              <span className={`text-xs font-mono capitalize transition-colors ${
                stage === s ? "text-slate-200" : "text-muted"
              }`}>
                {s === "analysis" ? "Summary" : s === "chat" ? "Details" : "Preview"}
              </span>
            </div>
          ))}

          <div className={`ml-2 text-sm font-mono font-semibold ${RISK_COLORS[result.riskLevel] || "text-muted"}`}>
            {result.riskLevel} RISK
          </div>
        </div>
      </nav>

      <main className={`flex-1 mx-auto w-full px-5 py-8 flex flex-col gap-5 ${
        stage === STAGE.PREVIEW ? "max-w-6xl" : "max-w-2xl"
      }`}>
        {/* File badge */}
        {fileName && stage === STAGE.ANALYSIS && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/40 border border-border w-fit">
            <span className="text-xs font-mono text-muted">Analyzed:</span>
            <span className="text-xs font-mono text-slate-400 truncate max-w-xs">{fileName}</span>
          </div>
        )}

        {/* ── STAGE: ANALYSIS ───────────────────────────────────────────── */}
        {stage === STAGE.ANALYSIS && (
          <>
            <ResultCard result={result} />

            {/* Extracted text */}
            {result.extractedText && (
              <details className="card group">
                <summary className="p-5 cursor-pointer flex items-center justify-between list-none hover:bg-slate-800/30 rounded-2xl transition-colors">
                  <span className="section-label">Extracted Text from Image</span>
                  <span className="text-muted text-xs font-mono group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <div className="px-5 pb-5">
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/50 max-h-40 overflow-y-auto">
                    <pre className="text-xs font-mono text-slate-400 whitespace-pre-wrap leading-relaxed">
                      {result.extractedText}
                    </pre>
                  </div>
                </div>
              </details>
            )}

            {/* CTA to file complaint */}
            <div className="card p-5 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-lg flex-shrink-0">📋</div>
                <div>
                  <p className="font-display font-semibold text-slate-200 text-sm">File a Cybercrime Complaint</p>
                  <p className="text-xs text-muted font-body mt-0.5">Our assistant will guide you step by step to generate a formal complaint PDF.</p>
                </div>
              </div>
              <button
                onClick={() => setStage(STAGE.CHAT)}
                className="btn-primary w-full justify-center"
              >
                Start Filing Complaint →
              </button>
            </div>

            {/* Emergency callout */}
            <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 flex items-center gap-3">
              <span className="text-2xl">🚨</span>
              <div>
                <p className="text-sm font-display font-semibold text-slate-200">Financial loss? Call immediately.</p>
                <p className="text-sm text-muted font-body">
                  National Cyber Crime Helpline:{" "}
                  <a href="tel:1930" className="text-accent font-mono font-medium hover:underline">1930</a>
                </p>
              </div>
            </div>
          </>
        )}

        {/* ── STAGE: CHAT ───────────────────────────────────────────────── */}
        {stage === STAGE.CHAT && (
          <>
            {/* Compact summary header */}
            <div className="card p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-base">
                {result.scamType === "phishing" ? "🎣" : result.scamType === "upi_fraud" ? "💸" : result.scamType === "job_scam" ? "💼" : result.scamType === "lottery_scam" ? "🎰" : "⚠️"}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display font-semibold text-sm text-slate-200 capitalize">
                    {result.scamType.replace(/_/g, " ")}
                  </span>
                  <span className={`badge text-xs ${result.riskLevel === "HIGH" ? "badge-high" : result.riskLevel === "MEDIUM" ? "badge-medium" : "badge-low"}`}>
                    {result.riskLevel}
                  </span>
                </div>
                <p className="text-xs text-muted font-body truncate">{result.explanation}</p>
              </div>
            </div>

            <ChatComplaint scamResult={result} onComplete={handleChatComplete} />
          </>
        )}

        {/* ── STAGE: PREVIEW ────────────────────────────────────────────── */}
        {stage === STAGE.PREVIEW && collectedFields && (
          <>
            <ComplaintPreview
              initialFields={collectedFields}
              scamType={result.scamType}
              imageBase64={imageBase64}
              onBack={() => setStage(STAGE.CHAT)}
            />

            {/* ── Legal + Actions shown AFTER preview/download ── */}
            <div className="mt-2 border-t border-border/50 pt-6 flex flex-col gap-4 max-w-2xl">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border/50" />
                <span className="section-label px-2">Legal Reference & Action Checklist</span>
                <div className="h-px flex-1 bg-border/50" />
              </div>

              {/* Legal card */}
              {result.law && (
                <div className="card p-5 border-l-2 border-l-accent">
                  <span className="section-label block mb-3">Applicable Legal Provisions</span>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-accent text-xs mt-0.5">§</span>
                      <div>
                        <p className="font-display font-semibold text-slate-200 text-sm">{result.law.section}</p>
                        <p className="text-muted text-xs mt-0.5 font-body">{result.law.description}</p>
                      </div>
                    </div>
                    <div className="mt-1 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                      <p className="text-xs font-mono text-slate-400">
                        <span className="text-slate-500">Punishment → </span>{result.law.punishment}
                      </p>
                    </div>
                    {result.law.acts && (
                      <div className="flex gap-2 flex-wrap mt-1">
                        {result.law.acts.map((act) => (
                          <span key={act} className="badge bg-slate-800 text-slate-500 border border-border text-xs">{act}</span>
                        ))}
                      </div>
                    )}
                    {result.law.reportTo && (
                      <div className="mt-2 flex flex-col gap-1.5">
                        <span className="text-xs font-mono text-muted">Report to:</span>
                        {result.law.reportTo.map((r) => (
                          <div key={r} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-safe flex-shrink-0" />
                            <span className="text-sm text-slate-300 font-body">{r}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions checklist */}
              <ActionList actions={result.actions} />
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-border/50 px-6 py-4">
        <p className="text-xs text-muted font-body text-center">
          Legal information is for guidance only. Consult a legal professional for case-specific advice.
        </p>
      </footer>
    </div>
  );
}
