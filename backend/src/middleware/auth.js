import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export default async function auth(req,res,next){
  const hdr = req.headers.authorization || ''
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null
  if (!token) return res.status(401).json({ message:'No token' })
  try{
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.sub).lean()
    if (!user) return res.status(401).json({ message:'Invalid user' })
    req.user = user
    next()
  }catch(e){
    return res.status(401).json({ message:'Invalid token' })
  }
}
