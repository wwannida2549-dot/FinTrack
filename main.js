import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
import "./style.css";

const sb=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
let user=null, items=[];
const app=document.querySelector("#app");
const months=["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
const money=n=>Number(n||0).toLocaleString("th-TH",{minimumFractionDigits:2,maximumFractionDigits:2});

async function init(){
 const {data}=await sb.auth.getSession(); user=data.session?.user||null; render();
 sb.auth.onAuthStateChange((_e,s)=>{user=s?.user||null;render();});
}
function render(){ user?dashboard():login(); }

function login(){
 app.innerHTML=`<div class="login"><div class="login-card"><div class="brand">Fin<span>Track</span></div><h1>บัญชีรายรับ–รายจ่าย</h1><p>ระบบบันทึกรายรับ–รายจ่ายประจำเดือนสำหรับการเรียน</p>
 <input id="email" type="email" placeholder="อีเมล"><input id="password" type="password" placeholder="รหัสผ่าน">
 <button id="signin">เข้าสู่ระบบ</button><button id="signup" class="ghost">สมัครสมาชิก</button><small id="msg"></small></div></div>`;
 signin.onclick=async()=>auth("signin"); signup.onclick=async()=>auth("signup");
}
async function auth(mode){
 const email=document.querySelector("#email").value.trim(),password=document.querySelector("#password").value;
 msg.textContent="";
 if(!email||password.length<6){msg.textContent="กรุณากรอกอีเมลและรหัสผ่านอย่างน้อย 6 ตัวอักษร";return}
 const r=mode==="signin"?await sb.auth.signInWithPassword({email,password}):await sb.auth.signUp({email,password});
 if(r.error)msg.textContent=r.error.message; else msg.textContent=mode==="signup"?"สมัครสมาชิกแล้ว กรุณาตรวจอีเมลหากระบบร้องขอ":"เข้าสู่ระบบสำเร็จ";
}

function dashboard(){
 const now=new Date(), y=now.getFullYear(), m=now.getMonth();
 app.innerHTML=`<div class="layout"><aside><div class="logo">Fin<span>Track</span></div><nav><a class="active">▦ ภาพรวม</a><a>＋ บันทึกรายการ</a><a>▤ รายการทั้งหมด</a></nav><button id="logout" class="logout">ออกจากระบบ</button></aside>
 <main><header><div><h1>ภาพรวมการเงิน</h1><p>บันทึกรายรับและรายจ่ายของคุณในแต่ละเดือน</p></div><div class="pick"><select id="month">${months.map((x,i)=>`<option value="${i}" ${i===m?"selected":""}>${x}</option>`).join("")}</select><select id="year">${[y-2,y-1,y,y+1,y+2].map(x=>`<option value="${x}" ${x===y?"selected":""}>${x+543}</option>`).join("")}</select></div></header>
 <div class="cards"><div><small>รายรับทั้งหมด</small><b id="inc">฿0.00</b></div><div><small>รายจ่ายทั้งหมด</small><b id="exp">฿0.00</b></div><div><small>คงเหลือ</small><b id="bal">฿0.00</b></div><div><small>จำนวนรายการ</small><b id="cnt">0</b></div></div>
 <section class="panel"><h2>➕ เพิ่มรายการ</h2><div class="form"><input id="date" type="date" value="${now.toISOString().slice(0,10)}"><select id="type"><option value="income">รายรับ</option><option value="expense">รายจ่าย</option></select><select id="category"><option>อาหาร</option><option>เดินทาง</option><option>การศึกษา</option><option>ที่พัก</option><option>ของใช้ส่วนตัว</option><option>บันเทิง</option><option>เงินค่าขนม/เงินเดือน</option><option>รายได้อื่น ๆ</option><option>อื่น ๆ</option></select><input id="detail" placeholder="รายละเอียด"><input id="amount" type="number" min="0" step=".01" placeholder="จำนวนเงิน (บาท)"><button id="add">บันทึกรายการ</button></div></section>
 <section class="panel"><h2>📋 รายการเดือนนี้</h2><div class="table"><table><thead><tr><th>วันที่</th><th>รายการ</th><th>ประเภท</th><th>หมวดหมู่</th><th>จำนวนเงิน</th><th></th></tr></thead><tbody id="rows"></tbody></table></div><div id="empty" class="empty">กำลังโหลด...</div></section>
 </main></div>`;
 logout.onclick=()=>sb.auth.signOut(); month.onchange=load;year.onchange=load;add.onclick=addItem;load();
}
async function load(){
 const y=+year.value,m=+month.value+1,start=`${y}-${String(m).padStart(2,"0")}-01`,end=new Date(y,m,0).toISOString().slice(0,10);
 const {data,error}=await sb.from("transactions").select("*").eq("user_id",user.id).gte("date",start).lte("date",end).order("date",{ascending:false});
 if(error){empty.textContent=error.message;return}
 items=data||[];let inc=0,exp=0;items.forEach(x=>x.type==="income"?inc+=+x.amount:exp+=+x.amount);
 document.querySelector("#inc").textContent="฿"+money(inc);document.querySelector("#exp").textContent="฿"+money(exp);document.querySelector("#bal").textContent="฿"+money(inc-exp);document.querySelector("#cnt").textContent=items.length+" รายการ";
 rows.innerHTML=items.map(x=>`<tr><td>${new Date(x.date+"T00:00:00").toLocaleDateString("th-TH")}</td><td>${safe(x.detail)}</td><td class="${x.type}">${x.type==="income"?"รายรับ":"รายจ่าย"}</td><td>${safe(x.category)}</td><td class="${x.type}">${x.type==="income"?"+":"-"}฿${money(x.amount)}</td><td><button class="del" data-id="${x.id}">ลบ</button></td></tr>`).join("");
 empty.style.display=items.length?"none":"block";document.querySelectorAll(".del").forEach(b=>b.onclick=()=>del(b.dataset.id));
}
async function addItem(){
 const payload={user_id:user.id,date:date.value,type:type.value,category:category.value,detail:detail.value.trim(),amount:+amount.value};
 if(!payload.date||!payload.detail||payload.amount<=0)return alert("กรุณากรอกข้อมูลให้ครบ");
 const {error}=await sb.from("transactions").insert(payload);if(error)return alert(error.message);detail.value="";amount.value="";load();
}
async function del(id){if(!confirm("ลบรายการนี้หรือไม่?"))return;await sb.from("transactions").delete().eq("id",id).eq("user_id",user.id);load()}
function safe(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
init();