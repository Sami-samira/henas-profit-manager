const KEY="henas-cafe-os-pro-v1";
const seed={
 ingredients:[
  {id:1,name:"دانه قهوه فول",price:2000000,pack:1000,unit:"گرم"},
  {id:2,name:"شیر",price:65000,pack:1000,unit:"میلی‌لیتر"},
  {id:3,name:"سیروپ وانیل",price:420000,pack:1000,unit:"میلی‌لیتر"}
 ],
 recipes:[
  {id:101,name:"لاته وانیل",category:"گرم",cup:"۳۵۰ میلی‌لیتر",time:"۲ دقیقه",temp:"۶۰ تا ۶۵ درجه",allergens:"لبنیات",price:90000,salesQty:0,
   ingredients:[{ingredientId:1,qty:18},{ingredientId:2,qty:220},{ingredientId:3,qty:15}],
   steps:["۱۸ گرم قهوه را عصاره‌گیری کن.","شیر را تا ۶۰ تا ۶۵ درجه بخار بده.","سیروپ وانیل را داخل لیوان بریز.","اسپرسو و سپس شیر را اضافه کن.","با لاته آرت سرو کن."]},
  {id:102,name:"آیس لاته",category:"سرد",cup:"۴۰۰ میلی‌لیتر",time:"۲ دقیقه",temp:"سرد",allergens:"لبنیات",price:95000,salesQty:0,
   ingredients:[{ingredientId:1,qty:18},{ingredientId:2,qty:220}],
   steps:["لیوان را با یخ پر کن.","شیر سرد را اضافه کن.","شات اسپرسو را جداگانه بگیر.","اسپرسو را روی شیر و یخ اضافه کن.","بدون هم‌زدن سرو کن."]}
 ],
 expenses:[],wastes:[],inventory:{1:0,2:0,3:0},
 settings:{targetProfit:50000000,workDays:30,targetMargin:25},
 chat:[{role:"bot",text:"سلام 👋 من دستیار باریستا هناس هستم. درباره رسپی‌ها، روش تهیه، لیوان، دما، آلرژن و عیب‌یابی نوشیدنی‌ها از من بپرس."}]
};
let db=JSON.parse(localStorage.getItem(KEY)||"null")||seed;
db.ledgerEntries=Array.isArray(db.ledgerEntries)?db.ledgerEntries:[];
db.offPosPayments=Array.isArray(db.offPosPayments)?db.offPosPayments:[];
db.customers=Array.isArray(db.customers)?db.customers:[];
db.employees=Array.isArray(db.employees)&&db.employees.length?db.employees:[
 {id:9001,name:"کیمیا افکاری",role:"باریستا",pin:"1234",baseSalary:15000000,overtimeRate:62500,dailyTarget:4250000,targetBonus:200000,dailyHours:8,active:true}
];
db.attendance=Array.isArray(db.attendance)?db.attendance:[];
db.correctionRequests=Array.isArray(db.correctionRequests)?db.correctionRequests:[];
db.purchaseInvoices=Array.isArray(db.purchaseInvoices)?db.purchaseInvoices:[];
db.clubCustomers=Array.isArray(db.clubCustomers)?db.clubCustomers:[];
db.customerVisits=Array.isArray(db.customerVisits)?db.customerVisits:[];
db.preorders=Array.isArray(db.preorders)?db.preorders:[];
db.cafeStatus=db.cafeStatus||{status:"open",openTime:"08:00",prepMinutes:10,message:"باز هستیم و منتظرتان هستیم."};
db.clubSettings=db.clubSettings||{pointsPer100k:10};
let cloudMode=false,cloudSession=null,cloudWorkspace=null,cloudSaveTimer=null,cloudLoading=false;
const CLOUD_SESSION_KEY="henas_cloud_session";
const CLOUD_WORKSPACE_KEY="henas_cloud_workspace";
db.appSecurity=db.appSecurity||{managerPin:"1403"};
let activeRole=sessionStorage.getItem("henasRole")||"";
let activeEmployeeId=Number(sessionStorage.getItem("henasEmployeeId")||0);
let recipeDraft=[];
let lastBotAnswer="";
const pages=[["dashboard","داشبورد"],["assistant","باریستا AI"],["recipes","رسپی‌ها"],["ingredients","مواد"],["operations","عملیات"],["club","باشگاه مشتریان"],["purchases","خرید و انبار"],["staff","پرسنل"],["accounts","حساب‌ها"],["import","ورود فایل"],["analysis","تحلیل"]];
const $=id=>document.getElementById(id);
function money(n){return Math.round(Number(n)||0).toLocaleString("fa-IR")+" تومان"}
function num(n){return (Number(n)||0).toLocaleString("fa-IR",{maximumFractionDigits:1})}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function save(){
 localStorage.setItem(KEY,JSON.stringify(db));
 renderAll();
 if(cloudMode&&cloudSession&&cloudWorkspace&&!cloudLoading)scheduleCloudSave()
}
function uid(){return Date.now()+Math.random()}
function unitCost(i){return i?.pack?i.price/i.pack:0}

function initNav(){
 $("tabs").innerHTML=pages.map((p,i)=>`<button class="tab ${i===0?"active":""}" onclick="showPage('${p[0]}')">${p[1]}</button>`).join("");
 $("bottomNav").innerHTML=pages.map((p,i)=>`<button class="${i===0?"active":""}" onclick="showPage('${p[0]}')">${p[1]}</button>`).join("");
}
function showPage(name){
 document.querySelectorAll(".page").forEach(x=>x.classList.toggle("active",x.dataset.page===name));
 const title=pages.find(p=>p[0]===name)?.[1];
 document.querySelectorAll(".tab,.bottom-nav button").forEach(x=>x.classList.toggle("active",x.textContent===title));
 scrollTo({top:0,behavior:"smooth"});
}

function addIngredient(){
 const name=$("iName").value.trim(),price=+$("iPrice").value,pack=+$("iPack").value,unit=$("iUnit").value;
 if(!name||price<=0||pack<=0)return alert("نام، قیمت و مقدار بسته را کامل وارد کنید.");
 const id=uid();db.ingredients.push({id,name,price,pack,unit});db.inventory[id]=0;
 $("iName").value=$("iPrice").value=$("iPack").value="";save();
}
function deleteIngredient(id){
 if(db.recipes.some(r=>r.ingredients.some(x=>x.ingredientId===id)))return alert("این ماده در رسپی استفاده شده است.");
 db.ingredients=db.ingredients.filter(x=>x.id!==id);delete db.inventory[id];save();
}
function addRecipeRow(){
 if(!db.ingredients.length)return alert("ابتدا مواد اولیه را ثبت کنید.");
 recipeDraft.push({ingredientId:db.ingredients[0].id,qty:0});renderRecipeRows();
}
function renderRecipeRows(){
 $("recipeRows").innerHTML=recipeDraft.map((r,i)=>`<div class="recipe-line">
 <select onchange="recipeDraft[${i}].ingredientId=+this.value">${db.ingredients.map(x=>`<option value="${x.id}" ${x.id===r.ingredientId?"selected":""}>${esc(x.name)} (${x.unit})</option>`).join("")}</select>
 <input type="number" placeholder="مقدار" value="${r.qty||""}" oninput="recipeDraft[${i}].qty=+this.value">
 <button class="btn danger" onclick="recipeDraft.splice(${i},1);renderRecipeRows()">حذف</button></div>`).join("");
}
function saveRecipe(){
 const name=$("rName").value.trim(),price=+$("rPrice").value,salesQty=+$("rSalesQty").value||0;
 if(!name||!recipeDraft.length||recipeDraft.some(x=>x.qty<=0))return alert("نام و مواد رسپی را کامل وارد کنید.");
 const steps=$("rSteps").value.split("\n").map(x=>x.trim()).filter(Boolean);
 db.recipes.push({id:uid(),name,category:$("rCategory").value,cup:$("rCup").value.trim(),time:$("rTime").value.trim(),temp:$("rTemp").value.trim(),allergens:$("rAllergens").value.trim(),price,salesQty,ingredients:JSON.parse(JSON.stringify(recipeDraft)),steps});
 ["rName","rCup","rTime","rSteps","rTemp","rAllergens","rPrice","rSalesQty"].forEach(id=>$(id).value="");
 recipeDraft=[];renderRecipeRows();save();
}
function deleteRecipe(id){db.recipes=db.recipes.filter(x=>x.id!==id);save()}

function recipeCost(r){return r.ingredients.reduce((s,x)=>{const i=db.ingredients.find(z=>z.id===x.ingredientId);const c=(db.purchaseInvoices||[]).some(p=>p.ingredientId===x.ingredientId)?weightedIngredientUnitCost(x.ingredientId):unitCost(i);return s+c*x.qty},0)}
function renderRecipeCards(){
 const q=($("recipeSearch")?.value||"").trim().toLowerCase();
 const list=db.recipes.filter(r=>!q||r.name.toLowerCase().includes(q)||r.category.includes(q));
 $("recipeCards").innerHTML=list.length?list.map(r=>`<div class="recipe-card">
 <div class="section-title"><h3>${esc(r.name)}</h3><button class="btn danger" onclick="deleteRecipe(${r.id})">حذف</button></div>
 <div class="recipe-meta"><span class="chip">${r.category}</span><span class="chip">${esc(r.cup||"لیوان ثبت نشده")}</span><span class="chip">${esc(r.time||"زمان ثبت نشده")}</span><span class="chip good">هزینه: ${money(recipeCost(r))}</span></div>
 <div class="recipe-steps"><strong>مواد:</strong><br>${r.ingredients.map(x=>{const i=db.ingredients.find(z=>z.id===x.ingredientId);return `• ${num(x.qty)} ${i?.unit||""} ${esc(i?.name||"")}`}).join("<br>")}
 <br><br><strong>مراحل:</strong><br>${r.steps.map((s,i)=>`${i+1}. ${esc(s)}`).join("<br>")}
 ${r.temp?`<br><br><strong>دما:</strong> ${esc(r.temp)}`:""}${r.allergens?`<br><strong>آلرژن:</strong> ${esc(r.allergens)}`:""}</div></div>`).join(""):'<div class="empty">رسپی پیدا نشد.</div>';
}

function addExpense(){
 const name=$("eName").value.trim(),amount=+$("eAmount").value;
 if(!name||amount<=0)return alert("اطلاعات هزینه را کامل کنید.");
 db.expenses.push({id:uid(),name,amount,type:$("eType").value});$("eName").value=$("eAmount").value="";save();
}
function addWaste(){
 const ingredientId=+$("wIngredient").value,qty=+$("wQty").value;
 if(!ingredientId||qty<=0)return alert("ماده و مقدار پرت را وارد کنید.");
 db.wastes.push({id:uid(),ingredientId,qty,note:$("wNote").value.trim()});$("wQty").value=$("wNote").value="";save();
}
function removeItem(type,id){db[type]=db[type].filter(x=>x.id!==id);save()}

function metrics(){
 let sales=0,material=0,gross=0;
 db.recipes.forEach(r=>{const c=recipeCost(r);sales+=r.price*r.salesQty;material+=c*r.salesQty;gross+=(r.price-c)*r.salesQty});
 const baseRate=sales?material/sales:.35;
 const ledgerSales=(db.ledgerEntries||[]).filter(e=>e.type==='debit'&&e.includeInSales).reduce((s,e)=>s+(+e.amount||0),0);
 const offPosSales=(db.offPosPayments||[]).filter(p=>p.includeInSales).reduce((s,p)=>s+(+p.amount||0),0);
 const manualSales=ledgerSales+offPosSales;
 sales+=manualSales;material+=manualSales*baseRate;gross+=manualSales*(1-baseRate);
 const expenses=db.expenses.reduce((s,e)=>s+e.amount,0);
 const waste=db.wastes.reduce((s,w)=>s+unitCost(db.ingredients.find(i=>i.id===w.ingredientId))*w.qty,0);
 const net=gross-expenses-waste,margin=sales?net/sales*100:0,variableRate=sales?material/sales:0;
 const fixed=db.expenses.filter(e=>e.type==="ثابت").reduce((s,e)=>s+e.amount,0);
 const breakEven=variableRate<1?fixed/(1-variableRate):0;
 return{sales,material,gross,expenses,waste,net,margin,variableRate,fixed,breakEven,ledgerSales,offPosSales,manualSales};
}
function managerInsights(m){
 const a=[];
 if(!db.recipes.length)a.push(["high","رسپی‌ها را ثبت کنید","بدون رسپی، بهای تمام‌شده و قیمت پیشنهادی قابل محاسبه نیست.","اولویت فوری"]);
 db.recipes.forEach(r=>{const c=recipeCost(r),mar=r.price?(r.price-c)/r.price*100:0,suggest=c/.45;
  if(r.price&&mar<35)a.push(["high",`اصلاح قیمت ${r.name}`,`حاشیه سود این آیتم ${num(mar)}٪ است. قیمت پیشنهادی اولیه حدود ${money(suggest)} است.`,`اثر بالقوه ماهانه: ${money(Math.max(0,(suggest-r.price)*r.salesQty))}`]);
  else if(r.price&&mar>=55)a.push(["low",`${r.name} سودساز است`,"آن را در منو برجسته و به‌صورت فروش مکمل پیشنهاد کنید.",`سود واحد: ${money(r.price-c)}`]);
 });
 if(m.margin<15&&m.sales>0)a.push(["high","فروش بالا اما سود پایین","هزینه‌های ثابت، پرت و آیتم‌های پرفروش کم‌سود را بررسی کنید.",`حاشیه فعلی: ${num(m.margin)}٪`]);
 if(m.waste>m.sales*.03&&m.sales>0)a.push(["medium","پرت بیش از حد","ارزش پرت از ۳٪ فروش بیشتر شده است.",`پرت: ${money(m.waste)}`]);
 const gap=db.settings.targetProfit-m.net,con=1-m.variableRate,extra=gap>0&&con>0?gap/con:0;
 if(extra>0&&m.sales>0)a.push(["medium","برنامه رسیدن به سود هدف",`حدود ${money(extra)} فروش بیشتر یا کاهش هزینه معادل آن لازم است.`,`روزانه: ${money(extra/db.settings.workDays)}`]);
 if(!a.length)a.push(["low","وضعیت مناسب","تمرکز بعدی روی افزایش میانگین خرید و کاهش زمان آماده‌سازی باشد.","روند مثبت"]);
 return a.slice(0,7);
}

function normalize(s){return s.toLowerCase().replace(/[؟?!.,،]/g," ").replace(/\s+/g," ").trim()}
function findRecipe(question){
 const q=normalize(question);
 let best=null,score=0;
 db.recipes.forEach(r=>{
  const tokens=normalize(r.name).split(" ");
  let s=tokens.reduce((n,t)=>n+(q.includes(t)?2:0),0);
  if(q.includes(normalize(r.name)))s+=5;
  if(s>score){score=s;best=r}
 });
 return score>0?best:null;
}
function baristaAnswer(question){
 const q=normalize(question),r=findRecipe(q);
 if(r){
  if(q.includes("لیوان")||q.includes("سایز"))return `${r.name}\nلیوان استاندارد: ${r.cup||"ثبت نشده"}\nزمان استاندارد: ${r.time||"ثبت نشده"}`;
  if(q.includes("آلرژ")||q.includes("حساسیت"))return `${r.name}\nآلرژن‌های ثبت‌شده: ${r.allergens||"موردی ثبت نشده است."}`;
  if(q.includes("دما")||q.includes("درجه"))return `${r.name}\nدمای استاندارد: ${r.temp||"ثبت نشده"}`;
  if(q.includes("مواد")||q.includes("چی میخواد"))return `${r.name}\nمواد لازم:\n`+r.ingredients.map(x=>{const i=db.ingredients.find(z=>z.id===x.ingredientId);return `• ${num(x.qty)} ${i?.unit||""} ${i?.name||""}`}).join("\n");
  return `${r.name}\n\nمواد لازم:\n${r.ingredients.map(x=>{const i=db.ingredients.find(z=>z.id===x.ingredientId);return `• ${num(x.qty)} ${i?.unit||""} ${i?.name||""}`}).join("\n")}\n\nمراحل تهیه:\n${r.steps.map((s,i)=>`${i+1}. ${s}`).join("\n")}\n\nلیوان: ${r.cup||"ثبت نشده"}\nدما: ${r.temp||"ثبت نشده"}\nزمان: ${r.time||"ثبت نشده"}\nآلرژن: ${r.allergens||"ثبت نشده"}`;
 }
 if(q.includes("فوم")||q.includes("کف شیر"))return "برای خراب‌شدن فوم شیر این موارد را بررسی کن:\n1. شیر باید سرد و تازه باشد.\n2. نوک نازل در شروع نزدیک سطح شیر باشد.\n3. بعد از ورود هوا، نازل را کمی پایین‌تر ببر تا گرداب ایجاد شود.\n4. دما را معمولاً از ۶۵ درجه بالاتر نبر.\n5. نازل را قبل و بعد از کار پاک و Purge کن.";
 if(q.includes("عصاره")||q.includes("اسپرسو")&&q.includes("خراب"))return "برای عصاره‌گیری نامناسب بررسی کن:\n• وزن دوز قهوه\n• درجه آسیاب\n• زمان عصاره‌گیری\n• توزیع و تمپ یکنواخت\n• تمیزی گروپ‌هد\n• تازگی دانه\nاگر شات سریع است آسیاب را ریزتر و اگر خیلی کند است درشت‌تر کن.";
 if(q.includes("نداریم")||q.includes("جایگزین")){
  const missing=db.ingredients.filter(i=>(db.inventory[i.id]||0)<=0).map(i=>i.name);
  const unavailable=db.recipes.filter(r=>r.ingredients.some(x=>(db.inventory[x.ingredientId]||0)<=0)).map(r=>r.name);
  const available=db.recipes.filter(r=>r.ingredients.every(x=>(db.inventory[x.ingredientId]||0)>0)).map(r=>r.name);
  return `مواد ناموجود یا ثبت‌نشده: ${missing.length?missing.join("، "):"موردی نیست"}\n\nمحصولات فعلاً غیرقابل سرو: ${unavailable.length?unavailable.join("، "):"موردی نیست"}\n\nمحصولات قابل پیشنهاد: ${available.length?available.join("، "):"موجودی‌ها را ثبت کن."}`;
 }
 return "رسپی دقیق این مورد را پیدا نکردم. نام محصول را دقیق‌تر بگو یا ابتدا آن را در بخش «رسپی‌ها» ثبت کن. همچنین می‌توانی درباره فوم شیر، عصاره‌گیری، لیوان، دما و آلرژن سؤال کنی.";
}
function sendChat(){
 const input=$("chatInput"),q=input.value.trim();if(!q)return;
 db.chat.push({role:"user",text:q});const ans=baristaAnswer(q);db.chat.push({role:"bot",text:ans});lastBotAnswer=ans;input.value="";save();
}
function askQuick(q){$("chatInput").value=q;sendChat();showPage("assistant")}
function renderChat(){
 $("chatMessages").innerHTML=db.chat.map(m=>`<div class="msg ${m.role}"><div class="bubble">${esc(m.text)}</div></div>`).join("");
 $("chatMessages").scrollTop=$("chatMessages").scrollHeight;
}
function startVoice(){
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return alert("مرورگر شما ورودی صوتی را پشتیبانی نمی‌کند.");
 const rec=new SR();rec.lang="fa-IR";rec.onresult=e=>{$("chatInput").value=e.results[0][0].transcript;sendChat()};rec.start();
}
function speakLastAnswer(){
 if(!lastBotAnswer){const last=[...db.chat].reverse().find(x=>x.role==="bot");lastBotAnswer=last?.text||""}
 if(!lastBotAnswer)return;
 speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(lastBotAnswer);u.lang="fa-IR";speechSynthesis.speak(u);
}

function saveSettings(){db.settings.targetProfit=+$("targetProfit").value||0;db.settings.workDays=+$("workDays").value||30;db.settings.targetMargin=+$("targetMargin").value||25;save()}
function exportData(){const b=new Blob([JSON.stringify(db,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="henas-cafe-os-backup.json";a.click()}

function ingredientNeed(id){return db.recipes.reduce((s,r)=>s+r.salesQty*r.ingredients.filter(x=>x.ingredientId===id).reduce((a,x)=>a+x.qty,0),0)}
function renderTables(){
 $("ingredientsTable").innerHTML="<tr><th>ماده</th><th>قیمت بسته</th><th>مقدار بسته</th><th>هزینه واحد</th><th></th></tr>"+db.ingredients.map(i=>`<tr><td>${esc(i.name)}</td><td>${money(i.price)}</td><td>${num(i.pack)} ${i.unit}</td><td>${money(unitCost(i))}</td><td><button class="btn danger" onclick="deleteIngredient(${i.id})">حذف</button></td></tr>`).join("");
 $("wIngredient").innerHTML=db.ingredients.map(i=>`<option value="${i.id}">${esc(i.name)}</option>`).join("");
 $("expensesTable").innerHTML="<tr><th>عنوان</th><th>مبلغ</th><th>نوع</th><th></th></tr>"+db.expenses.map(e=>`<tr><td>${esc(e.name)}</td><td>${money(e.amount)}</td><td>${e.type}</td><td><button class="btn danger" onclick="removeItem('expenses',${e.id})">حذف</button></td></tr>`).join("");
 $("wasteTable").innerHTML="<tr><th>ماده</th><th>مقدار</th><th>ارزش</th><th>توضیح</th><th></th></tr>"+db.wastes.map(w=>{const i=db.ingredients.find(x=>x.id===w.ingredientId);return `<tr><td>${esc(i?.name||"-")}</td><td>${num(w.qty)} ${i?.unit||""}</td><td>${money(unitCost(i)*w.qty)}</td><td>${esc(w.note)}</td><td><button class="btn danger" onclick="removeItem('wastes',${w.id})">حذف</button></td></tr>`}).join("");
 $("inventoryTable").innerHTML="<tr><th>ماده</th><th>موجودی فعلی</th><th>نیاز ماه</th><th>کسری/مازاد</th><th>پیشنهاد خرید</th></tr>"+db.ingredients.map(i=>{const stock=+db.inventory[i.id]||0,need=ingredientNeed(i.id),diff=stock-need,buy=Math.max(0,need-stock);return `<tr><td>${esc(i.name)}</td><td><input type="number" value="${stock}" onchange="db.inventory[${i.id}]=+this.value;save()"></td><td>${num(need)} ${i.unit}</td><td class="${diff<0?"badText":"goodText"}">${num(diff)} ${i.unit}</td><td>${buy?`${num(buy)} ${i.unit} ≈ ${money(buy*unitCost(i))}`:"نیازی نیست"}</td></tr>`}).join("");
}
function renderAnalysis(m){
 const avg=db.recipes.length?m.sales/db.recipes.length:0;
 $("analysisTable").innerHTML="<tr><th>محصول</th><th>فروش</th><th>هزینه سرو</th><th>حاشیه</th><th>دسته</th><th>تصمیم</th></tr>"+db.recipes.map(r=>{const c=recipeCost(r),sales=r.price*r.salesQty,mar=r.price?(r.price-c)/r.price*100:0;let cat,cls,act;if(sales>=avg&&mar>=45){cat="ستاره";cls="good";act="حفظ کیفیت و تبلیغ"}else if(sales>=avg&&mar<35){cat="پرفروش کم‌سود";cls="bad";act="اصلاح قیمت یا رسپی"}else if(sales<avg&&mar>=45){cat="سودساز پنهان";cls="warn";act="فروش مکمل"}else{cat="ضعیف";cls="bad";act="بازطراحی یا حذف"}return `<tr><td>${esc(r.name)}</td><td>${money(sales)}</td><td>${money(c)}</td><td>${num(mar)}٪</td><td><span class="chip ${cls}">${cat}</span></td><td>${act}</td></tr>`}).join("");
 $("pnlReport").innerHTML=`<p>فروش: <strong>${money(m.sales)}</strong></p><p>بهای مواد: <strong>${money(m.material)}</strong></p><p>سود ناخالص: <strong>${money(m.gross)}</strong></p><p>هزینه‌های عملیاتی: <strong>${money(m.expenses)}</strong></p><p>پرت: <strong>${money(m.waste)}</strong></p><p>سود خالص: <strong class="${m.net>=0?"goodText":"badText"}">${money(m.net)}</strong></p><p>نقطه سربه‌سر: <strong>${money(m.breakEven)}</strong></p>`;
 const gap=db.settings.targetProfit-m.net,con=1-m.variableRate,extra=gap>0&&con>0?gap/con:0;
 $("scenarioReport").innerHTML=gap<=0?'<div class="insight low"><h4>هدف محقق شده</h4><p>سود فعلی از هدف بیشتر است.</p></div>':`<div class="insight medium"><h4>سناریوی پیشنهادی</h4><p>فاصله سود: ${money(gap)}</p><p>فروش اضافه لازم: ${money(extra)}</p><p>روزانه: ${money(extra/db.settings.workDays)}</p><p>ترکیب پیشنهادی: افزایش قیمت آیتم‌های کم‌سود، فروش مکمل و کاهش پرت.</p></div>`;
}
function renderChart(id,data,key){
 const el=$(id);if(!data.length){el.innerHTML='<div class="empty">داده‌ای ثبت نشده</div>';return}
 const max=Math.max(...data.map(x=>Math.max(0,x[key])),1);
 el.innerHTML=data.map(x=>`<div class="bar-item"><div class="bar-visual" title="${money(x[key])}" style="height:${Math.max(3,x[key]/max*175)}px"></div><small>${esc(x.name)}</small></div>`).join("");
}
function renderDashboard(m){
 $("kSales").textContent=money(m.sales);$("kGross").textContent=money(m.gross);$("kNet").textContent=money(m.net);$("kMargin").textContent=num(m.margin)+"٪";
 $("kNet").className=m.net>=0?"goodText":"badText";$("kMargin").className=m.margin>=25?"goodText":m.margin>=15?"warnText":"badText";$("kStatus").textContent=m.margin>=25?"عالی":m.margin>=15?"قابل قبول":m.sales?"نیازمند اصلاح":"نیازمند داده";
 $("managerInsights").innerHTML=managerInsights(m).map(x=>`<div class="insight ${x[0]}"><h4>${esc(x[1])}</h4><p>${x[2]}</p><p class="impact">${x[3]}</p></div>`).join("");
 $("targetProfit").value=db.settings.targetProfit;$("workDays").value=db.settings.workDays;$("targetMargin").value=db.settings.targetMargin;
 const gap=db.settings.targetProfit-m.net,con=1-m.variableRate,extra=gap>0&&con>0?gap/con:0;$("extraSales").textContent=money(extra);$("extraDaily").textContent=money(extra/db.settings.workDays);
 const d=db.recipes.map(r=>({name:r.name,sales:r.price*r.salesQty,profit:(r.price-recipeCost(r))*r.salesQty}));renderChart("profitChart",d,"profit");renderChart("salesChart",d,"sales");
}
function renderAll(){const m=metrics();renderTables();renderRecipeRows();renderRecipeCards();renderChat();renderAnalysis(m);renderDashboard(m);renderAccountsModule();renderStaffModule();renderPurchasesModule();renderClubModule();syncJalaliInputs();fillRoleGate()}







// ================= Supabase cloud persistence (REST + Auth) =================
function cloudConfig(){
 const saved=JSON.parse(localStorage.getItem('henas_cloud_config')||'null');
 const fallback=window.HENAS_CLOUD_CONFIG||{};
 return{url:(saved?.url||fallback.url||'').replace(/\/$/,''),key:saved?.key||fallback.key||''}
}
function saveCloudConfig(){
 const url=$('cloudUrl').value.trim().replace(/\/$/,''),key=$('cloudKey').value.trim();
 if(!/^https:\/\/.+\.supabase\.co$/.test(url)||!key)return cloudMessage('آدرس یا کلید صحیح نیست.');
 localStorage.setItem('henas_cloud_config',JSON.stringify({url,key}));showCloudAuth()
}
function resetCloudConfig(){localStorage.removeItem('henas_cloud_config');localStorage.removeItem(CLOUD_SESSION_KEY);location.reload()}
function useLocalDemo(){cloudMode=false;sessionStorage.setItem('henas_local_demo','1');$('cloudGate').classList.add('hidden');$('roleGate')?.classList.remove('hidden');setSyncStatus('محلی','')}
function cloudMessage(t){$('cloudGateMessage').textContent=t||''}
function authHeaders(accessToken=''){
 const c=cloudConfig(),h={'apikey':c.key,'Content-Type':'application/json'};
 if(accessToken)h.Authorization='Bearer '+accessToken;
 return h
}
async function cloudFetch(path,opts={}){
 const c=cloudConfig();if(!c.url||!c.key)throw new Error('تنظیم اتصال کامل نیست.');
 const res=await fetch(c.url+path,{...opts,headers:{...authHeaders(opts.accessToken),...(opts.headers||{})}});
 const text=await res.text();let data=null;try{data=text?JSON.parse(text):null}catch{data=text}
 if(!res.ok)throw new Error(data?.msg||data?.message||data?.error_description||data?.hint||`خطای ${res.status}`);
 return{data,res}
}
function persistCloudSession(data){
 cloudSession={access_token:data.access_token,refresh_token:data.refresh_token,user:data.user,expires_at:Date.now()+(data.expires_in||3600)*1000};
 localStorage.setItem(CLOUD_SESSION_KEY,JSON.stringify(cloudSession))
}
async function cloudSignUp(){
 try{
  cloudMessage('در حال ثبت‌نام...');
  const {data}=await cloudFetch('/auth/v1/signup',{method:'POST',body:JSON.stringify({email:$('cloudSignupEmail').value.trim(),password:$('cloudSignupPassword').value})});
  if(data.access_token){persistCloudSession(data);await showWorkspacePanel()}else cloudMessage('ثبت‌نام انجام شد. ایمیل تأیید را بررسی و سپس وارد شوید.')
 }catch(e){cloudMessage(e.message)}
}
async function cloudSignIn(){
 try{
  cloudMessage('در حال ورود...');
  const {data}=await cloudFetch('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email:$('cloudLoginEmail').value.trim(),password:$('cloudLoginPassword').value})});
  persistCloudSession(data);await showWorkspacePanel()
 }catch(e){cloudMessage(e.message)}
}
async function refreshCloudSession(){
 if(!cloudSession?.refresh_token)return false;
 try{
  const {data}=await cloudFetch('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:cloudSession.refresh_token})});
  persistCloudSession(data);return true
 }catch{return false}
}
async function ensureCloudSession(){
 if(!cloudSession)return false;
 if(cloudSession.expires_at-Date.now()<120000)return await refreshCloudSession();
 return true
}
async function cloudSignOut(){
 try{if(cloudSession)await cloudFetch('/auth/v1/logout',{method:'POST',accessToken:cloudSession.access_token})}catch{}
 localStorage.removeItem(CLOUD_SESSION_KEY);localStorage.removeItem(CLOUD_WORKSPACE_KEY);cloudSession=null;cloudWorkspace=null;location.reload()
}
function showCloudAuth(){
 $('cloudConfigPanel').style.display='none';$('cloudAuthPanel').style.display='block';$('workspacePanel').style.display='none';cloudMessage('')
}
async function getMyWorkspaces(){
 await ensureCloudSession();
 const {data}=await cloudFetch('/rest/v1/workspace_members?select=workspace_id,role,workspaces(id,name,join_code,created_at)&order=created_at.desc',{accessToken:cloudSession.access_token});
 return data||[]
}
async function showWorkspacePanel(){
 $('cloudConfigPanel').style.display='none';$('cloudAuthPanel').style.display='none';$('workspacePanel').style.display='block';
 const rows=await getMyWorkspaces();
 $('workspaceList').innerHTML=rows.length?rows.map(r=>`<div class="workspace-card"><div class="section-title"><div><strong>${esc(r.workspaces?.name||'فضای کاری')}</strong><div class="customer-meta">نقش: ${r.role} | کد عضویت: ${esc(r.workspaces?.join_code||'-')}</div></div><button class="btn good" onclick="selectCloudWorkspace('${r.workspace_id}')">انتخاب</button></div></div>`).join(''):'<div class="empty">فضای کاری ندارید.</div>';
 cloudMessage('')
}
async function createCloudWorkspace(){
 try{
  const {data}=await cloudFetch('/rest/v1/rpc/create_workspace',{method:'POST',accessToken:cloudSession.access_token,body:JSON.stringify({p_name:$('workspaceName').value.trim()||'کافه هناس'})});
  await selectCloudWorkspace(typeof data==='string'?data:data?.id||data)
 }catch(e){cloudMessage(e.message)}
}
async function joinCloudWorkspace(){
 try{
  const {data}=await cloudFetch('/rest/v1/rpc/join_workspace',{method:'POST',accessToken:cloudSession.access_token,body:JSON.stringify({p_join_code:$('workspaceJoinCode').value.trim().toUpperCase(),p_role:$('workspaceJoinRole').value})});
  await selectCloudWorkspace(typeof data==='string'?data:data?.id||data)
 }catch(e){cloudMessage(e.message)}
}
async function selectCloudWorkspace(id){
 try{
  await ensureCloudSession();
  const {data}=await cloudFetch(`/rest/v1/workspace_members?workspace_id=eq.${encodeURIComponent(id)}&select=workspace_id,role,workspaces(id,name,join_code)&limit=1`,{accessToken:cloudSession.access_token});
  if(!data?.length)throw new Error('دسترسی به فضای کاری پیدا نشد.');
  cloudWorkspace={id:data[0].workspace_id,role:data[0].role,name:data[0].workspaces?.name,join_code:data[0].workspaces?.join_code};
  localStorage.setItem(CLOUD_WORKSPACE_KEY,JSON.stringify(cloudWorkspace));
  await loadCloudState();
  cloudMode=true;$('cloudGate').classList.add('hidden');$('roleGate')?.classList.remove('hidden');
  setSyncStatus('همگام','ok');$('cloudUserLabel').textContent=`${cloudSession.user?.email||''} | ${cloudWorkspace.name||''}`;
 }catch(e){cloudMessage(e.message)}
}
async function loadCloudState(){
 cloudLoading=true;setSyncStatus('دریافت داده...','wait');
 try{
  const {data}=await cloudFetch(`/rest/v1/workspace_state?workspace_id=eq.${encodeURIComponent(cloudWorkspace.id)}&select=data,version,updated_at&limit=1`,{accessToken:cloudSession.access_token});
  if(data?.[0]?.data&&Object.keys(data[0].data).length){
   db={...seed,...data[0].data};
   localStorage.setItem(KEY,JSON.stringify(db))
  }else await saveCloudState();
  renderAll();setSyncStatus('همگام','ok')
 }finally{cloudLoading=false}
}
function scheduleCloudSave(){
 clearTimeout(cloudSaveTimer);setSyncStatus('در انتظار ذخیره','wait');
 cloudSaveTimer=setTimeout(saveCloudState,900)
}
async function saveCloudState(){
 if(!cloudMode||!cloudSession||!cloudWorkspace)return;
 try{
  await ensureCloudSession();setSyncStatus('ذخیره...','wait');
  await cloudFetch('/rest/v1/workspace_state?on_conflict=workspace_id',{method:'POST',accessToken:cloudSession.access_token,headers:{'Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({workspace_id:cloudWorkspace.id,data:db,updated_at:new Date().toISOString()})});
  setSyncStatus('همگام','ok')
 }catch(e){setSyncStatus('خطای همگام‌سازی','error');console.error(e)}
}
function setSyncStatus(label,cls){if(!$('syncLabel'))return;$('syncLabel').textContent=label;$('syncDot').className='sync-dot '+(cls||'')}
function openCloudWorkspaceSwitcher(){$('cloudGate').classList.remove('hidden');if(cloudSession)showWorkspacePanel();else showCloudAuth()}
async function initCloud(){
 const cfg=cloudConfig();$('cloudUrl').value=cfg.url||'';$('cloudKey').value=cfg.key||'';
 if(sessionStorage.getItem('henas_local_demo')==='1'){useLocalDemo();return}
 if(!cfg.url||!cfg.key){$('cloudConfigPanel').style.display='block';return}
 cloudSession=JSON.parse(localStorage.getItem(CLOUD_SESSION_KEY)||'null');
 if(!cloudSession){showCloudAuth();return}
 if(!await ensureCloudSession()){showCloudAuth();return}
 const saved=JSON.parse(localStorage.getItem(CLOUD_WORKSPACE_KEY)||'null');
 if(saved?.id){cloudWorkspace=saved;await selectCloudWorkspace(saved.id)}
 else await showWorkspacePanel()
}

// ================= Jalali date conversion and picker =================
function div(a,b){return ~~(a/b)}
function mod(a,b){return a-~~(a/b)*b}
function jalCal(jy){
 const breaks=[-61,9,38,199,426,686,756,818,1111,1181,1210,1635,2060,2097,2192,2262,2324,2394,2456,3178];
 let bl=breaks.length,gy=jy+621,leapJ=-14,jp=breaks[0],jm,jump,leap,n,i;
 if(jy<jp||jy>=breaks[bl-1])throw Error('Invalid Jalaali year');
 for(i=1;i<bl;i++){jm=breaks[i];jump=jm-jp;if(jy<jm)break;leapJ+=div(jump,33)*8+div(mod(jump,33),4);jp=jm}
 n=jy-jp;leapJ+=div(n,33)*8+div(mod(n,33)+3,4);if(mod(jump,33)===4&&jump-n===4)leapJ++;
 const leapG=div(gy,4)-div((div(gy,100)+1)*3,4)-150, march=20+leapJ-leapG;
 if(jump-n<6)n=n-jump+div(jump+4,33)*33;
 leap=mod(mod(n+1,33)-1,4);if(leap===-1)leap=4;
 return{leap,gy,march}
}
function g2d(gy,gm,gd){let d=div((gy+div(gm-8,6)+100100)*1461,4)+div(153*mod(gm+9,12)+2,5)+gd-34840408;d=d-div(div(gy+100100+div(gm-8,6),100)*3,4)+752;return d}
function d2g(jdn){let j=4*jdn+139361631;j=j+div(div(4*jdn+183187720,146097)*3,4)*4-3908;let i=div(mod(j,1461),4)*5+308;let gd=div(mod(i,153),5)+1,gm=mod(div(i,153),12)+1,gy=div(j,1461)-100100+div(8-gm,6);return{gy,gm,gd}}
function j2d(jy,jm,jd){const r=jalCal(jy);return g2d(r.gy,3,r.march)+(jm-1)*31-div(jm,7)*(jm-7)+jd-1}
function d2j(jdn){const g=d2g(jdn),jy=g.gy-621,r=jalCal(jy),jdn1f=g2d(g.gy,3,r.march);let k=jdn-jdn1f,jm,jd,jy2=jy;if(k>=0){if(k<=185){jm=1+div(k,31);jd=mod(k,31)+1;return{jy:jy2,jm,jd}}k-=186}else{jy2--;k+=179;if(r.leap===1)k++;}jm=7+div(k,30);jd=mod(k,30)+1;return{jy:jy2,jm,jd}}
function toJalali(iso){
 if(!iso)return'';const m=String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return iso;
 const j=d2j(g2d(+m[1],+m[2],+m[3]));return`${j.jy}/${String(j.jm).padStart(2,'0')}/${String(j.jd).padStart(2,'0')}`
}
function toGregorian(jalali){
 const m=String(jalali).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);if(!m)return'';
 try{const g=d2g(j2d(+m[1],+m[2],+m[3]));return`${g.gy}-${String(g.gm).padStart(2,'0')}-${String(g.gd).padStart(2,'0')}`}catch{return''}
}
const jalaliMonths=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
let activeJalaliInput=null,activeJalaliMode='date';
function initJalaliInputs(){
 document.querySelectorAll('input[type="date"],input[type="month"]').forEach(hidden=>{
  if(hidden.dataset.jalaliReady)return;hidden.dataset.jalaliReady='1';hidden.classList.add('jalali-hidden');
  const visible=document.createElement('input');visible.type='text';visible.className='jalali-visible';visible.placeholder=hidden.type==='month'?'۱۴۰۵/۰۱':'۱۴۰۵/۰۱/۰۱';visible.readOnly=true;visible.dataset.for=hidden.id;
  hidden.insertAdjacentElement('afterend',visible);visible.onclick=()=>openJalaliPicker(hidden,hidden.type);
  if(hidden.value)visible.value=hidden.type==='month'?toJalali(hidden.value+'-01').slice(0,7):toJalali(hidden.value)
 })
}
function syncJalaliInputs(){
 initJalaliInputs();
 document.querySelectorAll('.jalali-visible').forEach(v=>{const h=$(v.dataset.for);if(!h)return;const val=h.value||'';v.value=h.type==='month'?(val?toJalali(val+'-01').slice(0,7):''):(val?toJalali(val):'')})
}
function openJalaliPicker(hidden,mode='date'){
 activeJalaliInput=hidden;activeJalaliMode=mode;
 let j;if(hidden.value){const iso=mode==='month'?hidden.value+'-01':hidden.value;j=d2j(g2d(...iso.split('-').map(Number)))}else{const n=new Date();j=d2j(g2d(n.getFullYear(),n.getMonth()+1,n.getDate()))}
 $('jalaliYear').innerHTML=Array.from({length:21},(_,i)=>j.jy-10+i).map(y=>`<option ${y===j.jy?'selected':''}>${y}</option>`).join('');
 $('jalaliMonth').innerHTML=jalaliMonths.map((m,i)=>`<option value="${i+1}" ${i+1===j.jm?'selected':''}>${m}</option>`).join('');
 updateJalaliDays(j.jd);$('jalaliMonth').onchange=()=>updateJalaliDays(1);$('jalaliYear').onchange=()=>updateJalaliDays(1);
 $('jalaliDay').parentElement.style.display=mode==='month'?'none':'block';$('jalaliModal').classList.add('open')
}
function jalaliMonthLength(y,m){if(m<=6)return 31;if(m<=11)return 30;return jalCal(y).leap===0?30:29}
function updateJalaliDays(selected=1){const y=+$('jalaliYear').value,m=+$('jalaliMonth').value,max=jalaliMonthLength(y,m);$('jalaliDay').innerHTML=Array.from({length:max},(_,i)=>i+1).map(d=>`<option ${d===selected?'selected':''}>${d}</option>`).join('')}
function applyJalaliDate(){
 if(!activeJalaliInput)return;const y=+$('jalaliYear').value,m=+$('jalaliMonth').value,d=activeJalaliMode==='month'?1:+$('jalaliDay').value;const g=d2g(j2d(y,m,d));
 activeJalaliInput.value=activeJalaliMode==='month'?`${g.gy}-${String(g.gm).padStart(2,'0')}`:`${g.gy}-${String(g.gm).padStart(2,'0')}-${String(g.gd).padStart(2,'0')}`;
 activeJalaliInput.dispatchEvent(new Event('change',{bubbles:true}));closeJalaliPicker();syncJalaliInputs()
}
function setJalaliToday(){const n=new Date(),j=d2j(g2d(n.getFullYear(),n.getMonth()+1,n.getDate()));$('jalaliYear').value=j.jy;$('jalaliMonth').value=j.jm;updateJalaliDays(j.jd)}
function clearJalaliDate(){if(activeJalaliInput){activeJalaliInput.value='';activeJalaliInput.dispatchEvent(new Event('change',{bubbles:true}))}closeJalaliPicker();syncJalaliInputs()}
function closeJalaliPicker(){$('jalaliModal').classList.remove('open')}

// ================= Henas Customer Club =================
function normalizePhone(v){return String(v||'').replace(/\D/g,'').replace(/^98/,'0')}
function clubCustomerStats(id){
 const visits=db.customerVisits.filter(v=>v.customerId===id).sort((a,b)=>a.date.localeCompare(b.date));
 const total=visits.reduce((s,v)=>s+(+v.amount||0),0),count=visits.length;
 const last=visits.length?visits.at(-1).date:'';
 const daysSince=last?Math.floor((new Date(localISODate())-new Date(last))/86400000):9999;
 return{total,count,last,daysSince,avg:count?total/count:0}
}
function loyaltyLevel(c){
 const s=clubCustomerStats(c.id),points=+c.points||0;
 if(c.tag==='VIP'||s.total>=20000000||points>=2000)return{title:'VIP',cls:'level-vip'};
 if(s.total>=10000000||points>=1000)return{title:'طلایی',cls:'level-gold'};
 if(s.total>=4000000||points>=400)return{title:'نقره‌ای',cls:'level-silver'};
 return{title:'برنزی',cls:'level-bronze'}
}
function saveClubCustomer(){
 const id=+$('clubCustomerId').value,name=$('cName').value.trim(),phone=normalizePhone($('cPhone').value);
 if(!name||phone.length<10)return alert('نام و شماره موبایل معتبر وارد کنید.');
 const duplicate=db.clubCustomers.find(c=>normalizePhone(c.phone)===phone&&c.id!==id);
 if(duplicate)return alert('این شماره قبلاً برای '+duplicate.name+' ثبت شده است.');
 let c=id?db.clubCustomers.find(x=>x.id===id):null;
 if(!c){c={id:uid(),createdAt:new Date().toISOString(),points:0};db.clubCustomers.push(c)}
 Object.assign(c,{name,phone,birthday:$('cBirthday').value,instagram:$('cInstagram').value.trim(),favorite:$('cFavorite').value.trim(),preferredTime:$('cPreferredTime').value.trim(),points:+$('cPoints').value||0,tag:$('cTag').value,note:$('cNote').value.trim(),consent:$('cConsent').checked});
 clearClubCustomerForm();save()
}
function clearClubCustomerForm(){
 $('clubCustomerId').value='';
 ['cName','cPhone','cBirthday','cInstagram','cFavorite','cPreferredTime','cNote'].forEach(id=>$(id).value='');
 $('cPoints').value=0;$('cTag').value='عادی';$('cConsent').checked=true
}
function editClubCustomer(id){
 const c=db.clubCustomers.find(x=>x.id===id);if(!c)return;
 $('clubCustomerId').value=c.id;$('cName').value=c.name;$('cPhone').value=c.phone;$('cBirthday').value=c.birthday||'';$('cInstagram').value=c.instagram||'';$('cFavorite').value=c.favorite||'';$('cPreferredTime').value=c.preferredTime||'';$('cPoints').value=c.points||0;$('cTag').value=c.tag||'عادی';$('cNote').value=c.note||'';$('cConsent').checked=c.consent!==false;
 $('cName').scrollIntoView({behavior:'smooth',block:'center'})
}
function deleteClubCustomer(id){
 if(!confirm('مشتری و سوابق او حذف شود؟'))return;
 db.clubCustomers=db.clubCustomers.filter(x=>x.id!==id);db.customerVisits=db.customerVisits.filter(x=>x.customerId!==id);db.preorders=db.preorders.filter(x=>x.customerId!==id);save()
}
function addCustomerVisit(){
 const customerId=+$('visitCustomer').value,c=db.clubCustomers.find(x=>x.id===customerId),amount=cleanNumber($('visitAmount').value);
 if(!c||amount<=0)return alert('مشتری و مبلغ خرید را وارد کنید.');
 const autoPoints=Math.floor(amount/100000)*(db.clubSettings.pointsPer100k||10),bonus=+$('visitBonusPoints').value||0;
 db.customerVisits.push({id:uid(),customerId,date:$('visitDate').value||localISODate(),amount,items:$('visitItems').value.trim(),channel:$('visitChannel').value,points:autoPoints+bonus,createdAt:new Date().toISOString()});
 c.points=(+c.points||0)+autoPoints+bonus;
 if($('visitItems').value.trim())c.favorite=c.favorite||$('visitItems').value.trim();
 ['visitAmount','visitItems'].forEach(id=>$(id).value='');$('visitBonusPoints').value=0;save()
}
function setCafeStatus(status){db.cafeStatus.status=status;document.querySelectorAll('.cafe-status button').forEach(b=>b.classList.toggle('active',b.dataset.status===status))}
function saveCafeStatus(){db.cafeStatus.openTime=$('cafeOpenTime').value;db.cafeStatus.prepMinutes=+$('cafePrepMinutes').value||10;db.cafeStatus.message=$('cafeStatusMessage').value.trim();save()}
function cafeStatusText(){
 const m={open:'🟢 کافه هناس باز است.',opening:'🟡 امروز کمی دیرتر باز می‌کنیم.',busy:'☕ کافه باز است و کمی شلوغیم.',closed:'🔴 کافه هناس فعلاً بسته است.'};
 return `${m[db.cafeStatus.status]||m.open}\n${db.cafeStatus.openTime?'ساعت شروع: '+db.cafeStatus.openTime+'\n':''}${db.cafeStatus.message||''}\nزمان تقریبی آماده‌سازی سفارش: ${db.cafeStatus.prepMinutes||10} دقیقه.`
}
function copyText(text){navigator.clipboard?.writeText(text).then(()=>alert('متن کپی شد.')).catch(()=>prompt('متن را کپی کنید:',text))}
function copyCafeStatus(){copyText(cafeStatusText())}
function addPreorder(){
 const customerId=+$('preCustomer').value,c=db.clubCustomers.find(x=>x.id===customerId),items=$('preItems').value.trim(),pickup=$('prePickupTime').value;
 if(!c||!items||!pickup)return alert('مشتری، سفارش و زمان رسیدن را وارد کنید.');
 db.preorders.push({id:uid(),customerId,customerName:c.name,phone:c.phone,items,pickupTime:pickup,amount:cleanNumber($('preAmount').value),payment:$('prePayment').value,note:$('preNote').value.trim(),status:'new',createdAt:new Date().toISOString()});
 ['preItems','prePickupTime','preAmount','preNote'].forEach(id=>$(id).value='');save()
}
function updatePreorder(id,status){const p=db.preorders.find(x=>x.id===id);if(p){p.status=status;save()}}
function deletePreorder(id){if(confirm('پیش‌سفارش حذف شود؟')){db.preorders=db.preorders.filter(x=>x.id!==id);save()}}
function smsLink(phone,text){return `sms:${normalizePhone(phone)}?body=${encodeURIComponent(text)}`}
function whatsappLink(phone,text){let p=normalizePhone(phone);if(p.startsWith('0'))p='98'+p.slice(1);return `https://wa.me/${p}?text=${encodeURIComponent(text)}`}
function suggestCampaign(){
 const goal=$('campaignGoal').value,offer=$('campaignOffer').value.trim()||'یک پیشنهاد ویژه هناس',disc=+$('campaignDiscount').value||10;
 const texts={
  inactive:`سلام دوست عزیز ☕ دلمان برایتان تنگ شده. این هفته با ارائه این پیام، ${disc}٪ تخفیف برای ${offer} مهمان هناس باشید.`,
  holiday:`سلام ☕ امروز هم کنار شما هستیم. ${cafeStatusText()}\nمی‌توانید سفارشتان را زودتر ثبت کنید تا هنگام رسیدن آماده باشد.`,
  birthday:`تولدت مبارک 🎉 امروز یک تجربه ویژه در کافه هناس برایت داریم. برای دریافت هدیه تولد، این پیام را نشان بده.`,
  quiet:`امروز در ساعت‌های خلوت هناس، ${offer} با ${disc}٪ تخفیف منتظر شماست.`,
  product:`یک پیشنهاد تازه از هناس ☕ ${offer}. برای اعضای باشگاه ${disc}٪ تخفیف ویژه در نظر گرفته‌ایم.`
 };
 $('campaignText').value=texts[goal]
}
function campaignAudienceList(){
 const goal=$('campaignGoal').value,days=+$('campaignInactiveDays').value||30,today=localISODate(),monthDay=today.slice(5);
 return db.clubCustomers.filter(c=>{
  if(c.consent===false)return false;
  const s=clubCustomerStats(c.id);
  if(goal==='inactive')return s.daysSince>=days;
  if(goal==='birthday')return c.birthday&&c.birthday.slice(5)===monthDay;
  return true
 })
}
function buildCampaignAudience(){
 suggestCampaign();
 const list=campaignAudienceList(),text=$('campaignText').value;
 $('campaignAudience').innerHTML=list.length?`<div class="summary-strip"><span class="chip good">${num(list.length)} مخاطب مناسب</span></div>`+list.map(c=>`<div class="campaign-card"><strong>${esc(c.name)}</strong> | ${esc(c.phone)}<div class="customer-actions"><a class="btn" href="${smsLink(c.phone,text)}">SMS</a><a class="btn good" target="_blank" href="${whatsappLink(c.phone,text)}">WhatsApp</a></div></div>`).join(''):'<div class="empty">مخاطبی مطابق این کمپین پیدا نشد.</div>'
}
function copyCampaignText(){copyText($('campaignText').value)}
function exportClubExcel(){
 if(typeof XLSX==='undefined')return alert('کتابخانه Excel بارگذاری نشده است.');
 const customers=db.clubCustomers.map(c=>{const s=clubCustomerStats(c.id),l=loyaltyLevel(c);return {'نام':c.name,'موبایل':c.phone,'تولد':c.birthday,'برچسب':c.tag,'سطح':l.title,'امتیاز':c.points,'تعداد خرید':s.count,'جمع خرید':s.total,'میانگین خرید':s.avg,'آخرین مراجعه':s.last,'روز از آخرین مراجعه':s.daysSince,'محبوب':c.favorite,'رضایت پیام':c.consent?'بله':'خیر'}});
 const visits=db.customerVisits.map(v=>{const c=db.clubCustomers.find(x=>x.id===v.customerId);return {'تاریخ':v.date,'مشتری':c?.name,'موبایل':c?.phone,'مبلغ':v.amount,'سفارش':v.items,'کانال':v.channel,'امتیاز':v.points}});
 const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(customers),'مشتریان');XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(visits),'خریدها');XLSX.writeFile(wb,'باشگاه_مشتریان_هناس.xlsx')
}
function renderClubModule(){
 if(!$('clubMembersKpi'))return;
 if(!$('visitDate').value)$('visitDate').value=localISODate();
 $('cafeOpenTime').value=db.cafeStatus.openTime||'';$('cafePrepMinutes').value=db.cafeStatus.prepMinutes||10;$('cafeStatusMessage').value=db.cafeStatus.message||'';
 setCafeStatus(db.cafeStatus.status);
 $('cafePublicStatus').innerHTML='<h4>وضعیت قابل انتشار</h4><p>'+esc(cafeStatusText())+'</p>';
 const options=db.clubCustomers.map(c=>`<option value="${c.id}">${esc(c.name)} | ${esc(c.phone)}</option>`).join('');
 $('visitCustomer').innerHTML=options;$('preCustomer').innerHTML=options;
 const q=normHeader($('clubSearch').value||'');
 const customers=db.clubCustomers.filter(c=>!q||[c.name,c.phone,c.favorite,c.tag,c.note].some(v=>normHeader(v).includes(q)));
 $('clubCustomerCards').innerHTML=customers.length?customers.map(c=>{const s=clubCustomerStats(c.id),l=loyaltyLevel(c);return `<div class="club-card"><div class="club-card-head"><div><strong>${esc(c.name)}</strong><div class="customer-meta">${esc(c.phone)} | ${esc(c.favorite||'علاقه ثبت نشده')}</div></div><span class="chip ${l.cls}">${l.title}</span></div><div class="summary-strip"><span class="chip">امتیاز ${num(c.points||0)}</span><span class="chip">خرید ${num(s.count)}</span><span class="chip good">${money(s.total)}</span><span class="chip ${s.daysSince>=30?'bad':'good'}">${s.last?'آخرین '+num(s.daysSince)+' روز قبل':'بدون خرید'}</span></div><div class="customer-actions"><button class="btn" onclick="editClubCustomer(${c.id})">ویرایش</button><a class="btn" href="${smsLink(c.phone,'سلام '+c.name+'، از کافه هناس پیام می‌دهیم ☕')}">پیامک</a><a class="btn good" target="_blank" href="${whatsappLink(c.phone,'سلام '+c.name+'، از کافه هناس پیام می‌دهیم ☕')}">واتساپ</a><button class="btn danger" onclick="deleteClubCustomer(${c.id})">حذف</button></div></div>`}).join(''):'<div class="empty">مشتری ثبت نشده است.</div>';
 const active=db.clubCustomers.filter(c=>clubCustomerStats(c.id).daysSince<=30).length,inactive=db.clubCustomers.filter(c=>{const d=clubCustomerStats(c.id).daysSince;return d>=30&&d<9999}).length;
 $('clubMembersKpi').textContent=num(db.clubCustomers.length);$('activeCustomersKpi').textContent=num(active);$('inactiveCustomersKpi').textContent=num(inactive);$('openPreordersKpi').textContent=num(db.preorders.filter(p=>!['delivered','cancelled'].includes(p.status)).length);
 $('preorderList').innerHTML=db.preorders.length?db.preorders.slice().sort((a,b)=>a.pickupTime.localeCompare(b.pickupTime)).map(p=>`<div class="preorder-card"><div class="club-card-head"><div><strong>${esc(p.customerName)}</strong><div class="customer-meta">${esc(p.pickupTime.replace('T',' '))} | ${esc(p.phone)}</div></div><span class="chip ${p.status==='delivered'?'good':p.status==='cancelled'?'bad':'warn'}">${p.status==='new'?'جدید':p.status==='preparing'?'در حال آماده‌سازی':p.status==='ready'?'آماده':p.status==='delivered'?'تحویل شد':'لغو'}</span></div><p>${esc(p.items)} | ${money(p.amount||0)} | ${esc(p.payment)}</p><div class="customer-actions"><button class="btn" onclick="updatePreorder(${p.id},'preparing')">آماده‌سازی</button><button class="btn good" onclick="updatePreorder(${p.id},'ready')">آماده شد</button><button class="btn" onclick="updatePreorder(${p.id},'delivered')">تحویل</button><button class="btn danger" onclick="deletePreorder(${p.id})">حذف</button></div></div>`).join(''):'<div class="empty">پیش‌سفارشی ثبت نشده است.</div>';
 const insights=[];
 if(inactive)insights.push({level:'high',title:`${inactive} مشتری در معرض ریزش`,text:'برای مشتریانی که بیش از ۳۰ روز مراجعه نکرده‌اند، یک پیشنهاد کوچک و شخصی‌سازی‌شده ارسال کنید.',impact:'کمپین بازگشت مشتری'});
 const birthdays=db.clubCustomers.filter(c=>c.birthday&&c.birthday.slice(5)===localISODate().slice(5)).length;if(birthdays)insights.push({level:'low',title:`امروز تولد ${birthdays} عضو است`,text:'پیام تبریک و هدیه کم‌هزینه اما به‌یادماندنی ارسال کنید.',impact:'وفادارسازی'});
 const noFav=db.clubCustomers.filter(c=>!c.favorite).length;if(noFav)insights.push({level:'medium',title:`علاقه‌مندی ${noFav} مشتری ثبت نشده`,text:'در مراجعه بعدی نوشیدنی محبوب را ثبت کنید تا کمپین‌ها هدفمندتر شوند.',impact:'بهبود شخصی‌سازی'});
 const top=[...db.clubCustomers].sort((a,b)=>clubCustomerStats(b.id).total-clubCustomerStats(a.id).total).slice(0,3);if(top.length)insights.push({level:'low',title:'مشتریان باارزش',text:top.map(c=>c.name).join('، ')+' بیشترین ارزش خرید را دارند. برای آن‌ها تجربه VIP و پیش‌سفارش سریع فعال کنید.',impact:'حفظ مشتریان کلیدی'});
 insights.push({level:'medium',title:'ایده خلاقانه: سفارش همیشگی',text:'برای مشتری ثابت یک دکمه «همان سفارش همیشگی» بسازید تا با یک لمس زمان رسیدن را اعلام کند.',impact:'سرعت و تجربه بهتر'});
 insights.push({level:'medium',title:'ایده خلاقانه: ساعت خلوت',text:'در ساعاتی که فروش پایین است، فقط برای مشتریانی که معمولاً همان حوالی مراجعه می‌کنند پیشنهاد محدود بفرستید.',impact:'فروش بدون تخفیف عمومی'});
 $('clubInsights').innerHTML=insights.map(x=>`<div class="insight ${x.level}"><h4>${esc(x.title)}</h4><p>${x.text}</p><p class="impact">${x.impact}</p></div>`).join('');
 if(!$('campaignText').value)suggestCampaign()
}

// ================= Purchase & Weighted Average =================
function basePurchaseQty(qty,unit){
 qty=+qty||0;
 return (unit==='kg'||unit==='liter')?qty*1000:qty
}
function addPurchaseInvoice(){
 const ingredientId=+$('puIngredient').value,i=db.ingredients.find(x=>x.id===ingredientId);
 const qty=+$('puQty').value,price=cleanNumber($('puUnitPrice').value);
 if(!i||qty<=0||price<=0)return alert('ماده، مقدار و قیمت خرید را کامل کنید.');
 const baseQty=basePurchaseQty(qty,$('puQtyUnit').value);
 let gross;
 const pu=$('puPriceUnit').value;
 if(pu==='kg'||pu==='liter')gross=baseQty/1000*price;
 else if(pu==='count')gross=baseQty*price;
 else gross=price;
 const totalCost=Math.max(0,gross-cleanNumber($('puDiscount').value)+cleanNumber($('puExtraCost').value));
 db.purchaseInvoices.push({id:uid(),invoiceNo:$('puInvoiceNo').value.trim(),supplier:$('puSupplier').value.trim(),date:$('puDate').value||localISODate(),ingredientId,ingredientName:i.name,baseQty,totalCost,note:$('puNote').value.trim(),createdAt:new Date().toISOString()});
 db.inventory[ingredientId]=(+db.inventory[ingredientId]||0)+baseQty;
 ['puInvoiceNo','puSupplier','puQty','puUnitPrice','puNote'].forEach(id=>$(id).value='');
 $('puDiscount').value=0;$('puExtraCost').value=0;save()
}
function purchaseUnitCost(p){return p.baseQty?p.totalCost/p.baseQty:0}
function weightedInfo(id){
 const rows=db.purchaseInvoices.filter(p=>p.ingredientId===id);
 const qty=rows.reduce((s,p)=>s+p.baseQty,0),cost=rows.reduce((s,p)=>s+p.totalCost,0);
 const fallback=unitCost(db.ingredients.find(i=>i.id===id));
 const avg=qty?cost/qty:fallback,stock=+db.inventory[id]||0;
 const prices=rows.map(purchaseUnitCost).filter(Boolean);
 return{rows,qty,cost,avg,stock,value:stock*avg,last:prices.at(-1)||0,min:prices.length?Math.min(...prices):0,max:prices.length?Math.max(...prices):0}
}
function weightedIngredientUnitCost(id){return weightedInfo(id).avg}
function deletePurchaseInvoice(id){
 const p=db.purchaseInvoices.find(x=>x.id===id);if(!p||!confirm('فاکتور حذف شود؟'))return;
 db.inventory[p.ingredientId]=Math.max(0,(+db.inventory[p.ingredientId]||0)-p.baseQty);
 db.purchaseInvoices=db.purchaseInvoices.filter(x=>x.id!==id);save()
}
function clearPurchaseFilters(){['purchaseFilterDate','purchaseFilterSupplier','purchaseFilterInvoice'].forEach(id=>$(id).value='');$('purchaseFilterIngredient').value='';renderPurchasesModule()}
function renderPurchasesModule(){
 if(!$('inventoryValueKpi'))return;
 if(!$('puDate').value)$('puDate').value=localISODate();
 $('puIngredient').innerHTML=db.ingredients.map(i=>`<option value="${i.id}">${esc(i.name)} (${i.unit})</option>`).join('');
 $('purchaseFilterIngredient').innerHTML='<option value="">همه مواد</option>'+db.ingredients.map(i=>`<option value="${i.id}">${esc(i.name)}</option>`).join('');
 const infos=db.ingredients.map(i=>({i,x:weightedInfo(i.id)}));
 $('weightedInventoryTable').innerHTML='<tr><th>ماده</th><th>موجودی</th><th>میانگین موزون</th><th>ارزش موجودی</th><th>آخرین</th><th>کمترین/بیشترین</th></tr>'+infos.map(o=>`<tr><td>${esc(o.i.name)}</td><td>${num(o.x.stock)} ${o.i.unit}</td><td>${money(o.x.avg)}</td><td>${money(o.x.value)}</td><td>${money(o.x.last)}</td><td>${money(o.x.min)} / ${money(o.x.max)}</td></tr>`).join('');
 const month=localISODate().slice(0,7),mr=db.purchaseInvoices.filter(p=>p.date.startsWith(month));
 $('inventoryValueKpi').textContent=money(infos.reduce((s,o)=>s+o.x.value,0));
 $('monthPurchaseKpi').textContent=money(mr.reduce((s,p)=>s+p.totalCost,0));
 $('monthInvoiceCountKpi').textContent=num(mr.length);
 let top=null;
 db.ingredients.forEach(i=>{const ps=weightedInfo(i.id).rows.map(purchaseUnitCost);if(ps.length>1){const pct=(ps.at(-1)-ps.at(-2))/ps.at(-2)*100;if(!top||pct>top.pct)top={name:i.name,pct}}});
 $('maxPriceIncreaseKpi').textContent=top?`${top.name} ${num(top.pct)}٪`:'-';
 const mf=$('purchaseFilterDate').value,ig=+$('purchaseFilterIngredient').value,sf=normHeader($('purchaseFilterSupplier').value),nf=normHeader($('purchaseFilterInvoice').value);
 const rows=db.purchaseInvoices.filter(p=>(!mf||p.date.startsWith(mf))&&(!ig||p.ingredientId===ig)&&(!sf||normHeader(p.supplier).includes(sf))&&(!nf||normHeader(p.invoiceNo).includes(nf))).sort((a,b)=>(b.date+b.createdAt).localeCompare(a.date+a.createdAt));
 $('purchasesTable').innerHTML='<tr><th>تاریخ</th><th>فاکتور</th><th>تأمین‌کننده</th><th>ماده</th><th>مقدار</th><th>هزینه کل</th><th>قیمت واحد پایه</th><th></th></tr>'+rows.map(p=>{const i=db.ingredients.find(x=>x.id===p.ingredientId);return `<tr><td>${p.date}</td><td>${esc(p.invoiceNo||'-')}</td><td>${esc(p.supplier||'-')}</td><td>${esc(p.ingredientName)}</td><td>${num(p.baseQty)} ${i?.unit||''}</td><td>${money(p.totalCost)}</td><td>${money(purchaseUnitCost(p))}</td><td><button class="btn danger" onclick="deletePurchaseInvoice(${p.id})">حذف</button></td></tr>`}).join('');
 const ins=[];
 db.ingredients.forEach(i=>{const x=weightedInfo(i.id),ps=x.rows.map(purchaseUnitCost);if(ps.length>1){const pct=(ps.at(-1)-ps.at(-2))/ps.at(-2)*100;if(Math.abs(pct)>=5)ins.push(`<div class="insight ${pct>0?'high':'low'}"><h4>${esc(i.name)}</h4><p>آخرین قیمت نسبت به فاکتور قبلی ${pct>0?'افزایش':'کاهش'} داشته است.</p><p class="impact">${num(Math.abs(pct))}٪</p></div>`)}});
 $('purchaseInsights').innerHTML=ins.join('')||'<div class="empty">حداقل دو فاکتور برای یک ماده ثبت کنید.</div>';
 const impacts=[];
 db.recipes.forEach(r=>{const old=r.ingredients.reduce((s,x)=>s+unitCost(db.ingredients.find(i=>i.id===x.ingredientId))*x.qty,0),nw=r.ingredients.reduce((s,x)=>s+weightedInfo(x.ingredientId).avg*x.qty,0);if(Math.abs(nw-old)>=100)impacts.push({name:r.name,old,nw,d:nw-old})});
 $('recipeCostImpact').innerHTML=impacts.sort((a,b)=>Math.abs(b.d)-Math.abs(a.d)).slice(0,10).map(x=>`<div class="insight ${x.d>0?'high':'low'}"><h4>${esc(x.name)}</h4><p>بهای قبلی ${money(x.old)} → بهای جدید ${money(x.nw)}</p><p class="impact">${x.d>0?'+':''}${money(x.d)}</p></div>`).join('')||'<div class="empty">اثری ثبت نشده است.</div>'
}
function exportPurchasesExcel(){
 if(typeof XLSX==='undefined')return alert('کتابخانه Excel بارگذاری نشده است.');
 const rows=db.purchaseInvoices.map(p=>({'تاریخ':p.date,'شماره فاکتور':p.invoiceNo,'تأمین‌کننده':p.supplier,'ماده':p.ingredientName,'مقدار پایه':p.baseQty,'هزینه کل':p.totalCost,'قیمت واحد پایه':purchaseUnitCost(p),'توضیحات':p.note}));
 const inv=db.ingredients.map(i=>{const x=weightedInfo(i.id);return {'ماده':i.name,'واحد':i.unit,'موجودی':x.stock,'میانگین موزون':x.avg,'ارزش موجودی':x.value,'آخرین قیمت':x.last,'کمترین':x.min,'بیشترین':x.max}});
 const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),'فاکتورها');XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(inv),'موجودی');XLSX.writeFile(wb,'خرید_و_میانگین_موزون_هناس.xlsx')
}

// ================= Personnel / Manager Panels =================
function minutesBetween(start,end){
 if(!start||!end)return 0;
 const [sh,sm]=start.split(':').map(Number),[eh,em]=end.split(':').map(Number);
 let a=sh*60+sm,b=eh*60+em;if(b<a)b+=1440;return b-a
}
function attendanceCalc(a,emp){
 const raw=Math.max(0,minutesBetween(a.inTime,a.outTime)-(+a.breakMinutes||0));
 const standard=(+emp.dailyHours||8)*60;
 return{rawMinutes:raw,workedHours:raw/60,overtimeMinutes:Math.max(0,raw-standard),shortageMinutes:Math.max(0,standard-raw)}
}
function fillRoleGate(){
 if(!$('gateEmployee'))return;
 $('gateEmployee').innerHTML=db.employees.filter(e=>e.active!==false).map(e=>`<option value="${e.id}">${esc(e.name)} - ${esc(e.role||'')}</option>`).join('');
 if(activeRole){$('roleGate').classList.add('hidden');applyRoleUI()}
}
function enterPersonnelPanel(){
 const id=+$('gateEmployee').value,pin=$('gateEmployeePin').value;
 const emp=db.employees.find(e=>e.id===id&&String(e.pin)===String(pin));
 if(!emp)return alert('نام یا PIN پرسنل صحیح نیست.');
 activeRole='personnel';activeEmployeeId=id;sessionStorage.setItem('henasRole',activeRole);sessionStorage.setItem('henasEmployeeId',id);
 $('roleGate').classList.add('hidden');showPage('staff');applyRoleUI();renderStaffModule()
}
function enterManagerPanel(){
 if(String($('gateManagerPin').value)!==String(db.appSecurity.managerPin))return alert('PIN مدیر صحیح نیست.');
 activeRole='manager';activeEmployeeId=0;sessionStorage.setItem('henasRole',activeRole);sessionStorage.removeItem('henasEmployeeId');
 $('roleGate').classList.add('hidden');showPage('staff');applyRoleUI();renderStaffModule()
}
function logoutRole(){sessionStorage.removeItem('henasRole');sessionStorage.removeItem('henasEmployeeId');activeRole='';activeEmployeeId=0;$('roleGate').classList.remove('hidden');fillRoleGate()}
function applyRoleUI(){
 if(!$('personnelPanel'))return;
 const isManager=activeRole==='manager';
 $('personnelPanel').style.display=isManager?'none':'block';
 $('managerPanel').style.display=isManager?'block':'none';
 $('staffPanelTitle').textContent=isManager?'پنل مدیر':'پنل پرسنل';
 const emp=db.employees.find(e=>e.id===activeEmployeeId);
 $('staffPanelSubtitle').textContent=isManager?'تأیید کارکرد، تارگت و محاسبه حقوق':`${emp?.name||''} | ${emp?.role||''}`;
 document.querySelectorAll('.tab,.bottom-nav button').forEach(btn=>{
  const page=pages.find(p=>p[1]===btn.textContent)?.[0];
  if(activeRole==='personnel'&&page&&page!=='staff'&&page!=='assistant'&&page!=='recipes')btn.style.display='none';
  else btn.style.display=''
 })
}
function addEmployee(){
 const name=$('empName').value.trim(),pin=$('empPin').value.trim();
 if(!name||!pin)return alert('نام و PIN را وارد کنید.');
 db.employees.push({id:uid(),name,role:$('empRole').value.trim(),pin,baseSalary:cleanNumber($('empBaseSalary').value),overtimeRate:cleanNumber($('empOvertimeRate').value)||62500,dailyTarget:cleanNumber($('empTarget').value)||4250000,targetBonus:cleanNumber($('empTargetBonus').value)||200000,dailyHours:+$('empDailyHours').value||8,active:true});
 ['empName','empRole','empPin','empBaseSalary'].forEach(id=>$(id).value='');save()
}
function toggleEmployee(id){const e=db.employees.find(x=>x.id===id);if(e)e.active=e.active===false?true:false;save()}
function submitAttendance(){
 const emp=db.employees.find(e=>e.id===activeEmployeeId);if(!emp)return;
 const date=$('aDate').value||localISODate(),inTime=$('aIn').value,outTime=$('aOut').value;
 if(!inTime||!outTime)return alert('ساعت ورود و خروج را وارد کنید.');
 if(minutesBetween(inTime,outTime)<=0)return alert('ساعت خروج باید بعد از ورود باشد.');
 const exists=db.attendance.find(a=>a.employeeId===emp.id&&a.date===date&&a.status!=='rejected');
 if(exists&&!confirm('برای این تاریخ قبلاً رکورد ثبت شده است. رکورد جدید ارسال شود؟'))return;
 db.attendance.push({id:uid(),employeeId:emp.id,employeeName:emp.name,date,shift:$('aShift').value,inTime,outTime,breakMinutes:+$('aBreak').value||0,sales:cleanNumber($('aSales').value),note:$('aNote').value.trim(),status:'pending',submittedAt:new Date().toISOString(),approvedAt:null,managerNote:''});
 ['aIn','aOut','aSales','aNote'].forEach(id=>$(id).value='');$('aBreak').value=0;save()
}
function approveAttendance(id,approved){
 const a=db.attendance.find(x=>x.id===id);if(!a)return;
 a.status=approved?'approved':'rejected';a.approvedAt=new Date().toISOString();a.managerNote=approved?'تأیید مدیر':prompt('دلیل رد یا توضیح مدیر:','')||'رد مدیر';save()
}
function approveAllPending(){db.attendance.filter(a=>a.status==='pending').forEach(a=>{a.status='approved';a.approvedAt=new Date().toISOString();a.managerNote='تأیید گروهی مدیر'});save()}
function deleteAttendance(id){if(confirm('رکورد حذف شود؟')){db.attendance=db.attendance.filter(x=>x.id!==id);save()}}
function submitCorrection(){
 const id=+$('correctionAttendance').value,reason=$('correctionReason').value.trim();
 if(!id||!reason)return alert('رکورد و دلیل اصلاح را انتخاب کنید.');
 const a=db.attendance.find(x=>x.id===id);if(!a)return;
 db.correctionRequests.push({id:uid(),attendanceId:id,employeeId:a.employeeId,employeeName:a.employeeName,oldIn:a.inTime,oldOut:a.outTime,newIn:$('correctionIn').value||a.inTime,newOut:$('correctionOut').value||a.outTime,reason,status:'pending',createdAt:new Date().toISOString()});
 $('correctionReason').value='';save()
}
function resolveCorrection(id,approve){
 const r=db.correctionRequests.find(x=>x.id===id);if(!r)return;
 r.status=approve?'approved':'rejected';r.resolvedAt=new Date().toISOString();
 if(approve){const a=db.attendance.find(x=>x.id===r.attendanceId);if(a){a.inTime=r.newIn;a.outTime=r.newOut;a.status='approved';a.managerNote='اصلاح تأییدشده مدیر'}}
 save()
}
function renderStaffModule(){
 if(!$('staffPanelTitle'))return;
 setFinancialDefaults();
 if(!$('aDate').value)$('aDate').value=localISODate();
 if(!$('payrollMonth').value)$('payrollMonth').value=localISODate().slice(0,7);
 applyRoleUI();
 const emp=db.employees.find(e=>e.id===activeEmployeeId);

 if(emp){
  const mine=db.attendance.filter(a=>a.employeeId===emp.id).sort((a,b)=>b.date.localeCompare(a.date));
  const approved=mine.filter(a=>a.status==='approved');
  const calcs=approved.map(a=>attendanceCalc(a,emp));
  $('empApprovedHours').textContent=num(calcs.reduce((s,x)=>s+x.workedHours,0))+' ساعت';
  $('empOvertime').textContent=num(calcs.reduce((s,x)=>s+x.overtimeMinutes,0)/60)+' ساعت';
  $('empTargetDays').textContent=num(approved.filter(a=>(+a.sales||0)>=emp.dailyTarget).length);
  const last=mine[0];$('empLastStatus').textContent=last?(last.status==='approved'?'تأییدشده':last.status==='rejected'?'ردشده':'در انتظار'):'-';
  $('myAttendanceTable').innerHTML='<tr><th>تاریخ</th><th>ورود</th><th>خروج</th><th>کارکرد</th><th>فروش</th><th>وضعیت</th></tr>'+
   mine.map(a=>{const c=attendanceCalc(a,emp);return `<tr><td>${a.date}</td><td>${a.inTime}</td><td>${a.outTime}</td><td>${num(c.workedHours)} ساعت</td><td>${money(a.sales||0)}</td><td><span class="staff-chip ${a.status}">${a.status==='approved'?'تأیید':a.status==='rejected'?'رد':'در انتظار'}</span></td></tr>`}).join('');
  $('correctionAttendance').innerHTML=mine.map(a=>`<option value="${a.id}">${a.date} | ${a.inTime}-${a.outTime}</option>`).join('')
 }

 const pending=db.attendance.filter(a=>a.status==='pending');
 const approvedAll=db.attendance.filter(a=>a.status==='approved');
 let totalApprovedMinutes=0,totalOver=0,totalBonus=0;
 approvedAll.forEach(a=>{const e=db.employees.find(x=>x.id===a.employeeId);if(!e)return;const c=attendanceCalc(a,e);totalApprovedMinutes+=c.rawMinutes;totalOver+=c.overtimeMinutes;if((+a.sales||0)>=e.dailyTarget)totalBonus+=e.targetBonus});
 $('mgrPending').textContent=num(pending.length);$('mgrApprovedHours').textContent=num(totalApprovedMinutes/60)+' ساعت';$('mgrOvertime').textContent=num(totalOver/60)+' ساعت';$('mgrTargetBonus').textContent=money(totalBonus);

 $('employeeCards').innerHTML=db.employees.map(e=>`<div class="customer-card"><div class="customer-head"><div><strong>${esc(e.name)}</strong><div class="customer-meta">${esc(e.role||'')} | تارگت ${money(e.dailyTarget)} | اضافه‌کاری ${money(e.overtimeRate)}</div></div><span class="staff-chip ${e.active===false?'rejected':'approved'}">${e.active===false?'غیرفعال':'فعال'}</span></div><div class="actions"><button class="btn" onclick="toggleEmployee(${e.id})">${e.active===false?'فعال‌سازی':'غیرفعال‌کردن'}</button></div></div>`).join('');
 $('managerAttendanceTable').innerHTML='<tr><th>پرسنل</th><th>تاریخ</th><th>ورود/خروج</th><th>کارکرد</th><th>فروش/تارگت</th><th>وضعیت</th><th>اقدام</th></tr>'+
 db.attendance.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(a=>{const e=db.employees.find(x=>x.id===a.employeeId)||{};const c=attendanceCalc(a,e);return `<tr><td>${esc(a.employeeName)}</td><td>${a.date}</td><td>${a.inTime} - ${a.outTime}<br>استراحت ${num(a.breakMinutes)} دقیقه</td><td>${num(c.workedHours)} ساعت<br>اضافه ${num(c.overtimeMinutes/60)} | کسری ${num(c.shortageMinutes/60)}</td><td>${money(a.sales||0)}<br>${(+a.sales||0)>=e.dailyTarget?'<span class="staff-chip approved">تارگت محقق</span>':'<span class="staff-chip pending">زیر تارگت</span>'}</td><td><span class="staff-chip ${a.status}">${a.status==='approved'?'تأیید':a.status==='rejected'?'رد':'در انتظار'}</span></td><td>${a.status==='pending'?`<button class="btn good" onclick="approveAttendance(${a.id},true)">تأیید</button> <button class="btn danger" onclick="approveAttendance(${a.id},false)">رد</button>`:`<button class="btn danger" onclick="deleteAttendance(${a.id})">حذف</button>`}</td></tr>`}).join('');
 $('payrollEmployee').innerHTML=db.employees.map(e=>`<option value="${e.id}">${esc(e.name)}</option>`).join('');
 $('correctionRequests').innerHTML=db.correctionRequests.length?db.correctionRequests.slice().reverse().map(r=>`<div class="request-card"><strong>${esc(r.employeeName)}</strong> | ${r.oldIn}-${r.oldOut} ← ${r.newIn}-${r.newOut}<br><span style="color:#aaa">${esc(r.reason)}</span><div class="actions">${r.status==='pending'?`<button class="btn good" onclick="resolveCorrection(${r.id},true)">تأیید اصلاح</button><button class="btn danger" onclick="resolveCorrection(${r.id},false)">رد</button>`:`<span class="staff-chip ${r.status}">${r.status==='approved'?'تأییدشده':'ردشده'}</span>`}</div></div>`).join(''):'<div class="empty">درخواستی ثبت نشده است.</div>';
 renderPayroll()
}
function renderPayroll(){
 if(!$('payrollOutput'))return;
 const emp=db.employees.find(e=>e.id===+$('payrollEmployee').value)||db.employees[0];if(!emp){$('payrollOutput').innerHTML='<div class="empty">پرسنلی تعریف نشده است.</div>';return}
 const month=$('payrollMonth').value||localISODate().slice(0,7);
 const rows=db.attendance.filter(a=>a.employeeId===emp.id&&a.status==='approved'&&a.date.startsWith(month));
 let worked=0,overtime=0,shortage=0,targetDays=0;
 rows.forEach(a=>{const c=attendanceCalc(a,emp);worked+=c.rawMinutes;overtime+=c.overtimeMinutes;shortage+=c.shortageMinutes;if((+a.sales||0)>=emp.dailyTarget)targetDays++});
 const overtimePay=overtime/60*emp.overtimeRate,targetPay=targetDays*emp.targetBonus,benefits=cleanNumber($('payrollBenefits').value),deductions=cleanNumber($('payrollDeductions').value);
 const hourlyBase=(emp.baseSalary||0)/(30*(emp.dailyHours||8)),shortageDeduction=shortage/60*hourlyBase;
 const net=(emp.baseSalary||0)+overtimePay+targetPay+benefits-deductions-shortageDeduction;
 $('payrollOutput').innerHTML=`<div class="section-title"><div><h2 style="margin:0">فیش کارکرد ${esc(emp.name)}</h2><div style="color:#aaa">ماه ${month} | ${esc(emp.role||'')}</div></div><strong>${money(net)}</strong></div>
 <div class="salary-grid">
  <div class="salary-box"><small>روز حضور تأییدشده</small><strong>${num(rows.length)}</strong></div>
  <div class="salary-box"><small>مجموع کارکرد</small><strong>${num(worked/60)} ساعت</strong></div>
  <div class="salary-box"><small>اضافه‌کاری</small><strong>${num(overtime/60)} ساعت</strong></div>
  <div class="salary-box"><small>کسری کار</small><strong>${num(shortage/60)} ساعت</strong></div>
  <div class="salary-box"><small>روزهای تارگت</small><strong>${num(targetDays)}</strong></div>
  <div class="salary-box"><small>مبلغ اضافه‌کاری</small><strong>${money(overtimePay)}</strong></div>
  <div class="salary-box"><small>پاداش تارگت</small><strong>${money(targetPay)}</strong></div>
  <div class="salary-box"><small>کسر کارکرد</small><strong>${money(shortageDeduction)}</strong></div>
  <div class="salary-box"><small>حقوق ثابت</small><strong>${money(emp.baseSalary||0)}</strong></div>
  <div class="salary-box"><small>مزایا</small><strong>${money(benefits)}</strong></div>
  <div class="salary-box"><small>کسورات/مساعده</small><strong>${money(deductions)}</strong></div>
  <div class="salary-box"><small>خالص قابل پرداخت</small><strong class="${net>=0?'goodText':'badText'}">${money(net)}</strong></div>
 </div>
 <div class="table-wrap" style="margin-top:14px"><table><tr><th>تاریخ</th><th>ورود</th><th>خروج</th><th>کارکرد</th><th>اضافه</th><th>کسری</th><th>فروش</th><th>پاداش</th></tr>${rows.map(a=>{const c=attendanceCalc(a,emp);return `<tr><td>${a.date}</td><td>${a.inTime}</td><td>${a.outTime}</td><td>${num(c.workedHours)}</td><td>${num(c.overtimeMinutes/60)}</td><td>${num(c.shortageMinutes/60)}</td><td>${money(a.sales||0)}</td><td>${(+a.sales||0)>=emp.dailyTarget?money(emp.targetBonus):'-'}</td></tr>`}).join('')}</table></div>`
}
function printPayroll(){showPage('staff');setTimeout(()=>window.print(),100)}

// ======================= Customer Ledgers & Off-POS Payments =======================
function localISODate(d=new Date()){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`}
function localTime(d=new Date()){return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`}
function setFinancialDefaults(){
 const date=localISODate(),time=localTime();
 ['lDate','pDate'].forEach(id=>{const el=$(id);if(el&&!el.value)el.value=date});
 ['lTime','pTime'].forEach(id=>{const el=$(id);if(el&&!el.value)el.value=time});
}
function customerKey(name){return normHeader(name||'')}
function upsertCustomer(name,phone=''){
 const n=String(name||'').trim();if(!n)return null;
 let c=db.customers.find(x=>customerKey(x.name)===customerKey(n));
 if(!c){c={id:uid(),name:n,phone:String(phone||'').trim(),createdAt:new Date().toISOString()};db.customers.push(c)}
 else if(phone&&!c.phone)c.phone=String(phone).trim();
 return c
}
function addLedgerEntry(){
 const customer=$('lCustomer').value.trim(),amount=cleanNumber($('lAmount').value),type=$('lType').value;
 if(!customer||amount<=0)return alert('نام مشتری و مبلغ را وارد کنید.');
 const c=upsertCustomer(customer,$('lPhone').value);
 db.ledgerEntries.push({
   id:uid(),customerId:c.id,customerName:c.name,phone:c.phone,type,amount,
   date:$('lDate').value||localISODate(),time:$('lTime').value||localTime(),
   shift:$('lShift').value,responsible:$('lResponsible').value.trim(),
   method:$('lMethod').value,tracking:$('lTracking').value.trim(),note:$('lNote').value.trim(),
   includeInSales:type==='debit'&&$('lIncludeSales').checked,createdAt:new Date().toISOString()
 });
 ['lAmount','lTracking','lNote'].forEach(id=>$(id).value='');
 save()
}
function addOffPosPayment(){
 const amount=cleanNumber($('pAmount').value),method=$('pMethod').value,customer=$('pCustomer').value.trim();
 if(amount<=0)return alert('مبلغ دریافت را وارد کنید.');
 let c=customer?upsertCustomer(customer,$('pPhone').value):null;
 const payment={
   id:uid(),method,amount,customerId:c?.id||null,customerName:c?.name||customer,phone:c?.phone||$('pPhone').value.trim(),
   date:$('pDate').value||localISODate(),time:$('pTime').value||localTime(),shift:$('pShift').value,
   responsible:$('pResponsible').value.trim(),tracking:$('pTracking').value.trim(),
   destination:$('pDestination').value.trim(),note:$('pNote').value.trim(),
   includeInSales:$('pIncludeSales').checked,settledLedger:$('pSettleLedger').checked,createdAt:new Date().toISOString()
 };
 db.offPosPayments.push(payment);
 if(payment.settledLedger){
   if(!customer)return alert('برای کم‌کردن از حساب دفتری، نام مشتری را وارد کنید.');
   db.ledgerEntries.push({
     id:uid(),customerId:c.id,customerName:c.name,phone:c.phone,type:'credit',amount,
     date:payment.date,time:payment.time,shift:payment.shift,responsible:payment.responsible,
     method:payment.method,tracking:payment.tracking,note:`تسویه از طریق دریافت خارج پوز${payment.note?' - '+payment.note:''}`,
     includeInSales:false,paymentId:payment.id,createdAt:new Date().toISOString()
   })
 }
 ['pAmount','pTracking','pDestination','pNote'].forEach(id=>$(id).value='');
 save()
}
function ledgerBalances(){
 const map={};
 db.customers.forEach(c=>map[c.id]={customerId:c.id,name:c.name,phone:c.phone||'',debit:0,credit:0,balance:0,lastDate:''});
 db.ledgerEntries.forEach(e=>{
   const id=e.customerId||customerKey(e.customerName);
   map[id]=map[id]||{customerId:id,name:e.customerName||'بدون نام',phone:e.phone||'',debit:0,credit:0,balance:0,lastDate:''};
   if(e.type==='debit')map[id].debit+=+e.amount||0;else map[id].credit+=+e.amount||0;
   map[id].balance=map[id].debit-map[id].credit;
   if((e.date||'')+(e.time||'')>(map[id].lastDate||''))map[id].lastDate=(e.date||'')+' '+(e.time||'')
 });
 return Object.values(map).sort((a,b)=>b.balance-a.balance)
}
function accountTotals(){
 const balances=ledgerBalances(),today=localISODate();
 const todays=db.offPosPayments.filter(p=>p.date===today);
 return{
  receivable:balances.reduce((s,x)=>s+Math.max(0,x.balance),0),
  customerCredit:balances.reduce((s,x)=>s+Math.max(0,-x.balance),0),
  todayOffPos:todays.reduce((s,x)=>s+(+x.amount||0),0),
  todayCash:todays.filter(x=>x.method==='نقدی').reduce((s,x)=>s+(+x.amount||0),0),
  todayTransfer:todays.filter(x=>x.method==='کارت به کارت'||x.method==='واریز بانکی').reduce((s,x)=>s+(+x.amount||0),0)
 }
}
function fillLedgerCustomer(name){
 $('lCustomer').value=name;$('lType').value='credit';$('lMethod').value='کارت به کارت';$('lCustomer').scrollIntoView({behavior:'smooth',block:'center'})
}
function deleteLedgerEntry(id){if(confirm('این گردش حساب حذف شود؟')){db.ledgerEntries=db.ledgerEntries.filter(x=>x.id!==id);save()}}
function deleteOffPosPayment(id){
 if(!confirm('این دریافت حذف شود؟'))return;
 db.offPosPayments=db.offPosPayments.filter(x=>x.id!==id);
 db.ledgerEntries=db.ledgerEntries.filter(x=>x.paymentId!==id);
 save()
}
function clearLedgerFilters(){['ledgerFilterCustomer','ledgerFilterDate'].forEach(id=>$(id).value='');$('ledgerFilterType').value='';$('ledgerFilterShift').value='';renderAccountsModule()}
function clearPaymentFilters(){['paymentFilterDate','paymentFilterResponsible'].forEach(id=>$(id).value='');$('paymentFilterMethod').value='';$('paymentFilterShift').value='';renderAccountsModule()}
function renderAccountsModule(){
 if(!$('ledgerReceivable'))return;
 setFinancialDefaults();
 const totals=accountTotals();
 $('ledgerReceivable').textContent=money(totals.receivable);
 $('todayOffPos').textContent=money(totals.todayOffPos);
 $('todayCash').textContent=money(totals.todayCash);
 $('todayTransfer').textContent=money(totals.todayTransfer);

 const balances=ledgerBalances(),q=normHeader($('customerSearch').value||'');
 const shown=balances.filter(x=>!q||normHeader(x.name).includes(q)||normHeader(x.phone).includes(q));
 $('customerBalances').innerHTML=shown.length?shown.map(x=>`<div class="customer-card">
   <div class="customer-head"><div><strong>${esc(x.name)}</strong><div class="customer-meta">${esc(x.phone||'شماره تماس ثبت نشده')} | آخرین گردش: ${esc(x.lastDate||'-')}</div></div>
   <div class="account-balance ${x.balance>0?'debt':'credit'}">${x.balance>0?'بدهکار: ':x.balance<0?'بستانکار: ':'تسویه: '}${money(Math.abs(x.balance))}</div></div>
   <div class="actions"><button class="btn" onclick="fillLedgerCustomer('${String(x.name).replace(/'/g,"\\'")}')">ثبت تسویه</button></div>
 </div>`).join(''):'<div class="empty">مشتری یا مانده‌ای ثبت نشده است.</div>';
 $('customerNames').innerHTML=db.customers.map(c=>`<option value="${esc(c.name)}">${esc(c.phone||'')}</option>`).join('');

 const cf=normHeader($('ledgerFilterCustomer').value||''),df=$('ledgerFilterDate').value,tf=$('ledgerFilterType').value,sf=$('ledgerFilterShift').value;
 const ledger=[...db.ledgerEntries].filter(e=>(!cf||normHeader(e.customerName).includes(cf))&&(!df||e.date===df)&&(!tf||e.type===tf)&&(!sf||e.shift===sf)).sort((a,b)=>((b.date||'')+(b.time||'')).localeCompare((a.date||'')+(a.time||'')));
 $('ledgerTable').innerHTML='<tr><th>تاریخ</th><th>ساعت</th><th>مشتری</th><th>نوع</th><th>مبلغ</th><th>شیفت/مسئول</th><th>روش/پیگیری</th><th>توضیحات</th><th></th></tr>'+
 ledger.map(e=>`<tr><td>${esc(e.date)}</td><td>${esc(e.time)}</td><td>${esc(e.customerName)}</td><td><span class="chip ${e.type==='debit'?'bad':'good'}">${e.type==='debit'?'بدهکار':'بستانکار/تسویه'}</span></td><td>${money(e.amount)}</td><td>${esc(e.shift||'-')} / ${esc(e.responsible||'-')}</td><td>${esc(e.method||'-')} ${e.tracking?'<br>'+esc(e.tracking):''}</td><td>${esc(e.note||'')}</td><td><button class="btn danger" onclick="deleteLedgerEntry(${e.id})">حذف</button></td></tr>`).join('');

 const pd=$('paymentFilterDate').value,pm=$('paymentFilterMethod').value,ps=$('paymentFilterShift').value,pr=normHeader($('paymentFilterResponsible').value||'');
 const payments=[...db.offPosPayments].filter(p=>(!pd||p.date===pd)&&(!pm||p.method===pm)&&(!ps||p.shift===ps)&&(!pr||normHeader(p.responsible).includes(pr))).sort((a,b)=>((b.date||'')+(b.time||'')).localeCompare((a.date||'')+(a.time||'')));
 const pTotal=payments.reduce((s,x)=>s+(+x.amount||0),0),cash=payments.filter(x=>x.method==='نقدی').reduce((s,x)=>s+(+x.amount||0),0),transfer=payments.filter(x=>x.method==='کارت به کارت'||x.method==='واریز بانکی').reduce((s,x)=>s+(+x.amount||0),0);
 $('paymentSummary').innerHTML=`<span class="chip">تعداد: ${num(payments.length)}</span><span class="chip good">جمع: ${money(pTotal)}</span><span class="chip">نقدی: ${money(cash)}</span><span class="chip">انتقال بانکی: ${money(transfer)}</span>`;
 $('paymentsTable').innerHTML='<tr><th>تاریخ</th><th>ساعت</th><th>نوع پرداخت</th><th>مبلغ</th><th>پرداخت‌کننده</th><th>شیفت/مسئول</th><th>پیگیری/مقصد</th><th>توضیحات</th><th></th></tr>'+
 payments.map(p=>`<tr><td>${esc(p.date)}</td><td>${esc(p.time)}</td><td><span class="chip ${p.method==='نقدی'?'warn':'good'}">${esc(p.method)}</span></td><td>${money(p.amount)}</td><td>${esc(p.customerName||'-')}</td><td>${esc(p.shift||'-')} / ${esc(p.responsible||'-')}</td><td>${esc(p.tracking||'-')}<br>${esc(p.destination||'')}</td><td>${esc(p.note||'')}${p.settledLedger?'<br><span class="chip good">تسویه حساب دفتری</span>':''}</td><td><button class="btn danger" onclick="deleteOffPosPayment(${p.id})">حذف</button></td></tr>`).join('')
}
function exportAccountsExcel(){
 if(typeof XLSX==='undefined')return alert('کتابخانه Excel بارگذاری نشده است.');
 const balances=ledgerBalances().map(x=>({'نام مشتری':x.name,'شماره تماس':x.phone,'جمع بدهکار':x.debit,'جمع بستانکار/تسویه':x.credit,'مانده':x.balance,'آخرین گردش':x.lastDate}));
 const ledger=db.ledgerEntries.map(e=>({'تاریخ':e.date,'ساعت':e.time,'نام مشتری':e.customerName,'شماره تماس':e.phone,'نوع':e.type==='debit'?'بدهکار':'بستانکار/تسویه','مبلغ':e.amount,'شیفت':e.shift,'مسئول':e.responsible,'روش پرداخت':e.method,'شماره پیگیری':e.tracking,'توضیحات':e.note}));
 const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(balances),'مانده مشتریان');XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(ledger),'گردش حساب');XLSX.writeFile(wb,'گزارش_حسابهای_دفتری_هناس.xlsx')
}
function exportPaymentsExcel(){
 if(typeof XLSX==='undefined')return alert('کتابخانه Excel بارگذاری نشده است.');
 const rows=db.offPosPayments.map(p=>({'تاریخ':p.date,'ساعت':p.time,'نوع پرداخت':p.method,'مبلغ':p.amount,'نام پرداخت‌کننده':p.customerName,'شماره تماس':p.phone,'شیفت':p.shift,'مسئول':p.responsible,'شماره پیگیری':p.tracking,'حساب مقصد':p.destination,'توضیحات':p.note,'تسویه حساب دفتری':p.settledLedger?'بله':'خیر','ثبت در فروش':p.includeInSales?'بله':'خیر'}));
 const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),'دریافت خارج پوز');XLSX.writeFile(wb,'گزارش_دریافتهای_خارج_پوز_هناس.xlsx')
}
function printAccountsReport(){showPage('accounts');setTimeout(()=>window.print(),100)}

// ======================= Bulk Word / Excel Import =======================
const importState={logs:[],preview:[]};
function faToEnDigits(v){return String(v??'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d))}
function cleanNumber(v){if(typeof v==='number')return v;const s=faToEnDigits(v).replace(/[٬,\s]/g,'').replace(/تومان|ریال/gi,'');const n=Number(s);return Number.isFinite(n)?n:0}
function normHeader(v){return faToEnDigits(v).toLowerCase().replace(/[\s_\-–—()（）:：]/g,'').replace(/ي/g,'ی').replace(/ك/g,'ک')}
function pick(row,names){const map={};Object.keys(row||{}).forEach(k=>map[normHeader(k)]=row[k]);for(const n of names){const key=normHeader(n);if(map[key]!==undefined&&map[key]!==null&&map[key]!=='')return map[key]}return ''}
function addLog(type,title,detail){importState.logs.unshift({type,title,detail,time:new Date().toLocaleTimeString('fa-IR')});renderImportLog()}
function clearImportLog(){importState.logs=[];importState.preview=[];renderImportLog()}
function renderImportLog(){const el=$('importSummary');if(!el)return;el.innerHTML=importState.logs.length?importState.logs.map(x=>`<div class="log-row"><span class="chip ${x.type==='error'?'bad':x.type==='warn'?'warn':'good'}">${x.type==='error'?'خطا':x.type==='warn'?'هشدار':'موفق'}</span> <strong>${esc(x.title)}</strong><div style="color:#aaa;font-size:12px">${esc(x.detail||'')} — ${x.time}</div></div>`).join(''):'<div class="empty">هنوز فایلی وارد نشده است.</div>';const p=$('importPreview');if(p)p.innerHTML=importState.preview.length?`<table><tr>${Object.keys(importState.preview[0]).map(k=>`<th>${esc(k)}</th>`).join('')}</tr>${importState.preview.slice(0,8).map(r=>`<tr>${Object.keys(importState.preview[0]).map(k=>`<td>${esc(r[k])}</td>`).join('')}</tr>`).join('')}</table>`:''}
function setupDropZone(id,inputId,handler){const zone=$(id);if(!zone)return;['dragenter','dragover'].forEach(e=>zone.addEventListener(e,ev=>{ev.preventDefault();zone.classList.add('drag')}));['dragleave','drop'].forEach(e=>zone.addEventListener(e,ev=>{ev.preventDefault();zone.classList.remove('drag')}));zone.addEventListener('drop',ev=>handler(ev.dataTransfer.files))}

async function importWordFiles(files){if(!files?.length)return;if(typeof mammoth==='undefined'){addLog('error','کتابخانه Word بارگذاری نشده','اتصال اینترنت را بررسی و صفحه را دوباره باز کنید.');return}for(const file of [...files]){try{const buffer=await file.arrayBuffer();const result=await mammoth.convertToHtml({arrayBuffer:buffer});const imported=parseWordRecipes(result.value,file.name);addLog(imported.count?'success':'warn',file.name,`${imported.count} رسپی و ${imported.ingredients} ماده جدید استخراج شد.${imported.warnings.length?' '+imported.warnings.join(' | '):''}`)}catch(e){addLog('error',file.name,e.message||'خواندن فایل Word ناموفق بود.')}}save()}
function wordBlocksFromHtml(html){const doc=new DOMParser().parseFromString(html,'text/html');const blocks=[];let current=null;const children=[...doc.body.children];children.forEach(el=>{const tag=el.tagName.toLowerCase(),text=el.textContent.trim();if(!text)return;if(/^h[1-4]$/.test(tag)){if(current)blocks.push(current);current={title:text,lines:[]}}else{if(!current)current={title:'',lines:[]};if(tag==='table'){[...el.querySelectorAll('tr')].forEach(tr=>current.lines.push([...tr.querySelectorAll('th,td')].map(x=>x.textContent.trim()).filter(Boolean).join(' | ')))}else if(tag==='ul'||tag==='ol'){[...el.querySelectorAll('li')].forEach(li=>current.lines.push(li.textContent.trim()))}else current.lines.push(text)}});if(current)blocks.push(current);return blocks}
function parseIngredientLine(line){let s=faToEnDigits(line).replace(/^[•\-–—*\d.\)]+\s*/,'').trim();const m=s.match(/([0-9]+(?:\.[0-9]+)?)\s*(گرم|g|میلی\s*لیتر|میلی‌لیتر|ml|عدد|پیمانه|شات|قاشق)\s+(.+)/i)||s.match(/(.+?)\s*[:|]\s*([0-9]+(?:\.[0-9]+)?)\s*(گرم|g|میلی\s*لیتر|میلی‌لیتر|ml|عدد|پیمانه|شات|قاشق)/i);if(!m)return null;let qty,unit,name;if(/^\d/.test(m[1])){qty=cleanNumber(m[1]);unit=m[2];name=m[3]}else{name=m[1];qty=cleanNumber(m[2]);unit=m[3]}unit=unit.toLowerCase();if(unit==='g')unit='گرم';if(unit==='ml'||unit.includes('میلی'))unit='میلی‌لیتر';if(['پیمانه','شات','قاشق'].includes(unit))unit='عدد';return{name:name.trim(),qty,unit}}
function parseWordRecipes(html,fileName){const blocks=wordBlocksFromHtml(html);let count=0,newIngs=0;const warnings=[];blocks.forEach((b,idx)=>{const lines=b.lines.map(x=>x.trim()).filter(Boolean);let name=b.title.trim();if(!name){const first=lines.find(x=>/^(نام|عنوان)\s*(محصول|رسپی)?\s*[:：]/.test(x));if(first)name=first.split(/[:：]/).slice(1).join(':').trim()}if(!name&&blocks.length===1)name=fileName.replace(/\.docx$/i,'');if(!name)return;const meta={category:'',cup:'',time:'',temp:'',allergens:'',price:0,salesQty:0};let mode='';const ingredientLines=[],steps=[];lines.forEach(line=>{const n=normHeader(line);const val=line.split(/[:：]/).slice(1).join(':').trim();if(/^(مواداولیه|موادلازم|ترکیبات)/.test(n)){mode='ingredients';return}if(/^(مراحلتهیه|روش تهیه|دستورتهیه|طرزتهیه)/.test(line.replace(/[:：]/g,'').trim())){mode='steps';return}if(/^دسته/.test(line)){meta.category=val;return}if(/^(لیوان|سایز|حجم)/.test(line)){meta.cup=val;return}if(/^زمان/.test(line)){meta.time=val;return}if(/^(دما|درجه)/.test(line)){meta.temp=val;return}if(/^(آلرژن|حساسیت)/.test(line)){meta.allergens=val;return}if(/^(قیمتفروش|قیمت)/.test(n)){meta.price=cleanNumber(val);return}if(/^(تعدادفروش|فروشماهانه)/.test(n)){meta.salesQty=cleanNumber(val);return}const ing=parseIngredientLine(line);if(mode==='ingredients'||ing){if(ing)ingredientLines.push(ing);else if(mode==='ingredients'&&line.length<80)ingredientLines.push(null);return}if(mode==='steps'||/^\d+[.\-)]/.test(faToEnDigits(line)))steps.push(line.replace(/^[\d۰-۹]+[.\-)]\s*/,''))});const valid=ingredientLines.filter(Boolean);if(!valid.length){warnings.push(`برای «${name}» ماده قابل تشخیص نبود`);return}const ingredients=[];valid.forEach(x=>{let ing=db.ingredients.find(i=>normHeader(i.name)===normHeader(x.name));if(!ing&&$('wordAutoIngredients')?.checked){ing={id:uid(),name:x.name,price:0,pack:1,unit:x.unit};db.ingredients.push(ing);db.inventory[ing.id]=0;newIngs++}if(ing)ingredients.push({ingredientId:ing.id,qty:x.qty})});if(!ingredients.length)return;const recipe={id:uid(),name,category:meta.category||'نامشخص',cup:meta.cup,time:meta.time,temp:meta.temp,allergens:meta.allergens,price:meta.price,salesQty:meta.salesQty,ingredients,steps:steps.length?steps:['مراحل تهیه از فایل Word استخراج نشد؛ نیازمند بازبینی است.']};const existing=db.recipes.findIndex(r=>normHeader(r.name)===normHeader(name));if(existing>=0&&$('wordReplace')?.checked)db.recipes[existing]=recipe;else if(existing<0)db.recipes.push(recipe);else warnings.push(`«${name}» از قبل وجود داشت`);count++});return{count,ingredients:newIngs,warnings}}

async function importExcelFiles(files){
 if(!files?.length)return;
 if(typeof XLSX==='undefined'){addLog('error','کتابخانه Excel بارگذاری نشده','اتصال اینترنت را بررسی و صفحه را دوباره باز کنید.');return}
 importExcelFiles.cleared=new Set();
 for(const file of [...files]){
  try{
   const data=await file.arrayBuffer();
   const wb=XLSX.read(data,{type:'array',cellDates:true});
   let totals={ingredients:0,recipes:0,sales:0,expenses:0,inventory:0,wastes:0,posMatched:0,posCreated:0,posUnmatched:0};
   for(const sheetName of wb.SheetNames){
    const sheet=wb.Sheets[sheetName];
    const matrix=XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',raw:false});
    if(!matrix.length)continue;
    if(isPosMatrix(sheetName,matrix)){
      const result=importPosMatrix(matrix);
      totals.sales+=result.imported;
      totals.posMatched+=result.matched;
      totals.posCreated+=result.created;
      totals.posUnmatched+=result.unmatched;
      importState.preview=matrix.slice(0,10).map(r=>({'نام محصول':r[0],'تعداد':r[1],'قیمت واحد':r[2],'مبلغ کل':r[3]}));
      continue;
    }
    const rows=XLSX.utils.sheet_to_json(sheet,{defval:'',raw:false});
    if(!rows.length)continue;
    const kind=detectSheetKind(sheetName,rows[0]);
    const n=importSheetRows(kind,rows);
    if(kind)totals[kind]+=n;
    importState.preview=rows.slice(0,10);
   }
   const posText=(totals.posMatched||totals.posCreated||totals.posUnmatched)?` | پوز: ${totals.posMatched} تطبیق، ${totals.posCreated} محصول جدید، ${totals.posUnmatched} ردیف نامعتبر`:'';
   addLog('success',file.name,`مواد: ${totals.ingredients} | رسپی: ${totals.recipes} | فروش: ${totals.sales} | هزینه: ${totals.expenses} | موجودی: ${totals.inventory} | پرت: ${totals.wastes}${posText}`)
  }catch(e){addLog('error',file.name,e.message||'خواندن Excel ناموفق بود.')}
 }
 save()
}
function canonicalProductName(v){
 let s=normHeader(v).replace(/٪/g,'').replace(/درصد/g,'');
 s=s.replace(/۷۰۳۰|7030/g,'70/30').replace(/۵۰۵۰|5050/g,'50/50');
 s=s.replace(/کافهلاته/g,'لاته').replace(/کافهالتّه/g,'لاته').replace(/آیسالتّه/g,'آیسلاته');
 s=s.replace(/اسپرسودبل/g,'اسپرسو').replace(/کلاسیک|کالسیک/g,'');
 return s;
}
function tokenSimilarity(a,b){
 const aa=canonicalProductName(a),bb=canonicalProductName(b);
 if(aa===bb)return 100;
 if(aa.includes(bb)||bb.includes(aa))return 85;
 const ta=new Set(aa.split(/[^\p{L}\p{N}/]+/u).filter(Boolean)),tb=new Set(bb.split(/[^\p{L}\p{N}/]+/u).filter(Boolean));
 let inter=0;ta.forEach(x=>{if(tb.has(x))inter++});
 return inter/Math.max(ta.size,tb.size,1)*70;
}
function findRecipeForPos(name){
 let best=null,score=0;
 db.recipes.forEach(r=>{const s=tokenSimilarity(name,r.name);if(s>score){score=s;best=r}});
 return score>=55?best:null;
}
function isPosMatrix(sheetName,matrix){
 const n=normHeader(sheetName);
 if(/پوز|pos|فروش دستگاه|صندوق/.test(n))return true;
 const rows=matrix.filter(r=>r&&r.some(x=>x!==''));
 if(!rows.length)return false;
 const sample=rows.slice(0,Math.min(5,rows.length));
 return sample.filter(r=>typeof r[0]==='string'&&cleanNumber(r[1])>0&&cleanNumber(r[2])>0).length>=Math.min(3,sample.length);
}
function importPosMatrix(matrix){
 let imported=0,matched=0,created=0,unmatched=0;
 const inRial=$('posPriceInRial')?.checked!==false;
 const rows=matrix.filter(r=>r&&r.some(x=>x!==''));
 rows.forEach((r,idx)=>{
   const name=String(r[0]??'').trim(),qty=cleanNumber(r[1]),unitRaw=cleanNumber(r[2]),totalRaw=cleanNumber(r[3]);
   if(!name||qty<=0){unmatched++;return}
   let unitPrice=unitRaw;
   if(!unitPrice&&totalRaw&&qty)unitPrice=totalRaw/qty;
   if(inRial)unitPrice=unitPrice/10;
   let rec=findRecipeForPos(name);
   if(rec){matched++}
   else{
     rec={id:uid(),name,category:'خروجی پوز',cup:'',time:'',temp:'',allergens:'',price:unitPrice||0,salesQty:0,ingredients:[],steps:['رسپی این محصول هنوز وارد نشده است؛ فقط اطلاعات فروش از دستگاه پوز ثبت شده است.']};
     db.recipes.push(rec);created++
   }
   rec.salesQty=qty;
   if(unitPrice>0)rec.price=unitPrice;
   rec.posSource=true;
   rec.posTotal=inRial?totalRaw/10:totalRaw;
   imported++
 });
 return{imported,matched,created,unmatched}
}
function detectSheetKind(name,row){const n=normHeader(name),heads=Object.keys(row).map(normHeader).join('|');if(/مواد|ingredient/.test(n)||/قیمتبسته.*مقداربسته/.test(heads))return'ingredients';if(/رسپی|recipe|دستور/.test(n)||/ناممحصول.*ماده.*مقدار/.test(heads))return'recipes';if(/فروش|sales/.test(n)||/ناممحصول.*تعدادفروش/.test(heads))return'sales';if(/هزینه|expense/.test(n)||/عنوانهزینه.*مبلغ/.test(heads))return'expenses';if(/موجودی|inventory|انبار/.test(n)||/نامماده.*موجودی/.test(heads))return'inventory';if(/پرت|ضایعات|waste/.test(n)||/نامماده.*مقدارپرت/.test(heads))return'wastes';return null}
function maybeClear(kind){if(!$('excelReplace')?.checked)return;if(importExcelFiles.cleared?.has(kind))return;importExcelFiles.cleared=importExcelFiles.cleared||new Set();importExcelFiles.cleared.add(kind);if(kind==='ingredients'){db.ingredients=[];db.inventory={}}if(kind==='recipes'||kind==='sales')db.recipes=[];if(kind==='expenses')db.expenses=[];if(kind==='wastes')db.wastes=[]}
function getOrCreateIngredient(name,unit='گرم'){if(!name)return null;let i=db.ingredients.find(x=>normHeader(x.name)===normHeader(name));if(!i){i={id:uid(),name:String(name).trim(),price:0,pack:1,unit:unit||'گرم'};db.ingredients.push(i);db.inventory[i.id]=0}return i}
function importSheetRows(kind,rows){if(!kind)return 0;maybeClear(kind);let count=0;if(kind==='ingredients')rows.forEach(r=>{const name=pick(r,['نام ماده','ماده','ingredient']);if(!name)return;const old=db.ingredients.find(x=>normHeader(x.name)===normHeader(name));const obj={id:old?.id||uid(),name:String(name).trim(),price:cleanNumber(pick(r,['قیمت بسته','قیمت خرید','price'])),pack:cleanNumber(pick(r,['مقدار بسته','وزن بسته','حجم بسته','pack']))||1,unit:String(pick(r,['واحد','unit'])||'گرم').trim()};if(old)Object.assign(old,obj);else db.ingredients.push(obj);if(db.inventory[obj.id]==null)db.inventory[obj.id]=0;count++});
if(kind==='recipes'){const groups={};rows.forEach(r=>{const name=pick(r,['نام محصول','محصول','نام رسپی','recipe']);if(!name)return;const key=normHeader(name);groups[key]=groups[key]||{name:String(name).trim(),rows:[]};groups[key].rows.push(r)});Object.values(groups).forEach(g=>{const first=g.rows[0],ings=[];g.rows.forEach(r=>{const iname=pick(r,['ماده','نام ماده','مواد اولیه','ingredient']),qty=cleanNumber(pick(r,['مقدار','مقدار مصرف','qty'])),unit=pick(r,['واحد','unit'])||'گرم';if(iname&&qty){const ing=getOrCreateIngredient(iname,unit);ings.push({ingredientId:ing.id,qty})}});if(!ings.length)return;const steps=String(pick(first,['مراحل','مراحل تهیه','طرز تهیه','دستورالعمل'])||'').split(/\n|\||؛/).map(x=>x.trim()).filter(Boolean);const obj={id:uid(),name:g.name,category:String(pick(first,['دسته','category'])||'نامشخص'),cup:String(pick(first,['لیوان','سایز','cup'])||''),time:String(pick(first,['زمان','زمان استاندارد'])||''),temp:String(pick(first,['دما','درجه'])||''),allergens:String(pick(first,['آلرژن','حساسیت'])||''),price:cleanNumber(pick(first,['قیمت فروش','قیمت'])),salesQty:cleanNumber(pick(first,['تعداد فروش','فروش ماهانه'])),ingredients:ings,steps:steps.length?steps:['مراحل تهیه ثبت نشده است.']};const ix=db.recipes.findIndex(x=>normHeader(x.name)===normHeader(g.name));if(ix>=0)db.recipes[ix]=obj;else db.recipes.push(obj);count++})}
if(kind==='sales')rows.forEach(r=>{const name=pick(r,['نام محصول','محصول','item']);if(!name)return;let rec=db.recipes.find(x=>normHeader(x.name)===normHeader(name));if(!rec){rec={id:uid(),name:String(name).trim(),category:'نامشخص',cup:'',time:'',temp:'',allergens:'',price:0,salesQty:0,ingredients:[],steps:['رسپی این محصول هنوز وارد نشده است.']};db.recipes.push(rec)}rec.salesQty=cleanNumber(pick(r,['تعداد فروش','تعداد','qty','quantity']));const price=cleanNumber(pick(r,['قیمت فروش','قیمت واحد','price']));if(price)rec.price=price;count++});
if(kind==='expenses')rows.forEach(r=>{const name=pick(r,['عنوان هزینه','هزینه','شرح','title']),amount=cleanNumber(pick(r,['مبلغ','amount']));if(!name||!amount)return;db.expenses.push({id:uid(),name:String(name).trim(),amount,type:String(pick(r,['نوع','type'])||'متغیر')});count++});
if(kind==='inventory')rows.forEach(r=>{const name=pick(r,['نام ماده','ماده','ingredient']),stock=cleanNumber(pick(r,['موجودی فعلی','موجودی','stock']));if(!name)return;const ing=getOrCreateIngredient(name,pick(r,['واحد','unit'])||'گرم');db.inventory[ing.id]=stock;count++});
if(kind==='wastes')rows.forEach(r=>{const name=pick(r,['نام ماده','ماده','ingredient']),qty=cleanNumber(pick(r,['مقدار پرت','پرت','qty']));if(!name||!qty)return;const ing=getOrCreateIngredient(name,pick(r,['واحد','unit'])||'گرم');db.wastes.push({id:uid(),ingredientId:ing.id,qty,note:String(pick(r,['توضیح','شرح','note'])||'')});count++});return count}
function downloadExcelTemplate(ev){ev?.stopPropagation();if(typeof XLSX==='undefined')return alert('کتابخانه Excel هنوز بارگذاری نشده است.');const wb=XLSX.utils.book_new();const sheets={
 'مواد اولیه':[['نام ماده','قیمت بسته','مقدار بسته','واحد'],['دانه قهوه فول',2000000,1000,'گرم'],['شیر',65000,1000,'میلی‌لیتر']],
 'رسپی‌ها':[['نام محصول','دسته','لیوان','زمان','دما','آلرژن','ماده','مقدار','واحد','مراحل','قیمت فروش','تعداد فروش'],['لاته وانیل','گرم','۳۵۰ میلی‌لیتر','۲ دقیقه','۶۰ تا ۶۵ درجه','لبنیات','دانه قهوه فول',18,'گرم','عصاره‌گیری|بخاردهی شیر|ترکیب و سرو',90000,120],['لاته وانیل','گرم','۳۵۰ میلی‌لیتر','۲ دقیقه','۶۰ تا ۶۵ درجه','لبنیات','شیر',220,'میلی‌لیتر','',90000,120]],
 'فروش':[['نام محصول','تعداد فروش','قیمت فروش'],['لاته وانیل',120,90000]],
 'هزینه‌ها':[['عنوان هزینه','مبلغ','نوع'],['اجاره',30000000,'ثابت'],['حقوق',50000000,'ثابت']],
 'موجودی':[['نام ماده','موجودی فعلی','واحد'],['دانه قهوه فول',5000,'گرم']],
 'پرت':[['نام ماده','مقدار پرت','واحد','توضیح'],['شیر',2500,'میلی‌لیتر','شیر دورریز ماهانه']]
};Object.entries(sheets).forEach(([name,data])=>XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(data),name));XLSX.writeFile(wb,'قالب_ورود_اطلاعات_کافه_هناس.xlsx')}


let deferredPrompt;window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("installBtn").hidden=false});$("installBtn").onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();deferredPrompt=null;$("installBtn").hidden=true}};
if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js"));
initNav();renderAll();initCloud();setTimeout(()=>{setupDropZone('wordDrop','wordFiles',importWordFiles);setupDropZone('excelDrop','excelFiles',importExcelFiles);renderImportLog()},0);