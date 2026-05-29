import { useState, useEffect, useRef, useCallback } from 'react'

const marsPhotos = [
  { src: `${import.meta.env.BASE_URL}assets/mars-1.jpg`, cap: 'главный соучастник' },
]

const TAUNTS = [
  'ну Настюшка…', 'точно нет?', 'а если подумать?',
  'Марс будет грустить', 'ягодка, ну пожалуйста',
  'эта кнопка сломана 😅', 'попробуй поймай',
]

const LANTERN_COUNT = 6

export default function App() {
  const [litSet, setLitSet] = useState(new Set())
  const [scrollCueVisible, setScrollCueVisible] = useState(false)
  const [cardOpen, setCardOpen] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState(null)
  const [finaleShown, setFinaleShown] = useState(false)
  const [noText, setNoText] = useState('нет')
  const [noStyle, setNoStyle] = useState({})

  const starsRef = useRef(null)
  const ambientRef = useRef(null)
  const stageRef = useRef(null)
  const noRef = useRef(null)
  const noTauntI = useRef(0)
  const noDodges = useRef(0)
  const lanternDelays = useRef(
    Array.from({ length: LANTERN_COUNT }, () => (Math.random() * 1.5).toFixed(2) + 's')
  )

  const lit = litSet.size

  const hintText =
    lit >= LANTERN_COUNT ? 'небо засияло — теперь листай вниз ✦'
    : lit >= 2            ? 'вот так… ещё чуть-чуть света'
    :                       'нажми на фонарики, чтобы зажечь небо'

  // Scroll cue — after all lit or 6s timeout
  useEffect(() => {
    if (lit >= LANTERN_COUNT) setScrollCueVisible(true)
  }, [lit])

  useEffect(() => {
    const t = setTimeout(() => setScrollCueVisible(true), 6000)
    return () => clearTimeout(t)
  }, [])

  // Stars
  useEffect(() => {
    const layer = starsRef.current
    if (!layer) return
    const n = Math.min(140, Math.round(window.innerWidth * window.innerHeight / 9000))
    for (let i = 0; i < n; i++) {
      const s = document.createElement('div')
      s.className = 'star'
      s.style.left = Math.random() * 100 + 'vw'
      s.style.top = Math.random() * 100 + 'vh'
      s.style.setProperty('--tw', (2 + Math.random() * 5).toFixed(2) + 's')
      s.style.animationDelay = (Math.random() * 5).toFixed(2) + 's'
      if (Math.random() > .8) { s.style.width = s.style.height = '3px' }
      layer.appendChild(s)
    }
    return () => { layer.innerHTML = '' }
  }, [])

  // Ambient lanterns
  useEffect(() => {
    const layer = ambientRef.current
    if (!layer) return
    const timers = []

    function spawn() {
      const cls = Math.random() > .55 ? 'tiny' : 'small'
      const l = document.createElement('div')
      l.className = 'lantern ' + cls
      l.innerHTML = '<div class="body"></div>'
      const dur = 14 + Math.random() * 16
      l.style.position = 'absolute'
      l.style.left = Math.random() * 100 + 'vw'
      l.style.bottom = '-70px'
      l.style.opacity = (0.18 + Math.random() * 0.4).toFixed(2)
      l.style.transition = `transform ${dur}s linear, opacity ${dur}s linear`
      layer.appendChild(l)
      requestAnimationFrame(() => {
        l.style.transform = `translateY(-${110 + Math.random() * 20}vh) translateX(${Math.random() * 80 - 40}px)`
        l.style.opacity = '0'
      })
      const t = setTimeout(() => l.remove(), dur * 1000 + 500)
      timers.push(t)
    }

    for (let i = 0; i < 7; i++) {
      const t = setTimeout(spawn, i * 900)
      timers.push(t)
    }
    const interval = setInterval(spawn, 2200)
    return () => {
      timers.forEach(clearTimeout)
      clearInterval(interval)
    }
  }, [])

  // Scroll reveal
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.reveal'))
    const showInView = () => {
      const vh = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0, 600)
      els.forEach(el => {
        const r = el.getBoundingClientRect()
        if (r.top < vh * 0.92 && r.bottom > 0) el.classList.add('in')
      })
    }
    requestAnimationFrame(() => requestAnimationFrame(showInView))
    showInView()
    window.addEventListener('load', showInView)
    window.addEventListener('scroll', showInView, { passive: true })
    window.addEventListener('resize', showInView)

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } })
      }, { threshold: 0.18 })
      els.forEach(el => io.observe(el))
    }

    const t1 = setTimeout(showInView, 120)
    const t2 = setTimeout(() => els.forEach(el => el.classList.add('in')), 400)
    return () => {
      window.removeEventListener('load', showInView)
      window.removeEventListener('scroll', showInView)
      window.removeEventListener('resize', showInView)
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [finaleShown])

  const handleLanternClick = (index) => {
    setLitSet(prev => {
      if (prev.has(index)) return prev
      return new Set([...prev, index])
    })
  }

  const flee = useCallback(() => {
    const stage = stageRef.current
    const no = noRef.current
    if (!stage || !no) return
    noDodges.current++
    const sb = stage.getBoundingClientRect()
    const w = no.offsetWidth
    const h = no.offsetHeight
    const maxX = Math.max(10, sb.width - w - 10)
    const maxY = Math.max(10, sb.height - h - 10)
    const x = Math.random() * maxX
    const y = Math.random() * maxY
    const scale = Math.max(0.55, 1 - noDodges.current * 0.06)
    setNoStyle({ left: x + 'px', top: y + 'px', transform: 'none', fontSize: (18 * scale).toFixed(1) + 'px' })
    setNoText(TAUNTS[noTauntI.current % TAUNTS.length])
    noTauntI.current++
  }, [])

  function burst() {
    const colors = ['#f7c948', '#ffe7a3', '#f3a7bb', '#cdb8ee', '#fffbe9']
    for (let i = 0; i < 60; i++) {
      const l = document.createElement('div')
      l.className = 'lantern confetti-lantern ' + (Math.random() > .5 ? 'small' : 'tiny')
      l.innerHTML = '<div class="body"></div>'
      const body = l.querySelector('.body')
      const col = colors[i % colors.length]
      body.style.background = `radial-gradient(60% 55% at 50% 62%, #fff, ${col} 60%, ${col})`
      body.style.boxShadow = `0 0 20px ${col}`
      l.style.left = Math.random() * 100 + 'vw'
      const dur = 4 + Math.random() * 4
      l.style.transition = `transform ${dur}s cubic-bezier(.3,.7,.5,1), opacity ${dur}s ease`
      document.body.appendChild(l)
      requestAnimationFrame(() => {
        l.style.transform = `translateY(-${100 + Math.random() * 30}vh) translateX(${Math.random() * 200 - 100}px) rotate(${Math.random() * 40 - 20}deg)`
        l.style.opacity = '0'
      })
      setTimeout(() => l.remove(), dur * 1000 + 400)
    }
  }

  const handleYes = () => {
    setFinaleShown(true)
    burst()
    setTimeout(() => {
      document.getElementById('hooray')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  return (
    <>
      <div className="sky" />
      <div className="stars" ref={starsRef} />
      <div className="ambient" ref={ambientRef} />

      {/* ========== HERO ========== */}
      <section className="section" id="hero">
        <div className="wrap">
          <div className="hero-lanterns">
            {Array.from({ length: LANTERN_COUNT }, (_, i) => (
              <div
                key={i}
                className={`lantern interactive${litSet.has(i) ? ' lit' : ''}`}
                onClick={() => handleLanternClick(i)}
                style={litSet.has(i) ? { animationDelay: lanternDelays.current[i] } : {}}
              >
                <span className="string" />
                <div className="body" />
              </div>
            ))}
          </div>
          <p className="kicker reveal">Однажды, в одном маленьком королевстве,<br />жил один Иванушка…</p>
          <h1 className="script reveal" style={{ margin: '8px 0 6px' }}>Настя,</h1>
          <p className="lead reveal">у меня к тебе очень важное<br />и очень нежное дело&nbsp;🏮</p>
          <div className="hint">
            {hintText} <span className="dot" />
          </div>
        </div>
        <div className={`scroll-cue${scrollCueVisible ? ' show' : ''}`}>
          дальше<span className="arrow">↓</span>
        </div>
      </section>

      {/* ========== ОТКРЫТКА ========== */}
      <section className="section">
        <div className="wrap">
          <div className="divider reveal"><div className="braid" /><div className="flower" /></div>
          <h2 className="script reveal" style={{ marginBottom: '6px' }}>маленькое письмо</h2>
          <p className="lead muted reveal" style={{ marginBottom: '26px' }}>для моей зайки и ягодки</p>
          <div className="card-scene reveal">
            <div className={`card${cardOpen ? ' open' : ''}`} onClick={() => setCardOpen(o => !o)}>
              <div className="card-cover">
                <div className="card-seal">🌟</div>
                <div className="label">запечатано специально для тебя</div>
                <div className="open-word">нажми, чтобы открыть</div>
              </div>
              <div className="card-inside">
                <div className="from">от Иванушки — для Настюшки</div>
                <div className="msg">Я хочу привнести немного романтики в&nbsp;наши отношения, потому&nbsp;что очень люблю тебя.</div>
                <div className="sign">твой Иванушка</div>
              </div>
            </div>
          </div>
          <p className="card-tip reveal">(да-да, по ней можно нажимать)</p>
        </div>
      </section>

      {/* ========== МАРС ========== */}
      <section className="section">
        <div className="wrap">
          <div className="divider reveal"><div className="braid" /><div className="flower" /></div>
          <p className="kicker reveal">а теперь — слово главному эксперту по нежности</p>
          <h2 className="script reveal" style={{ margin: '6px 0 4px' }}>Марс одобряет</h2>
          <div className="gallery reveal">
            {marsPhotos.map((p, i) => (
              <div key={i} className="polaroid" onClick={() => setLightboxSrc(p.src)}>
                <img src={p.src} alt="Марс" />
                <div className="cap">{p.cap}</div>
              </div>
            ))}
          </div>
          <p className="mars-quote reveal">
            «Я, кот <b>Марс</b>, лично проверил этого человека.<br />
            Лапки чистые, намерения серьёзные. <b>Рекомендую сказать «да».</b>»
          </p>
        </div>
      </section>

      {/* ========== ПРИГЛАШЕНИЕ ========== */}
      <section className="section">
        <div className="wrap">
          <div className="divider reveal"><div className="braid" /><div className="flower" /></div>
          <div className="scroll-card reveal">
            <div className="crest">🏰</div>
            <div className="decree">королевский указ о свидании</div>
            <div className="what">на пикник</div>
            <div className="when">в следующие выходные</div>
            <ul className="checklist">
              <li><span className="b" /> мягкий плед и солнечная полянка</li>
              <li><span className="b" /> корзинка с твоими любимыми вкусняшками</li>
              <li><span className="b" /> фонарики, когда начнёт темнеть</li>
              <li><span className="b" /> и я, который очень-очень рад тебе</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ========== RSVP ========== */}
      <section className="section" id="hooray">
        <div className="wrap">
          <div className="divider reveal"><div className="braid" /><div className="flower" /></div>
          {!finaleShown ? (
            <>
              <div className="rsvp-q">ну что, ты со мной?</div>
              <div className="rsvp-stage" ref={stageRef}>
                <button className="btn btn-yes" onClick={handleYes}>Да! ✨</button>
                <button
                  className="btn btn-no"
                  ref={noRef}
                  style={noStyle}
                  onMouseEnter={flee}
                  onClick={flee}
                  onTouchStart={(e) => { e.preventDefault(); flee() }}
                >
                  {noText}
                </button>
              </div>
            </>
          ) : (
            <div className="finale show">
              <div className="big">я знал!&nbsp;🥹</div>
              <p className="sub">лучшее свидание в королевстве уже совсем скоро. Я тебя очень люблю, зайка.</p>
              <div className="lantern lit" style={{ marginTop: '6px' }}><div className="body" /></div>
            </div>
          )}
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="footer">
        <div className="divider reveal" style={{ marginBottom: '18px' }}><div className="braid" /><div className="flower" /></div>
        <div className="sign">От Иванушки</div>
        <p className="ps">с любовью и горящими фонариками <span className="heart">♥</span></p>
      </footer>

      {/* ========== LIGHTBOX ========== */}
      {lightboxSrc && (
        <div className="lightbox show" onClick={() => setLightboxSrc(null)}>
          <span className="close">×</span>
          <img src={lightboxSrc} alt="Марс" />
        </div>
      )}
    </>
  )
}
