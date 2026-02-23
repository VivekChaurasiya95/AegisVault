/**
 * NoteItem Entity
 * Represents a secure note in the vault
 */

import { VaultItem } from './VaultItem';

export interface NoteData {
  title: string;
  content: string;
  isRichText: boolean;
  audioTranscript?: string;
  audioUrl?: string;
  voiceRecorded?: boolean;
}

export interface NoteItem extends VaultItem {
  title: string;
  preview: string; // First 100 chars
  hasAudio: boolean;
  // Encrypted content is in VaultItem.encryptedBlob
}
