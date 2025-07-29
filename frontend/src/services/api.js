// File: frontend/src/services/api.js
// Description: API service for Railway-deployed services with integrated database

import axios from "axios";

// ========= BASE URLs FOR RAILWAY SERVICES =========
// Updated untuk menggunakan Railway services yang sudah terintegrasi database
const FAKTUR_SERVICE_URL = process.env.REACT_APP_FAKTUR_SERVICE_URL || "https://deploy-production-72bc.up.railway.app";
const BUKTI_SETOR_SERVICE_URL = process.env.REACT_APP_BUKTI_SETOR_SERVICE_URL || "https://bukti-setor-service.up.railway.app";

// ========= AXIOS INSTANCES =========

// 🔹 Instance untuk Faktur Service (OCR + Database)
export const fakturApi = axios.create({
  baseURL: FAKTUR_SERVICE_URL,
  timeout: 300000, // 5 minutes untuk OCR processing
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔹 Instance untuk Bukti Setor Service (OCR + Database)  
export const buktiSetorApi = axios.create({
  baseURL: BUKTI_SETOR_SERVICE_URL,
  timeout: 300000, // 5 minutes untuk OCR processing
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔸 Instance khusus untuk upload file (FormData) - Faktur
export const fakturFormApi = axios.create({
  baseURL: FAKTUR_SERVICE_URL,
  timeout: 300000, // Timeout lebih lama untuk upload besar
});

// 🔸 Instance khusus untuk upload file (FormData) - Bukti Setor
export const buktiSetorFormApi = axios.create({
  baseURL: BUKTI_SETOR_SERVICE_URL,
  timeout: 300000, // Timeout lebih lama untuk upload besar
});

// ========= ENDPOINTS =========

// --- FAKTUR SERVICE (OCR + Database Integrated) ---
export const processFaktur = (formData) => fakturFormApi.post("/api/process", formData);
export const saveFaktur = (data) => fakturApi.post("/api/save-faktur", data);
export const deleteFaktur = (id) => fakturApi.delete(`/api/faktur/${id}`);
export const fetchFakturHistory = (page = 1, per_page = 50) => 
  fakturApi.get(`/api/faktur-history?page=${page}&per_page=${per_page}`);

// --- BUKTI SETOR SERVICE (OCR + Database Integrated) ---
export const processBuktiSetor = (formData) => buktiSetorFormApi.post("/api/process", formData);
export const saveBuktiSetor = (data) => buktiSetorApi.post("/api/save-bukti-setor", data);
export const deleteBuktiSetor = (id) => buktiSetorApi.delete(`/api/bukti-setor/${id}`);
export const fetchBuktiSetorHistory = (page = 1, per_page = 50) => 
  buktiSetorApi.get(`/api/bukti-setor-history?page=${page}&per_page=${per_page}`);

// --- HEALTH CHECK ENDPOINTS ---
export const checkFakturHealth = () => fakturApi.get("/health");
export const checkBuktiSetorHealth = () => buktiSetorApi.get("/health");