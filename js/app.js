(function(){
const $=id=>document.getElementById(id), HAS=typeof L!=='undefined';
window.addEventListener('error',e=>{const s=$('stale');if(s&&e.message){s.classList.remove('hide');$('staleMsg').textContent='صار خطأ بالصفحة: '+e.message+' — جرّب Ctrl+F5، وإذا تكرر صوّر هذي الرسالة.'}});
if(!window.VideoEncoder||!window.VideoFrame)$('nosup').classList.remove('hide');
let map,marker,circ,countriesLayer=null,labels=[],pickLbl=false,selected=new Set(),parsed=null,parsedKey='',cancelled=false;
const mode=()=>document.querySelector('input[name=mode]:checked').value;
if(HAS){map=L.map('map',{worldCopyJump:true}).setView([33.2625,44.2346],8);
 L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap'}).addTo(map);
 marker=L.marker([33.2625,44.2346]).addTo(map);circ=L.circle([33.2625,44.2346],{radius:10.5*1852,color:'#f2c97a',weight:2,fillOpacity:.06}).addTo(map);
 map.on('click',e=>{if(pickLbl){addLblAt(e.latlng);return}
  if(mode()==='airport'){$('lat').value=e.latlng.lat.toFixed(4);$('lon').value=e.latlng.lng.toFixed(4);syncAirport()}});}
else $('map').innerHTML='<p style="padding:20px;color:#ffe9a8">تعذّر تحميل الخريطة. أدخل الإحداثيات يدوياً أو اختر الدول من القائمة.</p>';
function addLblAt(ll){labels.push({name:'',lat:+ll.lat.toFixed(4),lon:+ll.lng.toFixed(4),side:mode()==='airport'?'w':'e'});pickLbl=false;$('lblHint').textContent='';if(HAS)map.getContainer().style.cursor='';renderLbls(true)}
function syncAirport(){const la=+$('lat').value,lo=+$('lon').value,r=+$('rad').value;if(HAS){marker.setLatLng([la,lo]);circ.setLatLng([la,lo]).setRadius(r*1852)}$('rv').textContent=r}
['lat','lon','rad'].forEach(i=>$(i).addEventListener('input',syncAirport));
function renderLbls(focus){const w=$('lbls');w.innerHTML='';labels.forEach((l,i)=>{const d=document.createElement('div');d.className='l';
 d.innerHTML=`<input type=text placeholder="الاسم" value="${l.name.replace(/"/g,'&quot;')}"><input type=number step=0.0001 value="${l.lat}"><input type=number step=0.0001 value="${l.lon}"><select><option value=e ${l.side=='e'?'selected':''}>النص يمين النقطة</option><option value=w ${l.side=='w'?'selected':''}>النص يسار النقطة</option></select><button type=button>✕</button>`;
 const [n,a,o,s,x]=d.children;n.oninput=()=>l.name=n.value;a.oninput=()=>l.lat=+a.value;o.oninput=()=>l.lon=+o.value;s.onchange=()=>l.side=s.value;x.onclick=()=>{labels.splice(i,1);renderLbls()};w.appendChild(d);if(focus&&i==labels.length-1)n.focus()})}
labels.push({name:'بغداد',lat:33.31,lon:44.40,side:'w'});renderLbls();
$('addLbl').onclick=()=>{pickLbl=true;if(HAS)map.getContainer().style.cursor='crosshair';$('lblHint').textContent=HAS?'اضغط على الخريطة لتحديد موقع المدينة…':'الخريطة غير متاحة، أدخل الإحداثيات يدوياً بعد إضافة صف.';if(!HAS){labels.push({name:'',lat:0,lon:0,side:'e'});pickLbl=false;renderLbls(true)}};
document.querySelectorAll('input[name=mode]').forEach(r=>r.onchange=()=>{const a=mode()==='airport';$('airportOpts').classList.toggle('hide',!a);$('countryOpts').classList.toggle('hide',a);
 if(HAS){marker.setOpacity(a?1:0);a?circ.addTo(map):circ.remove();if(countriesLayer)a?countriesLayer.remove():countriesLayer.addTo(map);if(a)map.setView(marker.getLatLng(),8);else if(map.getZoom()>5)map.setZoom(5)}});
const C=window.RASEED_LITE;
function chips(){$('chips').innerHTML=[...selected].map(n=>`<span class=chip>${(C.find(c=>c.name==n)||{}).name_ar||n}</span>`).join('')||'<span class=hint>لا شي مختار بعد</span>'}
function listC(){const q=($('csearch').value||'').trim().toLowerCase();$('clist').innerHTML=C.filter(c=>!q||c.name.toLowerCase().includes(q)||c.name_ar.includes(q)).slice(0,60).map(c=>`<button type=button class="chip" data-n="${c.name}" style="cursor:pointer;${selected.has(c.name)?'background:#f2c97a;color:#101826':''}">${c.name_ar}</button>`).join('')}
$('clist').addEventListener('click',e=>{const n=e.target.dataset&&e.target.dataset.n;if(!n)return;selected.has(n)?selected.delete(n):selected.add(n);if(countriesLayer)countriesLayer.resetStyle();chips();listC()});
$('csearch').addEventListener('input',listC);
if(HAS){countriesLayer=L.geoJSON({type:'FeatureCollection',features:C.map(c=>({type:'Feature',properties:{n:c.name,ar:c.name_ar},geometry:{type:'MultiPolygon',coordinates:c.polys}}))},
 {style:f=>({color:'#8fc4ff',weight:1,fillColor:selected.has(f.properties.n)?'#f2c97a':'#3aa0ff',fillOpacity:selected.has(f.properties.n)?.5:.08}),
  onEachFeature:(f,l)=>{l.on('click',e=>{L.DomEvent.stopPropagation(e);if(pickLbl){addLblAt(e.latlng);return}const n=f.properties.n;selected.has(n)?selected.delete(n):selected.add(n);countriesLayer.resetStyle();chips();listC()});l.bindTooltip(f.properties.ar,{sticky:true})}})}
chips();listC();
function cfg(demo){const c={title:$('title').value,type:'virtual',badge:($('badge').value||'').trim()||'الطيران الافتراضي',source:$('source').value,date:$('date').value||'auto',handle:$('handle').value.trim(),caption:$('caption').value,note:$('note').value,
 tz:+$('tz').value,tz_name:$('tz').value==3?'بغداد':'UTC'+($('tz').value>0?'+':'')+$('tz').value,durations:[...document.querySelectorAll('.dur:checked')].map(x=>+x.value),time:{}};
 if($('t0').value)c.time.start=$('t0').value;if($('t1').value)c.time.end=$('t1').value;const lb=labels.filter(l=>l.name.trim());
 c.theme=th;c.map=mode()==='airport'?{mode:'airport',lat:+$('lat').value,lon:+$('lon').value,radius_nm:+$('rad').value,label:$('alabel').value,labels:lb}:{mode:'country',countries:[...selected],labels:lb};
 if(demo){if(c.map.mode==='country'&&!c.map.countries.length)c.map.countries=['Iraq'];if(c.map.mode==='airport'&&!(isFinite(c.map.lat)&&isFinite(c.map.lon)&&c.map.radius_nm>0)){c.map.lat=33.2625;c.map.lon=44.2346;c.map.radius_nm=10.5}c.title=c.title||'عنوان الفيديو'}return c}
$('dl').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(cfg(),null,1)],{type:'application/json'}));a.download='raseed-config.json';a.click()};
const ui={busy(b){$('go').disabled=$('prev').disabled=b;$('cancel').disabled=!b},stage(t,p){$('stage').textContent=t;if(p!=null)$('pct').style.width=Math.max(2,Math.round(p*100))+'%'}};
async function pipeline(preview){
  $('stat').style.display='block';$('err').textContent='';$('warn').textContent='';$('res').innerHTML='';cancelled=false;
  const f=$('log').files[0];if(!f){$('err').textContent='اختر ملف السجل أولاً';return}
  const c=cfg();if(c.map.mode==='country'&&!c.map.countries.length){$('err').textContent='اختر دولة من الخريطة أو القائمة';return}
  if(!preview&&!c.durations.length){$('err').textContent='اختر مدة وحدة على الأقل';return}
  ui.busy(true);rendering=true;
  try{
    ui.stage('تجهيز الخطوط…',.02);await baseFonts();await ensureFont(th.font);
    const key=f.name+f.size+f.lastModified;
    if(!parsed||parsedKey!==key){ui.stage('قراءة السجل…',.03);parsed=await Raseed.parseLog(f,p=>ui.stage('قراءة السجل…',.03+.1*p));parsedKey=key}
    ui.stage('بناء المسارات…',.14);await new Promise(r=>setTimeout(r,20));
    const ctx=Raseed.prepare(c,parsed),i=ctx.info;
    $('stage').textContent='جاهز'+(i.runways.length?' — المدارج المكتشفة: '+i.runways.map(x=>x[0]).join('، ')+' | إقلاع '+i.departures+' / هبوط '+i.arrivals:' — '+i.tracks+' مسار');
    if(i.spanH>12)$('warn').textContent='مدة السجل '+i.spanH.toFixed(1)+' ساعة؛ حدّد بداية ونهاية لو تريد فترة أقصر وحركة أوضح.';
    if(preview){const N=Math.round(c.durations[0]||60)*60;const r=await Raseed.renderVideo(ctx,c.durations[0]||60,{frames:[.04,.3,.62].map(x=>Math.round(x*(N-1)))});
      $('res').innerHTML='';r.images.forEach(b=>{const im=new Image();im.src=URL.createObjectURL(b);$('res').appendChild(im)});ui.stage('تمت المعاينة',1)}
    else{const durs=c.durations;for(let k=0;k<durs.length;k++){
      const r=await Raseed.renderVideo(ctx,durs[k],{cancel:()=>cancelled,onProgress:p=>ui.stage(`رسم الفيديو ${k+1}/${durs.length} (${durs[k]} ثانية) — ${Math.round(p*100)}%`,.15+.85*(k+p)/durs.length)});
      const url=URL.createObjectURL(r.blob),box=document.createElement('div');box.innerHTML=`<video controls playsinline src="${url}"></video><a class="btn ghost" style="display:block;text-align:center;margin-top:8px;text-decoration:none;color:#fff" download="raseed-${durs[k]}s.mp4" href="${url}">تنزيل raseed-${durs[k]}s.mp4</a>`;$('res').appendChild(box);
      if(!r.codec.startsWith('avc'))$('warn').textContent='ملاحظة: متصفحك رمّز الفيديو بـ VP9 داخل MP4. إنستغرام وبعض المنصات تفضّل H.264؛ استخدم Chrome أو Edge على الكمبيوتر للحصول على H.264.'}
      ui.stage('تم',1)}
  }catch(e){$('err').textContent='خطأ: '+(e.message||e);console.error(e)}
  rendering=false;ui.busy(false)}
$('go').onclick=()=>pipeline(false);$('prev').onclick=()=>pipeline(true);$('cancel').onclick=()=>{cancelled=true};

// ---------- theme UI
if(!Raseed.THEMES||!Raseed.demo){$('stale').classList.remove('hide');$('staleMsg').textContent='المتصفح محمّل ملفات قديمة من الكاش. اضغط Ctrl+F5 (أو امسح الكاش) حتى تشتغل بطاقة الثيم. إذا رفعت الملفات للسيرفر، تأكد إنك بدّلت مجلد js كامل.';$('themeErr').classList.remove('hide');$('themeErr').textContent='بطاقة الثيم تحتاج النسخة الجديدة من js/raseed.js.';window.__raseedCfg=cfg;return}
const DEF=Raseed.DEFAULT_THEME,TH=Raseed.THEMES;let th=Object.assign({},DEF),fontsDone=false,rendering=false;
const baseFonts=async()=>{if(!fontsDone){await Raseed.loadFonts(RASEED_FONTS);fontsDone=true}};
const GF={'Tajawal':'Tajawal:wght@300;400;700;800;900','Almarai':'Almarai:wght@300;400;700;800','Changa':'Changa:wght@300;400;600;700;800','El Messiri':'El+Messiri:wght@400;700','Reem Kufi':'Reem+Kufi:wght@400;700','Lalezar':'Lalezar','Noto Kufi Arabic':'Noto+Kufi+Arabic:wght@300;400;700;900','IBM Plex Sans Arabic':'IBM+Plex+Sans+Arabic:wght@300;400;700','Rubik':'Rubik:wght@300;400;700;900'};
const SYS=['Tahoma','Segoe UI','Arial','Times New Roman','Courier New'];
async function ensureFont(n){if(!n||n==='Cairo'||SYS.includes(n)||n==='RaseedCustom')return;
 if(GF[n]&&!document.getElementById('gf-'+n)){const l=document.createElement('link');l.id='gf-'+n;l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family='+GF[n]+'&display=swap';document.head.appendChild(l)}
 try{await Promise.race([Promise.all([400,700,900].map(w=>document.fonts.load(w+' 40px "'+n+'"','عربي ABC'))),new Promise(r=>setTimeout(r,7000))])}catch(e){}
 $('tfontInfo').style.color=document.fonts.check('700 20px "'+n+'"')?'':'#ffe9a8';if(!document.fonts.check('700 20px "'+n+'"'))$('tfontInfo').textContent='تعذّر تحميل الخط (تحتاج إنترنت). راح يُستخدم Cairo بدله.'}
const COLORS=[['bg0','الخلفية أعلى'],['bg1','الخلفية وسط'],['bg2','الخلفية أسفل'],['accent','الشارة والتقدم'],['clock','الساعة'],['text','النصوص'],['planeDep','طائرة إقلاع/عام'],['planeArr','طائرة هبوط'],['mapFill','تعبئة الخريطة'],['outline','حدود الخريطة'],['glow','توهج الحدود'],['net','شبكة المسارات'],['ring','دوائر وشبكة'],['badgeText','نص الشارة']];
const SELS=[['bgStyle','الخلفية',{linear:'تدرّج عمودي',radial:'تدرّج دائري',flat:'لون واحد'}],['outlineStyle','حدود الخريطة',{glow:'توهج',thin:'خط رفيع',thick:'خط عريض',dashed:'منقّط',none:'بدون'}],['fillStyle','تعبئة الخريطة',{solid:'ممتلئ',gradient:'متدرّج',hatch:'تظليل مائل',none:'بدون'}],['shape','شكل نافذة المطار',{circle:'دائرة',square:'مربع بزوايا مدوّرة'}],['planeStyle','شكل الطائرة',{jet:'طائرة',arrow:'سهم',dot:'نقطة',blip:'نبضة رادار'}],['titleWeight','سُمك العنوان والساعة',{900:'عريض جداً',700:'عريض',400:'عادي'}]];
const RNG=[['mapFillA','شفافية التعبئة',0,.5,.01],['planeSize','حجم الطائرات',.5,2,.05],['trailLen','طول الذيل (0=بدون)',0,2.5,.1],['netAmt','كثافة شبكة المسارات (0=بدون)',0,2,.1],['labelSize','حجم أسماء المدن والمدارج',.6,1.6,.05]];
const TOGS=[['grid','شبكة إحداثيات'],['rings','دوائر المسافة (مطار)'],['sweep','مسح رادار (مطار)'],['showBadge','الشارة'],['showClock','الساعة الكبيرة'],['showProgress','شريط التقدم'],['showCounters','عدّاد إقلاع/هبوط'],['showLabels','أسماء المدن والمدارج']];
$('presets').innerHTML=Object.keys(TH).map(k=>`<button type=button class=pre data-k="${k}">${TH[k].name}</button>`).join('');
$('tcolors').innerHTML=COLORS.map(([k,n])=>`<label class=cc><input type=color data-k="${k}"><span>${n}</span></label>`).join('');
$('tsel').innerHTML=SELS.map(([k,n,o])=>`<div><label>${n}</label><select data-k="${k}">${Object.entries(o).map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select></div>`).join('');
$('trng').innerHTML=RNG.map(([k,n,a,b,s])=>`<div><label>${n}: <b data-v="${k}"></b></label><input type=range data-k="${k}" min=${a} max=${b} step=${s} style="width:100%"></div>`).join('');
$('ttog').innerHTML=TOGS.map(([k,n])=>`<label><input type=checkbox data-k="${k}"> ${n}</label>`).join('');
$('tfont').innerHTML='<option value="Cairo">Cairo (مدمج، افتراضي)</option><optgroup label="خطوط الجهاز">'+SYS.map(f=>`<option>${f}</option>`).join('')+'</optgroup><optgroup label="Google Fonts (تحتاج إنترنت)">'+Object.keys(GF).map(f=>`<option>${f}</option>`).join('')+'</optgroup><option value="RaseedCustom" disabled id="tcustom">الخط المرفوع</option>';
function sync(){document.querySelectorAll('#tcolors input').forEach(i=>i.value=th[i.dataset.k]);document.querySelectorAll('#tsel select').forEach(s=>s.value=String(th[s.dataset.k]));
 document.querySelectorAll('#trng input').forEach(i=>{i.value=th[i.dataset.k];document.querySelector(`[data-v=${i.dataset.k}]`).textContent=(+th[i.dataset.k]).toFixed(2)});document.querySelectorAll('#ttog input').forEach(i=>i.checked=!!th[i.dataset.k]);
 if(!$('tfont').querySelector(`[value="${th.font}"]`)&&!([...$('tfont').options].some(o=>o.value===th.font||o.text===th.font)))th.font='Cairo';$('tfont').value=th.font}
function persist(){try{localStorage.setItem('raseed.theme',JSON.stringify(th))}catch(e){}}
let pt=null;function changed(){persist();clearTimeout(pt);pt=setTimeout(livePreview,350)}
const num=k=>['mapFillA','planeSize','trailLen','netAmt','labelSize','titleWeight'].includes(k);
$('presets').onclick=e=>{const k=e.target.dataset&&e.target.dataset.k;if(!k)return;const keep=th.font;th=Object.assign({},DEF,TH[k]);delete th.name;th.font=keep;sync();changed()};
$('tcolors').addEventListener('input',e=>{th[e.target.dataset.k]=e.target.value;changed()});
$('tsel').addEventListener('change',e=>{const k=e.target.dataset.k;th[k]=num(k)?+e.target.value:e.target.value;changed()});
$('trng').addEventListener('input',e=>{const k=e.target.dataset.k;th[k]=+e.target.value;document.querySelector(`[data-v=${k}]`).textContent=(+e.target.value).toFixed(2);changed()});
$('ttog').addEventListener('change',e=>{th[e.target.dataset.k]=e.target.checked;changed()});
$('tfont').onchange=async()=>{th.font=$('tfont').value;$('tfontInfo').style.color='';$('tfontInfo').textContent='جاري تحميل الخط…';await ensureFont(th.font);if(document.fonts.check('700 20px "'+th.font+'"')||th.font==='Cairo')$('tfontInfo').textContent='تم.';changed()};
$('tfontfile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{await Raseed.registerFont('RaseedCustom',await f.arrayBuffer());const o=$('tcustom');o.disabled=false;o.textContent='الخط المرفوع: '+f.name;th.font='RaseedCustom';$('tfont').value='RaseedCustom';$('tfontInfo').textContent='تم تحميل الخط: '+f.name;changed()}catch(err){$('tfontInfo').textContent='الملف غير صالح كخط.'}};
$('tReset').onclick=()=>{th=Object.assign({},DEF);sync();changed()};
$('tExp').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(th,null,1)],{type:'application/json'}));a.download='raseed-theme.json';a.click()};
$('tImp').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const j=JSON.parse(await f.text());const n=Object.assign({},DEF);for(const k in DEF)if(k in j&&typeof j[k]===typeof DEF[k])n[k]=j[k];if(n.font==='RaseedCustom'&&!document.fonts.check('700 20px RaseedCustom'))n.font='Cairo';th=n;sync();await ensureFont(th.font);changed()}catch(err){alert('ملف الثيم غير صالح')}};
try{const s=JSON.parse(localStorage.getItem('raseed.theme')||'null');if(s)for(const k in DEF)if(k in s&&typeof s[k]===typeof DEF[k])th[k]=s[k];if(th.font==='RaseedCustom')th.font='Cairo'}catch(e){}
sync();
let pvBusy=false,pvPend=false;
async function livePreview(){if(rendering)return;if(pvBusy){pvPend=true;return}pvBusy=true;
 try{await baseFonts();await ensureFont(th.font);const c=cfg(true),ctx=Raseed.demo(c);const r=await Raseed.renderVideo(ctx,30,{frames:[990]});const im=$('tprev'),old=im.src;im.src=URL.createObjectURL(r.images[0]);if(old&&old.startsWith('blob:'))URL.revokeObjectURL(old)}
 catch(e){console.error(e)}
 pvBusy=false;if(pvPend){pvPend=false;livePreview()}}
let pt2=null;const soon=()=>{clearTimeout(pt2);pt2=setTimeout(livePreview,500)};
document.addEventListener('input',e=>{if(e.target.closest('#airportOpts,#countryOpts')||['title','caption','note','handle','source','date','badge'].includes(e.target.id))soon()});
document.addEventListener('change',e=>{if(e.target.name==='mode')soon()});
$('clist').addEventListener('click',soon);if(HAS)map.on('click',soon);
soon();
window.__raseedCfg=cfg;window.__raseedTheme=()=>th;
})();
