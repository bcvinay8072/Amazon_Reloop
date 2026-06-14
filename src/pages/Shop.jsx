import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

const REVIEWS_ENDPOINT = 'https://zltp5eq0i6.execute-api.us-east-1.amazonaws.com/prod/reviews'

const products = [
  {
    id: 'TSHIRT-URBAN-01',
    name: "UrbanFit Men's Essential Tee",
    price: 25.00,
    category: 'Apparel',
    image: '👕',
    originLat: 12.9716,
    originLon: 77.5946 // Bangalore
  },
  {
    id: 'SHOE-AERO-99',
    name: 'AeroStride Running Sneakers',
    price: 89.99,
    category: 'Footwear',
    image: '👟',
    originLat: 13.0827,
    originLon: 80.2707 // Chennai
  },
  {
    id: 'CONT-FRESH-1L',
    name: 'FreshSeal 1000ml Storage Box Set',
    price: 15.99,
    category: 'Home & Kitchen',
    image: '📦',
    originLat: 28.7041,
    originLon: 77.1025 // Delhi
  }
]

export default function Shop() {
  const navigate = useNavigate()
  const { addOrder, renewedListings, buyRenewed } = useAppContext()
  const [modal, setModal] = useState(null) // { product, warning, loading }

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'Pristine': return '#10b981'
      case 'Good': return '#3b82f6'
      case 'Fair': return '#f59e0b'
      case 'Poor': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const handleBuyRenewed = (listing) => {
    buyRenewed(listing.returnId)
    navigate('/orders')
  }

  const handleBuy = async (product) => {
    setModal({ product, warning: null, loading: true })

    try {
      // Call AWS reviews endpoint: queries DynamoDB → Bedrock Nova Micro
      const response = await fetch(REVIEWS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name
        })
      })

      if (!response.ok) {
        throw new Error(`Review service error: ${response.status}`)
      }

      const data = await response.json()
      const warning = data.warning || `⚠️ This product has a high return rate. Check reviews before purchasing.`
      setModal({ product, warning, loading: false })
    } catch (err) {
      console.error('Review insights failed:', err)
      setModal({ product, warning: `⚠️ Review analysis unavailable. Proceed with caution.`, loading: false })
    }
  }

  const handleProceed = () => {
    if (modal?.product) {
      addOrder(modal.product)
      setModal(null)
      navigate('/orders')
    }
  }

  return (
    <div className="page-container">
      <h2 className="page-title">🛒 Shop</h2>
      <p className="page-subtitle">Browse our catalog</p>

      <div className="products-grid">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <div className="product-emoji">{product.image}</div>
            <h3 className="product-name">{product.name}</h3>
            <div className="product-price">${product.price.toFixed(2)}</div>
            <div className="product-category">{product.category}</div>
            <button className="buy-button" onClick={() => handleBuy(product)}>
              Buy Now
            </button>
          </div>
        ))}
      </div>

      {/* Renewed Nearby — the "second life" marketplace */}
      {renewedListings.length > 0 && (
        <div className="renewed-section">
          <h2 className="page-title" style={{ marginTop: '2.5rem' }}>♻️ Renewed Nearby</h2>
          <p className="page-subtitle">
            Certified second-life items routed to resale near you — each with a verified condition passport
          </p>

          <div className="products-grid">
            {renewedListings.map(item => (
              <div key={item.returnId} className="product-card renewed-card">
                <div className="renewed-badge">♻️ Certified Renewed</div>
                <div className="product-emoji">{item.productEmoji || '📦'}</div>
                <h3 className="product-name">{item.originalProductName || item.productName}</h3>

                <div className="renewed-meta">
                  <span
                    className="renewed-grade"
                    style={{ color: getGradeColor(item.grade) }}
                  >
                    {item.grade} condition
                  </span>
                  <span className="renewed-distance">📍 {item.nearbyKm} km away</span>
                </div>

                <div className="product-price">
                  ${item.estimatedResalePrice?.toFixed(2)}
                  {item.originalPrice > item.estimatedResalePrice && (
                    <span className="renewed-original">${item.originalPrice?.toFixed(2)}</span>
                  )}
                </div>

                {item.cryptographicSignature && (
                  <div className="renewed-passport">
                    🔒 Verified Passport: {item.cryptographicSignature.slice(0, 10)}…
                  </div>
                )}

                <button className="buy-button renewed-buy" onClick={() => handleBuyRenewed(item)}>
                  Buy Renewed
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => !modal.loading && setModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            {modal.loading ? (
              <div className="modal-loading">
                <div className="spinner"></div>
                <p>🤖 Analyzing reviews for potential issues...</p>
              </div>
            ) : (
              <>
                <h3 className="modal-title">⚠️ AI Review Insights</h3>
                <div className="modal-warning">{modal.warning}</div>
                <div className="modal-product-info">
                  <span>{modal.product.image} {modal.product.name}</span>
                  <span className="modal-price">${modal.product.price.toFixed(2)}</span>
                </div>
                <div className="modal-actions">
                  <button className="modal-cancel" onClick={() => setModal(null)}>Cancel</button>
                  <button className="modal-proceed" onClick={handleProceed}>Proceed to Checkout ✓</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
