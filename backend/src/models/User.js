import mongoose from 'mongoose'

const AddressSchema = new mongoose.Schema({
  line: String
}, { _id:false })

const schema = new mongoose.Schema({
  name: { type:String, required:true },
  email: { type:String, required:true, unique:true, index:true },
  phone: String,
  passwordHash: String,
  role: { type:String, enum:['buyer','admin'], default:'buyer' },
  addresses: [AddressSchema]
}, { timestamps:true })

export default mongoose.model('User', schema)
