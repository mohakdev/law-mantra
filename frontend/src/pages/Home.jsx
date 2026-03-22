import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Upload from "../components/Upload";
import Loader from "../components/Loader";
import { analyzeImage } from "../services/api";
import LegalChatBot from "../components/LegalChatBot";

const FEATURES = [
  { icon: "◈", label: "OCR Text Extraction", desc: "Reads text directly from your screenshot" },
  { icon: "◎", label: "AI Scam Classification", desc: "Identifies phishing, UPI fraud, job scams & more" },
  { icon: "§", label: "Static Legal Mapping", desc: "IT Act & IPC sections — no AI hallucination" },
  { icon: "→", label: "Instant Action Plan", desc: "Know exactly what to do in the next 30 minutes" },
];

// Simulated step progression during loading
const STEP_DURATIONS = [2000, 3000, 1500, 2000];

export default function Home() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loaderStep, setLoaderStep] = useState(0);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const stepTimers = useRef([]);

  const clearTimers = () => {
    stepTimers.current.forEach(clearTimeout);
    stepTimers.current = [];
  };

  const startStepProgression = () => {
    let elapsed = 0;
    STEP_DURATIONS.forEach((dur, i) => {
      elapsed += dur;
      const t = setTimeout(() => setLoaderStep(i + 1), elapsed);
      stepTimers.current.push(t);
    });
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setError("");
    setLoading(true);
    setLoaderStep(0);
    startStepProgression();

    try {
      const result = await analyzeImage(file);
      clearTimers();
      // Convert image to JPEG via canvas (pdfkit only supports JPEG/PNG)
      const imageBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const MAX = 1200;
            const scale = Math.min(1, MAX / Math.max(img.width, img.height));
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/jpeg", 0.85));
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });

      navigate("/result", { state: { result, fileName: file.name, imageBase64 } });
    } catch (err) {
      clearTimers();
      setLoading(false);
      setLoaderStep(0);
      const msg =
        err?.response?.data?.error ||
        "Analysis failed. Please check your server is running and try again.";
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white text-xs font-display font-bold">⚖</span>
          </div>
          <span className="font-display font-semibold text-white text-sm tracking-tight">
            Legal First-Aid
          </span>
        </div>
        <a
          href="https://cybercrime.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono text-muted hover:text-slate-300 transition-colors"
        >
          cybercrime.gov.in ↗
        </a>
      </nav>

      <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-12 flex flex-col gap-10">
        {/* Hero */}
        <div className="text-center flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-full mx-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-accent text-xs font-mono tracking-widest uppercase">
              Cybercrime Legal Analyzer
            </span>
          </div>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-white leading-tight">
            Got a suspicious
            <br />
            <span className="text-accent">message?</span>
          </h1>
          <p className="text-muted text-base font-body max-w-sm mx-auto leading-relaxed">
            Upload a screenshot. We'll identify the scam, show you your legal rights, and tell you exactly what to do.
          </p>
        </div>

        {/* Upload + CTA */}
        {loading ? (
          <Loader step={loaderStep} />
        ) : (
          <div className="flex flex-col gap-4">
            <Upload onFileSelect={setFile} disabled={loading} />

            {error && (
              <div className="p-4 rounded-xl bg-accent/10 border border-accent/30 flex items-start gap-3">
                <span className="text-accent mt-0.5 flex-shrink-0">⚠</span>
                <p className="text-sm text-slate-300 font-body">{error}</p>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!file || loading}
              className={`
                w-full py-4 rounded-xl font-display font-bold text-base transition-all duration-200
                ${file
                  ? "bg-accent text-white hover:bg-red-600 active:scale-[0.98] shadow-lg shadow-accent/20"
                  : "bg-slate-800 text-slate-600 cursor-not-allowed"
                }
              `}
            >
              {file ? "Analyze Scam →" : "Upload an image to begin"}
            </button>

            <p className="text-center text-xs text-muted font-body">
              Your image is processed locally on the server — not stored anywhere.
            </p>
          </div>
        )}

        {/* Feature grid */}
        {!loading && (
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="card p-4 flex flex-col gap-2 hover:border-slate-600 transition-colors"
              >
                <span className="font-mono text-accent text-base">{f.icon}</span>
                <div>
                  <p className="font-display font-semibold text-sm text-slate-200">{f.label}</p>
                  <p className="text-xs text-muted font-body mt-0.5 leading-snug">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 px-6 py-4 flex items-center justify-between">
        <p className="text-xs text-muted font-body">
          For informational purposes. Not a substitute for legal advice.
        </p>
        <p className="text-xs font-mono text-muted">
          Helpline: <span className="text-slate-400">1930</span>
        </p>
      </footer>
      <LegalChatBot />
    </div>
  );
}
