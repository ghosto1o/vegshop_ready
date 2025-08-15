import { Router } from 'express'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import auth from '../middleware/auth.js'
const router = Router()
router.use((req,res,next)=>{ console.log('[orders] incoming', req.method, req.originalUrl); next() })
router.use(auth)
router.post('/', async (req,res)=>{
  try{
    if (!req.user?._id) return res.status(401).json({ message:'unauthorized' })
    const { items, total, paymentMethod, deliveryMethod, address } = req.body
    if (!Array.isArray(items) || items.length===0) return res.status(400).json({ message:'no items' })
    for (const it of items){
      const p = await Product.findById(it.productId)
      if (!p || p.stock < it.qty) return res.status(400).json({ message:`stock not enough for ${it?.name||it.productId}` })
    }
    for (const it of items){ await Product.updateOne({ _id: it.productId }, { $inc: { stock: -it.qty } }) }
    const order = await Order.create({ user: req.user._id, items, total, status:'processing', paymentMethod, deliveryMethod, address })
    console.log('[orders] created', order._id.toString(), 'by', req.user.email)
    res.json({ orderId: order._id })
  }catch(e){ console.log('[orders] error', e.message); res.status(500).json({ message:'order error' }) }
})
router.get('/me', async (req,res)=>{ const orders = await Order.find({ user: req.user._id }).sort({createdAt:-1}).lean(); res.json({ orders }) })
export default router
