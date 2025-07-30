import React from "react";

const PreviewPanel = ({ data, onImageClick }) => {
  if (!data) return null;

  console.log("🧪 Data masuk ke PreviewPanel:", data);
  console.log("🧪 preview_image:", data.preview_image);
  
  // Gunakan Railway URL untuk preview image
  const railwayPreviewUrl = `${process.env.REACT_APP_FAKTUR_SERVICE_URL}/preview/${data.preview_image}`;
  console.log("🧪 Railway preview URL:", railwayPreviewUrl);

  return (
    <div className="preview-panel">
      <h3>Preview Halaman {data.halaman || 1}</h3>
      {data.preview_image ? (
        <img
          src={railwayPreviewUrl}
          alt="Preview"
          onClick={onImageClick}
          style={{
            maxWidth: "100%",
            cursor: "zoom-in",
            border: "1px solid #ccc",
            borderRadius: "8px"
          }}
          onError={(e) => {
            console.error("❌ Preview image load failed:", railwayPreviewUrl);
            e.target.style.display = 'none';
          }}
        />
      ) : (
        <p>Gambar preview tidak tersedia.</p>
      )}
    </div>
  );
};

export default PreviewPanel;
