const KEY="henas-v3";
let db=JSON.parse(localStorage.getItem(KEY)||"null")||{ingredients:[],products:[],expenses:[],wastes:[],settings:{targetProfit:50000000,workDays:30,targetMargin:25}};
let recipe=[];
const pages=[["dashboard","داشبورد"],["ingredients","مواد"],["products","رسپی"],["expenses","هزینه/پرت"],["analysis","تحلیل"]];
const $=id=>document.getElementById(id);
function money(n){return Math.round(Number(n)||0).toLocaleString("fa-IR")+" تومان"}
function num(n){return (Number(n)||0).toLocaleString("fa-IR",{maximumFractionDigits:1})}
function save(){localStorage.setItem(KEY,JSON.stringify(db));render()}
function nav(){
 $("tabs").innerHTML=pages.map((p,i)=>`<button class="tab ${i?"":"active"}" onclick="show('${p[0]}')">${p[1]}</button>`).join("");
 $("bottom").innerHTML=pages.map((p,i)=>`<button class="${i?"":"active"}" onclick="show('${p[0]}')">${p[1]}</button>`).join("");
}
function show(name){
 document.querySelectorAll(".page").forEach(x=>x.classList.toggle("active",x.dataset.page===name));
 document.querySelectorAll(".tab,.bottom button").forEach(x=>x.classList.remove("active"));
 [...document.querySelectorAll(".tab,.bottom button")].filter(x=>x.textContent===pages.find(p=>p[0]===name)[1]).forEach(x=>x.classList.add("active"));
 scrollTo(0,0);
}
function addIngredient(){
 let n=$("ingName").value.trim(),price=+$("ingPrice").value,pack=+$("ingPack").value,unit=$("ingUnit").value;
 if(!n||price<=0||pack<=0)return alert("اطلاعات ماده را کامل کن.");
 db.ingredients.push({id:Date.now(),name:n,price,pack,unit});$("ingName").value=$("ingPrice").value=$("ingPack").value="";save();
}
function uc(i){return i.price/i.pack}
function addRecipeRow(){if(!db.ingredients.length)return alert("اول ماده اولیه ثبت کن.");recipe.push({ingredientId:db.ingredients[0].id,qty:0});renderRecipe()}
function renderRecipe(){
 $("recipeRows").innerHTML=recipe.map((r,i)=>`<div class="form" style="margin-bottom:8px">
 <div><select onchange="recipe[${i}].ingredientId=+this.value">${db.ingredients.map(x=>`<option value="${x.id}" ${x.id===r.ingredientId?"selected":""}>${x.name}</option>`).join("")}</select></div>
 <div><input type="number" placeholder="مقدار" oninput="recipe[${i}].qty=+this.value" value="${r.qty||""}"></div>
 <div><button class="btn danger" onclick="recipe.splice(${i},1);renderRecipe()">حذف</button></div></div>`).join("");
}
function cost(p){return p.recipe.reduce((s,r)=>{let i=db.ingredients.find(x=>x.id===r.ingredientId);return s+(i?uc(i)*r.qty:0)},0)+(p.packCost||0)}
function addProduct(){
 let name=$("pName").value.trim(),price=+$("pPrice").value,qty=+$("pQty").value,packCost=+$("pPackCost").value||0;
 if(!name||price<=0||!recipe.length||recipe.some(r=>r.qty<=0))return alert("اطلاعات محصول و رسپی را کامل کن.");
 db.products.push({id:Date.now(),name,price,qty,packCost,recipe:JSON.parse(JSON.stringify(recipe))});recipe=[];$("pName").value=$("pPrice").value=$("pQty").value="";$("pPackCost").value=0;renderRecipe();save();
}
function addExpense(){let name=$("eName").value.trim(),amount=+$("eAmount").value,type=$("eType").value;if(!name||amount<=0)return;db.expenses.push({id:Date.now(),name,amount,type});$("eName").value=$("eAmount").value="";save()}
function addWaste(){let ingredientId=+$("wIngredient").value,qty=+$("wQty").value,note=$("wNote").value;if(!ingredientId||qty<=0)return;db.wastes.push({id:Date.now(),ingredientId,qty,note});$("wQty").value=$("wNote").value="";save()}
function del(type,id){db[type]=db[type].filter(x=>x.id!==id);save()}
function metrics(){
 let sales=0,gross=0,mat=0;db.products.forEach(p=>{let c=cost(p);sales+=p.price*p.qty;mat+=c*p.qty;gross+=(p.price-c)*p.qty});
 let expenses=db.expenses.reduce((s,e)=>s+e.amount,0);
 let waste=db.wastes.reduce((s,w)=>{let i=db.ingredients.find(x=>x.id===w.ingredientId);return s+(i?uc(i)*w.qty:0)},0);
 let net=gross-expenses-waste,margin=sales?net/sales*100:0,vr=sales?mat/sales:0;
 return{sales,gross,expenses,waste,net,margin,vr};
}
function insights(m){
 let a=[];
 if(!db.products.length)a.push(["high","داده کافی نیست","اول مواد اولیه و رسپی محصولات را ثبت کن.","شروع تحلیل"]);
 db.products.forEach(p=>{let c=cost(p),mar=p.price?(p.price-c)/p.price*100:0,sp=c/.45;
 if(mar<35)a.push(["high",`قیمت ${p.name} را اصلاح کن`,`حاشیه سود این محصول فقط ${num(mar)}٪ است. قیمت پیشنهادی اولیه ${money(sp)} است.`,`اثر ماهانه بالقوه: ${money(Math.max(0,(sp-p.price)*p.qty))}`]);
 else if(mar>=55)a.push(["low",`${p.name} سودساز است`,"این محصول را بیشتر پیشنهاد بده و در منو برجسته کن.",`سود هر سرو: ${money(p.price-c)}`]);
 });
 if(m.margin<15&&m.sales>0)a.push(["high","فروش بالا، سود پایین","هزینه‌های ثابت و محصولات پرفروش کم‌سود را فوراً بررسی کن.",`حاشیه سود فعلی: ${num(m.margin)}٪`]);
 if(m.waste>m.sales*.03&&m.sales>0)a.push(["medium","پرت زیاد است","پرت بیش از ۳٪ فروش شده است.",`ارزش پرت: ${money(m.waste)}`]);
 let gap=db.settings.targetProfit-m.net,con=1-m.vr,extra=gap>0&&con>0?gap/con:0;
 if(extra>0)a.push(["medium","برنامه رسیدن به هدف",`برای رسیدن به سود هدف، حدود ${money(extra)} فروش بیشتر یا کاهش هزینه معادل آن لازم است.`,`روزانه: ${money(extra/db.settings.workDays)}`]);
 return a.slice(0,7);
}
function saveGoals(){db.settings.targetProfit=+$("targetProfit").value;db.settings.workDays=+$("workDays").value||30;db.settings.targetMargin=+$("targetMargin").value||25;save()}
function backup(){let b=new Blob([JSON.stringify(db,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="henas-backup.json";a.click()}
function render(){
 let m=metrics();
 $("salesKpi").textContent=money(m.sales);$("grossKpi").textContent=money(m.gross);$("netKpi").textContent=money(m.net);$("marginKpi").textContent=num(m.margin)+"٪";
 $("netKpi").className=m.net>=0?"goodText":"badText";$("marginKpi").className=m.margin>=25?"goodText":m.margin>=15?"warnText":"badText";
 $("targetProfit").value=db.settings.targetProfit;$("workDays").value=db.settings.workDays;$("targetMargin").value=db.settings.targetMargin;
 let gap=db.settings.targetProfit-m.net,con=1-m.vr,extra=gap>0&&con>0?gap/con:0;$("extraSales").textContent=money(extra);$("extraDaily").textContent=money(extra/db.settings.workDays);
 $("insights").innerHTML=insights(m).map(x=>`<div class="insight ${x[0]}"><strong>${x[1]}</strong><div>${x[2]}</div><div>${x[3]}</div></div>`).join("");
 $("ingredientsTable").innerHTML="<tr><th>ماده</th><th>بسته</th><th>هزینه واحد</th><th></th></tr>"+db.ingredients.map(i=>`<tr><td>${i.name}</td><td>${money(i.price)} / ${num(i.pack)} ${i.unit}</td><td>${money(uc(i))}</td><td><button class="btn danger" onclick="del('ingredients',${i.id})">حذف</button></td></tr>`).join("");
 $("wIngredient").innerHTML=db.ingredients.map(i=>`<option value="${i.id}">${i.name}</option>`).join("");
 $("productsTable").innerHTML="<tr><th>محصول</th><th>هزینه ساخت</th><th>قیمت</th><th>سود واحد</th><th></th></tr>"+db.products.map(p=>`<tr><td>${p.name}</td><td>${money(cost(p))}</td><td>${money(p.price)}</td><td>${money(p.price-cost(p))}</td><td><button class="btn danger" onclick="del('products',${p.id})">حذف</button></td></tr>`).join("");
 $("expensesTable").innerHTML="<tr><th>هزینه</th><th>مبلغ</th><th>نوع</th><th></th></tr>"+db.expenses.map(e=>`<tr><td>${e.name}</td><td>${money(e.amount)}</td><td>${e.type}</td><td><button class="btn danger" onclick="del('expenses',${e.id})">حذف</button></td></tr>`).join("");
 $("wasteTable").innerHTML="<tr><th>ماده</th><th>مقدار</th><th>ارزش</th><th></th></tr>"+db.wastes.map(w=>{let i=db.ingredients.find(x=>x.id===w.ingredientId);return `<tr><td>${i?.name||"-"}</td><td>${num(w.qty)}</td><td>${money(i?uc(i)*w.qty:0)}</td><td><button class="btn danger" onclick="del('wastes',${w.id})">حذف</button></td></tr>`}).join("");
 let avg=db.products.length?m.sales/db.products.length:0;
 $("analysisTable").innerHTML="<tr><th>محصول</th><th>فروش</th><th>حاشیه</th><th>دسته</th><th>تصمیم</th></tr>"+db.products.map(p=>{let c=cost(p),sales=p.price*p.qty,mar=p.price?(p.price-c)/p.price*100:0,cat,cls,act;if(sales>=avg&&mar>=45){cat="ستاره";cls="good";act="تبلیغ بیشتر"}else if(sales>=avg&&mar<35){cat="پرفروش کم‌سود";cls="bad";act="افزایش قیمت"}else if(sales<avg&&mar>=45){cat="سودساز پنهان";cls="warn";act="فروش مکمل"}else{cat="ضعیف";cls="bad";act="بازطراحی یا حذف"}return `<tr><td>${p.name}</td><td>${money(sales)}</td><td>${num(mar)}٪</td><td><span class="chip ${cls}">${cat}</span></td><td>${act}</td></tr>`}).join("");
}
let deferredPrompt;window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("installBtn").hidden=false});$("installBtn").onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();deferredPrompt=null;$("installBtn").hidden=true}};
if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js"));
nav();render();
