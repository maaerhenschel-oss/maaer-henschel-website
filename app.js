const CART_KEY="maaerHenschelCartV2";
const SMALL_ORDER_LIMIT=300;
const SMALL_ORDER_FEE=30;
const OUTSIDE_DELIVERY_FEE=30;
const money=n=>"₹"+Number(n).toLocaleString("en-IN");
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let products=[];
let selectedCategory="All";
function getCart(){try{return JSON.parse(sessionStorage.getItem(CART_KEY))||{}}catch{return {}}}
function saveCart(c){sessionStorage.setItem(CART_KEY,JSON.stringify(c))}
async function loadMenu(){const r=await fetch("/api/products");if(!r.ok)throw Error("Menu unavailable");return r.json()}
function getSubtotal(){const c=getCart();let subtotal=0;for(const[id,q]of Object.entries(c)){const p=products.find(x=>x.id===id);if(p&&q>0)subtotal+=p.price*q}return subtotal}
function getCharges(){
  const subtotal=getSubtotal();
  const distance=document.getElementById("deliveryDistance")?.value||"";
  const smallOrder=subtotal>0&&subtotal<SMALL_ORDER_LIMIT?SMALL_ORDER_FEE:0;
  const delivery=distance==="beyond"?OUTSIDE_DELIVERY_FEE:0;
  return {subtotal,smallOrder,delivery,total:subtotal+smallOrder+delivery};
}
function updateCheckoutTotals(){
  const fees=getCharges();
  const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=money(value)};
  set("cartSubtotal",fees.subtotal);
  set("smallOrderCharge",fees.smallOrder);
  set("deliveryCharge",fees.delivery);
  set("cartTotal",fees.total);
}
function renderMenu(){const grid=document.getElementById("productGrid");if(!grid)return;const categories=[...new Set(products.map(p=>(p.category||"Uncategorized").trim()).filter(Boolean))];if(selectedCategory!=="All"&&!categories.includes(selectedCategory))selectedCategory="All";const nav=document.getElementById("menuCategories");if(nav){nav.innerHTML=["All",...categories].map(c=>`<button class="category-chip ${selectedCategory===c?"active":""}" type="button" data-category="${esc(c)}" aria-pressed="${selectedCategory===c}">${esc(c==="All"?"All items":c)}</button>`).join("");nav.querySelectorAll("[data-category]").forEach(b=>b.onclick=()=>{selectedCategory=b.dataset.category;renderMenu()})}const visible=selectedCategory==="All"?products:products.filter(p=>(p.category||"Uncategorized").trim()===selectedCategory);grid.innerHTML=visible.map(p=>`<article class="product-card"><div class="product-thumb">${p.image?`<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">`:"✦"}</div><h3>${esc(p.name)}</h3><p>${esc(p.description||"Prepared with care.")}</p><div class="product-foot"><span class="price">${money(p.price)}</span><button class="add-button" data-add="${esc(p.id)}">Add to cart +</button></div></article>`).join("")||"<p>No items in this category yet.</p>";grid.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>{const c=getCart();c[b.dataset.add]=(c[b.dataset.add]||0)+1;saveCart(c);renderCart();openCart()})}
function renderCart(){const box=document.getElementById("cartItems");if(!box)return;const c=getCart();let count=0,rows=[];for(const[id,q]of Object.entries(c)){const p=products.find(x=>x.id===id);if(!p||q<1)continue;count+=q;rows.push(`<div class="cart-row"><div><strong>${esc(p.name)}</strong><br>${money(p.price)} each</div><div class="qty-controls"><button data-dec="${esc(id)}">−</button><span>${q}</span><button data-inc="${esc(id)}">+</button></div></div>`)}box.innerHTML=rows.join("")||'<p class="empty-cart">Your cart is empty.</p>';document.getElementById("cartCount").textContent=count;updateCheckoutTotals();box.querySelectorAll("[data-dec]").forEach(b=>b.onclick=()=>qty(b.dataset.dec,-1));box.querySelectorAll("[data-inc]").forEach(b=>b.onclick=()=>qty(b.dataset.inc,1))}
function qty(id,d){const c=getCart();c[id]=(c[id]||0)+d;if(c[id]<=0)delete c[id];saveCart(c);renderCart()}
function openCart(){document.getElementById("cartPanel").classList.add("open");document.getElementById("scrim").classList.add("show");document.getElementById("cartPanel").setAttribute("aria-hidden","false")}
function closeCart(){document.getElementById("cartPanel").classList.remove("open");document.getElementById("scrim").classList.remove("show");document.getElementById("cartPanel").setAttribute("aria-hidden","true")}
document.addEventListener("DOMContentLoaded",async()=>{
  if(!document.getElementById("productGrid"))return;
  document.getElementById("year").textContent=new Date().getFullYear();
  document.getElementById("cartToggle").onclick=openCart;
  document.getElementById("cartClose").onclick=closeCart;
  document.getElementById("scrim").onclick=closeCart;
  try{products=await loadMenu();renderMenu();renderCart()}catch{document.getElementById("productGrid").innerHTML="<p>We could not load the menu right now. Please refresh in a moment.</p>"}
  const BUSINESS_WHATSAPP="916290808529";
  const waUrl=message=>`https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent(message)}`;
  document.getElementById("contactWhatsApp").href=waUrl("Hello Maa'er Henschel, I would like to make an enquiry.");
  document.getElementById("contactWhatsApp").target="_blank";
  document.getElementById("contactWhatsApp").rel="noopener";
  document.getElementById("deliveryDistance").addEventListener("change",updateCheckoutTotals);
  document.getElementById("orderForm").onsubmit=e=>{
    e.preventDefault();
    const form=e.currentTarget;
    const data=new FormData(form);
    const c=getCart();
    const lines=[];
    for(const[id,q]of Object.entries(c)){
      const p=products.find(x=>x.id===id);
      if(!p||q<1)continue;
      const lineTotal=p.price*q;
      lines.push(`${p.name} x ${q} = ${money(lineTotal)}`);
    }
    if(!lines.length){alert("Your cart is empty. Please add an item before placing an order.");return}
    if(!data.get("deliveryDistance")){alert("Please select your delivery distance.");return}
    const fees=getCharges();
    const distanceLabel=data.get("deliveryDistance")==="within"?"Within 3 km (free delivery)": "More than 3 km";
    const message=[
      "Hello Maa'er Henschel, I would like to place an order.","",
      `Name: ${data.get("name")}`,
      `Phone: ${data.get("phone")}`,
      `Delivery address: ${data.get("address")}`,
      `Delivery distance: ${distanceLabel}`,"",
      "Order:",...lines,"",
      `Food subtotal: ${money(fees.subtotal)}`,
      `Small order charge: ${money(fees.smallOrder)}`,
      `Delivery charge: ${money(fees.delivery)}`,
      `Checkout total: ${money(fees.total)}`,"",
      "Order timing: Accepted daily, 9:00 AM–9:00 PM.",
      "Delivery timing: Within 2 hours after the order is received. For immediate delivery, please call the restaurant directly."
    ].join("\n");
    window.open(waUrl(message),"_blank","noopener,noreferrer");
  };
});
