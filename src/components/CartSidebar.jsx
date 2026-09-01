import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'

export default function CartSidebar() {
  const { items, removeItem, updateQty, subtotal, shipping, tax, total, open, setOpen, loading } = useCart()
  const { user } = useAuth()

  return (
    <>
      <div className={`cart-overlay ${open ? 'active' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`cart-sidebar ${open ? 'active' : ''}`}>
        <div className="cart-header">
          <h2 className="cart-title">
            <ShoppingBag size={20} />
            Your Cart
          </h2>
          <button className="cart-close" onClick={() => setOpen(false)} aria-label="Close cart">
            <X size={20} />
          </button>
        </div>

        <div className="cart-body">
          {!user ? (
            <div className="cart-empty">
              <ShoppingBag size={48} strokeWidth={1} />
              <p>Please sign in to view your cart</p>
              <Link to="/login" className="btn btn--primary btn--sm" onClick={() => setOpen(false)}>Sign In</Link>
            </div>
          ) : items.length === 0 ? (
            <div className="cart-empty">
              <ShoppingBag size={48} strokeWidth={1} />
              <p>Your cart is empty</p>
              <Link to="/shop" className="btn btn--primary btn--sm" onClick={() => setOpen(false)}>Browse Products</Link>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="cart-item">
                <img src={item.img} alt={item.name} className="cart-item-img" />
                <div className="cart-item-info">
                  <h4 className="cart-item-name">{item.name}</h4>
                  <p className="cart-item-price">${item.price.toFixed(2)}</p>
                  <div className="cart-item-controls">
                    <button onClick={() => updateQty(item.id, -1)} className="qty-btn" aria-label="Decrease" disabled={loading}>
                      <Minus size={14} />
                    </button>
                    <span className="qty-val">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="qty-btn" aria-label="Increase" disabled={loading}>
                      <Plus size={14} />
                    </button>
                    <button onClick={() => removeItem(item.id)} className="qty-remove" aria-label="Remove" disabled={loading}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="cart-item-total">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>

        {user && items.length > 0 && (
          <div className="cart-footer">
            <div className="cart-row">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="cart-row">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="cart-row">
              <span>Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="cart-row cart-row--total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <Link to="/checkout" className="btn btn--primary btn--block" onClick={() => setOpen(false)}>
              Proceed to Checkout
            </Link>
            <p className="cart-note">Free worldwide shipping on orders over $50</p>
          </div>
        )}
      </aside>
    </>
  )
}
