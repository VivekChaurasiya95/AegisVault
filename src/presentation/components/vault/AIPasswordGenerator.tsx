/**
 * AI Password Generator Component
 * Uses RunAnywhere LLM to generate secure, memorable passwords
 */

import { useState } from "react";
import { useVault } from "../../contexts/VaultContext";
import { AIPasswordSuggestion } from "../../../domain/entities/PasswordItem";
import { AIGenerationOptions } from "../../../domain/types";

interface AIPasswordGeneratorProps {
  onClose: () => void;
  onUsePassword: (password: string) => void;
}

export function AIPasswordGenerator({
  onClose,
  onUsePassword,
}: AIPasswordGeneratorProps) {
  const { generateAIPassword, explainPasswordStrength } = useVault();
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<AIPasswordSuggestion | null>(
    null,
  );
  const [explanation, setExplanation] = useState<string>("");
  const [options, setOptions] = useState<AIGenerationOptions>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    memorable: false,
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    setSuggestion(null);
    setExplanation("");

    try {
      const result = await generateAIPassword(options);
      setSuggestion(result);

      // Get AI explanation
      const exp = await explainPasswordStrength(result.password);
      setExplanation(exp);
    } catch (error) {
      alert(
        "Failed to generate password: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case "excellent":
        return "#10b981";
      case "strong":
        return "#3b82f6";
      case "good":
        return "#f59e0b";
      case "fair":
        return "#f97316";
      case "weak":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const handleCopy = async () => {
    if (suggestion) {
      await navigator.clipboard.writeText(suggestion.password);
      alert("Password copied to clipboard!");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content ai-generator"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>AI Password Generator</h2>
          <button className="btn-close" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="generator-body">
          {/* Options */}
          <div className="generator-options">
            <h3>Password Options</h3>

            <div className="option-group">
              <label>Length: {options.length}</label>
              <input
                type="range"
                min="8"
                max="32"
                value={options.length}
                onChange={(e) =>
                  setOptions({ ...options, length: parseInt(e.target.value) })
                }
              />
            </div>

            <div className="option-checkboxes">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={options.includeUppercase}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      includeUppercase: e.target.checked,
                    })
                  }
                />
                <span>Uppercase (A-Z)</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={options.includeLowercase}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      includeLowercase: e.target.checked,
                    })
                  }
                />
                <span>Lowercase (a-z)</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={options.includeNumbers}
                  onChange={(e) =>
                    setOptions({ ...options, includeNumbers: e.target.checked })
                  }
                />
                <span>Numbers (0-9)</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={options.includeSymbols}
                  onChange={(e) =>
                    setOptions({ ...options, includeSymbols: e.target.checked })
                  }
                />
                <span>Symbols (!@#$)</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={options.memorable}
                  onChange={(e) =>
                    setOptions({ ...options, memorable: e.target.checked })
                  }
                />
                <span>Memorable (AI-enhanced)</span>
              </label>
            </div>
          </div>

          {/* Generate Button */}
          <button
            className="btn-primary btn-large"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? "Generating..." : "Generate Password"}
          </button>

          {/* Generated Password */}
          {suggestion && (
            <div className="generated-result">
              <div className="password-display">
                <code className="password-text">{suggestion.password}</code>
                <button className="btn-icon" onClick={handleCopy} title="Copy">
                  Copy
                </button>
              </div>

              {/* Strength Indicator */}
              <div className="strength-indicator">
                <div className="strength-header">
                  <span>Password Strength</span>
                  <span
                    className="strength-badge"
                    style={{
                      backgroundColor: getStrengthColor(
                        suggestion.strength.strength,
                      ),
                    }}
                  >
                    {suggestion.strength.strength.toUpperCase()}
                  </span>
                </div>

                <div className="strength-bar">
                  <div
                    className="strength-fill"
                    style={{
                      width: `${suggestion.strength.score}%`,
                      backgroundColor: getStrengthColor(
                        suggestion.strength.strength,
                      ),
                    }}
                  />
                </div>

                <div className="strength-score">
                  Score: {suggestion.strength.score}/100
                </div>
              </div>

              {/* AI Explanation */}
              {explanation && (
                <div className="ai-explanation">
                  <h4>AI Analysis</h4>
                  <p>{explanation}</p>
                </div>
              )}

              {/* Strength Details */}
              <div className="strength-details">
                <div className="detail-item">
                  <span>{suggestion.strength.hasUppercase ? "Yes" : "No"}</span>
                  <span>Uppercase letters</span>
                </div>
                <div className="detail-item">
                  <span>{suggestion.strength.hasLowercase ? "Yes" : "No"}</span>
                  <span>Lowercase letters</span>
                </div>
                <div className="detail-item">
                  <span>{suggestion.strength.hasNumbers ? "Yes" : "No"}</span>
                  <span>Numbers</span>
                </div>
                <div className="detail-item">
                  <span>{suggestion.strength.hasSymbols ? "Yes" : "No"}</span>
                  <span>Special symbols</span>
                </div>
                <div className="detail-item">
                  <span>{suggestion.strength.length >= 12 ? "Yes" : "No"}</span>
                  <span>Length ({suggestion.strength.length} characters)</span>
                </div>
              </div>

              {/* Feedback */}
              {suggestion.strength.feedback.length > 0 && (
                <div className="strength-feedback">
                  <h4>Suggestions</h4>
                  <ul>
                    {suggestion.strength.feedback.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {suggestion && (
          <div className="modal-actions">
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={() => onUsePassword(suggestion.password)}
            >
              Use This Password
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
