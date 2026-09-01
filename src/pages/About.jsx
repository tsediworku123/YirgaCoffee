import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Award, Users, Globe, Leaf } from 'lucide-react'

function FadeIn({ children, className = '', delay = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div ref={ref} className={className} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay }}>
      {children}
    </motion.div>
  )
}

const timeline = [
  { year: '800 AD', title: 'The Discovery', text: 'Kaldi the goat herder discovers coffee in the forests of Kaffa, Ethiopia. The energizing red cherries spread across the region.' },
  { year: '1500s', title: 'Spreads to Arabia', text: 'Coffee cultivation reaches Yemen via Ethiopian ports. The first coffee houses open in Mocha, creating global trade routes.' },
  { year: '2008', title: 'Yirga Coffee Founded', text: 'Our founder begins sourcing single-origin beans from Yirgacheffe, driven by a mission to connect farmers directly with the world.' },
  { year: '2015', title: 'Global Expansion', text: 'Partnerships established across 30+ countries. Rotterdam export office opens. First USDA Organic and Fair Trade certifications received.' },
  { year: '2020', title: 'Carbon Neutral', text: 'Achieve carbon-neutral operations. Launch reforestation program in partnership with Ethiopian highland communities.' },
  { year: 'Today', title: 'The Future', text: '50+ family farms, 30+ countries served, and an unwavering commitment to quality that started over 1,200 years ago.' },
]

const values = [
  { icon: Award, title: 'Quality Above All', text: 'We never compromise. Every bean is scored, cupped, and tested before it carries the Yirga name.' },
  { icon: Users, title: 'Farm-First Partnership', text: 'Direct trade means farmers earn fair wages and invest in their communities and land.' },
  { icon: Globe, title: 'Global Reach, Local Roots', text: 'We bring Ethiopian coffee to the world while keeping our operations rooted in Ethiopian communities.' },
  { icon: Leaf, title: 'Environmental Stewardship', text: 'Organic farming, water recycling, and carbon-neutral shipping protect the land that gives us so much.' },
]

export default function About() {
  return (
    <>
      {/* Hero */}
      <section className="about-hero">
        <div className="about-hero-bg" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=1920&q=80)' }} />
        <div className="about-hero-overlay" />
        <div className="container about-hero-content">
          <span className="section-label section-label--light">Our Story</span>
          <h1 className="about-hero-title">1,200 Years of<br /><em>Coffee Heritage</em></h1>
          <p className="about-hero-text">From the ancient forests of Kaffa to the tables of the world's finest cafes, the story of Yirga Coffee is inseparable from the story of coffee itself.</p>
        </div>
      </section>

      {/* Mission */}
      <section className="section section--cream">
        <div className="container">
          <div className="about-mission-grid">
            <FadeIn>
              <span className="section-label">Our Mission</span>
              <h2 className="section-title">To connect the world with<br /><em>authentic Ethiopian coffee</em></h2>
              <p className="story-body">We believe that great coffee tells a story — of the land it grows on, the hands that tend it, and the centuries of tradition behind it. Yirga Coffee exists to share that story with every cup.</p>
              <p className="story-body">By working directly with smallholder farmers, we ensure they receive fair compensation while delivering the highest quality beans to roasters, cafes, and homes around the world.</p>
            </FadeIn>
            <FadeIn delay={0.15}>
              <div className="about-mission-visual">
                <img src="https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=800&q=80" alt="Coffee cherries being hand-picked in the Ethiopian highlands" className="about-mission-img" loading="lazy" />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section">
        <div className="container">
          <FadeIn className="section-header section-header--center">
            <span className="section-label">Our Journey</span>
            <h2 className="section-title">A Timeline of <em>Heritage</em></h2>
          </FadeIn>
          <div className="timeline">
            {timeline.map((t, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className={`timeline-item ${i % 2 === 0 ? 'timeline-item--left' : 'timeline-item--right'}`}>
                  <div className="timeline-dot" />
                  <div className="timeline-card">
                    <span className="timeline-year">{t.year}</span>
                    <h3 className="timeline-title">{t.title}</h3>
                    <p className="timeline-text">{t.text}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section section--cream">
        <div className="container">
          <FadeIn className="section-header section-header--center">
            <span className="section-label">What We Stand For</span>
            <h2 className="section-title">Our <em>Values</em></h2>
          </FadeIn>
          <div className="values-grid">
            {values.map((v, i) => {
              const Icon = v.icon
              return (
                <FadeIn key={i} delay={i * 0.1}>
                  <div className="value-card">
                    <div className="value-icon"><Icon size={32} strokeWidth={1.2} /></div>
                    <h3 className="value-title">{v.title}</h3>
                    <p className="value-text">{v.text}</p>
                  </div>
                </FadeIn>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
