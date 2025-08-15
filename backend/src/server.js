import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import health from './routes/health.js'
import auth from './routes/auth.js'
import products from './routes/products.js'
import orders from './routes/orders.js'
import adminBuyers from './routes/admin.buyers.js'
import adminOrders from './routes/admin.orders.js'
import authMw from './middleware/auth.js'
import payments from './routes/payments.js'
import authRoutes from './routes/auth.js'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import mongoSanitize from 'express-mongo-sanitize'
import account from './routes/account.js'



const app = express()
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*', credentials: true }))
app.use(express.json())
app.use(express.urlencoded({ extended:true }))
app.use('/account', account)
app.get('/', (_req,res)=> res.json({ name:'vegshop-api' }))
app.use('/health', health)
app.use('/auth', auth)
app.use('/products', products)
app.use('/orders', orders)
app.use('/admin', authMw, adminBuyers)
app.use('/admin', authMw, adminOrders)
app.use('/payments', payments)
app.use('/auth', authRoutes)
app.use(helmet({crossOriginResourcePolicy: { policy: "cross-origin" }}))

const allowed = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',')
app.use(cors({ origin: allowed, credentials: true }))

app.use(express.json({ limit:'1mb' }))
app.use(express.urlencoded({ extended:true }))
app.use(cookieParser())
app.use(mongoSanitize())



// ป้องกัน NoSQL injection
app.use(mongoSanitize())

const PORT = process.env.PORT || 4000
mongoose.connect(process.env.MONGO_URI).then(()=>{
  app.listen(PORT, ()=> console.log(`[api] http://localhost:${PORT}`))
}).catch(err=>{
  console.error('[db] error', err)
  process.exit(1)
})
