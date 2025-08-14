import { Router } from 'express'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import auth from '../middleware/auth.js'

const router = Router()

// Create order
router.post('/', auth, async (req,res)=>{
  const { items, total, paymentMethod, deliveryMethod, address } = req.body
  if (!Array.isArray(items) || items.length===0) return res.status(400).json({ message:'no items' })
  // check stock
  for (const it of items){
    const p = await Product.findById(it.productId)
    if (!p || p.stock < it.qty) return res.status(400).json({ message:`stock not enough for ${it.name}` })
  }
  // reduce stock
  for (const it of items){
    await Product.updateOne({ _id: it.productId }, { $inc: { stock: -it.qty } })
  }
  const order = await Order.create({
    user: req.user._id, items, total, status:'processing', paymentMethod, deliveryMethod, address
  })
  res.json({ orderId: order._id })
})

// My orders
router.get('/me', auth, async (req,res)=>{
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt:-1 }).lean()
  res.json({ orders })
})

export default router
