// File: frontend/src/services/api.js
// Description: API service for handling requests to the backend.

import axios from "axios";

// ========= BASE URL =========
// Pastikan ini selalu menjadi satu-satunya sumber URL API Anda.
const API_URL = process.env.REACT_APP_API_URL;
const TESSER_OCR_URL = process.env.REACT_APP_TESSER_OCR_URL;
const EASY_OCR_URL = process.env.REACT_APP_EASY_OCR_URL;

// ========= AXIOS INSTANCES =========

// 🔹 Instance umum untuk semua permintaan (JSON, delete, get, dll.)
export const api = axios.create({
  baseURL: API_URL, // <-- Selalu gunakan variabel dari .env
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔸 Instance khusus untuk upload file (FormData)
export const TessapiForm = axios.create({
  baseURL: TESSER_OCR_URL, // <-- Selalu gunakan variabel dari .env
  timeout: 300000, // Timeout lebih lama untuk upload besar
});

// 🔸 Instance khusus untuk upload file (FormData)
export const EasyapiForm = axios.create({
  baseURL: EASY_OCR_URL, // <-- Selalu gunakan variabel dari .env
  timeout: 300000, // Timeout lebih lama untuk upload besar
});

// ========= ENDPOINTS =========

// --- FAKTUR ---
// 🔥 DIPERBAIKI: Endpoint ini sekarang menunjuk ke alamat yang benar untuk FAKTUR.
export const processFaktur = (formData) => TessapiForm.post("/api/process", formData);
export const saveFaktur = (data) => api.post("/api/save", data);
export const deleteFaktur = (jenis, id) => api.delete(`/api/delete/${jenis}/${id}`);
export const fetchFakturHistory = () => api.get("/api/history");
// 🔥 DIPERBAIKI: Endpoint ini sekarang menunjuk ke alamat yang benar untuk FAKTUR.

// --- BUKTI SETOR ---
// ✅ BENAR: Endpoint ini sudah benar untuk BUKTI SETOR.
export const processBuktiSetor = (formData) => EasyapiForm.post("/api/bukti_setor/process", formData);
export const saveBuktiSetor = (data) => api.post("/api/bukti_setor/save", data);
export const deleteBuktiSetor = (id) => api.delete(`/api/bukti_setor/delete/${id}`);
export const fetchBuktiSetorHistory = () => api.get("/api/bukti_setor/history");
// ✅ BENAR: Endpoint ini sudah benar untuk BUKTI SETOR.

// --- MISC (Lain-lain) ---
export const exportExcel = () => api.get("/api/export", { responseType: "blob" });