import React, { useEffect, useState } from 'react'
import { getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } from '../../api/account.js'

export default function DeliveryInfo(){
  const [items, setItems] = useState([])
  const [defaultIndex, setDefaultIndex] = useState(0)
  const [draft, setDraft] = useState({ line:'', phone:'', note:'' })
  const [loading, setLoading] = useState(false)

  const load = async ()=>{
    setLoading(true)
    try{
      const r = await getAddresses()
      setItems(r.addresses || [])
      setDefaultIndex(r.defaultIndex || 0)
      console.log('[DeliveryInfo] load', r)
    } finally { setLoading(false) }
  }

  useEffect(()=>{ load() }, [])

  return (
    <div className="container">
      <h3>ข้อมูลการจัดส่ง</h3>
      <p style={{color:'#555', marginTop:0}}>จัดการที่อยู่สำหรับจัดส่งสินค้า เลือกที่อยู่เริ่มต้น และหมายเหตุให้คนส่ง</p>

      {/* เพิ่มที่อยู่ */}
      <div className="card" style={{marginTop:8}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 240px 1fr auto', gap:8}}>
          <input className="input" placeholder="ที่อยู่ (เช่น บ้านเลขที่/ซอย/ถนน/แขวง/เขต/จังหวัด/รหัสไปรษณีย์)" value={draft.line} onChange={e=>setDraft({...draft, line:e.target.value})} />
          <input className="input" placeholder="เบอร์ติดต่อ" value={draft.phone} onChange={e=>setDraft({...draft, phone:e.target.value})} />
          <input className="input" placeholder="หมายเหตุ (เช่น ฝากไว้กับ รปภ.)" value={draft.note} onChange={e=>setDraft({...draft, note:e.target.value})} />
          <button className="btn primary" disabled={!draft.line} onClick={async ()=>{
            console.log('[DeliveryInfo] add', draft)
            await addAddress(draft)
            setDraft({ line:'', phone:'', note:'' })
            load()
          }}>เพิ่มที่อยู่</button>
        </div>
      </div>

      {/* รายการที่อยู่ */}
      <div className="card" style={{marginTop:12, overflow:'auto'}}>
        <table className="table">
          <thead><tr><th>ที่อยู่</th><th>เบอร์</th><th>หมายเหตุ</th><th>ตั้งค่าเริ่มต้น</th><th>แก้ไข</th><th>ลบ</th></tr></thead>
          <tbody>
            {items.map((a, i)=>(
              <tr key={i}>
                <td><input className="input" defaultValue={a.line||''} onBlur={async (e)=>{ await updateAddress(i, { line:e.target.value }); console.log('[DeliveryInfo] update line', i); }} /></td>
                <td><input className="input" defaultValue={a.phone||''} onBlur={async (e)=>{ await updateAddress(i, { phone:e.target.value }); console.log('[DeliveryInfo] update phone', i); }} /></td>
                <td><input className="input" defaultValue={a.note||''} onBlur={async (e)=>{ await updateAddress(i, { note:e.target.value }); console.log('[DeliveryInfo] update note', i); }} /></td>
                <td style={{textAlign:'center'}}>
                  <input type="radio" name="def" checked={defaultIndex===i} onChange={async ()=>{
                    await setDefaultAddress(i)
                    setDefaultIndex(i)
                    console.log('[DeliveryInfo] set default', i)
                  }} />
                </td>
                <td>
                  <button className="btn" onClick={async ()=>{ await updateAddress(i, a); alert('บันทึกแล้ว'); }}>บันทึก</button>
                </td>
                <td>
                  <button className="btn" onClick={async ()=>{ if(confirm('ลบที่อยู่นี้หรือไม่?')){ await deleteAddress(i); load() } }}>ลบ</button>
                </td>
              </tr>
            ))}
            {items.length===0 && (
              <tr><td colSpan={6} style={{color:'#777'}}>ยังไม่มีที่อยู่ กรุณาเพิ่มด้านบน</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
