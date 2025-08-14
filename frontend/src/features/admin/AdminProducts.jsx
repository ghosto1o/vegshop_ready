import React, { useEffect, useState } from 'react'
import { listProducts, createProduct, updateProduct, deleteProduct } from '../../api/products.js'
import { getToken } from '../../store/auth.js'

const currency = (n)=> new Intl.NumberFormat('th-TH',{style:'currency', currency:'THB'}).format(n||0)

export default function AdminProducts(){
  const [items, setItems] = useState([])
  const [draft, setDraft] = useState({ name:'', category:'veg', price:0, unit:'กก.', stock:0, description:'', images:['🥬'], rating:4.5 })

  const load = ()=> listProducts().then(res => setItems((res.items||[]).map(i=> ({...i, id:i._id||i.id}))))
  useEffect(()=>{ load() }, [])

  return (
    <div className="container">
      <h3>สินค้า</h3>
      <div className="card">
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:8}}>
          <input className="input" placeholder="ชื่อสินค้า" value={draft.name} onChange={e=>setDraft({...draft, name:e.target.value})}/>
          <select className="input" value={draft.category} onChange={e=>setDraft({...draft, category:e.target.value})}>
            <option value="veg">ผักสด</option><option value="fruit">ผลไม้</option><option value="herb">พืช/สมุนไพร</option>
          </select>
          <input className="input" type="number" placeholder="ราคา" value={draft.price} onChange={e=>setDraft({...draft, price:Number(e.target.value)})}/>
          <input className="input" placeholder="หน่วย" value={draft.unit} onChange={e=>setDraft({...draft, unit:e.target.value})}/>
          <input className="input" type="number" placeholder="สต็อก" value={draft.stock} onChange={e=>setDraft({...draft, stock:Number(e.target.value)})}/>
          <button className="btn primary" disabled={!draft.name} onClick={async ()=>{ const res=await createProduct(getToken(), draft); setDraft({ name:'', category:'veg', price:0, unit:'กก.', stock:0, description:'', images:['🥬'], rating:4.5 }); load() }}>เพิ่มสินค้า</button>
        </div>
      </div>

      <div className="card" style={{marginTop:12, overflow:'auto'}}>
        <table className="table">
          <thead><tr><th>สินค้า</th><th>หมวด</th><th style={{textAlign:'right'}}>ราคา</th><th style={{textAlign:'right'}}>สต็อก</th><th>หน่วย</th><th>ลบ</th></tr></thead>
          <tbody>
            {items.map(p=> (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td style={{textAlign:'right'}}>{currency(p.price)}</td>
                <td style={{textAlign:'right'}}><input className="input" style={{width:80,textAlign:'right'}} type="number" defaultValue={p.stock} onBlur={async (e)=>{ await updateProduct(getToken(), p.id, { stock:Number(e.target.value) }); load() }} /></td>
                <td>{p.unit}</td>
                <td><button className="btn" onClick={async ()=>{ if(confirm(`ลบสินค้า “${p.name}” ?`)){ await deleteProduct(getToken(), p.id); load() } }}>ลบ</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
