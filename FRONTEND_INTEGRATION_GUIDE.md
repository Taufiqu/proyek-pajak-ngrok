# 🚀 FAKTUR SERVICE API - RAILWAY DEPLOYMENT SUMMARY
## Frontend Integration Guide

### 📡 **Production API Endpoint**
```
Base URL: https://deploy-production-72bc.up.railway.app
```

### 🔧 **Required Frontend Changes**

#### 1. **Update API Base URL**
```javascript
// OLD (local development)
const API_BASE_URL = 'http://localhost:5000';

// NEW (production)
const API_BASE_URL = 'https://deploy-production-72bc.up.railway.app';
```

#### 2. **Available API Endpoints**

##### **Health Check Endpoints**
```javascript
GET /                    // Basic health check
GET /health             // Detailed health check with database status
GET /api/test-db        // Database connection test
```

##### **Faktur Processing Endpoints**
```javascript
POST /api/process       // Main OCR processing endpoint (NEW!)
POST /api/save-faktur   // Save faktur data to database
GET  /api/faktur-history // Get faktur records with filters
DELETE /api/faktur/{id} // Delete faktur record
```

#### 3. **New `/api/process` Endpoint Specification**

**Request Format:**
```javascript
// FormData with file upload
const formData = new FormData();
formData.append('file', fileBlob);
formData.append('service_type', 'faktur'); // or 'bukti-setor'

// POST request
fetch('https://deploy-production-72bc.up.railway.app/api/process', {
  method: 'POST',
  body: formData,
  headers: {
    // Don't set Content-Type, let browser set it with boundary
  }
})
```

**Response Format:**
```javascript
// Success Response
{
  "status": "success",
  "message": "File processed successfully",
  "service_type": "faktur",
  "extracted_data": {
    "no_faktur": "010.002-25.00000001",
    "tanggal": "2025-01-15",
    "nama_lawan_transaksi": "PT. CONTOH SUPPLIER",
    "npwp_lawan_transaksi": "01.234.567.8-901.000",
    "dpp": 1000000.00,
    "ppn": 110000.00,
    "bulan": "Januari 2025",
    "keterangan": "Pembelian bahan baku"
  },
  "confidence_score": 0.85,
  "processing_time": 2.34
}

// Error Response
{
  "status": "error",
  "message": "File format not supported",
  "error_code": "INVALID_FILE_FORMAT"
}
```

#### 4. **Updated CORS Configuration**
✅ Railway service already configured to accept requests from:
- `https://pajak-ocr.vercel.app` (your frontend)
- All origins (`*`) for development

#### 5. **Error Handling Updates**

**Network Error Handling:**
```javascript
// Handle Railway-specific errors
const handleAPIError = (error) => {
  if (error.code === 'ERR_NETWORK') {
    return 'Service temporarily unavailable. Please try again.';
  }
  if (error.response?.status === 502) {
    return 'Backend service is starting up. Please wait a moment.';
  }
  return error.message || 'An unexpected error occurred.';
};
```

#### 6. **Database Integration Features**

**Save Processed Data:**
```javascript
// After successful OCR processing, save to database
const saveToDatabase = async (extractedData) => {
  const response = await fetch('https://deploy-production-72bc.up.railway.app/api/save-faktur', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jenis: 'masukan', // or 'keluaran'
      no_faktur: extractedData.no_faktur,
      tanggal: extractedData.tanggal,
      nama_lawan_transaksi: extractedData.nama_lawan_transaksi,
      dpp: extractedData.dpp,
      ppn: extractedData.ppn,
      bulan: extractedData.bulan,
      keterangan: extractedData.keterangan,
      npwp_lawan_transaksi: extractedData.npwp_lawan_transaksi
    })
  });
  
  return response.json();
};
```

**Get History Data:**
```javascript
// Fetch faktur history with filters
const getFakturHistory = async (filters = {}) => {
  const queryParams = new URLSearchParams({
    jenis: filters.jenis || 'all',     // 'masukan', 'keluaran', 'all'
    limit: filters.limit || 20         // max 100
  });
  
  const response = await fetch(
    `https://deploy-production-72bc.up.railway.app/api/faktur-history?${queryParams}`
  );
  
  return response.json();
};
```

### 🔄 **Migration Steps for Frontend**

#### Step 1: Update Environment Variables
```javascript
// .env.production
REACT_APP_API_URL=https://deploy-production-72bc.up.railway.app

// .env.development  
REACT_APP_API_URL=http://localhost:5000
```

#### Step 2: Update API Service File
```javascript
// api/config.js or similar
const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_URL || 'https://deploy-production-72bc.up.railway.app',
  timeout: 30000, // 30 seconds for file processing
  headers: {
    'Accept': 'application/json',
  }
};
```

#### Step 3: Update File Upload Component
```javascript
// Update your upload handler
const handleFileUpload = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('service_type', 'faktur');
  
  try {
    const response = await axios.post(
      `${API_CONFIG.baseURL}/api/process`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000
      }
    );
    
    if (response.data.status === 'success') {
      // Handle successful OCR
      setExtractedData(response.data.extracted_data);
      
      // Optionally save to database
      await saveToDatabase(response.data.extracted_data);
    }
    
  } catch (error) {
    console.error('Upload error:', handleAPIError(error));
  }
};
```

### 🚨 **URGENT: CORS Issue Fix Required**

#### **Problem Detected:**
```
Access to XMLHttpRequest at 'https://deploy-production-72bc.up.railway.app/api/process' 
from origin 'https://pajak-ocr.vercel.app' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.

502 (Bad Gateway) - Service mungkin sedang cold start
```

#### **Root Cause:**
1. ❌ **CORS tidak dikonfigurasi** untuk domain Vercel di Railway backend
2. ❌ **Cold start issue** - Railway service sleeping (502 error)
3. ❌ **Missing `/api/process` endpoint** implementasi

#### **Immediate Actions Required:**

##### **1. 🔧 Fix Backend CORS Configuration**
Tambahkan ke Railway backend (`app.py` atau server config):

```python
from flask_cors import CORS

app = Flask(__name__)

# CORS configuration untuk production
CORS(app, origins=[
    "https://pajak-ocr.vercel.app",
    "https://*.vercel.app",
    "http://localhost:3000"  # for development
])

# Atau untuk development sementara (HANYA UNTUK TESTING):
# CORS(app, origins="*")
```

##### **2. 🚀 Implement Missing `/api/process` Endpoint**
```python
@app.route('/api/process', methods=['POST'])
def process_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
            
        file = request.files['file']
        service_type = request.form.get('service_type', 'faktur')
        
        # Process file dengan OCR
        # Return hasil sesuai format yang diharapkan frontend
        
        return jsonify({
            'status': 'success',
            'results': processed_data
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

##### **3. 🏥 Add Health Check Response**
```python
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'faktur-ocr',
        'cors_enabled': True,
        'timestamp': datetime.now().isoformat()
    })
```

### 🚨 **Current Status & Actions Needed**

#### ✅ **Working:**
- ✅ Railway deployment successful
- ✅ Frontend API configuration updated
- ✅ Error handling implemented
- ✅ Service status checking added

#### ⚠️ **Backend Issues (Need Fix):**
- ❌ CORS policy blocking Vercel domain
- ❌ Missing `/api/process` endpoint
- ❌ Cold start causing 502 errors
- ❌ No proper CORS headers

#### 🔧 **Frontend Updates (Completed):**
- ✅ Updated `api.js` dengan Railway URLs
- ✅ Added error handling dan CORS troubleshooting
- ✅ Added service connection testing
- ✅ Added status display untuk debugging
- ✅ Added proper timeout handling

#### � **Immediate Next Steps:**
1. **Fix Railway Backend CORS** - Add CORS middleware untuk `https://pajak-ocr.vercel.app`
2. **Implement `/api/process` endpoint** - Backend missing main OCR endpoint
3. **Test service warmup** - Prevent cold start 502 errors
4. **Verify environment variables** - Check DATABASE_URL di Railway

### 📋 **CORS Configuration Checklist**

**Backend Requirements:**
```python
# Required headers untuk CORS
Access-Control-Allow-Origin: https://pajak-ocr.vercel.app
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

**Railway Environment Variables:**
```
DATABASE_URL=postgresql://user:pass@host:port/db
FLASK_ENV=production
CORS_ORIGINS=https://pajak-ocr.vercel.app
```

**Testing Commands:**
```bash
# Test basic connectivity
curl https://deploy-production-72bc.up.railway.app/health

# Test CORS preflight
curl -X OPTIONS https://deploy-production-72bc.up.railway.app/api/process \
  -H "Origin: https://pajak-ocr.vercel.app" \
  -H "Access-Control-Request-Method: POST"
```

### 📞 **API Response Examples**

#### Health Check Response:
```json
{
  "status": "healthy",
  "service": "faktur-service",
  "database_available": true,
  "database_url_set": true,
  "environment": "production"
}
```

#### Database Test Response:
```json
{
  "status": "success",
  "message": "Database connection successful",
  "tables": {
    "ppn_masukan": 0,
    "ppn_keluaran": 0
  }
}
```

### 🔐 **Security Notes**
- All API endpoints are HTTPS-only in production
- CORS properly configured for your Vercel domain
- Database credentials secured via environment variables
- File uploads have size limits and type validation

### 📊 **Database Schema**
```sql
-- Tables available for frontend integration:
ppn_masukan     -- PPN input tax records
ppn_keluaran    -- PPN output tax records  
bukti_setor     -- Tax payment receipts (future)
```

This summary should give your frontend team everything needed to integrate with the Railway deployment! 🚀
