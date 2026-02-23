/**
 * AI Service - Integrates RunAnywhere SDK for AI-powered features
 * Provides LLM, STT, TTS, VAD, and VLM capabilities
 */

import { TextGeneration } from '@runanywhere/web-llamacpp';
import { VAD, AudioCapture, AudioPlayback } from '@runanywhere/web-onnx';
import { ModelManager, ModelCategory } from '@runanywhere/web';
import { AIGenerationOptions, AIPasswordSuggestion as AIPasswordSuggestionType } from '../../domain/types';
import { PasswordStrength } from '../../domain/entities/PasswordItem';
import { AIDocumentClassification } from '../../domain/entities/DocumentItem';

export class AIService {
  private static instance: AIService;
  
  private constructor() {}

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Generate secure password using LLM
   */
  async generatePassword(options: AIGenerationOptions = {}): Promise<AIPasswordSuggestionType> {
    const {
      length = 16,
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSymbols = true,
      memorable = false,
      customPrompt
    } = options;

    try {
      // Ensure LLM model is loaded
      await this.ensureLLMLoaded();

      // Create prompt for password generation
      const prompt = customPrompt || this.buildPasswordPrompt(options);

      // Generate password using LLM
      const result = await TextGeneration.generate(prompt, {
        maxTokens: 150,
        temperature: 0.9,
        systemPrompt: 'You are a secure password generation assistant. Generate only the password and a brief explanation.'
      });

      // Extract password from response
      const password = this.extractPasswordFromResponse(result.text, length);
      
      // Calculate password strength
      const strength = this.calculatePasswordStrength(password);

      return {
        password,
        strength,
        explanation: result.text,
        memorable: memorable
      };
    } catch (error) {
      throw new Error(`Password generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze password strength
   */
  calculatePasswordStrength(password: string): PasswordStrength {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const length = password.length;

    let score = 0;
    const feedback: string[] = [];

    // Length scoring
    if (length >= 8) score += 20;
    if (length >= 12) score += 20;
    if (length >= 16) score += 20;
    else if (length < 8) feedback.push('Password is too short. Use at least 8 characters.');

    // Character variety scoring
    if (hasUppercase) score += 10;
    else feedback.push('Add uppercase letters.');
    
    if (hasLowercase) score += 10;
    else feedback.push('Add lowercase letters.');
    
    if (hasNumbers) score += 10;
    else feedback.push('Add numbers.');
    
    if (hasSymbols) score += 10;
    else feedback.push('Add special symbols.');

    // Determine strength level
    let strength: 'weak' | 'fair' | 'good' | 'strong' | 'excellent';
    if (score < 40) strength = 'weak';
    else if (score < 60) strength = 'fair';
    else if (score < 80) strength = 'good';
    else if (score < 95) strength = 'strong';
    else strength = 'excellent';

    return {
      score,
      strength,
      feedback,
      hasUppercase,
      hasLowercase,
      hasNumbers,
      hasSymbols,
      length,
      isReused: false // Will be checked against existing passwords
    };
  }

  /**
   * Get security recommendations using LLM
   */
  async getSecurityRecommendations(context: {
    weakPasswords: number;
    reusedPasswords: number;
    expiringDocuments: number;
    lastSecurityScan: Date;
  }): Promise<string> {
    try {
      await this.ensureLLMLoaded();

      const prompt = `As a cybersecurity expert, analyze this vault security status and provide 3-5 actionable recommendations:

Weak passwords: ${context.weakPasswords}
Reused passwords: ${context.reusedPasswords}
Expiring documents: ${context.expiringDocuments}
Last security scan: ${context.lastSecurityScan.toLocaleDateString()}

Provide clear, prioritized recommendations to improve security.`;

      const result = await TextGeneration.generate(prompt, {
        maxTokens: 300,
        temperature: 0.7,
        systemPrompt: 'You are a helpful cybersecurity advisor for a password vault application.'
      });

      return result.text;
    } catch (error) {
      throw new Error(`Security recommendation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Explain password strength in natural language
   */
  async explainPasswordStrength(password: string, strength: PasswordStrength): Promise<string> {
    try {
      await this.ensureLLMLoaded();

      const prompt = `Explain why this password has a strength score of ${strength.score}/100 (${strength.strength}). 
Password length: ${strength.length}
Has uppercase: ${strength.hasUppercase}
Has lowercase: ${strength.hasLowercase}
Has numbers: ${strength.hasNumbers}
Has symbols: ${strength.hasSymbols}

Provide a brief, user-friendly explanation in 2-3 sentences.`;

      const result = await TextGeneration.generate(prompt, {
        maxTokens: 100,
        temperature: 0.7,
        systemPrompt: 'You are a helpful password security advisor.'
      });

      return result.text;
    } catch (error) {
      return `This password is ${strength.strength} with a score of ${strength.score}/100.`;
    }
  }

  /**
   * Classify document using VLM
   */
  async classifyDocument(imageData: {
    pixels: Uint8Array;
    width: number;
    height: number;
  }): Promise<AIDocumentClassification> {
    try {
      // This will be implemented when we add VLM support
      // For now, return a placeholder
      throw new Error('VLM classification not yet implemented. Use Vision tab for testing.');
    } catch (error) {
      throw new Error(`Document classification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stream AI response with token streaming
   */
  async *streamResponse(prompt: string): AsyncGenerator<string> {
    try {
      await this.ensureLLMLoaded();

      const { stream } = await TextGeneration.generateStream(prompt, {
        maxTokens: 500,
        temperature: 0.7
      });

      for await (const token of stream) {
        yield token;
      }
    } catch (error) {
      throw new Error(`Streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper methods

  private async ensureLLMLoaded(): Promise<void> {
    const models = ModelManager.getModels();
    const llmModel = models.find(m => m.id === 'lfm2-350m-q4_k_m');
    if (!llmModel) {
      throw new Error('LLM model not found in catalog');
    }

    if (llmModel.status !== 'loaded') {
      throw new Error('LLM model not loaded. Please load it first.');
    }
  }

  private buildPasswordPrompt(options: AIGenerationOptions): string {
    const { length, memorable } = options;
    
    if (memorable) {
      return `Generate a memorable yet secure password with ${length} characters that uses a combination of random words, numbers, and symbols. Make it easy to remember but hard to guess. Return only the password.`;
    }

    return `Generate a highly secure random password with exactly ${length} characters. Use uppercase, lowercase, numbers, and special symbols. Return only the password.`;
  }

  private extractPasswordFromResponse(text: string, targetLength: number): string {
    // Try to extract password from LLM response
    // Look for sequences that match password criteria
    const lines = text.split('\n');
    for (const line of lines) {
      // Remove common prefixes
      const cleaned = line.replace(/^(Password:|Generated:|Here's|The password is:?)/i, '').trim();
      
      // Check if line looks like a password
      if (cleaned.length >= 8 && cleaned.length <= targetLength + 5) {
        // Remove quotes if present
        const password = cleaned.replace(/['"]/g, '');
        if (password.length >= 8) {
          return password.substring(0, targetLength);
        }
      }
    }

    // Fallback: generate secure random password
    return this.generateFallbackPassword(targetLength);
  }

  private generateFallbackPassword(length: number): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = uppercase + lowercase + numbers + symbols;

    let password = '';
    
    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill remaining length
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}

export const aiService = AIService.getInstance();
