import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import auth from '../middleware/auth.js'

const router = Router()

router.post('/register', async (req,res)=>{
  const { name, email, phone, password } = req.body
  if (!name || !email || !password) return res.status(400).json({ message:'missing fields' })
  const exists = await User.findOne({ email: email.toLowerCase() })
  if (exists) return res.status(400).json({ message:'email exists' })
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await User.create({ name, email: email.toLowerCase(), phone, passwordHash, role:'buyer' })
  const token = jwt.sign({ sub:user._id }, process.env.JWT_SECRET, { expiresIn:'7d' })
  res.json({ token, user: { id:user._id, name:user.name, email:user.email, role:user.role } })
})

router.post('/login', async (req,res)=>{
  const { email, password } = req.body
  const user = await User.findOne({ email: (email||'').toLowerCase() })
  if (!user) return res.status(400).json({ message:'invalid credentials' })
  const ok = await bcrypt.compare(password||'', user.passwordHash||'')
  if (!ok) return res.status(400).json({ message:'invalid credentials' })
  const token = jwt.sign({ sub:user._id }, process.env.JWT_SECRET, { expiresIn:'7d' })
  res.json({ token, user: { id:user._id, name:user.name, email:user.email, role:user.role } })
})

router.get('/me', auth, async (req,res)=>{
  const u = req.user
  res.json({ user: { id:u._id, name:u.name, email:u.email, role:u.role } })
})

export default router
