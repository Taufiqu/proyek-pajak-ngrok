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
    "Accept": "application/json",
  },
});

// 🔹 Instance untuk Bukti Setor Service (OCR + Database)  
export const buktiSetorApi = axios.create({
  baseURL: BUKTI_SETOR_SERVICE_URL,
  timeout: 300000, // 5 minutes untuk OCR processing
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

// 🔸 Instance khusus untuk upload file (FormData) - Faktur
export const fakturFormApi = axios.create({
  baseURL: FAKTUR_SERVICE_URL,
  timeout: 300000, // Timeout lebih lama untuk upload besar
  headers: {
    "Accept": "application/json",
  },
});

// 🔸 Instance khusus untuk upload file (FormData) - Bukti Setor
export const buktiSetorFormApi = axios.create({
  baseURL: BUKTI_SETOR_SERVICE_URL,
  timeout: 300000, // Timeout lebih lama untuk upload besar
  headers: {
    "Accept": "application/json",
  },
});

// ========= INTERCEPTORS & ERROR HANDLING =========

// 🛡️ Error interceptor untuk Faktur API
fakturApi.interceptors.response.use(
  (response) => {
    console.log("✅ Faktur API Success:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error("❌ Faktur API Error:", error.response?.status, error.message);
    console.error("🔍 Request URL:", error.config?.url);
    console.error("🔍 Request Headers:", error.config?.headers);
    
    if (error.response?.status === 502) {
      console.error('🔥 Bad Gateway - Railway service mungkin sedang starting up');
    } else if (error.response?.status === 0 || error.code === 'ERR_NETWORK') {
      console.error('🌐 Network Error - Kemungkinan CORS issue');
    }
    return Promise.reject(error);
  }
);

// 🛡️ Error interceptor untuk Faktur Form API
fakturFormApi.interceptors.response.use(
  (response) => {
    console.log("✅ Faktur Form API Success:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error("❌ Faktur Form API Error:", error.response?.status, error.message);
    console.error("🔍 Upload URL:", error.config?.url);
    
    if (error.response?.status === 502) {
      console.error('🔥 Bad Gateway - Railway service mungkin sedang cold start');
    } else if (error.response?.status === 0 || error.code === 'ERR_NETWORK') {
      console.error('🌐 Network/CORS Error - Periksa Railway CORS configuration');
    }
    return Promise.reject(error);
  }
);

// ========= ENDPOINTS =========

// --- FAKTUR SERVICE (OCR + Database Integrated) ---
export const processFaktur = (formData) => {
  console.log("🚀 Processing Faktur with Railway API:", FAKTUR_SERVICE_URL);
  return fakturFormApi.post("/api/process", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const saveFaktur = (data) => {
  console.log("💾 Saving Faktur data:", data);
  return fakturApi.post("/api/save-faktur", data);
};

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
export const checkFakturHealth = () => {
  console.log("🏥 Checking Faktur service health:", FAKTUR_SERVICE_URL);
  return fakturApi.get("/health");
};

export const checkBuktiSetorHealth = () => {
  console.log("🏥 Checking Bukti Setor service health:", BUKTI_SETOR_SERVICE_URL);
  return buktiSetorApi.get("/health");
};

// --- UTILITY FUNCTIONS ---
export const testFakturConnection = async () => {
  try {
    console.log("🔍 Testing Faktur service connection...");
    const response = await fakturApi.get("/");
    console.log("✅ Faktur service reachable:", response.status);
    return { success: true, status: response.status };
  } catch (error) {
    console.error("❌ Faktur service unreachable:", error.message);
    return { success: false, error: error.message };
  }
};

// Error handler utility
export const handleApiError = (error) => {
  if (error.code === 'ERR_NETWORK') {
    return 'Koneksi ke server gagal. Pastikan Railway service aktif dan CORS dikonfigurasi dengan benar.';
  }
  if (error.response?.status === 502) {
    return 'Service sedang starting up. Silakan tunggu beberapa saat dan coba lagi.';
  }
  if (error.response?.status === 404) {
    return 'Endpoint tidak ditemukan. Periksa URL API.';
  }
  if (error.response?.status === 500) {
    return 'Terjadi kesalahan di server. Silakan coba lagi nanti.';
  }
  return error.message || 'Terjadi kesalahan yang tidak diketahui.';
};