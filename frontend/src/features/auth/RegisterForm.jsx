import React, { useState } from 'react'
import { register } from '../../api/auth.js'

export default function RegisterForm({ onSuccess }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')

  // ฟิลด์ที่อยู่ (ใหม่)
  const [addressLine, setAddressLine] = useState('')
  const [addressPhone, setAddressPhone] = useState('')
  const [addressNote, setAddressNote] = useState('')

  const [err, setErr] = useState('')

  return (
    <form onSubmit={async (e)=>{
      e.preventDefault()
      try{
        console.log('[FE] submit register', { email, withAddress: !!addressLine })
        const u = await register({
          name, email, password, phone,
          addressLine, addressPhone, addressNote
        })
        onSuccess?.(u)
      }catch(ex){
        setErr(ex.message)
      }
    }}>
      <div className="grid gap-2">

        {/* บัญชี */}
        <input className="input" placeholder="ชื่อ" value={name} onChange={e=>setName(e.target.value)} />
        <input className="input" placeholder="อีเมล" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="input" placeholder="เบอร์โทร (ไม่บังคับ)" value={phone} onChange={e=>setPhone(e.target.value)} />
        <input className="input" type="password" placeholder="รหัสผ่าน" value={password} onChange={e=>setPassword(e.target.value)} />

        {/* ที่อยู่จัดส่งแรก (บันทึกเข้า DB ทันที) */}
        <div style={{marginTop:8, fontWeight:600}}>ที่อยู่จัดส่ง (บันทึกทันที)</div>
        <input className="input" placeholder="ที่อยู่เต็ม (เช่น บ้านเลขที่/ซอย/ถนน/แขวง/เขต/จังหวัด/รหัสไปรษณีย์)" value={addressLine} onChange={e=>setAddressLine(e.target.value)} />
        <input className="input" placeholder="เบอร์ติดต่อสำหรับจัดส่ง (ไม่บังคับ)" value={addressPhone} onChange={e=>setAddressPhone(e.target.value)} />
        <input className="input" placeholder="หมายเหตุ (ตัวอย่าง: ฝากไว้กับ รปภ.)" value={addressNote} onChange={e=>setAddressNote(e.target.value)} />

        {err && <div style={{color:'crimson',fontSize:12}}>{err}</div>}
        <button className="btn primary" type="submit">สมัครสมาชิก</button>
      </div>
    </form>
  )
}
