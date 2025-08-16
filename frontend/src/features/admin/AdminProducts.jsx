import React, { useEffect, useRef, useState } from 'react'
import { listProducts, createProduct, updateProduct, deleteProduct, uploadProductImage } from '../../api/products.js'
const currency = (n)=> new Intl.NumberFormat('th-TH',{style:'currency', currency:'THB'}).format(n||0)

export default function AdminProducts(){
  const [items, setItems] = useState([])
  const [draft, setDraft] = useState({ name:'', category:'veg', price:0, unit:'กก.', stock:0, description:'', image:'', rating:4.5 })
  const [file, setFile] = useState(null)
  const fileRef = useRef()

  const handleFile = f => {
    if (!f) return
    setFile(f)
    setDraft(d=> ({...d, image: URL.createObjectURL(f)}))
  }
  const load = ()=> listProducts().then(res => setItems((res.items||[]).map(i=> ({...i, id:i._id||i.id}))))
  useEffect(()=>{ load() }, [])
  return (
    <div className="container">
      <h3>สินค้า</h3>
      <div className="card">
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:8}}>
          <div
            style={{
              border:'2px dashed #ccc',
              borderRadius:8,
              width:120,
              height:120,
              display:'grid',
              placeItems:'center',
              cursor:'pointer'
            }}
            onClick={()=>fileRef.current?.click()}
            onDragOver={e=>e.preventDefault()}
            onDrop={e=>{e.preventDefault(); handleFile(e.dataTransfer.files?.[0])}}
          >
            {draft.image
              ? <img src={draft.image} alt="preview" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:6}}/>
              : <span style={{textAlign:'center',fontSize:12,color:'#666'}}>Drop image or click</span>}
            <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>handleFile(e.target.files?.[0])} />
          </div>
          <input className="input" placeholder="ชื่อสินค้า" value={draft.name} onChange={e=>setDraft({...draft, name:e.target.value})}/>
          <select className="input" value={draft.category} onChange={e=>setDraft({...draft, category:e.target.value})}>
            <option value="veg">ผักสด</option><option value="fruit">ผลไม้</option><option value="herb">พืช/สมุนไพร</option>
          </select>
          <input className="input" type="number" placeholder="ราคา" value={draft.price} onChange={e=>setDraft({...draft, price:Number(e.target.value)})}/>
          <input className="input" placeholder="หน่วย" value={draft.unit} onChange={e=>setDraft({...draft, unit:e.target.value})}/>
          <input className="input" type="number" placeholder="สต็อก" value={draft.stock} onChange={e=>setDraft({...draft, stock:Number(e.target.value)})}/>
          <button className="btn primary" disabled={!draft.name} onClick={async ()=>{
            let image = ''
            if (file){
              const uploaded = await uploadProductImage(file)
              image = uploaded.url
            }
            await createProduct({ ...draft, image })
            setDraft({ name:'', category:'veg', price:0, unit:'กก.', stock:0, description:'', image:'', rating:4.5 })
            setFile(null)
            load()
          }}>เพิ่มสินค้า</button>
        </div>
      </div>

      <div className="card" style={{marginTop:12, overflow:'auto'}}>
        <table className="table">
          <thead><tr><th>รูป</th><th>สินค้า</th><th>หมวด</th><th style={{textAlign:'right'}}>ราคา</th><th style={{textAlign:'right'}}>สต็อก</th><th>หน่วย</th><th>ลบ</th></tr></thead>
          <tbody>
            {items.map(p=> (
              <tr key={p.id}>
                <td>{p.image ? <img src={p.image} alt={p.name} style={{width:40,height:40,objectFit:'cover',borderRadius:4}}/> : '—'}</td>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td style={{textAlign:'right'}}>{currency(p.price)}</td>
                <td style={{textAlign:'right'}}><input className="input" style={{width:80,textAlign:'right'}} type="number" defaultValue={p.stock} onBlur={async (e)=>{ await updateProduct(p.id, { stock:Number(e.target.value) }); load() }} /></td>
                <td>{p.unit}</td>
                <td><button className="btn" onClick={async ()=>{ if(confirm(`ลบสินค้า “${p.name}” ?`)){ await deleteProduct(p.id); load() } }}>ลบ</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
