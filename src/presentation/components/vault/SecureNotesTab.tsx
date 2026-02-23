/**
 * Secure Notes Tab
 * Create and manage encrypted notes with voice transcription
 */

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { NoteItem, NoteData } from "../../../domain/entities/NoteItem";
import { notesService } from "../../../application/services/NotesService";

export function SecureNotesTab() {
  const { user, isVaultUnlocked } = useAuth();
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<{
    note: NoteItem;
    data: NoteData;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isRichText, setIsRichText] = useState(false);

  useEffect(() => {
    if (isVaultUnlocked && user) {
      loadNotes();
    }
  }, [isVaultUnlocked, user]);

  const loadNotes = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const notesList = await notesService.listNotes(user.id);
      setNotes(notesList);
    } catch (error) {
      console.error("Failed to load notes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    setIsLoading(true);
    try {
      const noteData: NoteData = {
        title,
        content,
        isRichText,
        voiceRecorded: false,
      };

      await notesService.createNote(user.id, noteData);

      // Reset form
      setShowCreateModal(false);
      setTitle("");
      setContent("");
      setIsRichText(false);

      await loadNotes();
    } catch (error) {
      alert(
        "Failed to create note: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceNote = async () => {
    if (!user) return;

    setIsRecording(true);
    try {
      const voiceTitle = title || "Voice Note " + new Date().toLocaleString();
      const note = await notesService.createNoteFromVoice(
        user.id,
        voiceTitle,
        60000,
      );

      setShowCreateModal(false);
      setTitle("");
      setContent("");

      await loadNotes();
      alert("Voice note created successfully!");
    } catch (error) {
      alert(
        "Voice recording failed: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    } finally {
      setIsRecording(false);
    }
  };

  const handleViewNote = async (note: NoteItem) => {
    try {
      const fullNote = await notesService.getNote(note.id);
      if (fullNote) {
        setSelectedNote(fullNote);
        setShowViewModal(true);
      }
    } catch (error) {
      alert("Failed to load note");
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      try {
        await notesService.deleteNote(id);
        await loadNotes();
      } catch (error) {
        alert("Delete failed");
      }
    }
  };

  const handleSearch = async () => {
    if (!user) return;

    if (searchQuery.trim() === "") {
      await loadNotes();
      return;
    }

    try {
      const results = await notesService.searchNotes(user.id, searchQuery);
      setNotes(results);
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isVaultUnlocked) {
    return (
      <div className="vault-locked-message">
        <div className="lock-icon" aria-hidden="true" title="Locked" />
        <h2>Vault is Locked</h2>
        <p>Please unlock your vault to access notes.</p>
      </div>
    );
  }

  return (
    <div className="notes-tab">
      {/* Header */}
      <div className="tab-header">
        <div>
          <h1>Secure Notes</h1>
          <p>Create encrypted notes with voice transcription</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          New Note
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Notes Grid */}
      <div className="notes-grid">
        {isLoading && notes.length === 0 ? (
          <div className="loading">Loading notes...</div>
        ) : notes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true" title="Notes" />
            <h3>No notes yet</h3>
            <p>Create your first secure note</p>
            <button
              className="btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              Create Note
            </button>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="note-card"
              onClick={() => handleViewNote(note)}
            >
              <div className="note-header">
                <h3>{note.title}</h3>
                {note.hasAudio && <span className="audio-badge">Voice</span>}
              </div>

              <p className="note-preview">{note.preview}</p>

              <div className="note-footer">
                <span className="note-date">
                  {note.updatedAt.toLocaleDateString()}
                </span>
                <button
                  className="btn-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNote(note.id);
                  }}
                  title="Delete"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Note Modal */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Note</h2>
              <button
                className="btn-close"
                onClick={() => setShowCreateModal(false)}
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateNote}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note title"
                  required
                />
              </div>

              <div className="form-group">
                <label>Content *</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your secure note here..."
                  rows={10}
                  required
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isRichText}
                    onChange={(e) => setIsRichText(e.target.checked)}
                  />
                  <span>Enable rich text formatting (coming soon)</span>
                </label>
              </div>

              {/* Voice Recording */}
              <div className="voice-recording-section">
                <h4>Or Record Voice Note</h4>
                <button
                  type="button"
                  className={`btn-secondary btn-voice ${isRecording ? "recording" : ""}`}
                  onClick={handleVoiceNote}
                  disabled={isRecording}
                >
                  {isRecording
                    ? "Recording... (60s max)"
                    : "Start Voice Recording"}
                </button>
                <p className="voice-hint">
                  {isRecording
                    ? "Speak clearly. Your voice will be transcribed automatically."
                    : "Click to record a voice note with automatic transcription"}
                </p>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating..." : "Create Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Note Modal */}
      {showViewModal && selectedNote && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedNote.note.title}</h2>
              <button
                className="btn-close"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>
            </div>

            <div className="note-view-content">
              {selectedNote.note.hasAudio && (
                <div className="audio-indicator">
                  This note was created from voice recording
                </div>
              )}

              <div className="note-text">{selectedNote.data.content}</div>

              {selectedNote.data.audioTranscript && (
                <div className="transcript-section">
                  <h4>Voice Transcript</h4>
                  <p>{selectedNote.data.audioTranscript}</p>
                </div>
              )}

              <div className="note-metadata">
                <p>
                  <strong>Created:</strong>{" "}
                  {selectedNote.note.createdAt.toLocaleString()}
                </p>
                <p>
                  <strong>Updated:</strong>{" "}
                  {selectedNote.note.updatedAt.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
