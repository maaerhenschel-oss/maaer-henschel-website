const DEFAULT_PRODUCTS = [
 {id:"egg",name:"Boiled Egg (1pc)",price:15,description:"A simple, satisfying favourite.",image:""},
 {id:"plain-maggi",name:"Plain Maggi",price:30,description:"Warm and comforting Maggi.",image:""},
 {id:"egg-maggi",name:"Egg Maggi",price:40,description:"Maggi prepared with egg.",image:""}
];
// Add the business WhatsApp number in international format, without + or spaces.
// Example format for India: 91XXXXXXXXXX. Replace the empty value before accepting orders.
const WHATSAPP_NUMBER = "";
const STORAGE_KEY = "maaerHenschelProductsV1";
const CART_KEY = "maaerHenschelCartV1";
const money = n => "₹" + Number(n).toLocaleString("en-IN");
function getProducts(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||DEFAULT_PRODUCTS}catch{return DEFAULT_PRODUCTS}}
function saveProducts(p){localStorage.setItem(STORAGE_KEY,JSON.stringify(p))}
function getCart(){try{return JSON.parse(sessionStorage.getItem(CART_KEY))||{}}catch{return {}}}
function saveCart(c){sessionStorage.setItem(CART_KEY,JSON.stringify(c))}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function renderMenu(){
 const grid=document.getElementById("productGrid"); if(!grid)return;
 grid.innerHTML=getProducts().map(p=>`<article class="product-card"><div class="product-thumb">${p.image?`<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}">`:"✦"}</div><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.description||"Prepared with care.")}</p><div class="product-foot"><span class="price">${money(p.price)}</span><button class="add-button" data-add="${escapeHtml(p.id)}">Add to cart +</button></div></article>`).join("")||"<p>No menu items available yet.</p>";
 grid.querySelectorAll("[data-add]").forEach(b=>b.addEventListener("click",()=>{const c=getCart();c[b.dataset.add]=(c[b.dataset.add]||0)+1;saveCart(c);renderCart();openCart()}));
}
function renderCart(){
 const box=document.getElementById("cartItems");if(!box)return;
 const products=getProducts(),cart=getCart();let total=0,count=0,rows=[];
 for(const [id,qty] of Object.entries(cart)){const p=products.find(x=>x.id===id);if(!p||qty<1)continue;total+=p.price*qty;count+=qty;rows.push(`<div class="cart-row"><div><strong>${escapeHtml(p.name)}</strong><br>${money(p.price)} each</div><div class="qty-controls"><button data-dec="${id}">−</button><span>${qty}</span><button data-inc="${id}">+</button></div></div>`)}
 box.innerHTML=rows.join("")||'<p class="empty-cart">Your cart is empty.</p>';
 document.getElementById("cartCount").textContent=count;document.getElementById("cartTotal").textContent=money(total);
 box.querySelectorAll("[data-dec]").forEach(b=>b.onclick=()=>changeQty(b.dataset.dec,-1));box.querySelectorAll("[data-inc]").forEach(b=>b.onclick=()=>changeQty(b.dataset.inc,1));
}
function changeQty(id,d){const c=getCart();c[id]=(c[id]||0)+d;if(c[id]<=0)delete c[id];saveCart(c);renderCart()}
function openCart(){document.getElementById("cartPanel")?.classList.add("open");document.getElementById("scrim")?.classList.add("show");document.getElementById("cartPanel")?.setAttribute("aria-hidden","false")}
function closeCart(){document.getElementById("cartPanel")?.classList.remove("open");document.getElementById("scrim")?.classList.remove("show");document.getElementById("cartPanel")?.setAttribute("aria-hidden","true")}
function initCustomer(){
 if(!document.getElementById("productGrid"))return;
 renderMenu();renderCart();document.getElementById("year").textContent=new Date().getFullYear();
 document.getElementById("cartToggle").onclick=openCart;document.getElementById("cartClose").onclick=closeCart;document.getElementById("scrim").onclick=closeCart;
 document.getElementById("contactWhatsApp").onclick=e=>{e.preventDefault();if(WHATSAPP_NUMBER)window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello Maa'er Henschel, I would like to make an enquiry.")}`,"_blank");else alert("WhatsApp contact is not configured yet. Add the business number in app.js.");};
 document.getElementById("orderForm").onsubmit=e=>{e.preventDefault();if(!WHATSAPP_NUMBER){alert("The WhatsApp number has not been added yet. Please configure WHATSAPP_NUMBER in app.js before taking orders.");return}
 const c=getCart(),ps=getProducts(),items=Object.entries(c).map(([id,q])=>{const p=ps.find(x=>x.id===id);return p?`${p.name} x ${q} = ${money(p.price*q)}`:null}).filter(Boolean);
 if(!items.length){alert("Please add an item to your cart.");return}
 const f=new FormData(e.target),total=Object.entries(c).reduce((s,[id,q])=>s+(ps.find(p=>p.id===id)?.price||0)*q,0);
 const msg=`New order - Maa'er Henschel\nName: ${f.get("name")}\nPhone: ${f.get("phone")}\nAddress: ${f.get("address")}\n\n${items.join("\n")}\n\nTotal: ${money(total)}`;
 window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,"_blank");
 };
}
function initAdmin(){
 const form=document.getElementById("productForm");if(!form)return;
 const $=id=>document.getElementById(id);
 function render(){const list=$("adminProducts"),ps=getProducts();list.innerHTML=ps.map(p=>`<div class="admin-product"><div><strong>${escapeHtml(p.name)} — ${money(p.price)}</strong><small>${escapeHtml(p.description||"")}</small></div><div><button class="outline-button" data-edit="${escapeHtml(p.id)}">Edit</button><button class="outline-button" data-delete="${escapeHtml(p.id)}">Delete</button></div></div>`).join("")||"<p>No products yet.</p>";
 list.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>{const p=getProducts().find(x=>x.id===b.dataset.edit);$("productId").value=p.id;$("productName").value=p.name;$("productPrice").value=p.price;$("productDescription").value=p.description||"";$("productImage").value=p.image||"";$("formTitle").textContent="Edit product";window.scrollTo({top:0,behavior:"smooth"})});
 list.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>{if(confirm("Delete this product?")){saveProducts(getProducts().filter(p=>p.id!==b.dataset.delete));render()}});
 }
 function clear(){form.reset();$("productId").value="";$("formTitle").textContent="Add a product"}
 form.onsubmit=e=>{e.preventDefault();const ps=getProducts(),id=$("productId").value||("p-"+Date.now()),item={id,name:$("productName").value.trim(),price:Number($("productPrice").value),description:$("productDescription").value.trim(),image:$("productImage").value.trim()};if(!item.name||item.price<=0)return;const i=ps.findIndex(p=>p.id===id);if(i>=0)ps[i]=item;else ps.push(item);saveProducts(ps);clear();render();alert("Saved in this browser. Export the menu file to keep a backup.")};
 $("cancelEdit").onclick=clear;
 $("exportCatalog").onclick=()=>{const blob=new Blob([JSON.stringify(getProducts(),null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="maaer-henschel-menu.json";a.click();URL.revokeObjectURL(url)};
 $("importCatalog").onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());if(!Array.isArray(data)||!data.every(p=>p.name&&Number(p.price)>0))throw Error();saveProducts(data);render();alert("Menu imported into this browser.")}catch{alert("That menu file is not valid.")}e.target.value=""};
 render();
}
document.addEventListener("DOMContentLoaded",()=>{initCustomer();initAdmin()});
