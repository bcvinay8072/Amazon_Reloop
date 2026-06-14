import { createContext, useContext, useState } from 'react'

const AppContext = createContext()

// Routes that give an item a "second life" available for resale
const SECOND_LIFE_ROUTES = ['PEER_TO_PEER_RESALE', 'AMAZON_RENEWED']

export function AppProvider({ children }) {
  const [orders, setOrders] = useState([])
  const [returns, setReturns] = useState([])
  const [adminView, setAdminView] = useState(false)
  const [greenPoints, setGreenPoints] = useState(0)

  const addOrder = (product) => {
    setOrders(prev => [...prev, {
      ...product,
      orderId: `ORD-${Date.now()}`,
      orderDate: new Date().toLocaleDateString(),
      status: 'Delivered'
    }])
  }

  const addReturn = (orderId, assessment) => {
    // Mark order as returned
    setOrders(prev => prev.map(o =>
      o.orderId === orderId ? { ...o, status: 'Returned' } : o
    ))

    // Green credits: ~10 points per kg CO2 saved
    const pointsEarned = Math.round((assessment.carbonSavedKg || 0) * 10)
    setGreenPoints(prev => prev + pointsEarned)

    // Store completed return, enriched for the "Renewed Nearby" marketplace
    setReturns(prev => [...prev, {
      ...assessment,
      orderId,
      returnDate: new Date().toLocaleDateString(),
      returnId: `RET-${Date.now()}`,
      greenPointsEarned: pointsEarned,
      nearbyKm: Math.floor(Math.random() * 8) + 2, // mock 2-9 km from buyer
      listed: SECOND_LIFE_ROUTES.includes(assessment.routingDecision),
      sold: false
    }])
  }

  // A new customer buys a renewed item → mark sold + add to their orders
  const buyRenewed = (returnId) => {
    let bought = null
    setReturns(prev => prev.map(r => {
      if (r.returnId === returnId) {
        bought = r
        return { ...r, sold: true }
      }
      return r
    }))
    if (bought) {
      setOrders(prev => [...prev, {
        id: bought.itemId,
        name: bought.originalProductName || bought.productName,
        price: bought.estimatedResalePrice,
        category: bought.category,
        image: bought.productEmoji || '♻️',
        originLat: bought.logistics?.originLat,
        originLon: bought.logistics?.originLon,
        orderId: `ORD-${Date.now()}`,
        orderDate: new Date().toLocaleDateString(),
        status: 'Delivered',
        renewed: true
      }])
    }
  }

  // Items with a second life still available for purchase
  const renewedListings = returns.filter(r => r.listed && !r.sold)

  return (
    <AppContext.Provider value={{
      orders, addOrder,
      returns, addReturn,
      renewedListings, buyRenewed,
      greenPoints,
      adminView, setAdminView
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  return useContext(AppContext)
}
