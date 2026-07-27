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
let recipeDraft=[];
let lastBotAnswer="";
const pages=[["dashboard","داشبورد"],["assistant","باریستا AI"],["recipes","رسپی‌ها"],["ingredients","مواد"],["operations","عملیات"],["accounts","حساب‌ها"],["import","ورود فایل"],["analysis","تحلیل"]];
const $=id=>document.getElementById(id);
function money(n){return Math.round(Number(n)||0).toLocaleString("fa-IR")+" تومان"}
function num(n){return (Number(n)||0).toLocaleString("fa-IR",{maximumFractionDigits:1})}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function save(){localStorage.setItem(KEY,JSON.stringify(db));renderAll()}
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

function recipeCost(r){return r.ingredients.reduce((s,x)=>s+unitCost(db.ingredients.find(i=>i.id===x.ingredientId))*x.qty,0)}
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
function renderAll(){const m=metrics();renderTables();renderRecipeRows();renderRecipeCards();renderChat();renderAnalysis(m);renderDashboard(m);renderAccountsModule()}



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
initNav();renderAll();setTimeout(()=>{setupDropZone('wordDrop','wordFiles',importWordFiles);setupDropZone('excelDrop','excelFiles',importExcelFiles);renderImportLog()},0);