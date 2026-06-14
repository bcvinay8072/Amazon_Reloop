import { createContext, useContext, useState } from 'react'

const AppContext = createContext()

export function AppProvider({ children }) {
  const [orders, setOrders] = useState([])
  const [returns, setReturns] = useState([])
  const [adminView, setAdminView] = useState(false)

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
    // Store completed return
    setReturns(prev => [...prev, {
      ...assessment,
      orderId,
      returnDate: new Date().toLocaleDateString(),
      returnId: `RET-${Date.now()}`
    }])
  }

  return (
    <AppContext.Provider value={{ orders, addOrder, returns, addReturn, adminView, setAdminView }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  return useContext(AppContext)
}
