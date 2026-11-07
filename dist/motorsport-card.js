/* HA Motorsport Card - dev preview */
const calendarCache=new Map();
async function getCalendarEvents(hass,entity,days,force=false){
  const key=entity+'|'+days;
  const cached=calendarCache.get(key);
  if(!force&&cached&&Date.now()-cached.when<300000)return cached.promise;
  const promise=hass.callWS({type:'call_service',domain:'calendar',service:'get_events',service_data:{duration:{days}},target:{entity_id:entity},return_response:true}).then(response=>{
    const events=response?.response?.[entity]?.events??response?.[entity]?.events;
    if(!Array.isArray(events))throw Error('Calendar response missing events');
    return events.map(normalize).filter(e=>Number.isFinite(e.start)&&Number.isFinite(e.end)&&e.end>e.start).sort((a,b)=>a.start-b.start);
  });
  calendarCache.set(key,{when:Date.now(),promise});
  promise.catch(()=>{if(calendarCache.get(key)?.promise===promise)calendarCache.delete(key)});
  return promise;
}
const COLORS={F1:'#078b52',F2:'#a71048',F3:'#bc501d','F1 Academy':'#073b70',MotoGP:'#a30b43',Moto2:'#4e609e',Moto3:'#7044a6',WRC:'#d80025',WEC:'#224b90'};
const FLAGS={Brazil:'🇧🇷',Qatar:'🇶🇦',Monaco:'🇲🇨',Portugal:'🇵🇹',Spain:'🇪🇸','United States':'🇺🇸','United Arab Emirates':'🇦🇪'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const fmt=t=>new Intl.DateTimeFormat(undefined,{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(t));
const clock=t=>{let s=Math.max(0,Math.floor(t/1000));return [Math.floor(s/86400),Math.floor(s/3600)%24,Math.floor(s/60)%60,s%60].map(n=>String(n).padStart(2,'0'))};
const calendarTimestamp=value=>{if(/^\d{4}-\d{2}-\d{2}$/.test(String(value||''))){const [y,m,d]=value.split('-').map(Number);return new Date(y,m-1,d).getTime()}return Date.parse(value)};
function normalize(e){const info={};for(const line of String(e.description||'').split(/\r?\n/)){const match=line.match(/^\s*([^:]+):\s*(.*?)\s*,?\s*$/);if(match)info[match[1].toLowerCase().trim()]=match[2].replace(/,$/,'').trim()}const short=String(e.summary||'').split(':')[0].trim();const series=short||info.series||'Unknown';const start=calendarTimestamp(e.start),end=calendarTimestamp(e.end);return {series,full:info.series||series,event:info.event||e.summary||'Event',session:info.session||'Session',location:info.location||e.location||'',country:String(info.location||e.location||'').split(',').pop().trim(),start,end,allDay:!!e.all_day||/^\d{4}-\d{2}-\d{2}$/.test(String(e.start))}}
const OVERVIEW_CSS=`
.overview-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:16px}
.overview-title{font-size:23px;font-weight:800;letter-spacing:-.4px}
.overview-subtitle{font-size:12px;opacity:.75;margin-top:3px}
.overview-list{display:grid;gap:9px}
.overview-entry{--series:#294f71;position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:13px 14px;border-radius:10px;background:linear-gradient(110deg,var(--series),#101d2d 82%);border:1px solid #ffffff2c;min-width:0}
.overview-entry.active{outline:2px solid #ffca66;outline-offset:-2px}
.overview-entry-title{font-weight:750;font-size:14px}
.overview-entry-event{font-size:13px;margin-top:3px;overflow-wrap:anywhere}
.overview-entry-session{font-size:11px;opacity:.8;margin-top:4px}
.overview-entry-time{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;font-size:12px}
.overview-entry-time strong{display:block;font-size:18px}
.overview-empty{padding:20px 8px;opacity:.8}
@media(max-width:360px){.overview-entry{padding:10px;gap:6px}.overview-entry-time strong{font-size:15px}}
`;
const css=`:host{display:block;color:#fff}*{box-sizing:border-box}.shell{font-family:var(--paper-font-body1_-_font-family,Arial,sans-serif);background:linear-gradient(115deg,var(--accent),#0d1a2d 72%);border-radius:16px;padding:18px;color:#fff;overflow:hidden;touch-action:pan-y;user-select:none}.top,.bottom,.line{display:flex;align-items:center;justify-content:space-between;gap:10px}.badge{font-size:12px;font-weight:700;background:#071321c9;border-radius:5px;padding:5px 8px}.title{font-size:clamp(22px,3.8vw,30px);font-weight:750;line-height:1.15;overflow-wrap:anywhere;margin:14px 0 6px}.place{opacity:.86;font-size:14px}.count{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;margin:17px 0}.cell{background:#050c15ac;border-radius:6px;text-align:center;padding:10px 2px}.num{font-size:clamp(19px,4vw,29px);font-weight:750;font-variant-numeric:tabular-nums}.unit{opacity:.75;font-size:11px}.bottom{background:#060b14aa;padding:10px;border-radius:6px;font-size:13px}.schedule{padding:12px;background:#071321a6;border-radius:8px;margin-top:12px}.line{border-bottom:1px solid #ffffff24;padding:8px 0;font-size:13px}.line:last-child{border:0}.status{opacity:.8;font-size:11px}.btn{background:#ffffff1c;color:#fff;border:1px solid #ffffff55;border-radius:7px;padding:8px 12px;cursor:pointer;margin-top:12px}.error{font-size:12px;margin-top:8px;color:#ffe0b2}.compact .title{font-size:21px}.compact .count{margin:10px 0}.compact .cell{padding:6px 2px}@media(max-width:400px){.shell{padding:13px}.unit{font-size:10px}.num{font-size:20px}.place{font-size:12px}}`;
class MotorsportCard extends HTMLElement{
constructor(){super();this.attachShadow({mode:'open'});this._config={};this._events=[];this._expanded=false;this._lastFetch=0;this._loading=false;this._timer=null;this._holdTimer=null;this._held=false;this._startPos=null;this._renderedKey='';this._refreshGeneration=0}
setConfig(config){if(!config||typeof config!=='object')throw Error('Missing config');this._config={calendar_entity:'calendar.lightsouts',series:'all',days_ahead:120,refresh_minutes:30,view:'series',compact:false,hold_action:{action:'none'},...config};this._lastFetch=0;this._renderedKey='';this.render();this.fetchEvents()}
set hass(h){this._hass=h;if(!this._timer)this._timer=setInterval(()=>this.tick(),1000);if(!this._lastFetch)this.fetchEvents()}
connectedCallback(){this.render()}
disconnectedCallback(){clearInterval(this._timer);this._timer=null;clearTimeout(this._holdTimer)}
getCardSize(){return this._config.view==='overview'?Math.max(3,Math.min(8,this._events.length)):this._expanded?6:3}
static getStubConfig(){return {type:'custom:motorsport-card',calendar_entity:'calendar.lightsouts',series:'all'}}
static getConfigElement(){return document.createElement('motorsport-card-editor')}
tick(){const now=Date.now();if(now-this._lastFetch>=Math.max(5,Number(this._config.refresh_minutes)||30)*60000)this.fetchEvents();if(this._config.view==='overview'){const minute=Math.floor(now/60000);if(this._renderedKey!=='overview|'+minute)this.render();return}const next=this.choose(now);const key=next?.series+'|'+next?.event+'|'+next?.start+'|'+(next&&now>=next.start);if(key!==this._renderedKey){this.render();return}const cells=this.shadowRoot.querySelectorAll('[data-count]');if(cells.length===4){const values=next?clock(next.start-now):['--','--','--','--'];cells.forEach((el,i)=>{if(el.textContent!==values[i])el.textContent=values[i]})}}
choose(now=Date.now()){const chosen=String(this._config.series||'all').toLowerCase();const filtered=this._events.filter(e=>(chosen==='all'||chosen===e.series.toLowerCase()||chosen===e.full.toLowerCase())&&e.end>now);return filtered.find(e=>e.start<=now&&now<e.end)||filtered[0]||null}
async fetchEvents(){if(!this._hass||this._loading)return;this._loading=true;const generation=++this._refreshGeneration;try{const entity=this._config.calendar_entity;const days=Math.max(1,Math.min(365,Number(this._config.days_ahead)||120));const events=await getCalendarEvents(this._hass,entity,days);if(generation!==this._refreshGeneration)return;this._events=events;this._error=''}catch(e){if(generation===this._refreshGeneration)this._error=String(e.message||e)}finally{this._loading=false;this._lastFetch=Date.now();this.render()}}
onHold(){const a=this._config.hold_action||{};if(a.action==='navigate'&&typeof a.navigation_path==='string'&&a.navigation_path.startsWith('/')){history.pushState(null,'',a.navigation_path);window.dispatchEvent(new Event('location-changed'))}else if(a.action==='more-info'){this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:this._config.calendar_entity},bubbles:true,composed:true}))}}
renderOverview(){
  const now=Date.now();
  const choices=[...new Set(this._events.map(e=>e.series))].map(series=>{
    const events=this._events.filter(e=>e.series===series&&e.end>now);
    const active=events.find(e=>e.start<=now&&now<e.end);
    return active||events[0]||null
  }).filter(Boolean).sort((a,b)=>Math.max(a.start,now)-Math.max(b.start,now)||a.series.localeCompare(b.series));
  const limit=Math.max(1,Math.min(30,Number(this._config.max_series)||12));
  const rows=choices.slice(0,limit).map(e=>{
    const active=e.start<=now&&now<e.end;
    const time=e.allDay?'Heldag':fmt(e.start);
    const remaining=active?'Pågår enligt schema':e.allDay?'Kommande rally':Math.max(0,Math.ceil((e.start-now)/60000))+' min kvar';
    return `<div class="overview-entry ${active?'active':''}" style="--series:${COLORS[e.series]||'#21476b'}"><div><div class="overview-entry-title">${esc(e.series)} · ${FLAGS[e.country]||'🏁'}</div><div class="overview-entry-event">${esc(e.event)}</div><div class="overview-entry-session">${esc(e.session)} · ${esc(remaining)}</div></div><div class="overview-entry-time"><strong>${e.allDay?'📅':new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit'}).format(e.start)}</strong>${esc(time.split(',')[0])}</div></div>`
  }).join('');
  this._renderedKey='overview|'+Math.floor(now/60000);
  this.shadowRoot.innerHTML=`<style>${css}${OVERVIEW_CSS}</style><div class="shell" style="--accent:#12395c"><div class="overview-head"><div><div class="overview-title">🏁 Motorsport</div><div class="overview-subtitle">Kommande och pågående sessioner · ${choices.length} serier</div></div><span class="badge">ÖVERSIKT</span></div><div class="overview-list">${rows||'<div class="overview-empty">Inga kommande sessioner hittades.</div>'}</div>${this._error?'<div class="error">Kalender: '+esc(this._error)+'</div>':''}</div>`;
}
render(){if(!this.shadowRoot)return;if(this._config.view==='overview'){this.renderOverview();return}const now=Date.now(),chosen=String(this._config.series||'all').toLowerCase();const filtered=this._events.filter(e=>(chosen==='all'||chosen===e.series.toLowerCase()||chosen===e.full.toLowerCase())&&e.end>now);const next=this.choose(now),current=next&&next.start<=now&&now<next.end,accent=COLORS[next?.series]||'#174a80',values=next?clock(next.start-now):['--','--','--','--'];const schedule=next?filtered.filter(e=>e.series===next.series&&e.event===next.event):[];this._renderedKey=next?.series+'|'+next?.event+'|'+next?.start+'|'+!!current;this.shadowRoot.innerHTML=`<style>${css}</style><div class="shell ${this._config.compact?'compact':''}" style="--accent:${accent}"><div class="top"><span class="badge">🏁 ${esc(next?.series||this._config.series||'Motorsport')}</span><span class="status">${current?'🔴 Schemalagd tid pågår':next?'Nästa session':'Kalender'}</span></div><div class="title">${esc(next?.event||'Ingen kommande session')}</div><div class="place">${FLAGS[next?.country]||'🏁'} ${esc(next?.location||'')}</div><div class="count">${values.map((n,i)=>`<div class="cell"><div class="num" data-count>${n}</div><div class="unit">${['Dagar','Timmar','Minuter','Sekunder'][i]}</div></div>`).join('')}</div><div class="bottom"><span>${esc(next?.session||'Inga händelser')}</span><span>${next?(next.allDay?'Heldag':fmt(next.start)):'—'}</span></div>${this._expanded?`<div class="schedule"><strong>Helgschema</strong>${schedule.map(e=>`<div class="line"><span>${esc(e.session)}</span><span>${e.allDay?'Heldag':fmt(e.start)}</span></div>`).join('')||'<p>Inga sessioner</p>'}</div>`:''}${this._error?`<div class="error">Kalender: ${esc(this._error)}</div>`:''}<button class="btn" type="button" aria-expanded="${this._expanded}">${this._expanded?'Dölj helgschema':'Visa helgschema'}</button></div>`;const root=this.shadowRoot.querySelector('.shell');root.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;this._held=false;this._startPos=[e.clientX,e.clientY];clearTimeout(this._holdTimer);this._holdTimer=setTimeout(()=>{this._held=true;this.onHold()},650)});root.addEventListener('pointermove',e=>{if(this._startPos&&Math.hypot(e.clientX-this._startPos[0],e.clientY-this._startPos[1])>12)clearTimeout(this._holdTimer)});for(const kind of ['pointerup','pointercancel','pointerleave'])root.addEventListener(kind,()=>clearTimeout(this._holdTimer));root.addEventListener('contextmenu',e=>{if((this._config.hold_action||{}).action!=='none')e.preventDefault()});root.addEventListener('click',e=>{if(e.target.closest('button')||this._held)return;this._expanded=!this._expanded;this.render()});root.querySelector('button').addEventListener('click',e=>{e.stopPropagation();this._expanded=!this._expanded;this.render()})}
}
if(!customElements.get('motorsport-card'))customElements.define('motorsport-card',MotorsportCard);
window.customCards=window.customCards||[];if(!window.customCards.some(c=>c.type==='motorsport-card'))window.customCards.push({type:'motorsport-card',name:'Motorsport Card (dev)',description:'Lightsouts calendar countdown and schedule'});

class MotorsportCardEditor extends HTMLElement{
  constructor(){super();this.attachShadow({mode:'open'});this._config={}}
  setConfig(config){this._config={...config};this.render()}
  set hass(h){this._hass=h}
  render(){
    this.shadowRoot.innerHTML=`<style>
    :host{display:block;color:var(--primary-text-color);font:inherit}
    .fields{display:grid;gap:12px;padding:12px}
    label{display:grid;gap:5px;font-size:13px}
    input,select{background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color,#888);border-radius:6px;padding:9px;width:100%;font:inherit}
    .check{display:flex;align-items:center}.check input{width:auto;margin-right:8px}
    small{opacity:.7}
    </style><div class="fields">
    <label>Kalenderentitet<input data-key="calendar_entity" value="${esc(this._config.calendar_entity||'calendar.lightsouts')}"></label>
    <label>Visningsläge<select data-key="view"><option value="series" ${this._config.view!=='overview'?'selected':''}>Seriekort</option><option value="overview" ${this._config.view==='overview'?'selected':''}>Motorsportöversikt</option></select></label>
    <label>Max antal serier i översikten<input type="number" min="1" max="30" data-key="max_series" value="${Number(this._config.max_series)||12}"></label>
    <label>Serie (F1, MotoGP, WRC eller all)<input data-key="series" value="${esc(this._config.series||'all')}"></label>
    <label>Antal dagar framåt<input type="number" min="1" max="365" data-key="days_ahead" value="${Number(this._config.days_ahead)||120}"></label>
    <label>Uppdateringsintervall (minuter)<input type="number" min="5" max="1440" data-key="refresh_minutes" value="${Number(this._config.refresh_minutes)||30}"></label>
    <label class="check"><input type="checkbox" data-key="compact" ${this._config.compact?'checked':''}> Kompakt kort</label>
    <label>Vid långt tryck<select data-key="hold_action"><option value="none">Ingen åtgärd</option><option value="navigate" ${this._config.hold_action?.action==='navigate'?'selected':''}>Öppna dashboardflik</option><option value="more-info" ${this._config.hold_action?.action==='more-info'?'selected':''}>Mer information</option></select></label>
    <label>Dashboardens navigeringssökväg<input data-key="navigation_path" placeholder="/lovelace/f1-sensor" value="${esc(this._config.hold_action?.navigation_path||'')}"><small>Använd exakt sökväg från Home Assistant.</small></label>
    </div>`;
    for(const el of this.shadowRoot.querySelectorAll('[data-key]'))el.addEventListener('change',()=>{
      const key=el.dataset.key,config={...this._config};
      if(key==='hold_action')config.hold_action={...config.hold_action,action:el.value};
      else if(key==='navigation_path')config.hold_action={...config.hold_action,navigation_path:el.value};
      else if(key==='compact')config.compact=el.checked;
      else if(['days_ahead','refresh_minutes','max_series'].includes(key))config[key]=Number(el.value);
      else config[key]=el.value;
      this._config=config;
      this.dispatchEvent(new CustomEvent('config-changed',{detail:{config},bubbles:true,composed:true}));
    });
  }
}
if(!customElements.get('motorsport-card-editor'))customElements.define('motorsport-card-editor',MotorsportCardEditor);
