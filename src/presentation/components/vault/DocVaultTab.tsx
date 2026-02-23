/**
 * DocVault Tab
 * Upload, manage, and classify documents with AI
 */

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  DocumentItem,
  AIDocumentClassification,
} from "../../../domain/entities/DocumentItem";
import { DocumentType } from "../../../domain/types";
import { documentService } from "../../../application/services/DocumentService";

export function DocVaultTab() {
  const { user, isVaultUnlocked } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>(
    DocumentType.CUSTOM,
  );
  const [documentNumber, setDocumentNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [classification, setClassification] =
    useState<AIDocumentClassification | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isVaultUnlocked && user) {
      loadDocuments();
    }
  }, [isVaultUnlocked, user]);

  const loadDocuments = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const docs = await documentService.listDocuments(user.id);
      setDocuments(docs);
    } catch (error) {
      console.error("Failed to load documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleClassifyDocument = async () => {
    if (!selectedFile) return;

    setIsClassifying(true);
    try {
      const result = await documentService.classifyDocument(selectedFile);
      setClassification(result);
      setDocumentType(result.documentType);
    } catch (error) {
      alert(
        "AI classification unavailable: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    } finally {
      setIsClassifying(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile || !user) return;

    setIsLoading(true);
    try {
      const metadata = {
        documentNumber: documentNumber || undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        notes: notes || undefined,
      };

      await documentService.uploadDocument(
        user.id,
        selectedFile,
        documentType,
        metadata,
      );

      // Reset form
      setShowUploadModal(false);
      setSelectedFile(null);
      setDocumentType(DocumentType.CUSTOM);
      setDocumentNumber("");
      setExpiryDate("");
      setNotes("");
      setClassification(null);
      setPreviewUrl(null);

      await loadDocuments();
    } catch (error) {
      alert(
        "Upload failed: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (doc: DocumentItem) => {
    try {
      const { data, fileName } = await documentService.downloadDocument(doc.id);

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(
        "Download failed: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      try {
        await documentService.deleteDocument(id);
        await loadDocuments();
      } catch (error) {
        alert("Delete failed");
      }
    }
  };

  const getDocumentIcon = (type: DocumentType) => {
    switch (type) {
      case DocumentType.AADHAAR:
        return "Aadhaar";
      case DocumentType.PAN:
        return "PAN";
      case DocumentType.MARKSHEET:
        return "Marksheet";
      case DocumentType.INCOME_CERTIFICATE:
        return "Income";
      case DocumentType.CASTE_CERTIFICATE:
        return "Caste";
      case DocumentType.DOMICILE_CERTIFICATE:
        return "Domicile";
      default:
        return "Document";
    }
  };

  const getDocumentTypeName = (type: DocumentType) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const isExpiringSoon = (date?: Date) => {
    if (!date) return false;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return date <= thirtyDaysFromNow && date > new Date();
  };

  if (!isVaultUnlocked) {
    return (
      <div className="vault-locked-message">
        <div className="lock-icon" aria-hidden="true" title="Locked" />
        <h2>Vault is Locked</h2>
        <p>Please unlock your vault to access documents.</p>
      </div>
    );
  }

  return (
    <div className="docvault-tab">
      {/* Header */}
      <div className="tab-header">
        <div>
          <h1>DocVault</h1>
          <p>Securely store and manage encrypted documents</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowUploadModal(true)}
        >
          Upload Document
        </button>
      </div>

      {/* Document Grid */}
      <div className="document-grid">
        {isLoading && documents.length === 0 ? (
          <div className="loading">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true" title="Documents" />
            <h3>No documents yet</h3>
            <p>Upload your first document to get started</p>
            <button
              className="btn-primary"
              onClick={() => setShowUploadModal(true)}
            >
              Upload Document
            </button>
          </div>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="document-card">
              <div className="doc-icon">
                {getDocumentIcon(doc.documentType)}
              </div>

              <div className="doc-info">
                <h3>{doc.fileName}</h3>
                <p className="doc-type">
                  {getDocumentTypeName(doc.documentType)}
                </p>
                <p className="doc-size">
                  {(doc.fileSize / 1024).toFixed(2)} KB
                </p>

                {doc.expiryDate && (
                  <p
                    className={`doc-expiry ${isExpiringSoon(doc.expiryDate) ? "warning" : ""}`}
                  >
                    {isExpiringSoon(doc.expiryDate)
                      ? "Expires soon: "
                      : "Expires: "}
                    {doc.expiryDate.toLocaleDateString()}
                  </p>
                )}

                <p className="doc-date">
                  Uploaded: {doc.createdAt.toLocaleDateString()}
                </p>
              </div>

              <div className="doc-actions">
                <button
                  className="btn-icon"
                  onClick={() => handleDownload(doc)}
                  title="Download"
                >
                  Download
                </button>
                <button
                  className="btn-icon"
                  onClick={() => handleDelete(doc.id)}
                  title="Delete"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="modal-content upload-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Upload Document</h2>
              <button
                className="btn-close"
                onClick={() => setShowUploadModal(false)}
              >
                Close
              </button>
            </div>

            <form onSubmit={handleUpload}>
              {/* File Upload Area */}
              <div
                className={`file-upload-area ${isDragging ? "dragging" : ""} ${selectedFile ? "has-file" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) =>
                    e.target.files && handleFileSelect(e.target.files[0])
                  }
                  style={{ display: "none" }}
                />

                {selectedFile ? (
                  <div className="file-selected">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="file-preview"
                      />
                    ) : (
                      <div
                        className="file-icon"
                        aria-hidden="true"
                        title="File"
                      />
                    )}
                    <p className="file-name">{selectedFile.name}</p>
                    <p className="file-size">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>

                    {previewUrl && (
                      <button
                        type="button"
                        className="btn-secondary btn-classify"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClassifyDocument();
                        }}
                        disabled={isClassifying}
                      >
                        {isClassifying ? "Classifying..." : "AI Classify"}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="upload-prompt">
                    <div
                      className="upload-icon"
                      aria-hidden="true"
                      title="Upload"
                    />
                    <p>Drag & drop your document here</p>
                    <p className="upload-hint">or click to browse</p>
                    <p className="upload-formats">
                      Supports: Images (JPG, PNG) and PDF
                    </p>
                  </div>
                )}
              </div>

              {/* AI Classification Result */}
              {classification && (
                <div className="classification-result">
                  <h4>AI Classification Result</h4>
                  <div className="classification-info">
                    <p>
                      <strong>Detected Type:</strong>{" "}
                      {getDocumentTypeName(classification.documentType)}
                    </p>
                    <p>
                      <strong>Confidence:</strong>{" "}
                      {(classification.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}

              {/* Document Metadata */}
              {selectedFile && (
                <div className="document-metadata">
                  <div className="form-group">
                    <label>Document Type *</label>
                    <select
                      value={documentType}
                      onChange={(e) =>
                        setDocumentType(e.target.value as DocumentType)
                      }
                      required
                    >
                      <option value={DocumentType.CUSTOM}>
                        Custom Document
                      </option>
                      <option value={DocumentType.AADHAAR}>Aadhaar Card</option>
                      <option value={DocumentType.PAN}>PAN Card</option>
                      <option value={DocumentType.MARKSHEET}>Marksheet</option>
                      <option value={DocumentType.INCOME_CERTIFICATE}>
                        Income Certificate
                      </option>
                      <option value={DocumentType.CASTE_CERTIFICATE}>
                        Caste Certificate
                      </option>
                      <option value={DocumentType.DOMICILE_CERTIFICATE}>
                        Domicile Certificate
                      </option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Document Number</label>
                    <input
                      type="text"
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      placeholder="e.g., ABCDE1234F"
                    />
                  </div>

                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Additional notes about this document"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!selectedFile || isLoading}
                >
                  {isLoading ? "Uploading..." : "Upload Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
