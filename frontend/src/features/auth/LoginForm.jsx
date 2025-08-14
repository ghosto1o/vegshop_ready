import React, { useState } from 'react'
import { login } from '../../api/auth.js'

export default function LoginForm({ onSuccess }){
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [err,setErr] = useState('')
  return (
    <form onSubmit={async (e)=>{ e.preventDefault(); try{ const u=await login({ email,password }); onSuccess?.(u) }catch(ex){ setErr(ex.message) } }}>
      <div className="grid gap-2">
        <input className="input" placeholder="อีเมล" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="input" type="password" placeholder="รหัสผ่าน" value={password} onChange={e=>setPassword(e.target.value)} />
        {err && <div style={{color:'crimson',fontSize:12}}>{err}</div>}
        <button className="btn primary" type="submit">เข้าสู่ระบบ</button>
      </div>
    </form>
  )
}
