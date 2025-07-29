// MainOCRPage.jsx

import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import UploadForm from "./UploadForm";
import PreviewPanel from "./PreviewPanel";
import ValidationForm from "./ValidationForm";
import NavigationButtons from "./NavigationButtons";
import TutorialPanel from "./TutorialPanel";
import Layout from "../Layout";
import LoadingSpinner from "../LoadingSpinner";
import ImageModal from "./ImageModal";
import "../ServiceStatus.css";
import {
  processFaktur,
  saveFaktur,
  handleApiError,
  testFakturConnection,
} from "../../services/api";

function App() {
  const [namaPtUtama, setNamaPtUtama] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [formPages, setFormPages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [modalSrc, setModalSrc] = useState(null);
  const [serviceStatus, setServiceStatus] = useState({ connected: null, message: "" });

  const fileInputRef = useRef(null);

  // Test service connection saat component mount
  useEffect(() => {
    const checkServiceConnection = async () => {
      console.log("🔍 Checking service connection on mount...");
      const result = await testFakturConnection();
      setServiceStatus({
        connected: result.success,
        message: result.success 
          ? "✅ Railway service terhubung" 
          : `❌ Service tidak dapat diakses: ${result.error}`
      });
    };

    checkServiceConnection();
  }, []);

  useEffect(() => {
    const savedPages = localStorage.getItem("formPages");
    const savedIndex = localStorage.getItem("formIndex");
    if (savedPages) {
      setFormPages(JSON.parse(savedPages));
      setCurrentIndex(parseInt(savedIndex, 10) || 0);
    }
  }, []);

  useEffect(() => {
    if (formPages.length > 0) {
      localStorage.setItem("formPages", JSON.stringify(formPages));
      localStorage.setItem("formIndex", currentIndex);
    }
  }, [formPages, currentIndex]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!namaPtUtama || selectedFiles.length === 0) return;

    toast.info("Mulai memproses file, mohon tunggu...");
    setIsProcessing(true);
    setFormPages([]);
    setCurrentIndex(0);
    setUploadError("");

    try {
      const allPages = [];

      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("nama_pt_utama", namaPtUtama);

        const res = await processFaktur(formData);

        for (let [key, value] of formData.entries()) {
          console.log(`${key}:`, value);
        }

        if (res.data?.results) {
          allPages.push(...res.data.results);
        } else {
          toast.error("Data hasil tidak ditemukan.");
        }
      }

      setFormPages(allPages);
      toast.success("Semua file berhasil diproses!");
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
      
      // Jika error 502, coba test connection untuk diagnose
      if (error.response?.status === 502) {
        console.log("🔍 Testing service connection due to 502 error...");
        testFakturConnection().then(result => {
          if (!result.success) {
            console.error("🚨 Service connection test failed:", result.error);
          }
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!formPages.length) {
      toast.error("Tidak ada halaman untuk disimpan.");
      return;
    }

    const currentPage = formPages[currentIndex];
    if (!currentPage || !currentPage.data) {
      toast.error("Halaman kosong atau data tidak lengkap.");
      return;
    }

    const parseRupiahToInt = (val) => {
      if (typeof val === "number") return val;
      if (typeof val === "string") {
        return parseInt(val.replace(/[^0-9]/g, ""), 10) || 0;
      }
      return 0;
    };

    const payload = {
      no_faktur: currentPage.data.no_faktur,
      tanggal: currentPage.data.tanggal,
      npwp_lawan_transaksi: currentPage.data.npwp_lawan_transaksi,
      nama_lawan_transaksi: currentPage.data.nama_lawan_transaksi,
      keterangan: currentPage.data.keterangan,
      dpp: parseRupiahToInt(currentPage.data.dpp),
      ppn: parseRupiahToInt(currentPage.data.ppn),
    };

    try {
      const res = await saveFaktur(payload);
      toast.success(res.data.message || "Data berhasil disimpan!");
      localStorage.removeItem("formPages");
      localStorage.removeItem("formIndex");
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Gagal menyimpan data.");
    }
  };

  const handleSaveAll = async () => {
    try {
      const payload = formPages.map((page) => page.data);
      const res = await saveFaktur(payload);
      toast.success(res.data.message || "Berhasil simpan semua data!");
    } catch (err) {
      console.error("Save all error:", err);
      toast.error("Gagal menyimpan semua data.");
    }
  };

  const handleNext = () => {
    if (currentIndex < formPages.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleReset = () => {
    localStorage.removeItem("formPages");
    localStorage.removeItem("formIndex");
    localStorage.removeItem("selectedFiles");
    setUploadError("");
    setIsProcessing(false);
    setSelectedFiles([]);
    setFormPages([]);
    setCurrentIndex(0);

    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }

    toast.info("Form berhasil di-reset 🚿");
  };

  // GANTI INI BRO
  const currentPage = formPages[currentIndex];

  console.log("🧠 currentPage (dari formPages):", currentPage);
  console.log("🖼️ preview_image:", currentPage?.preview_image);
  console.log("🔍 src:", `${process.env.REACT_APP_API_URL}/preview/${currentPage?.preview_image}`);

  return (
    <Layout>
      {isProcessing && <LoadingSpinner message="Sedang memproses file..." />}

      <h1 className="page-title">OCR Faktur Pajak</h1>

      {/* Service Status Display */}
      {serviceStatus.connected !== null && (
        <div className={`service-status ${serviceStatus.connected ? 'connected' : 'disconnected'}`}>
          <p>{serviceStatus.message}</p>
          {!serviceStatus.connected && (
            <small>
              🔧 Jika Anda melihat error CORS atau 502, pastikan Railway service aktif dan CORS dikonfigurasi untuk https://pajak-ocr.vercel.app
            </small>
          )}
        </div>
      )}

      <UploadForm
        handleUpload={handleUpload}
        namaPtUtama={namaPtUtama}
        setNamaPtUtama={setNamaPtUtama}
        selectedFiles={selectedFiles}
        setSelectedFiles={setSelectedFiles}
      />

      {uploadError && <div className="error-text">{uploadError}</div>}

      {formPages.length > 0 ? (
        <>
          <div className="preview-form-container">
            <div className="preview-column">
              <PreviewPanel
                data={currentPage}
                onImageClick={() =>
                  setModalSrc(`${process.env.REACT_APP_API_URL}/preview/${currentPage.preview_image}`)
                }
              />
            </div>
            <div className="form-column">
              <ValidationForm
                data={currentPage.data}
                onImageClick={() =>
                  setModalSrc(`${process.env.REACT_APP_API_URL}/preview/${currentPage.preview_image}`)
                }
                updateData={(updatedFields) => {
                  const updated = [...formPages];
                  updated[currentIndex].data = {
                    ...updated[currentIndex].data,
                    ...updatedFields,
                  };
                  setFormPages(updated);
                }}
              />
            </div>
          </div>

          <NavigationButtons
            currentIndex={currentIndex}
            total={formPages.length}
            handleBack={handleBack}
            handleNext={handleNext}
            handleSave={handleSave}
            handleSaveAll={handleSaveAll}
            handleReset={handleReset}
          />
        </>
      ) : (
        !isProcessing && <TutorialPanel />
      )}

      {modalSrc && (
        <ImageModal
          src={modalSrc}
          onClose={() => setModalSrc(null)}
        />
      )}
    </Layout>
  );
}

export default App;
