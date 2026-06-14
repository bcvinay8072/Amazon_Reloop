import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { analyzeReturnedItem } from '../services/api'

export default function Orders() {
  const { orders, addReturn } = useAppContext()
  const navigate = useNavigate()

  const [returnModal, setReturnModal] = useState(null) // { order, step, files, previewUrls, reason, loading, error, assessment }

  const openReturnModal = (order) => {
    setReturnModal({
      order,
      step: 'upload', // 'upload' | 'processing' | 'done'
      files: [],
      previewUrls: [],
      reason: '',
      loading: false,
      error: null,
      assessment: null
    })
  }

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files).slice(0, 5)
    if (files.length > 0) {
      setReturnModal(prev => ({
        ...prev,
        files,
        previewUrls: files.map(f => URL.createObjectURL(f)),
        error: null
      }))
    }
  }

  const handleSubmitReturn = async () => {
    if (!returnModal || returnModal.files.length === 0) {
      setReturnModal(prev => ({ ...prev, error: 'Please upload at least one image' }))
      return
    }

    setReturnModal(prev => ({ ...prev, loading: true, step: 'processing', error: null }))

    try {
      const { order } = returnModal
      const productMeta = {
        originalPrice: order.price,
        category: order.category || 'General',
        localDemand: 'High',
        originLat: order.originLat,
        originLon: order.originLon
      }

      const input = returnModal.files.length === 1 ? returnModal.files[0] : returnModal.files
      const assessment = await analyzeReturnedItem(input, productMeta)

      // Store the return with product info
      const fullAssessment = {
        ...assessment,
        originalProductName: order.name,
        originalPrice: order.price,
        productEmoji: order.image,
        returnReason: returnModal.reason,
        category: order.category,
        originLat: order.originLat,
        originLon: order.originLon
      }

      addReturn(order.orderId, fullAssessment)
      setReturnModal(prev => ({ ...prev, step: 'done', assessment: fullAssessment, loading: false }))
    } catch (err) {
      console.error('Return analysis failed:', err)
      setReturnModal(prev => ({ ...prev, error: err.message, loading: false, step: 'upload' }))
    }
  }

  const activeOrders = orders.filter(o => o.status === 'Delivered')
  const returnedOrders = orders.filter(o => o.status === 'Returned')

  if (orders.length === 0) {
    return (
      <div className="page-container">
        <h2 className="page-title">📋 My Orders</h2>
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No recent orders</h3>
          <p>Items you purchase will appear here.</p>
          <button className="nav-link-button" onClick={() => navigate('/shop')}>
            Browse Shop →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <h2 className="page-title">📋 My Orders</h2>

      {activeOrders.length > 0 && (
        <>
          <p className="page-subtitle">Recently Delivered</p>
          <div className="orders-list">
            {activeOrders.map((order, idx) => (
              <div key={order.orderId || idx} className="order-card">
                <div className="order-left">
                  <div className="order-emoji">{order.image}</div>
                  <div className="order-details">
                    <h4>{order.name}</h4>
                    <p className="order-meta">Order {order.orderId} • {order.orderDate}</p>
                    <span className="order-status">✓ Delivered</span>
                  </div>
                </div>
                <div className="order-right">
                  <div className="order-price">${order.price.toFixed(2)}</div>
                  <button className="return-button" onClick={() => openReturnModal(order)}>
                    Return Item
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {returnedOrders.length > 0 && (
        <>
          <p className="page-subtitle" style={{ marginTop: '2rem' }}>Previously Returned</p>
          <div className="orders-list">
            {returnedOrders.map((order, idx) => (
              <div key={order.orderId || idx} className="order-card returned">
                <div className="order-left">
                  <div className="order-emoji">{order.image}</div>
                  <div className="order-details">
                    <h4>{order.name}</h4>
                    <p className="order-meta">Order {order.orderId} • {order.orderDate}</p>
                    <span className="order-status returned-status">↩ Returned</span>
                  </div>
                </div>
                <div className="order-right">
                  <div className="order-price">${order.price.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Return Modal */}
      {returnModal && (
        <div className="modal-overlay" onClick={() => !returnModal.loading && setReturnModal(null)}>
          <div className="modal-content return-modal" onClick={e => e.stopPropagation()}>

            {returnModal.step === 'upload' && (
              <>
                <h3 className="modal-title">📸 Return: {returnModal.order.name}</h3>

                <div className="return-reason-wrapper">
                  <label htmlFor="return-reason">Reason for Return</label>
                  <input
                    id="return-reason"
                    type="text"
                    className="return-reason-input"
                    placeholder="e.g., Wrong size, Defective, Changed my mind"
                    value={returnModal.reason}
                    onChange={(e) => setReturnModal(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>

                <div className="file-input-wrapper">
                  <input
                    type="file"
                    id="return-file-input"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="file-input"
                  />
                  <label htmlFor="return-file-input" className="file-input-label">
                    📁 Upload Photos (Max 5)
                  </label>
                </div>

                {returnModal.previewUrls.length > 0 && (
                  <div className="preview-section">
                    <div className="preview-grid">
                      {returnModal.previewUrls.map((url, i) => (
                        <img key={i} src={url} alt={`Preview ${i + 1}`} className="preview-image" />
                      ))}
                    </div>
                  </div>
                )}

                {returnModal.error && (
                  <div className="error-box"><strong>Error:</strong> {returnModal.error}</div>
                )}

                <div className="modal-actions">
                  <button className="modal-cancel" onClick={() => setReturnModal(null)}>Cancel</button>
                  <button
                    className="modal-proceed"
                    disabled={returnModal.files.length === 0}
                    onClick={handleSubmitReturn}
                  >
                    Submit Return 📤
                  </button>
                </div>
              </>
            )}

            {returnModal.step === 'processing' && (
              <div className="modal-loading">
                <div className="spinner"></div>
                <p>🔍 Analyzing item condition...</p>
                <p className="loading-sub">Running visual grading + NRV routing engine</p>
              </div>
            )}

            {returnModal.step === 'done' && returnModal.assessment && (
              <>
                <div className="return-success">
                  <div className="success-icon">✅</div>
                  <h3>Return Processed Successfully</h3>
                  <div className="success-details">
                    <p><strong>Grade:</strong> {returnModal.assessment.grade}</p>
                    <p><strong>Route:</strong> {getRoutingLabel(returnModal.assessment.routingDecision)}</p>
                    <p><strong>Carbon Saved:</strong> 🍃 {returnModal.assessment.carbonSavedKg?.toFixed(1)} kg</p>
                    <p><strong>Green Points:</strong> 🌱 +{Math.round((returnModal.assessment.carbonSavedKg || 0) * 10)}</p>
                  </div>
                  <button className="modal-proceed" onClick={() => setReturnModal(null)}>
                    Done ✓
                  </button>
                  <button className="modal-cancel" style={{ marginTop: '0.5rem' }} onClick={() => { setReturnModal(null); navigate('/returns') }}>
                    View All Returns →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function getRoutingLabel(decision) {
  switch (decision) {
    case 'RESTOCK_MAIN_WAREHOUSE': return '📦 Restock Warehouse'
    case 'PEER_TO_PEER_RESALE': return '🤝 P2P Resale'
    case 'AMAZON_RENEWED': return '♻️ Amazon Renewed'
    case 'DONATE_RECYCLE': return '🌱 Donate/Recycle'
    default: return decision
  }
}
