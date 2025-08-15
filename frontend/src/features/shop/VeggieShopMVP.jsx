import React, { useEffect, useMemo, useReducer, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listProducts } from '../../api/products.js'
import { createOrder, listMyOrders } from '../../api/orders.js'
import { getToken, isAuthed } from '../../store/auth.js'
import { getBuyers, createBuyer, updateBuyer, deleteBuyer, setBuyerPassword } from '../../api/admin.js'
import { adminListOrders, adminUpdateOrderStatus } from '../../api/adminOrders.js'
import { createPaymentIntent } from '../../api/payments.js'
import PromptPayModal from '../payments/PromptPayModal.jsx'
import { logout as doLogout } from '../../api/auth.js'


const currency = (n)=> new Intl.NumberFormat('th-TH',{style:'currency',currency:'THB'}).format(n||0)

const initial = { products:[], cart:[], orders:[], buyers:[], adminOrders:[], user: (JSON.parse(localStorage.getItem('veg_current_user')||'null')) }
function reducer(s, a){
  switch(a.type){
    case 'SET_PRODUCTS': return {...s, products:a.items}
    case 'ADD_TO_CART': {
      const ex = s.cart.find(x=>x.id===a.id); const cart = ex? s.cart.map(x=> x.id===a.id? {...x, qty:x.qty+1}:x) : [...s.cart, {id:a.id, qty:1}]
      return {...s, cart}
    }
    case 'UPDATE_QTY': return {...s, cart: s.cart.map(x=> x.id===a.id? {...x, qty:Math.max(1,a.qty)}:x) }
    case 'REMOVE': return {...s, cart: s.cart.filter(x=>x.id!==a.id)}
    case 'SET_ORDERS': return {...s, orders:a.items}
    case 'SET_ADMIN_ORDERS': return {...s, adminOrders:a.items}
    case 'SET_BUYERS': return {...s, buyers:a.items}
    default: return s
  }
}

function TopBar({ user, openCart, onAuth }){
  const nav = useNavigate()
  const isBuyer = user?.role === 'buyer'
  const isAdmin = user?.role === 'admin'
  return (
    <div className="header">
      <div className="container" style={{display:'flex',alignItems:'center',gap:8}}>
        <div style={{fontSize:28}}>🥕</div>
        <b>ผักหน้าบ้าน</b>
        <div className="nav" style={{marginLeft:16}}>
          <Link to="/" className="active">หน้าหลัก</Link>
          {isBuyer && <Link to="/delivery">ข้อมูลจัดส่ง</Link>}
        </div>
        <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center'}}>
          {user ? (
            <>
              <span style={{fontSize:14}}>สวัสดี, {user.name}</span>
              <button
                className="btn"
                onClick={()=>{
                  console.log('[FE] logout click from TopBar')
                  doLogout()
                  location.reload()
                }}
              >
                ออกจากระบบ
              </button>
            </>
          ) : (
            <button className="btn primary" onClick={()=>onAuth('login')}>สมัคร/เข้าสู่ระบบ</button>
          )}
          <button className="btn" onClick={openCart}>🧺</button>
        </div>
      </div>
    </div>
  )
}


export default function VeggieShopMVP({ onOpenAuth, initialTab='home' }){
  const [s, d] = useReducer(reducer, initial)
  const [detail, setDetail] = useState(null)
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [ppOpen, setPpOpen] = useState(false); const [ppPayload, setPpPayload] = useState('')

  useEffect(()=>{ listProducts().then(r=> d({type:'SET_PRODUCTS', items:(r.items||[]).map(p=> ({...p, id:p._id||p.id}))})) },[])

  const map = useMemo(()=> Object.fromEntries(s.products.map(p=> [p.id||p._id, {...p, id:p.id||p._id}])), [s.products])
  const items = s.cart.map(c=> ({...c, product: map[c.id]})).filter(x=>x.product)
  const subtotal = items.reduce((t,x)=> t + (x.product.price||0)*x.qty, 0)

  async function placeOrder({ deliveryMethod, address, payment }){
    if (!isAuthed()) { alert('กรุณาเข้าสู่ระบบก่อนสั่งซื้อ'); onOpenAuth?.('login'); return }
    try {
      const res = await createOrder(getToken(), { items: items.map(x=> ({ productId:x.id, name:x.product.name, price:x.product.price, qty:x.qty })), total: subtotal, paymentMethod: payment, deliveryMethod, address })
      const orderId = res.orderId
      if (payment !== 'cod' && payment !== 'transfer'){
        const pay = await createPaymentIntent(getToken(), { orderId, method: payment })
        if (pay.payload){ setPpPayload(pay.payload); setPpOpen(true) }
        else if (pay.authorize_uri){ location.href = pay.authorize_uri; return }
      }
      setShowCheckout(false); setShowCart(false); alert('สั่งซื้อสำเร็จ!')
    } catch (e){ alert('ไม่สำเร็จ: '+e.message) }
  }

  return (
    <div>
      <TopBar user={s.user} openCart={()=>setShowCart(true)} onAuth={onOpenAuth} />
      <div className="container">
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:12}}>
          {s.products.map(p=> (
            <div key={p.id} className="card">
              <div style={{fontSize:48,textAlign:'center'}}>{p.images?.[0]||'🥬'}</div>
              <b>{p.name}</b> <span className="badge">{p.category}</span>
              <div style={{color:'#555',fontSize:14}}>{p.description}</div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
                <div><b>{currency(p.price)}</b> <span style={{fontSize:12,color:'#666'}}>/ {p.unit}</span></div>
                <button className="btn primary" disabled={p.stock<=0} onClick={()=>d({type:'ADD_TO_CART', id:p.id})}>{p.stock>0?'ใส่ตะกร้า':'หมดสต็อก'}</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCart && (
        <div className="fixed inset-0" style={{background:'rgba(0,0,0,.4)', display:'grid', placeItems:'end', gridTemplateRows:'auto 1fr auto'}} onClick={()=>setShowCart(false)}>
          <div style={{background:'#fff', width:'100%', maxWidth:380, height:'100%', padding:12}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <b>ตะกร้าของฉัน</b>
              <button className="btn" onClick={()=>setShowCart(false)}>ปิด</button>
            </div>
            <div style={{overflow:'auto',height:'calc(100% - 120px)'}}>
              {items.length===0? <div style={{color:'#777'}}>ยังไม่มีสินค้า</div>:
                items.map(ci=> (
                  <div key={ci.id} style={{display:'flex',gap:8,alignItems:'center',borderTop:'1px solid #eee',padding:'8px 0'}}>
                    <div style={{fontSize:32}}>{ci.product.images?.[0]||'🥬'}</div>
                    <div style={{flex:1}}>
                      <div><b>{ci.product.name}</b></div>
                      <div style={{fontSize:12,color:'#666'}}>{currency(ci.product.price)} / {ci.product.unit}</div>
                      <div style={{display:'flex',gap:6,marginTop:4,alignItems:'center'}}>
                        <button className="btn" onClick={()=>d({type:'UPDATE_QTY', id:ci.id, qty:ci.qty-1})}>-</button>
                        <input className="input" style={{width:60}} type="number" value={ci.qty} onChange={(e)=>d({type:'UPDATE_QTY', id:ci.id, qty:Number(e.target.value)})} min={1} />
                        <button className="btn" onClick={()=>d({type:'UPDATE_QTY', id:ci.id, qty:ci.qty+1})}>+</button>
                        <button className="btn" onClick={()=>d({type:'REMOVE', id:ci.id})}>ลบ</button>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
            <div style={{borderTop:'1px solid #eee',paddingTop:8}}>
              <div style={{display:'flex',justifyContent:'space-between'}}><span>ยอดรวม</span><b>{currency(subtotal)}</b></div>
              <button className="btn primary" style={{width:'100%',marginTop:8}} disabled={items.length===0} onClick={()=>setShowCheckout(true)}>ดำเนินการชำระเงิน</button>
            </div>
          </div>
        </div>
      )}

      {showCheckout && <CheckoutModal subtotal={subtotal} onClose={()=>setShowCheckout(false)} onPlaceOrder={placeOrder} />}
      <PromptPayModal open={ppOpen} onClose={()=>setPpOpen(false)} payload={ppPayload} />
    </div>
  )
}

function CheckoutModal({ subtotal, onClose, onPlaceOrder }){
  const [deliveryMethod,setDeliveryMethod] = useState('pickup')
  const [address,setAddress] = useState('')
  const [payment,setPayment] = useState('cod')
  return (
    <div className="fixed inset-0" style={{background:'rgba(0,0,0,.4)', display:'grid', placeItems:'center'}} onClick={onClose}>
      <div className="card" style={{maxWidth:480,width:'100%'}} onClick={e=>e.stopPropagation()}>
        <h3>เช็คเอาต์</h3>
        <div className="grid" style={{gap:8}}>
          <div>
            <div><b>วิธีจัดส่ง</b></div>
            <label><input type="radio" checked={deliveryMethod==='pickup'} onChange={()=>setDeliveryMethod('pickup')} /> รับที่ร้าน</label>
            <label style={{marginLeft:8}}><input type="radio" checked={deliveryMethod==='delivery'} onChange={()=>setDeliveryMethod('delivery')} /> ส่งถึงบ้าน</label>
            {deliveryMethod==='delivery' && <input className="input" placeholder="ที่อยู่" value={address} onChange={e=>setAddress(e.target.value)} style={{marginTop:6}}/>}
          </div>
          <div>
            <div><b>การชำระเงิน</b></div>
            <select className="input" value={payment} onChange={e=>setPayment(e.target.value)}>
              <option value="cod">ชำระปลายทาง</option>
              <option value="transfer">โอนผ่านธนาคาร</option>
              <option value="promptpay">PromptPay (Sandbox)</option>
              <option value="internet_banking_bbl">อินเทอร์เน็ตแบงก์กิ้ง (BBL)</option>
            </select>
          </div>
          <div style={{display:'flex',justifyContent:'space-between'}}><span>ยอดชำระ</span><b>{subtotal.toLocaleString()}</b></div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button className="btn" onClick={onClose}>ยกเลิก</button>
            <button className="btn primary" onClick={()=>onPlaceOrder({ deliveryMethod, address, payment })}>ยืนยัน</button>
          </div>
        </div>
      </div>
    </div>
  )
}
