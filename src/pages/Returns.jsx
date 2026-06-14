import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

export default function Returns() {
  const { returns, adminView } = useAppContext()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(null)

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'Pristine': return '#10b981'
      case 'Good': return '#3b82f6'
      case 'Fair': return '#f59e0b'
      case 'Poor': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getRoutingLabel = (decision) => {
    switch (decision) {
      case 'RESTOCK_MAIN_WAREHOUSE': return '📦 Restock Warehouse'
      case 'PEER_TO_PEER_RESALE': return '🤝 Peer-to-Peer Resale'
      case 'AMAZON_RENEWED': return '♻️ Amazon Renewed'
      case 'DONATE_RECYCLE': return '🌱 Donate / Recycle'
      default: return decision
    }
  }

  if (returns.length === 0) {
    return (
      <div className="page-container">
        <h2 className="page-title">↩ My Returns</h2>
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No returns yet</h3>
          <p>Items you return will appear here with their assessment details.</p>
          <button className="nav-link-button" onClick={() => navigate('/orders')}>
            View Orders →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <h2 className="page-title">↩ My Returns</h2>
      <p className="page-subtitle">{returns.length} processed return{returns.length > 1 ? 's' : ''}</p>

      <div className="returns-list">
        {returns.map((ret, idx) => (
          <div key={ret.returnId || idx} className="return-card">
            <div className="return-card-header" onClick={() => setExpanded(expanded === idx ? null : idx)}>
              <div className="return-card-left">
                <div className="order-emoji">{ret.productEmoji || '📦'}</div>
                <div>
                  <h4>{ret.originalProductName || ret.productName}</h4>
                  <p className="order-meta">{ret.returnId} • {ret.returnDate}</p>
                  {ret.returnReason && <p className="return-reason-tag">Reason: {ret.returnReason}</p>}
                </div>
              </div>
              <div className="return-card-right">
                <span className="return-grade" style={{ color: getGradeColor(ret.grade) }}>
                  {ret.grade}
                </span>
                <span className="return-route-badge">
                  {getRoutingLabel(ret.routingDecision)}
                </span>
                <span className="expand-arrow">{expanded === idx ? '▼' : '▶'}</span>
              </div>
            </div>

            {expanded === idx && (
              <div className="return-card-expanded">
                <div className="metrics-grid">
                  <div className="metric-card">
                    <div className="metric-label">Condition</div>
                    <div className="metric-value grade" style={{ color: getGradeColor(ret.grade), fontSize: '1.5rem' }}>
                      {ret.grade}
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Confidence</div>
                    <div className="metric-value" style={{ fontSize: '1.5rem' }}>{ret.confidenceScore}%</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Resale Value</div>
                    <div className="metric-value price" style={{ fontSize: '1.5rem' }}>${ret.estimatedResalePrice?.toFixed(2)}</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">🍃 Carbon Saved</div>
                    <div className="metric-value carbon" style={{ fontSize: '1.5rem' }}>{ret.carbonSavedKg?.toFixed(1)} kg</div>
                  </div>
                </div>

                {/* Customer view: simple routing result */}
                {!adminView && (
                  <div className="return-approved-banner">
                    <div className="approved-icon">✅</div>
                    <div className="approved-text">
                      <h4>Routed to: {getRoutingLabel(ret.routingDecision)}</h4>
                      <p>🍃 {ret.carbonSavedKg?.toFixed(1)} kg CO₂ saved by choosing this route</p>
                    </div>
                  </div>
                )}

                {/* Admin view: NRV margin breakdown */}
                {adminView && ret.marginBreakdown && (
                  <div className="routing-engine-panel">
                    <h4 className="engine-title">⚙️ NRV Margin Breakdown</h4>

                    {ret.logistics && (
                      <div className="logistics-info">
                        <div className="logistics-item">
                          <span>📍 Distance to Origin FC:</span>
                          <strong>{ret.logistics.distanceKm} km</strong>
                        </div>
                        <div className="logistics-item">
                          <span>💰 Dynamic Logistics Cost:</span>
                          <strong>${ret.logistics.warehouseLogisticsCost?.toFixed(2)}</strong>
                        </div>
                      </div>
                    )}

                    <div className="margin-comparison-grid">
                      <div className={`margin-card ${ret.routingDecision === 'RESTOCK_MAIN_WAREHOUSE' ? 'winner' : ''}`}>
                        <div className="margin-route-name">📦 Warehouse</div>
                        <div className="margin-value">
                          ${ret.marginBreakdown.warehouse != null ? ret.marginBreakdown.warehouse.toFixed(2) : '—'}
                        </div>
                      </div>
                      <div className={`margin-card ${ret.routingDecision === 'PEER_TO_PEER_RESALE' ? 'winner' : ''}`}>
                        <div className="margin-route-name">🤝 P2P</div>
                        <div className="margin-value">
                          {ret.marginBreakdown.p2p != null ? `$${ret.marginBreakdown.p2p.toFixed(2)}` : 'N/A'}
                        </div>
                      </div>
                      <div className={`margin-card ${ret.routingDecision === 'AMAZON_RENEWED' ? 'winner' : ''}`}>
                        <div className="margin-route-name">♻️ Refurbish</div>
                        <div className="margin-value">
                          ${ret.marginBreakdown.refurbish != null ? ret.marginBreakdown.refurbish.toFixed(2) : '—'}
                        </div>
                      </div>
                    </div>
                    <div className="routing-banner">
                      <div className="routing-label">AI Executive Decision</div>
                      <div className="routing-decision">{getRoutingLabel(ret.routingDecision)}</div>
                      <div className="routing-reasoning">{ret.routingReasoning}</div>
                    </div>
                  </div>
                )}

                {ret.detectedIssues && ret.detectedIssues.length > 0 && (
                  <div className="issues-section">
                    <h4>Detected Issues</h4>
                    <ul className="issues-list">
                      {ret.detectedIssues.map((issue, i) => <li key={i}>{issue}</li>)}
                    </ul>
                  </div>
                )}

                <div className="passport-section">
                  <h4>Transparency Passport</h4>
                  <p className="passport-text">{ret.transparencyPassport}</p>
                  {ret.cryptographicSignature && (
                    <div className="crypto-signature-badge">
                      <span className="crypto-lock">🔒</span>
                      <span className="crypto-label">Verified Immutable Record</span>
                      <code className="crypto-hash">SHA-256: {ret.cryptographicSignature.slice(0, 16)}...{ret.cryptographicSignature.slice(-8)}</code>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
