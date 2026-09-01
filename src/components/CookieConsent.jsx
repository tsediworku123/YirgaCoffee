import { useState } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'

export default function CookieConsent() {
  const [visible, setVisible] = useState(() => {
    return !localStorage.getItem('yirga-cookies-accepted')
  })

  const accept = () => {
    localStorage.setItem('yirga-cookies-accepted', 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="cookie-banner">
      <div className="cookie-inner">
        <div className="cookie-text">
          <p><strong>We value your privacy.</strong> This site uses cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All," you consent to our use of cookies.</p>
        </div>
        <div className="cookie-actions">
          <Link to="/privacy" className="cookie-link" onClick={() => setVisible(false)}>Privacy Policy</Link>
          <button className="btn btn--sm" onClick={accept}>Accept All</button>
          <button className="cookie-dismiss" onClick={accept} aria-label="Dismiss"><X size={16} /></button>
        </div>
      </div>
    </div>
  )
}
