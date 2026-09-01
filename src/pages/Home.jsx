import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, Star, Globe, Leaf, Shield, Award, ChevronLeft, ChevronRight } from 'lucide-react'
import CartSidebar from '../components/CartSidebar'

const heroSlides = [
  { url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1920&q=80', alt: 'Ethiopian coffee beans' },
  { url: 'https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?w=1920&q=80', alt: 'Coffee roasting' },
  { url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1920&q=80', alt: 'Coffee plantation' },
]

const varieties = [
  {
    id: 'yirgacheffe', name: 'Yirgacheffe',
    region: 'Southern Nations · 1,750-2,200m',
    altitude: '1,750-2,200 meters above sea level',
    process: 'Washed & Natural',
    notes: ['Bergamot', 'Citrus', 'Floral', 'Jasmine'],
    desc: 'Widely regarded as the finest coffee-producing region on earth. Yirgacheffe beans are grown at extreme altitudes in the Gedeo Zone of southern Ethiopia, where cool mountain air and rich volcanic soil produce beans of extraordinary complexity. The washed process yields a bright, tea-like cup with explosive floral aromatics — bergamot, jasmine, and lemon blossom dominate the nose, while the palate reveals layers of stone fruit, citrus zest, and a clean, winey finish. Natural-processed lots add wild strawberry and tropical fruit tones. Every specialty roaster in the world seeks Yirgacheffe for its unmatched elegance.',
    img: 'https://images.unsplash.com/photo-1611070966513-d9f94c251948?w=600&q=80'
  },
  {
    id: 'sidamo', name: 'Sidamo',
    region: 'Southern Ethiopia · 1,500-2,200m',
    altitude: '1,500-2,200 meters above sea level',
    process: 'Natural & Washed',
    notes: ['Berry', 'Chocolate', 'Spice', 'Wine'],
    desc: 'One of Ethiopia\'s most diverse coffee regions, Sidamo spans a wide range of microclimates across the Great Rift Valley. Natural-processed Sidamo is famous for its heavy body and intense fruit character — think ripe blueberry, blackberry compote, and dark chocolate. Washed Sidamo offers a cleaner, more structured cup with citrus brightness and a silky mouthfeel. The region\'s smallholder farmers hand-sort cherries at altitudes where morning fog rolls through canopy shade trees, producing beans that consistently score 85+ on the SCA cupping scale.',
    img: 'https://images.unsplash.com/photo-1524350876685-274059332603?w=600&q=80'
  },
  {
    id: 'harrar', name: 'Harrar',
    region: 'Eastern Ethiopia · 1,500-2,100m',
    altitude: '1,500-2,100 meters above sea level',
    process: 'Natural (dry-processed)',
    notes: ['Wine', 'Blueberry', 'Fruity', 'Spicy'],
    desc: 'The birthplace of coffee cultivation. Harrar is one of the oldest coffee-producing regions in the world, and its ancient heirloom varietals grow wild on dry, sun-baked hillsides east of Addis Ababa. Every bean is naturally processed — sun-dried on raised beds under the harsh eastern sun — which concentrates intense fruit flavors. The result is a bold, wild cup with a signature blueberry note that is unmistakable. Harrar Longberry, with its distinctive elongated bean shape, is prized by collectors and specialty roasters for its wine-like acidity, ripe fruit intensity, and peppery finish.',
    img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80'
  },
  {
    id: 'limu', name: 'Limu',
    region: 'Western Ethiopia · 1,500-1,900m',
    altitude: '1,500-1,900 meters above sea level',
    process: 'Washed',
    notes: ['Sweet', 'Nutty', 'Balanced', 'Smooth'],
    desc: 'Grown in the lush, forested highlands of southwestern Ethiopia, Limu coffee is the connoisseur\'s choice for a balanced, elegant cup. The region\'s dense forest canopy provides natural shade, and beans are washed and dried slowly on raised beds, producing a clean, sweet flavor profile. Expect a smooth, rounded body with notes of toasted almond, honey, and milk chocolate, complemented by a gentle citrus brightness. Limu is less flashy than Yirgacheffe or Harrar, but its consistency and balance make it the preferred base for premium espresso blends worldwide.',
    img: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80'
  },
  {
    id: 'jimma', name: 'Jimma',
    region: 'Southwestern Ethiopia · 1,400-2,000m',
    altitude: '1,400-2,000 meters above sea level',
    process: 'Natural & Washed',
    notes: ['Cocoa', 'Stone Fruit', 'Earthy', 'Full-bodied'],
    desc: 'The Jimma Zone is one of Ethiopia\'s largest coffee-producing areas and the birthplace of Coffea Arabica. Wild coffee forests still cover parts of the Kaffa Biosphere Reserve, where researchers first identified the genetic origins of all arabica coffee. Jimma beans are known for their deep, chocolatey body and earthy sweetness — think raw cocoa, ripe peach, and a hint of cedar. The region produces both washed and natural lots, with washed Jimma offering a cleaner, more structured profile ideal for medium roasts. For roasters seeking an authentic, full-bodied Ethiopian cup without the floral intensity of Yirgacheffe, Jimma is the origin.',
    img: 'https://images.unsplash.com/photo-1442411210769-b95c4632195e?w=600&q=80'
  },
]

const testimonials = [
  { text: 'Yirga Coffee\'s Yirgacheffe is the finest single-origin I\'ve tasted. The floral complexity is unmatched. We serve it at all three of our locations.', name: 'Marcus Reynolds', role: 'Head Barista, Blue Bottle — New York', initials: 'MR' },
  { text: 'As a specialty roaster in Tokyo, I demand the highest quality green beans. Yirga consistently delivers SCA 85+ scored lots, shipment after shipment.', name: 'Yuki Tanaka', role: 'Owner, Kohi Roasters — Tokyo', initials: 'YT' },
  { text: 'We switched our entire European distribution to Yirga Coffee. Their quality standards and sustainability commitment made them the clear choice.', name: 'Sophie Vanderberg', role: 'Procurement Director, Cafe Noir — Amsterdam', initials: 'SV' },
]

const sustainability = [
  { title: '100% Organic', text: 'No synthetic pesticides. Ethiopian coffee thrives naturally in its native forest environment, the way it has for millennia.', icon: Leaf },
  { title: 'Fair Trade Certified', text: 'We pay farmers 40% above fair trade minimums, supporting over 200 families across four coffee-growing regions.', icon: Shield },
  { title: 'Eco-Friendly Processing', text: 'Our washing stations recirculate 90% of water. Pulp is composted and returned to the soil as organic fertilizer.', icon: Leaf },
  { title: 'ISO 22000 Certified', text: 'Our facilities meet the highest international food safety standards, from green bean intake to final packaging.', icon: Shield },
  { title: 'Sustainable Packaging', text: 'All packaging is 100% recyclable or compostable. Zero single-use plastics in our supply chain.', icon: Leaf },
  { title: 'Carbon-Neutral Shipping', text: 'We offset 100% of shipping emissions through reforestation projects in the Ethiopian highlands.', icon: Globe },
]

const regions = [
  { flag: '\u{1F1FA}\u{1F1F8}', name: 'North America' },
  { flag: '\u{1F1EC}\u{1F1E7}', name: 'Europe' },
  { flag: '\u{1F1EF}\u{1F1F5}', name: 'Asia Pacific' },
  { flag: '\u{1F1E6}\u{1F1EA}', name: 'Middle East' },
  { flag: '\u{1F1FF}\u{1F1E6}', name: 'Africa' },
  { flag: '\u{1F1E7}\u{1F1F7}', name: 'South America' },
]

function FadeInSection({ children, className = '', delay = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  )
}

function AnimatedCounter({ target, suffix = '' }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const duration = 2000
    const t0 = performance.now()
    function tick(now) {
      const p = Math.min((now - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.floor(eased * target))
      if (p < 1) requestAnimationFrame(tick)
      else setVal(target)
    }
    requestAnimationFrame(tick)
  }, [inView, target])

  return <span ref={ref}>{val}{suffix}</span>
}

export default function Home() {
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setSlide(s => (s + 1) % heroSlides.length), 6000)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-carousel">
          {heroSlides.map((s, i) => (
            <div key={i} className={`hero-slide ${i === slide ? 'active' : ''}`} style={{ backgroundImage: `url(${s.url})` }} />
          ))}
        </div>
        <div className="hero-overlay" />
        <motion.div
          className="hero-content container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <span className="hero-badge">Est. 1200+ Years of Heritage</span>
          <h1 className="hero-title">
            Ethiopia<br />
            <em>The Birthplace of Coffee</em>
          </h1>
          <p className="hero-subtitle">
            From the misty highlands of Yirgacheffe to your cup. Premium, hand-selected
            Arabica beans roasted to perfection and delivered worldwide.
          </p>
          <div className="hero-actions">
            <Link to="/shop" className="btn btn--primary btn--lg">Explore Our Collection</Link>
            <Link to="/about" className="btn btn--outline btn--lg">Our Story</Link>
          </div>
        </motion.div>
        <div className="hero-scroll">
          <span>Scroll to discover</span>
          <div className="scroll-line" />
        </div>
      </section>

      <CartSidebar />

      {/* STORY */}
      <section className="section section--cream" id="story">
        <div className="container">
          <div className="story-grid">
            <FadeInSection>
              <div className="story-text-block">
                <span className="section-label">Our Heritage</span>
                <h2 className="section-title">A Legacy Rooted in<br /><em>Ethiopian Highlands</em></h2>
                <p className="story-body">
                  For over 1,200 years, Ethiopia has been the sacred origin of coffee. In the lush
                  forests of Kaffa, a goat herder named Kaldi noticed his goats dancing with energy
                  after eating bright red cherries from a wild coffee bush. This discovery would
                  change the world forever.
                </p>
                <p className="story-body">
                  Today, Yirga Coffee carries this ancient legacy forward. We partner directly with
                  over 50 family-owned farms across Ethiopia's most renowned growing regions.
                </p>
                <div className="story-stats">
                  <div className="stat">
                    <span className="stat-num"><AnimatedCounter target={1200} suffix="+" /></span>
                    <span className="stat-label">Years of Heritage</span>
                  </div>
                  <div className="stat">
                    <span className="stat-num"><AnimatedCounter target={100} suffix="%" /></span>
                    <span className="stat-label">Pure Arabica</span>
                  </div>
                  <div className="stat">
                    <span className="stat-num"><AnimatedCounter target={50} suffix="+" /></span>
                    <span className="stat-label">Origin Farms</span>
                  </div>
                </div>
              </div>
            </FadeInSection>
            <FadeInSection delay={0.15}>
              <div className="story-visual">
                <div className="story-img-wrapper">
                  <img src="https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=800&q=80" alt="Ethiopian coffee farmer sorting beans" className="story-img" loading="lazy" />
                </div>
                <div className="story-accent-card">
                  <span className="accent-card-label">World's finest single-origin coffee</span>
                </div>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* QUALITY */}
      <section className="section section--dark" id="quality">
        <div className="container">
          <FadeInSection className="section-header section-header--center">
            <span className="section-label section-label--light">Why Choose Us</span>
            <h2 className="section-title section-title--light">Uncompromising <em>Premium Quality</em></h2>
            <p className="section-subtitle section-subtitle--light">Every step of our process is designed to deliver the purest, most flavorful coffee experience.</p>
          </FadeInSection>
          <div className="quality-grid">
            {[
              { title: 'Hand-Selected Beans', text: 'Our master selectors hand-pick only the ripest coffee cherries. Each batch is inspected to ensure only the top 2% of beans make it to your cup.', badge: 'Top 2% Selection' },
              { title: 'Expert Roasting', text: 'Certified master roasters use Loring Smart Roasters with precise temperature profiles to unlock each bean\'s unique flavor potential.', badge: 'Loring Certified' },
              { title: 'Lab-Tested Purity', text: 'Every shipment undergoes rigorous SCA-standard cupping and lab testing for moisture, density, defect count, and flavor profile.', badge: 'SCA Certified' },
            ].map((q, i) => (
              <FadeInSection key={i} delay={i * 0.12}>
                <div className="quality-card">
                  <div className="quality-card-icon">
                    {i === 0 && <Award size={40} strokeWidth={1.2} />}
                    {i === 1 && <Shield size={40} strokeWidth={1.2} />}
                    {i === 2 && <Star size={40} strokeWidth={1.2} />}
                  </div>
                  <h3 className="quality-card-title">{q.title}</h3>
                  <p className="quality-card-text">{q.text}</p>
                  <span className="quality-card-badge">{q.badge}</span>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* VARIETIES */}
      <section className="section" id="varieties">
        <div className="container">
          <FadeInSection className="section-header section-header--center">
            <span className="section-label">Our Collection</span>
            <h2 className="section-title">Signature Ethiopian <em>Varieties</em></h2>
            <p className="section-subtitle">Each region produces beans with distinct, unforgettable flavor profiles.</p>
          </FadeInSection>
          <div className="varieties-grid">
            {varieties.map((v, i) => (
              <FadeInSection key={v.id} delay={i * 0.1}>
                <div className="variety-card">
                  <div className="variety-img-wrap">
                    <img src={v.img} alt={`${v.name} coffee`} className="variety-img" loading="lazy" />
                    <span className="variety-origin">{v.name}</span>
                  </div>
                  <div className="variety-info">
                    <div className="variety-stars">
                      {[...Array(5)].map((_, j) => <Star key={j} size={14} fill="currentColor" />)}
                    </div>
                    <h3 className="variety-name">{v.name}</h3>
                    <p className="variety-region">{v.region}</p>
                    <div className="variety-meta-row" style={{ display: 'flex', gap: 16, fontSize: '.78rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                      <span>{v.altitude}</span>
                      <span>|</span>
                      <span>{v.process}</span>
                    </div>
                    <div className="variety-notes">
                      {v.notes.map(n => <span key={n} className="note-tag">{n}</span>)}
                    </div>
                    <p className="variety-desc" style={{ fontSize: '.88rem', lineHeight: 1.7 }}>{v.desc}</p>
                    <Link to={`/shop?region=${v.id}`} className="btn btn--primary btn--sm" style={{ marginTop: 12 }}>Explore {v.name} Coffee</Link>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* SUSTAINABILITY */}
      <section className="section section--cream" id="sustainability">
        <div className="container">
          <FadeInSection className="section-header section-header--center">
            <span className="section-label">Our Commitment</span>
            <h2 className="section-title">Pure at Every Step &mdash; <em>Clean and Sustainable</em></h2>
            <p className="section-subtitle">From farm to cup, the highest standards of cleanliness, organic farming, and stewardship.</p>
          </FadeInSection>
          <div className="sustain-grid">
            {sustainability.map((s, i) => {
              const Icon = s.icon
              return (
                <FadeInSection key={i} delay={i * 0.08}>
                  <div className="sustain-card">
                    <div className="sustain-icon-wrap">
                      <Icon size={28} strokeWidth={1.3} />
                    </div>
                    <h3 className="sustain-title">{s.title}</h3>
                    <p className="sustain-text">{s.text}</p>
                  </div>
                </FadeInSection>
              )
            })}
          </div>
          <FadeInSection>
            <div className="cert-bar">
              <div className="cert-item"><Award size={18} /> SCA Score 85+</div>
              <div className="cert-item"><Leaf size={18} /> USDA Organic</div>
              <div className="cert-item"><Globe size={18} /> Fair Trade</div>
              <div className="cert-item"><Shield size={18} /> ISO 22000</div>
              <div className="cert-item"><Leaf size={18} /> Rainforest Alliance</div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* GLOBAL */}
      <section className="section section--dark" id="global">
        <div className="container">
          <FadeInSection className="section-header section-header--center">
            <span className="section-label section-label--light">Worldwide Distribution</span>
            <h2 className="section-title section-title--light">Ethiopian Excellence, <em>Delivered Globally</em></h2>
            <p className="section-subtitle section-subtitle--light">From Addis Ababa to Amsterdam, New York to Tokyo — over 30 countries across 6 continents.</p>
          </FadeInSection>
          <div className="global-stats">
            {[
              { n: 30, s: '+', l: 'Countries Served' },
              { n: 500, s: 'K+', l: 'Tons Exported Annually' },
              { n: 98, s: '%', l: 'On-Time Delivery' },
              { n: 24, s: '/7', l: 'Export Support' },
            ].map((g, i) => (
              <FadeInSection key={i} delay={i * 0.1}>
                <div className="global-stat">
                  <span className="global-stat-num"><AnimatedCounter target={g.n} suffix={g.s} /></span>
                  <span className="global-stat-label">{g.l}</span>
                </div>
              </FadeInSection>
            ))}
          </div>
          <FadeInSection>
            <div className="regions-bar">
              <h3 className="regions-title">Our Global Presence</h3>
              <div className="regions-grid">
                {regions.map((r, i) => (
                  <div key={i} className="region-item">
                    <span className="region-flag">{r.flag}</span>
                    <span className="region-name">{r.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeInSection>
          <FadeInSection className="section-header section-header--center" style={{ marginTop: '40px' }}>
            <Link to="/contact" className="btn btn--primary btn--lg">Become a Distributor</Link>
          </FadeInSection>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <Testimonials />

      {/* CTA */}
      <section className="section section--cream">
        <div className="container">
          <FadeInSection className="cta-block">
            <h2 className="cta-title">Ready to Experience<br /><em>Authentic Ethiopian Coffee?</em></h2>
            <p className="cta-text">Whether you're a roaster, cafe owner, distributor, or coffee enthusiast — we'd love to start a conversation.</p>
            <div className="cta-actions">
              <Link to="/shop" className="btn btn--primary btn--lg">Shop Now</Link>
              <Link to="/contact" className="btn btn--outline-dark btn--lg">Get in Touch</Link>
            </div>
          </FadeInSection>
        </div>
      </section>
    </>
  )
}

function Testimonials() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setCurrent(c => (c + 1) % testimonials.length), 6000)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="section" id="testimonials">
      <div className="container">
        <FadeInSection className="section-header section-header--center">
          <span className="section-label">What People Say</span>
          <h2 className="section-title">Trusted by Coffee <em>Lovers Worldwide</em></h2>
        </FadeInSection>
        <FadeInSection>
          <div className="testimonial-carousel">
            <div className="testimonial-track" style={{ transform: `translateX(-${current * 100}%)` }}>
              {testimonials.map((t, i) => (
                <div key={i} className="testimonial-card">
                  <div className="testimonial-stars">
                    {[...Array(5)].map((_, j) => <Star key={j} size={16} fill="currentColor" />)}
                  </div>
                  <blockquote className="testimonial-text">{t.text}</blockquote>
                  <div className="testimonial-author">
                    <div className="author-avatar">{t.initials}</div>
                    <div>
                      <strong>{t.name}</strong>
                      <span>{t.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="testimonial-nav">
              <button onClick={() => setCurrent(c => (c - 1 + testimonials.length) % testimonials.length)} className="testimonial-btn" aria-label="Previous"><ChevronLeft size={20} /></button>
              <div className="testimonial-dots">
                {testimonials.map((_, i) => (
                  <button key={i} onClick={() => setCurrent(i)} className={`dot ${i === current ? 'dot--active' : ''}`} aria-label={`Go to slide ${i + 1}`} />
                ))}
              </div>
              <button onClick={() => setCurrent(c => (c + 1) % testimonials.length)} className="testimonial-btn" aria-label="Next"><ChevronRight size={20} /></button>
            </div>
          </div>
        </FadeInSection>
      </div>
    </section>
  )
}
