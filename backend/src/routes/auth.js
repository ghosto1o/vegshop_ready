// backend/src/routes/auth.js
import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import User from '../models/User.js'
import auth from '../middleware/auth.js'

const router = Router()

// ====== Config ======
const ACCESS_TTL = '15m'                       // อายุ access token
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 วัน
const BCRYPT_ROUNDS = 12
const MAX_ATTEMPTS = 5                         // ล็อกหลังพลาด 5 ครั้ง
const LOCK_MS = 15 * 60 * 1000                 // 15 นาที

// ====== Helpers ======
function signAccessToken(sub){
  return jwt.sign({ sub }, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL })
}
function hashRefreshToken(token){
  return crypto.createHash('sha256').update(token).digest('hex')
}
function newRefreshToken(){
  return crypto.randomBytes(48).toString('base64url')
}
function setRefreshCookie(res, token){
  res.cookie('veg_refresh', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/auth/refresh',
    maxAge: REFRESH_TTL_MS
  })
}

// ตรวจ Origin/Referer สำหรับ /refresh (ลด CSRF บนเส้นนี้)
function originOk(req){
  const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',')
  const origin = req.headers.origin || ''
  const referer = req.headers.referer || ''
  return origins.some(o => origin.startsWith(o) || referer.startsWith(o))
}

// Zod Schemas
const regSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),

   // ฟิลด์ที่อยู่ที่มาจากฟอร์มสมัคร
  addressLine: z.string().optional(),
  addressPhone: z.string().optional(),
  addressNote: z.string().optional(),
})
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

// Rate limit per IP
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 นาที
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
})

// ====== Routes ======
router.post('/register', authLimiter, async (req,res)=>{
  try{
    const input = regSchema.parse(req.body)
    const email = input.email.toLowerCase()
     console.log('[auth] register', email, { withAddress: !!input.addressLine })

    const exists = await User.findOne({ email })
      if (exists) return res.status(400).json({ message:'email exists' })
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS)
    
    const addresses = input.addressLine ? [{
      line: input.addressLine,
      phone: input.addressPhone || input.phone || '',
      note: input.addressNote || ''
    }] : []

    const user = await User.create({
      name: input.name,
      email,
      phone: input.phone,
      passwordHash,
      role: 'buyer',
      addresses,
      defaultAddressIndex: addresses.length ? 0 : 0,
    })


    // ออก token
    const access = signAccessToken(user._id)
    const refresh = newRefreshToken()
    const tokenHash = hashRefreshToken(refresh)
    user.refreshTokens = user.refreshTokens || []
    user.refreshTokens.push({ tokenHash, expiresAt: new Date(Date.now() + REFRESH_TTL_MS) })
    await user.save()
    setRefreshCookie(res, refresh)

    console.log('[auth] register OK', { id: user._id.toString(), addressCount: user.addresses?.length || 0 })
    res.json({
      accessToken: access,
      user: { id:user._id, name:user.name, email:user.email, role:user.role }
    })
  }catch(e){
    console.log('[auth] register error', e.message)
    if (e.name === 'ZodError') return res.status(400).json({ message: 'invalid input' })
    res.status(500).json({ message:'register error' })
  }
})

router.post('/login', authLimiter, async (req,res)=>{
  try{
    const { email, password } = loginSchema.parse(req.body)
    const lower = email.toLowerCase()
    const user = await User.findOne({ email: lower })
    const now = Date.now()

    // user enumeration safe: ใช้ข้อความกลางๆ
    if (!user) {
      console.log('[auth] login fail: user not found')
      await new Promise(r => setTimeout(r, 300)) // หน่วงนิดเพื่อลด side channel
      return res.status(400).json({ message:'invalid credentials' })
    }

    // ตรวจ lockout
    if (user.lockUntil && user.lockUntil.getTime() > now){
      console.log('[auth] account locked until', user.lockUntil)
      return res.status(429).json({ message:'too many attempts, try later' })
    }

    const ok = await bcrypt.compare(password, user.passwordHash || '')
    console.log('[auth] password match?', ok)

    if (!ok){
      user.loginAttempts = (user.loginAttempts || 0) + 1
      if (user.loginAttempts >= MAX_ATTEMPTS){
        user.lockUntil = new Date(now + LOCK_MS)
        user.loginAttempts = 0
        console.log('[auth] locked account for', LOCK_MS/60000, 'minutes')
      }
      await user.save()
      return res.status(400).json({ message:'invalid credentials' })
    }

    // success → reset counters
    user.loginAttempts = 0
    user.lockUntil = null

    // issue tokens
    const access = signAccessToken(user._id)
    const refresh = newRefreshToken()
    const tokenHash = hashRefreshToken(refresh)

    // หมุน refresh: เก็บสูงสุด 5 อันล่าสุด
    user.refreshTokens.push({ tokenHash, expiresAt: new Date(Date.now() + REFRESH_TTL_MS) })
    if (user.refreshTokens.length > 5) user.refreshTokens = user.refreshTokens.slice(-5)
    await user.save()

    setRefreshCookie(res, refresh)
    console.log('[auth] login OK', user._id.toString())
    res.json({ accessToken: access, user: { id:user._id, name:user.name, email:user.email, role:user.role } })
  }catch(e){
    console.log('[auth] login error', e.message)
    if (e.name === 'ZodError') return res.status(400).json({ message: 'invalid input' })
    res.status(500).json({ message:'login error' })
  }
})

// ใช้เช็กโปรไฟล์ด้วย access token
router.get('/me', auth, async (req,res)=>{
  const u = req.user
  console.log('[auth] me', u.email)
  res.json({ user: { id:u._id, name:u.name, email:u.email, role:u.role } })
})

// รับ refresh (ใช้ cookie) → ออก access token ใหม่ + หมุน refresh
router.post('/refresh', async (req,res)=>{
  try{
    if (!originOk(req)) {
      console.log('[auth] refresh blocked by origin check')
      return res.status(403).json({ message:'forbidden' })
    }
    const old = req.cookies?.veg_refresh
    if (!old) return res.status(401).json({ message:'no refresh' })
    const oldHash = hashRefreshToken(old)

    const user = await User.findOne({ 'refreshTokens.tokenHash': oldHash })
    if (!user) {
      console.log('[auth] refresh token not found (possible reuse)')
      // hard revoke all tokens for safety
      await User.updateOne({ 'refreshTokens.tokenHash': oldHash }, { $set: { refreshTokens: [] } })
      res.clearCookie('veg_refresh', { path:'/auth/refresh' })
      return res.status(401).json({ message:'invalid refresh' })
    }

    // ตรวจอายุ
    const entry = user.refreshTokens.find(t => t.tokenHash === oldHash)
    if (!entry || (entry.expiresAt && entry.expiresAt.getTime() < Date.now())){
      console.log('[auth] refresh expired')
      user.refreshTokens = user.refreshTokens.filter(t => t.tokenHash !== oldHash)
      await user.save()
      res.clearCookie('veg_refresh', { path:'/auth/refresh' })
      return res.status(401).json({ message:'expired refresh' })
    }

    // หมุน refresh: ลบของเก่า ออกของใหม่
    user.refreshTokens = user.refreshTokens.filter(t => t.tokenHash !== oldHash)
    const newRaw = newRefreshToken()
    const newHash = hashRefreshToken(newRaw)
    user.refreshTokens.push({ tokenHash: newHash, expiresAt: new Date(Date.now() + REFRESH_TTL_MS) })
    await user.save()

    setRefreshCookie(res, newRaw)
    const access = signAccessToken(user._id)
    console.log('[auth] refresh OK', user.email)
    res.json({ accessToken: access })
  }catch(e){
    console.log('[auth] refresh error', e.message)
    res.status(500).json({ message:'refresh error' })
  }
})

// ออกจากระบบ → เพิกถอน refresh ปัจจุบัน + ล้าง cookie
router.post('/logout', async (req,res)=>{
  try{
    const raw = req.cookies?.veg_refresh
    if (raw){
      const h = hashRefreshToken(raw)
      await User.updateOne({ 'refreshTokens.tokenHash': h }, { $pull: { refreshTokens: { tokenHash: h } } })
    }
    res.clearCookie('veg_refresh', { path:'/auth/refresh' })
    console.log('[auth] logout OK')
    res.json({ ok:true })
  }catch(e){
    console.log('[auth] logout error', e.message)
    res.status(500).json({ message:'logout error' })
  }
})

export default router
