import mongoose from 'mongoose'

const AddressSchema = new mongoose.Schema({
  line: String,
  phone: String,
  note: String,
}, { _id:false })

const schema = new mongoose.Schema({
  name: { type:String, required:true },
  email: { type:String, required:true, unique:true, index:true },
  phone: String,
  passwordHash: String,
  role: { type:String, enum:['buyer','admin'], default:'buyer' },

  // เก็บหลายที่อยู่ได้
  addresses: [AddressSchema],
  defaultAddressIndex: { type:Number, default: 0 },

  // (ถ้าใช้เวอร์ชัน secure ก่อนหน้า จะมีฟิลด์ security อื่น ๆ เพิ่มอยู่แล้ว)
}, { timestamps:true })

export default mongoose.model('User', schema)

