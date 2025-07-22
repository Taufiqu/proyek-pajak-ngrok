// src/components/BuktiSetorPage.jsx
import React, { useState, useEffect, useRef } from "react";
import Layout from "../Layout";
import UploadFormBuktiSetor from "./UploadFormBuktiSetor";
import BuktiSetorValidationForm from "./BuktiSetorValidationForm";
import NavigationButtonsBuktiSetor from "./NavigationButtonsBuktiSetor";
import ImageModal from "./ImageModal";
import { processBuktiSetor, saveBuktiSetor, saveFaktur } from "../../services/api";
import TutorialPanelBuktiSetor from "./TutorialPanelBuktiSetor";
import { toast } from "react-toastify";
import LoadingSpinner from "../LoadingSpinner";

const BuktiSetorPage = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalSrc, setModalSrc] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    const savedResults = localStorage.getItem("buktiValidationResults");
    const savedFiles = localStorage.getItem("buktiSelectedFiles");
    const savedIndex = localStorage.getItem("buktiCurrentIndex");

    if (savedResults) {
      setValidationResults(JSON.parse(savedResults));
    }

    if (savedFiles) {
      try {
        const parsed = JSON.parse(savedFiles);
        setSelectedFiles(parsed);
      } catch (e) {
        console.warn("Gagal parse saved selected files");
      }
    }

    if (savedIndex) {
      setCurrentIndex(parseInt(savedIndex, 10) || 0);
    }
  }, []);

  useEffect(() => {
    if (validationResults.length > 0) {
      localStorage.setItem("buktiValidationResults", JSON.stringify(validationResults));
      localStorage.setItem("buktiCurrentIndex", currentIndex.toString());
      // Reset currentIndex jika melebihi batas array
      if (currentIndex >= validationResults.length) {
        setCurrentIndex(0);
      }
    }
  }, [validationResults, currentIndex]);

  useEffect(() => {
    if (selectedFiles.length > 0) {
      localStorage.setItem("buktiSelectedFiles", JSON.stringify(selectedFiles.map(f => ({ name: f.name }))));
    }
  }, [selectedFiles]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);

  // 🔄 Proses file upload satu per satu
 const handleProcess = async () => {
  if (!selectedFiles.length) {
    toast.warn("Belum ada file yang dipilih.");
    return;
  }

  toast.info("Mulai memproses file, mohon tunggu...");
  setIsProcessing(true);
  setValidationResults([]);
  setCurrentIndex(0);
  setUploadError("");
  setIsLoading(true);

  try {
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const formData = new FormData();
      formData.append("file", file);

      const res = await processBuktiSetor(formData);
      const rawData = res.data?.data || [];

      const formatted = rawData.map((item) => ({
        ...item,
        id: `bukti-${Date.now()}-${Math.random()}`,
        preview_filename: item.preview_filename || file.name,
      }));

      setValidationResults((prev) => [...prev, ...formatted]);
    }
  } catch (err) {
    console.error("❌ Gagal proses file:", err);
    toast.error("Gagal memproses salah satu file.");
  } finally {
    setIsLoading(false);
    setIsProcessing(false);
    toast.success("Selesai memproses file!");
  }
};


  // 📝 Ubah field data
  const handleDataChange = (id, field, value) => {
    setValidationResults((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  // 💾 Simpan ke backend
  const handleSaveItem = async (id) => {
    const item = validationResults.find((val) => val.id === id);
    if (!item) return;

    console.log("[🛰️ DATA YANG DIKIRIM KE BACKEND]", item); // Tambahin ini!

    try {
      await saveBuktiSetor(item);
      toast.success("Data berhasil disimpan.");
    } catch (err) {
      console.error("❌ Gagal simpan:", err);
      toast.error("Gagal menyimpan data.");
    }
  };

  const handleSaveAll = async () => {
    try {
      const payload = validationResults.map((item) => item);
      // Catatan: Untuk bukti setor, mungkin perlu endpoint khusus untuk save all
      // Sementara ini masih menggunakan endpoint faktur
      const res = await saveFaktur(payload);
      toast.success(res.data.message || "Berhasil simpan semua data!");
    } catch (err) {
      console.error("Save all error:", err);
      toast.error("Gagal menyimpan semua data.");
    }
  };

  const handleNext = () => {
    if (currentIndex < validationResults.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

    const handleReset = () => {
    // 🔄 Reset semua state utama
    setSelectedFiles([]);
    setValidationResults([]);
    setFiles([]);
    setCurrentIndex(0);
    setModalSrc(null);
    setUploadError("");

    // 🗑️ Bersihin localStorage
    localStorage.removeItem("buktiValidationResults");
    localStorage.removeItem("buktiSelectedFiles");
    localStorage.removeItem("buktiCurrentIndex");

    // ❌ Kosongin input file
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }

    toast.info("Form berhasil di-reset 🚿");
    console.log("🧠 validationResults:", validationResults);
    console.log("🖼️ preview_filename current index:", validationResults[currentIndex]?.preview_filename);
    console.log("🔍 Image modal src:", modalSrc);
  };

  return (
    <Layout>
      {isProcessing && <LoadingSpinner message="Sedang memproses file..." />}
      <div className="p-4">
        <h1 className="page-title">OCR Bukti Setor Pajak</h1>

        {/* 🗂️ Upload & Proses */}
        <UploadFormBuktiSetor
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
          handleProcess={handleProcess}
          loading={isLoading}
          fileInputRef={fileInputRef}
        />

        {uploadError && <div className="error-text">{uploadError}</div>}

        {/* 📘 Jika belum ada hasil, tampilkan tutorial */}
        {validationResults.length === 0 && !isLoading ? (
          <TutorialPanelBuktiSetor />
        ) : (
          <>
            {/* 📄 Tampilkan halaman saat ini saja (navigation method) */}
            {validationResults.length > 0 && (
              <div className="preview-form-container">
                <div className="form-column">
                  <BuktiSetorValidationForm
                    itemData={validationResults[currentIndex]}
                    onDataChange={handleDataChange}
                    onSave={() => handleSaveItem(validationResults[currentIndex]?.id)}
                    onImageClick={() => {
                      const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
                      const newSrc = `${baseUrl}/api/bukti_setor/uploads/${validationResults[currentIndex]?.preview_filename}`;
                      console.log("🖱️ Clicked image, set modalSrc to:", newSrc);
                      setModalSrc(newSrc);
                    }}
                  />
                </div>
                <NavigationButtonsBuktiSetor
                  currentIndex={currentIndex}
                  total={validationResults.length}
                  handleBack={handleBack}
                  handleNext={handleNext}
                  handleSave={() => handleSaveItem(validationResults[currentIndex]?.id)}
                  handleSaveAll={handleSaveAll}
                  handleReset={handleReset}
                />
              </div>
            )}
            {modalSrc && (
              <ImageModal
                src={modalSrc}
                onClose={() => setModalSrc(null)}
              />
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default BuktiSetorPage;
