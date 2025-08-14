import React, { useState } from 'react'
import { register } from '../../api/auth.js'

export default function RegisterForm({ onSuccess }){
  const [name,setName] = useState('')
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [err,setErr] = useState('')
  return (
    <form onSubmit={async (e)=>{ e.preventDefault(); try{ const u=await register({ name,email,password }); onSuccess?.(u) }catch(ex){ setErr(ex.message) } }}>
      <div className="grid gap-2">
        <input className="input" placeholder="ชื่อ" value={name} onChange={e=>setName(e.target.value)} />
        <input className="input" placeholder="อีเมล" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="input" type="password" placeholder="รหัสผ่าน" value={password} onChange={e=>setPassword(e.target.value)} />
        {err && <div style={{color:'crimson',fontSize:12}}>{err}</div>}
        <button className="btn primary" type="submit">สมัครสมาชิก</button>
      </div>
    </form>
  )
}
