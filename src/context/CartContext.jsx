import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../api'
import { useAuth } from './AuthContext'

const CartContext = createContext()

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [subtotal, setSubtotal] = useState(0)
  const [shipping, setShipping] = useState(0)
  const [tax, setTax] = useState(0)
  const [total, setTotal] = useState(0)
  const [itemCount, setItemCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const updateState = (data) => {
    setItems(data.items || [])
    setSubtotal(data.subtotal || 0)
    setShipping(data.shipping || 0)
    setTax(data.tax || 0)
    setTotal(data.total || 0)
    setItemCount(data.itemCount || 0)
  }

  // Load cart when user logs in
  useEffect(() => {
    if (user) {
      api.getCart().then(updateState).catch(() => {})
    } else {
      setItems([])
      setSubtotal(0)
      setShipping(0)
      setTax(0)
      setTotal(0)
      setItemCount(0)
    }
  }, [user])

  const addItem = useCallback(async (product) => {
    if (!user) {
      setOpen(true)
      return { error: 'Please login to add items to cart' }
    }
    setLoading(true)
    try {
      const data = await api.addToCart(product.id || product.product_id, 1)
      updateState(data)
      setOpen(true)
      return data
    } catch (err) {
      return { error: err.message }
    } finally {
      setLoading(false)
    }
  }, [user])

  const updateQty = useCallback(async (id, delta) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    const newQty = item.quantity + delta
    setLoading(true)
    try {
      const data = await api.updateCartItem(id, newQty)
      updateState(data)
    } catch (err) {
      console.error('Update qty error:', err)
    } finally {
      setLoading(false)
    }
  }, [items])

  const removeItem = useCallback(async (id) => {
    setLoading(true)
    try {
      const data = await api.removeFromCart(id)
      updateState(data)
    } catch (err) {
      console.error('Remove item error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const clearAll = useCallback(async () => {
    try {
      const data = await api.clearCart()
      updateState(data)
    } catch (err) {
      console.error('Clear cart error:', err)
    }
  }, [])

  return (
    <CartContext.Provider value={{
      items, subtotal, shipping, tax, total, itemCount,
      open, setOpen, loading, addItem, updateQty, removeItem, clearAll
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
