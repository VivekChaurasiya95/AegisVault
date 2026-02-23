/**
 * Notes Service
 * Manages encrypted notes with voice transcription
 */

import { NoteItem, NoteData } from '../../domain/entities/NoteItem';
import { VaultItemType } from '../../domain/types';
import { encryptionService } from '../../infrastructure/crypto/EncryptionService';
import { voiceService } from './VoiceService';
import { v4 as uuidv4 } from 'uuid';

export class NotesService {
  private static instance: NotesService;
  private notes: Map<string, NoteItem> = new Map();
  
  private constructor() {}

  static getInstance(): NotesService {
    if (!NotesService.instance) {
      NotesService.instance = new NotesService();
    }
    return NotesService.instance;
  }

  /**
   * Create a new note
   */
  async createNote(
    userId: string,
    noteData: NoteData
  ): Promise<NoteItem> {
    if (!encryptionService.isKeyInitialized()) {
      throw new Error('Vault is locked. Please unlock first.');
    }

    try {
      // Encrypt note content
      const encryptedBlob = await encryptionService.encrypt(
        JSON.stringify(noteData)
      );

      const noteItem: NoteItem = {
        id: uuidv4(),
        userId,
        type: VaultItemType.NOTE,
        title: noteData.title,
        preview: noteData.content.substring(0, 100),
        hasAudio: noteData.voiceRecorded || false,
        encryptedBlob,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: []
      };

      this.notes.set(noteItem.id, noteItem);
      return noteItem;
    } catch (error) {
      throw new Error(`Failed to create note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get decrypted note
   */
  async getNote(id: string): Promise<{ note: NoteItem; data: NoteData } | null> {
    const note = this.notes.get(id);
    if (!note) {
      return null;
    }

    if (!encryptionService.isKeyInitialized()) {
      throw new Error('Vault is locked. Please unlock first.');
    }

    try {
      const decryptedData = await encryptionService.decrypt(note.encryptedBlob);
      const noteData: NoteData = JSON.parse(decryptedData);

      return {
        note,
        data: noteData
      };
    } catch (error) {
      throw new Error(`Failed to decrypt note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update note
   */
  async updateNote(id: string, noteData: Partial<NoteData>): Promise<NoteItem> {
    const existing = await this.getNote(id);
    if (!existing) {
      throw new Error('Note not found');
    }

    const updatedData: NoteData = {
      ...existing.data,
      ...noteData
    };

    const encryptedBlob = await encryptionService.encrypt(
      JSON.stringify(updatedData)
    );

    const updatedNote: NoteItem = {
      ...existing.note,
      title: updatedData.title,
      preview: updatedData.content.substring(0, 100),
      hasAudio: updatedData.voiceRecorded || existing.note.hasAudio,
      encryptedBlob,
      updatedAt: new Date()
    };

    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  /**
   * Delete note
   */
  async deleteNote(id: string): Promise<boolean> {
    return this.notes.delete(id);
  }

  /**
   * List all notes for user
   */
  async listNotes(userId: string): Promise<NoteItem[]> {
    const userNotes: NoteItem[] = [];
    
    for (const note of this.notes.values()) {
      if (note.userId === userId) {
        userNotes.push(note);
      }
    }

    return userNotes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Search notes
   */
  async searchNotes(userId: string, query: string): Promise<NoteItem[]> {
    const allNotes = await this.listNotes(userId);
    const lowerQuery = query.toLowerCase();

    return allNotes.filter(note =>
      note.title.toLowerCase().includes(lowerQuery) ||
      note.preview.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Create note from voice recording
   */
  async createNoteFromVoice(
    userId: string,
    title: string,
    maxDuration: number = 60000
  ): Promise<NoteItem> {
    try {
      // Record voice
      const recording = await voiceService.recordVoiceNote(maxDuration);

      // Create note with transcription
      const noteData: NoteData = {
        title,
        content: recording.transcript,
        isRichText: false,
        audioTranscript: recording.transcript,
        voiceRecorded: true
      };

      return await this.createNote(userId, noteData);
    } catch (error) {
      throw new Error(`Voice note creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear all notes (for logout)
   */
  clearNotes(): void {
    this.notes.clear();
  }

  /**
   * Import notes
   */
  async importNotes(notes: NoteItem[]): Promise<void> {
    for (const note of notes) {
      this.notes.set(note.id, note);
    }
  }

  /**
   * Export notes
   */
  async exportNotes(userId: string): Promise<NoteItem[]> {
    return this.listNotes(userId);
  }
}

export const notesService = NotesService.getInstance();
