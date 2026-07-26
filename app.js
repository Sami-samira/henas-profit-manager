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
let recipeDraft=[];
let lastBotAnswer="";
const pages=[["dashboard","داشبورد"],["assistant","باریستا AI"],["recipes","رسپی‌ها"],["ingredients","مواد"],["operations","عملیات"],["analysis","تحلیل"]];
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
 const expenses=db.expenses.reduce((s,e)=>s+e.amount,0);
 const waste=db.wastes.reduce((s,w)=>s+unitCost(db.ingredients.find(i=>i.id===w.ingredientId))*w.qty,0);
 const net=gross-expenses-waste,margin=sales?net/sales*100:0,variableRate=sales?material/sales:0;
 const fixed=db.expenses.filter(e=>e.type==="ثابت").reduce((s,e)=>s+e.amount,0);
 const breakEven=variableRate<1?fixed/(1-variableRate):0;
 return{sales,material,gross,expenses,waste,net,margin,variableRate,fixed,breakEven};
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
function renderAll(){const m=metrics();renderTables();renderRecipeRows();renderRecipeCards();renderChat();renderAnalysis(m);renderDashboard(m)}
let deferredPrompt;window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("installBtn").hidden=false});$("installBtn").onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();deferredPrompt=null;$("installBtn").hidden=true}};
if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js"));
initNav();renderAll();