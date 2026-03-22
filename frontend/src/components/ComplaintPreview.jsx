import { useState } from "react";
import { downloadComplaintPDF } from "../services/api";

const SCAM_LABELS = {
  phishing: "Phishing Attack",
  upi_fraud: "UPI Fraud",
  job_scam: "Job Scam",
  lottery_scam: "Lottery Scam",
  unknown: "Suspicious / Unknown Cybercrime",
};

// ── Live HTML Document Preview ──────────────────────────────────────────────
function ComplaintDocument({ fields, scamType }) {
  const scamLabel = SCAM_LABELS[scamType] || "Cybercrime";
  const today = new Date().toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  });

  let aadhaarDisplay = "XXXX-XXXX-____";
  if (fields.aadhaarFull && fields.aadhaarFull.replace(/\s/g, "").length === 12) {
    const clean = fields.aadhaarFull.replace(/\s/g, "");
    aadhaarDisplay = `XXXX-XXXX-${clean.slice(-4)}`;
  } else if (fields.aadhaarLast4) {
    aadhaarDisplay = `XXXX-XXXX-${fields.aadhaarLast4}`;
  }

  const empty = (val) => (
    <span className={val ? "text-gray-900" : "text-gray-400 italic"}>
      {val || "Not provided"}
    </span>
  );

  return (
    <div
      className="bg-white text-gray-900 font-serif"
      style={{ minHeight: "297mm", width: "210mm", padding: "18mm 20mm", fontSize: "10pt", lineHeight: 1.6 }}
    >
      {/* Letterhead */}
      <div style={{ borderBottom: "3px solid #0f172a", paddingBottom: "10px", marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "16pt", fontWeight: "bold", color: "#0f172a", letterSpacing: "-0.3px" }}>
              CYBERCRIME COMPLAINT
            </div>
            <div style={{ fontSize: "8pt", color: "#64748b", marginTop: "2px" }}>
              National Cyber Crime Reporting Portal | cybercrime.gov.in | Helpline: 1930
            </div>
          </div>
          <div style={{ fontSize: "8.5pt", color: "#475569", textAlign: "right" }}>
            <div>Date: {today}</div>
          </div>
        </div>
      </div>

      {/* Address Block */}
      <div style={{ marginBottom: "14px" }}>
        <div style={{ fontWeight: "bold" }}>To,</div>
        <div>The Station House Officer / Cyber Crime Cell</div>
        <div>(Jurisdictional Police Station)</div>
      </div>

      {/* Subject */}
      <div style={{ marginBottom: "14px", fontWeight: "bold", textDecoration: "underline" }}>
        Subject: Complaint Regarding {scamLabel} — Request for FIR / Investigation
      </div>

      {/* Opening */}
      <div style={{ marginBottom: "14px" }}>
        Respected Sir/Madam,
        <br /><br />
        I, the undersigned, wish to bring to your kind notice that I have been a victim of a cybercrime. The complete details of the incident and my personal particulars are furnished below for your immediate action.
      </div>

      {/* Section A */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ background: "#f1f5f9", padding: "4px 8px", fontWeight: "bold", fontSize: "9pt", marginBottom: "8px", borderLeft: "3px solid #0f172a" }}>
          SECTION A — COMPLAINANT DETAILS
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9.5pt" }}>
          <tbody>
            {[
              ["Full Name", fields.fullName],
              ["Phone Number", fields.phone],
              ["Email Address", fields.email],
              ["Aadhaar Number", aadhaarDisplay],
              ...(fields.pan ? [["PAN Card Number", fields.pan]] : []),
              ["Residential Address", fields.address],
            ].map(([label, val]) => (
              <tr key={label} style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td style={{ padding: "4px 8px", fontWeight: "600", color: "#475569", width: "38%" }}>{label}:</td>
                <td style={{ padding: "4px 8px", color: val ? "#1e293b" : "#94a3b8", fontStyle: val ? "normal" : "italic" }}>
                  {val || "Not provided"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Section B */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ background: "#f1f5f9", padding: "4px 8px", fontWeight: "bold", fontSize: "9pt", marginBottom: "8px", borderLeft: "3px solid #0f172a" }}>
          SECTION B — INCIDENT DETAILS
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9.5pt", marginBottom: "8px" }}>
          <tbody>
            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
              <td style={{ padding: "4px 8px", fontWeight: "600", color: "#475569", width: "38%" }}>Type of Cybercrime:</td>
              <td style={{ padding: "4px 8px" }}>{scamLabel}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
              <td style={{ padding: "4px 8px", fontWeight: "600", color: "#475569" }}>Date of Incident:</td>
              <td style={{ padding: "4px 8px", color: fields.dateOfIncident ? "#1e293b" : "#94a3b8", fontStyle: fields.dateOfIncident ? "normal" : "italic" }}>
                {fields.dateOfIncident || "Not specified"}
              </td>
            </tr>
          </tbody>
        </table>
        <div style={{ fontWeight: "600", color: "#475569", fontSize: "9pt", marginBottom: "4px" }}>Detailed Description of Incident:</div>
        <div style={{ border: "1px solid #e2e8f0", borderRadius: "4px", padding: "10px 12px", background: "#f8fafc", minHeight: "60px", fontSize: "9.5pt", color: fields.description ? "#1e293b" : "#94a3b8", fontStyle: fields.description ? "normal" : "italic" }}>
          {fields.description || "No description provided."}
        </div>
      </div>

      {/* Section C */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ background: "#f1f5f9", padding: "4px 8px", fontWeight: "bold", fontSize: "9pt", marginBottom: "8px", borderLeft: "3px solid #0f172a" }}>
          SECTION C — DECLARATION & PRAYER
        </div>
        <div style={{ fontSize: "9.5pt" }}>
          I hereby declare that the information furnished above is true and correct to the best of my knowledge and belief. I humbly request your good office to:
          <ol style={{ marginLeft: "18px", marginTop: "6px", marginBottom: "6px" }}>
            <li>Register an FIR / Complaint in this matter</li>
            <li>Investigate the incident and take appropriate legal action against the perpetrators</li>
            <li>Help trace and recover any financial losses incurred, if applicable</li>
          </ol>
          I am willing to provide any further information, documents, or assistance required in the course of investigation.
        </div>
      </div>

      {/* Signature */}
      <div style={{ marginTop: "24px", fontSize: "9.5pt" }}>
        <div>Yours faithfully,</div>
        <div style={{ marginTop: "8px" }}>Name: {fields.fullName || "________________"}</div>
        <div>Phone: {fields.phone || "________________"}</div>
        <div>Date: {today}</div>
        <div style={{ marginTop: "8px" }}>Signature: ________________</div>
      </div>

      {/* Screenshot Evidence */}
      {fields._imageBase64 && (
        <div style={{ marginBottom: "12px" }}>
          <div style={{ background: "#f1f5f9", padding: "4px 8px", fontWeight: "bold", fontSize: "9pt", marginBottom: "8px", borderLeft: "3px solid #0f172a" }}>
            EXHIBIT A — SCREENSHOT EVIDENCE
          </div>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: "4px", padding: "8px", background: "#f8fafc", textAlign: "center" }}>
            <img src={fields._imageBase64} alt="Scam screenshot" style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain", borderRadius: "2px" }} />
            <div style={{ fontSize: "7.5pt", color: "#64748b", marginTop: "4px" }}>Screenshot submitted as evidence by the complainant</div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: "24px", borderTop: "1px solid #e2e8f0", paddingTop: "8px", fontSize: "7.5pt", color: "#94a3b8", textAlign: "center" }}>
        Generated by Legal First-Aid | Report cybercrime at cybercrime.gov.in | National Helpline: 1930
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function ComplaintPreview({ initialFields, scamType, imageBase64, onBack }) {
  const [fields, setFields] = useState({ ...initialFields, _imageBase64: imageBase64 });
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [pdfSuccess, setPdfSuccess] = useState(false);

  const set = (key) => (e) => setFields((prev) => ({ ...prev, [key]: e.target.value }));

  const handleDownload = async () => {
    setPdfError("");
    setPdfSuccess(false);
    setPdfLoading(true);
    try {
      await downloadComplaintPDF({ scamType, ...fields, imageBase64 });
      setPdfSuccess(true);
    } catch {
      setPdfError("Failed to generate PDF. Please ensure the server is running.");
    } finally {
      setPdfLoading(false);
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-border text-slate-200 text-xs font-body placeholder:text-slate-600 focus:outline-none focus:border-slate-500 transition-colors";
  const labelCls = "text-xs font-mono text-muted block mb-1";

  return (
    <div className="flex flex-col gap-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-lg text-white">Complaint Preview</h2>
        <button onClick={onBack} className="btn-outline text-xs py-1.5 px-3">← Edit Chat</button>
      </div>

      {/* Side-by-side layout */}
      <div className="flex gap-4 items-start" style={{ minHeight: "600px" }}>

        {/* Left: Document Preview */}
        <div className="flex-1 border border-border rounded-xl overflow-hidden shadow-xl" style={{ maxHeight: "680px", overflowY: "auto", background: "#f0f0f0" }}>
          <div style={{ transform: "scale(0.72)", transformOrigin: "top left", width: "138.9%", pointerEvents: "none" }}>
            <ComplaintDocument fields={fields} scamType={scamType} />
          </div>
        </div>

        {/* Right: Edit Form */}
        <div className="w-72 flex-shrink-0 card p-4 flex flex-col gap-3 sticky top-4" style={{ maxHeight: "680px", overflowY: "auto" }}>
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <span className="text-sm">✏️</span>
            <span className="font-display font-semibold text-sm text-slate-200">Edit Details</span>
          </div>

          <div>
            <label className={labelCls}>Full Name *</label>
            <input className={inputCls} value={fields.fullName || ""} onChange={set("fullName")} placeholder="Your full name" />
          </div>

          <div>
            <label className={labelCls}>Phone Number *</label>
            <input className={inputCls} value={fields.phone || ""} onChange={set("phone")} placeholder="+91 XXXXX XXXXX" />
          </div>

          <div>
            <label className={labelCls}>Email Address *</label>
            <input className={inputCls} value={fields.email || ""} onChange={set("email")} placeholder="you@email.com" />
          </div>

          <div>
            <label className={labelCls}>Aadhaar — Last 4 Digits *</label>
            <input className={inputCls} value={fields.aadhaarLast4 || ""} onChange={set("aadhaarLast4")} placeholder="e.g. 4821" maxLength={4} />
          </div>

          <div>
            <label className={labelCls}>Aadhaar — Full Number <span className="text-slate-600">(optional)</span></label>
            <input className={inputCls} value={fields.aadhaarFull || ""} onChange={set("aadhaarFull")} placeholder="12-digit Aadhaar number" maxLength={14} />
            <p className="text-xs text-muted mt-1">Stored masked (XXXX-XXXX-1234) in complaint</p>
          </div>

          <div>
            <label className={labelCls}>PAN Card <span className="text-slate-600">(optional)</span></label>
            <input className={inputCls} value={fields.pan || ""} onChange={set("pan")} placeholder="e.g. ABCDE1234F" maxLength={10} />
          </div>

          <div>
            <label className={labelCls}>Residential Address *</label>
            <textarea className={inputCls + " resize-none"} value={fields.address || ""} onChange={set("address")} placeholder="Your full address" rows={2} />
          </div>

          <div>
            <label className={labelCls}>Date of Incident *</label>
            <input className={inputCls} value={fields.dateOfIncident || ""} onChange={set("dateOfIncident")} placeholder="e.g. 20 March 2025" />
          </div>

          <div>
            <label className={labelCls}>Description *</label>
            <textarea className={inputCls + " resize-none"} value={fields.description || ""} onChange={set("description")} placeholder="Describe what happened in detail..." rows={5} />
          </div>

          {/* Download button */}
          <div className="pt-2 border-t border-border">
            {pdfError && (
              <p className="text-accent text-xs mb-2 flex items-center gap-1"><span>⚠</span>{pdfError}</p>
            )}
            {pdfSuccess && (
              <p className="text-safe text-xs mb-2 flex items-center gap-1"><span>✓</span>PDF downloaded successfully!</p>
            )}
            <button
              onClick={handleDownload}
              disabled={pdfLoading || !fields.fullName}
              className={`w-full py-3 rounded-xl font-display font-bold text-sm transition-all ${
                !pdfLoading && fields.fullName
                  ? "bg-accent text-white hover:bg-red-600 active:scale-[0.98] shadow-lg shadow-accent/20"
                  : "bg-slate-800 text-slate-600 cursor-not-allowed"
              }`}
            >
              {pdfLoading ? "Generating..." : "⬇ Download PDF"}
            </button>
            <p className="text-xs text-muted text-center mt-2">
              Submit at{" "}
              <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" className="text-slate-400 underline">
                cybercrime.gov.in
              </a>
              {" "}or your local cyber cell
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
