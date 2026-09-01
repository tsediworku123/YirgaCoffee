import { useRef, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { MapPin, Phone, Mail, Send } from 'lucide-react'
import { api } from '../api'

function FadeIn({ children, className = '', delay = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div ref={ref} className={className} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay }}>
      {children}
    </motion.div>
  )
}

export default function Contact() {
  const [searchParams] = useSearchParams()
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', company: '', interest: searchParams.get('interest') || '', message: '' })

  useEffect(() => {
    const interest = searchParams.get('interest')
    if (interest) setFormData(f => ({ ...f, interest }))
  }, [searchParams])

  const handleChange = (e) => setFormData(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.sendMessage(formData)
      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        setFormData({ name: '', email: '', company: '', interest: '', message: '' })
      }, 4000)
    } catch (err) {
      alert('Failed to send message. Please try again.')
    }
  }

  return (
    <>
      <section className="about-hero contact-hero">
        <div className="about-hero-bg" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1920&q=80)' }} />
        <div className="about-hero-overlay" />
        <div className="container about-hero-content">
          <span className="section-label section-label--light">Get in Touch</span>
          <h1 className="about-hero-title">Start Your Coffee<br /><em>Journey</em></h1>
          <p className="about-hero-text">Whether you're a roaster, cafe owner, distributor, or enthusiast — we'd love to hear from you.</p>
        </div>
      </section>

      <section className="section section--cream">
        <div className="container">
          <div className="contact-grid">
            <FadeIn>
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input type="text" id="name" name="name" required value={formData.name} onChange={handleChange} placeholder="Your name" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input type="email" id="email" name="email" required value={formData.email} onChange={handleChange} placeholder="you@company.com" />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="company">Company / Business</label>
                  <input type="text" id="company" name="company" value={formData.company} onChange={handleChange} placeholder="Your company name" />
                </div>
                <div className="form-group">
                  <label htmlFor="interest">Coffee Interest</label>
                  <select id="interest" name="interest" value={formData.interest} onChange={handleChange}>
                    <option value="">Select a variety...</option>
                    <option value="yirgacheffe">Yirgacheffe</option>
                    <option value="sidamo">Sidamo</option>
                    <option value="harrar">Harrar</option>
                    <option value="limu">Limu</option>
                    <option value="jimma">Jimma (Kaffa)</option>
                    <option value="blend">Custom Blend</option>
                    <option value="green">Green Beans</option>
                    <option value="other">Other</option>
                    <option value="wholesale">Wholesale Inquiry</option>
                    <option value="distribution">Distribution Partnership</option>
                    <option value="private-label">Private Label</option>
                    <option value="partnerships">Business Partnership</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea id="message" name="message" rows="5" required value={formData.message} onChange={handleChange} placeholder="Tell us about your coffee needs..." />
                </div>
                <button type="submit" className={`btn btn--primary btn--lg btn--block ${submitted ? 'btn--success' : ''}`} disabled={submitted}>
                  {submitted ? 'Message Sent' : <>Send Message <Send size={16} /></>}
                </button>
              </form>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="contact-info-card">
                <h3 className="contact-info-title">Headquarters</h3>
                <div className="contact-info-item">
                  <MapPin size={20} />
                  <div>
                    <strong>Addis Ababa, Ethiopia</strong>
                    <p>Bole Road, Atlas Area<br />Addis Ababa 1000</p>
                  </div>
                </div>
                <div className="contact-info-item">
                  <Phone size={20} />
                  <div>
                    <strong>+251 11 234 5678</strong>
                    <p>Mon-Fri: 8:00 AM - 6:00 PM (EAT)</p>
                  </div>
                </div>
                <div className="contact-info-item">
                  <Mail size={20} />
                  <div>
                    <strong>info@yirgacoffee.com</strong>
                    <p>We respond within 24 hours</p>
                  </div>
                </div>
                <div className="contact-info-item">
                  <MapPin size={20} />
                  <div>
                    <strong>Export Office - Rotterdam</strong>
                    <p>Europaweg 830<br />3199 LD Rotterdam, Netherlands</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>
    </>
  )
}
