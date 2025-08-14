import { Router } from 'express'
import Product from '../models/Product.js'
import auth from '../middleware/auth.js'
import role from '../middleware/role.js'
const router = Router()

router.get('/', async (_req,res)=>{
  const items = await Product.find().sort({ createdAt:-1 }).lean()
  res.json({ items })
})

router.post('/', auth, role('admin'), async (req,res)=>{
  const item = await Product.create(req.body)
  res.json({ item })
})
router.put('/:id', auth, role('admin'), async (req,res)=>{
  const item = await Product.findByIdAndUpdate(req.params.id, req.body, { new:true })
  if (!item) return res.status(404).json({ message:'not found' })
  res.json({ item })
})
router.delete('/:id', auth, role('admin'), async (req,res)=>{
  const item = await Product.findByIdAndDelete(req.params.id)
  if (!item) return res.status(404).json({ message:'not found' })
  res.json({ ok:true })
})

export default router
