import axios from "axios";

const api = axios.create({
  baseURL: "https://law-mantra.onrender.com/api/",
  timeout: 60000,
});

export const analyzeImage = async (imageFile) => {
  const formData = new FormData();
  formData.append("image", imageFile);
  const { data } = await api.post("/analyze", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const sendChatMessage = async (conversationHistory, scamContext, collectedFields) => {
  const { data } = await api.post("/chat", {
    conversationHistory,
    scamContext,
    collectedFields,
  });
  return data;
};

export const downloadComplaintPDF = async (payload) => {
  const response = await api.post("/generate-pdf", payload, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `cybercrime_complaint_${Date.now()}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const sendLegalChatMessage = async (conversationHistory) => {
  const { data } = await api.post("/legal-chat", { conversationHistory });
  return data.message;
};
