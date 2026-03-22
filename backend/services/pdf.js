const PDFDocument = require("pdfkit");

const SCAM_LABELS = {
  phishing: "Phishing Attack",
  upi_fraud: "UPI Fraud",
  job_scam: "Job Scam",
  lottery_scam: "Lottery Scam",
  unknown: "Suspicious / Unknown Cybercrime",
};

const generateComplaintPDF = (data) => {
  return new Promise((resolve, reject) => {
    const {
      scamType, description, fullName, phone, email,
      aadhaarLast4, aadhaarFull, pan, address, dateOfIncident, imageBase64,
    } = data;

    const doc = new PDFDocument({ margin: 60, size: "A4" });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const today = new Date().toLocaleDateString("en-IN", {
      year: "numeric", month: "long", day: "numeric",
    });
    const scamLabel = SCAM_LABELS[scamType] || "Cybercrime";

    let aadhaarDisplay = "Not provided";
    if (aadhaarFull && aadhaarFull.replace(/\s/g, "").length === 12) {
      const clean = aadhaarFull.replace(/\s/g, "");
      aadhaarDisplay = `XXXX-XXXX-${clean.slice(-4)}`;
    } else if (aadhaarLast4) {
      aadhaarDisplay = `XXXX-XXXX-${aadhaarLast4}`;
    }

    // ── Header ───────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 90).fill("#0f172a");
    doc.fillColor("#ef4444").fontSize(20).font("Helvetica-Bold").text("CYBERCRIME COMPLAINT", 60, 26);
    doc.fillColor("#94a3b8").fontSize(9).font("Helvetica")
      .text("National Cyber Crime Reporting Portal  |  cybercrime.gov.in  |  Helpline: 1930", 60, 52);
    doc.fillColor("#475569").fontSize(8).text(`Generated: ${today}`, 60, 66);

    doc.moveDown(3.5);
    doc.fillColor("#1e293b").fontSize(10).font("Helvetica-Bold").text("To,");
    doc.font("Helvetica").fontSize(10).fillColor("#334155")
      .text("The Station House Officer / Cyber Crime Cell")
      .text("(Jurisdictional Police Station)");

    doc.moveDown(0.8);
    doc.fillColor("#475569").fontSize(9).font("Helvetica").text(`Date: ${today}`, { align: "right" });
    doc.moveDown(0.5);

    doc.fillColor("#0f172a").fontSize(11).font("Helvetica-Bold")
      .text(`Subject: Complaint Regarding ${scamLabel} — Request for FIR / Investigation`);
    doc.moveTo(60, doc.y + 5).lineTo(doc.page.width - 60, doc.y + 5).strokeColor("#e2e8f0").lineWidth(0.5).stroke();
    doc.moveDown(1);

    doc.font("Helvetica").fontSize(10).fillColor("#334155")
      .text("Respected Sir/Madam,\n\nI, the undersigned, wish to bring to your kind notice that I have been a victim of a cybercrime. The complete details of the incident and my personal particulars are furnished below for your immediate action.", { lineGap: 3 });
    doc.moveDown(1);

    // ── Section Header helper ─────────────────────────────────────────────────
    const sectionHeader = (label) => {
      const y = doc.y;
      doc.rect(60, y, doc.page.width - 120, 22).fill("#f1f5f9");
      doc.fillColor("#0f172a").fontSize(9).font("Helvetica-Bold").text(label, 68, y + 6);
      doc.y = y + 26;
    };

    const detailRow = (label, value) => {
      const y = doc.y;
      doc.fillColor("#64748b").fontSize(9).font("Helvetica-Bold").text(label + ":", 68, y, { width: 130, continued: false });
      doc.fillColor("#1e293b").fontSize(9).font("Helvetica").text(value || "Not provided", 205, y, { width: doc.page.width - 265 });
      doc.moveDown(0.45);
    };

    // ── Section A ─────────────────────────────────────────────────────────────
    sectionHeader("SECTION A — COMPLAINANT DETAILS");
    doc.moveDown(0.6);
    detailRow("Full Name", fullName);
    detailRow("Phone Number", phone);
    detailRow("Email Address", email);
    detailRow("Aadhaar Number", aadhaarDisplay);
    if (pan) detailRow("PAN Card Number", pan);
    detailRow("Residential Address", address);
    doc.moveDown(0.8);

    // ── Section B ─────────────────────────────────────────────────────────────
    sectionHeader("SECTION B — INCIDENT DETAILS");
    doc.moveDown(0.6);
    detailRow("Type of Cybercrime", scamLabel);
    detailRow("Date of Incident", dateOfIncident || "Not specified");
    doc.moveDown(0.4);

    doc.fillColor("#64748b").fontSize(9).font("Helvetica-Bold").text("Detailed Description of Incident:", 68);
    doc.moveDown(0.3);

    const descY = doc.y;
    const descText = description || "No description provided.";
    const descLineCount = Math.ceil(descText.length / 80);
    const descHeight = Math.max(80, Math.min(200, descLineCount * 14 + 20));
    doc.rect(68, descY, doc.page.width - 136, descHeight).fill("#f8fafc").stroke("#e2e8f0");
    doc.fillColor("#1e293b").fontSize(9.5).font("Helvetica")
      .text(descText, 76, descY + 8, { width: doc.page.width - 152, lineGap: 3 });
    doc.y = descY + descHeight + 12;
    doc.moveDown(1);

    // ── Section C ─────────────────────────────────────────────────────────────
    sectionHeader("SECTION C — DECLARATION & PRAYER");
    doc.moveDown(0.6);
    doc.font("Helvetica").fontSize(9.5).fillColor("#334155").text(
      "I hereby declare that the information furnished above is true and correct to the best of my knowledge and belief. I humbly request your good office to:\n\n" +
      "  1. Register an FIR / Complaint in this matter\n" +
      "  2. Investigate the incident and take appropriate legal action against the perpetrators\n" +
      "  3. Help trace and recover any financial losses incurred, if applicable\n\n" +
      "I am willing to provide any further information, documents, or assistance required in the course of investigation.",
      { lineGap: 3 }
    );

    // ── Signature (page 1) ────────────────────────────────────────────────────
    doc.moveDown(2);
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#0f172a").text("Yours faithfully,");
    doc.moveDown(0.4);
    doc.font("Helvetica").fontSize(10).fillColor("#334155")
      .text(`Name: ${fullName || "________________"}`)
      .text(`Phone: ${phone || "________________"}`)
      .text(`Date: ${today}`);
    doc.moveDown(0.5);
    doc.text("Signature: ________________");

    // Footer page 1
    const footerY = doc.page.height - 45;
    doc.rect(0, footerY - 8, doc.page.width, 55).fill("#f8fafc");
    doc.fillColor("#94a3b8").fontSize(7.5).font("Helvetica")
      .text("Generated by Legal First-Aid | Report cybercrime at cybercrime.gov.in | National Helpline: 1930",
        60, footerY, { align: "center", width: doc.page.width - 120 });

    // ── Screenshot Evidence (page 2) ─────────────────────────────────────────
    if (imageBase64) {
      try {
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        if (!base64Data || base64Data.length < 100) throw new Error("Empty image data");

        const imgBuffer = Buffer.from(base64Data, "base64");

        // Verify JPEG (ffd8) or PNG (8950) magic bytes
        const magic = imgBuffer.slice(0, 4).toString("hex");
        if (!magic.startsWith("ffd8") && !magic.startsWith("8950")) {
          throw new Error("Unsupported format, magic: " + magic);
        }

        // Add page ONLY after validation passes
        doc.addPage();

        // Header bar — all absolute Y positions
        doc.rect(0, 0, doc.page.width, 55).fill("#0f172a");
        doc.fillColor("#ef4444").fontSize(14).font("Helvetica-Bold")
          .text("EXHIBIT A — SCREENSHOT EVIDENCE", 60, 18);
        doc.fillColor("#94a3b8").fontSize(9).font("Helvetica")
          .text("cybercrime.gov.in  |  Helpline: 1930", 60, 38);

        doc.fillColor("#334155").fontSize(10).font("Helvetica")
          .text(
            "The following screenshot was submitted by the complainant as evidence of the cybercrime incident described in this complaint.",
            60, 75, { width: doc.page.width - 120 }
          );

        // Image — fixed absolute position, never depends on doc.y
        const imgX = 60;
        const imgY = 120;
        const maxW = doc.page.width - 120;
        const maxH = doc.page.height - 200;
        doc.image(imgBuffer, imgX, imgY, { fit: [maxW, maxH] });

        doc.fillColor("#94a3b8").fontSize(8).font("Helvetica")
          .text(
            "Screenshot provided by complainant. Authenticity to be verified during investigation.",
            60, doc.page.height - 50,
            { align: "center", width: doc.page.width - 120 }
          );
      } catch (imgErr) {
        console.error("PDF image embed error:", imgErr.message);
      }
    }

    doc.end();
  });
};

module.exports = { generateComplaintPDF };
