/**
 * Security Center Tab
 * AI-powered security recommendations and vault health
 */

import { useState, useEffect } from "react";
import { useVault } from "../../contexts/VaultContext";
import { useAuth } from "../../contexts/AuthContext";

export function SecurityCenterTab() {
  const { getVaultStats, getSecurityRecommendations } = useVault();
  const { isVaultUnlocked } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<string>("");
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);

  useEffect(() => {
    if (isVaultUnlocked) {
      loadStats();
    }
  }, [isVaultUnlocked]);

  const loadStats = async () => {
    const vaultStats = await getVaultStats();
    setStats(vaultStats);
  };

  const handleGetRecommendations = async () => {
    setIsLoadingRecs(true);
    try {
      const recs = await getSecurityRecommendations();
      setRecommendations(recs);
    } catch (error) {
      alert(
        "Failed to get recommendations: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    } finally {
      setIsLoadingRecs(false);
    }
  };

  const calculateHealthScore = (): number => {
    if (!stats) return 0;

    let score = 100;

    // Deduct points for security issues
    if (stats.weakPasswords > 0) score -= stats.weakPasswords * 10;
    if (stats.expiringDocuments > 0) score -= stats.expiringDocuments * 5;

    return Math.max(0, Math.min(100, score));
  };

  const getHealthColor = (score: number): string => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const healthScore = calculateHealthScore();
  const healthColor = getHealthColor(healthScore);

  if (!isVaultUnlocked) {
    return (
      <div className="vault-locked-message">
        <div className="lock-icon" aria-hidden="true" title="Locked" />
        <h2>Vault is Locked</h2>
        <p>Please unlock your vault to access security features.</p>
      </div>
    );
  }

  return (
    <div className="security-center-tab">
      <div className="tab-header">
        <h1>Security Center</h1>
        <p>AI-powered security analysis and recommendations</p>
      </div>

      {/* Vault Health Score */}
      <div className="health-score-card">
        <h2>Vault Health Score</h2>

        <div className="health-gauge">
          <svg width="200" height="200" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="#1f2937"
              strokeWidth="20"
            />
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke={healthColor}
              strokeWidth="20"
              strokeDasharray={`${healthScore * 5.03} 503`}
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
            />
            <text
              x="100"
              y="100"
              textAnchor="middle"
              dy=".3em"
              fontSize="48"
              fill={healthColor}
              fontWeight="bold"
            >
              {healthScore}
            </text>
          </svg>
        </div>

        <div className="health-status">
          {healthScore >= 80 ? (
            <div className="status good">Excellent Security</div>
          ) : healthScore >= 60 ? (
            <div className="status fair">Fair Security</div>
          ) : (
            <div className="status poor">Needs Attention</div>
          )}
        </div>
      </div>

      {/* Security Issues */}
      <div className="security-issues">
        <h3>Security Issues</h3>

        <div className="issue-list">
          {stats?.weakPasswords > 0 && (
            <div className="issue-item warning">
              <span className="issue-icon" aria-hidden="true" title="Warning" />
              <div>
                <h4>Weak Passwords Detected</h4>
                <p>{stats.weakPasswords} password(s) need strengthening</p>
              </div>
            </div>
          )}

          {stats?.expiringDocuments > 0 && (
            <div className="issue-item warning">
              <span className="issue-icon" aria-hidden="true" title="Expiry" />
              <div>
                <h4>Expiring Documents</h4>
                <p>{stats.expiringDocuments} document(s) expiring soon</p>
              </div>
            </div>
          )}

          {stats?.weakPasswords === 0 && stats?.expiringDocuments === 0 && (
            <div className="issue-item success">
              <span className="issue-icon" aria-hidden="true" title="OK" />
              <div>
                <h4>All Clear!</h4>
                <p>No security issues detected</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="ai-recommendations">
        <div className="recs-header">
          <h3>AI Security Advisor</h3>
          <button
            className="btn-primary"
            onClick={handleGetRecommendations}
            disabled={isLoadingRecs}
          >
            {isLoadingRecs ? "Analyzing..." : "Get Recommendations"}
          </button>
        </div>

        {recommendations && (
          <div className="recommendations-content">
            <div className="ai-badge">
              <span>Powered by On-Device LLM</span>
            </div>
            <p>{recommendations}</p>
          </div>
        )}

        {!recommendations && !isLoadingRecs && (
          <div className="recommendations-placeholder">
            <p>
              Click "Get Recommendations" to receive personalized security
              advice from our AI assistant.
            </p>
          </div>
        )}
      </div>

      {/* Security Best Practices */}
      <div className="best-practices">
        <h3>Security Best Practices</h3>
        <ul>
          <li>
            <span>Use unique passwords for each account</span>
          </li>
          <li>
            <span>Enable AI password generation for strong passwords</span>
          </li>
          <li>
            <span>
              Regularly update passwords, especially for important accounts
            </span>
          </li>
          <li>
            <span>Keep documents up to date before expiry</span>
          </li>
          <li>
            <span>Review activity logs regularly</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
