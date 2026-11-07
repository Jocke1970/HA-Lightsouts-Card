/* HA Lightsouts Motorsport Card */
const calendarCache=new Map();
function resolveCalendarEntity(hass,configured){
  const desired=String(configured||'auto').trim();
  const states=hass?.states||{};
  if(desired!=='auto'&&states[desired])return desired;
  if(desired!=='calendar.lightsouts'&&desired!=='auto')throw Error('Kalenderentiteten '+desired+' finns inte. Kontrollera calendar_entity i kortets inställningar.');
  const matches=Object.keys(states).filter(id=>id.startsWith('calendar.')&&id.toLowerCase().includes('lightsouts'));
  if(matches.length===1)return matches[0];
  if(matches.length>1)throw Error('Flera Lightsouts-kalendrar hittades: '+matches.join(', ')+'. Ange calendar_entity explicit.');
  throw Error('Ingen Lightsouts-kalender hittades. Ange rätt calendar_entity, exempelvis calendar.externa_sensorer_lightsouts.');
}

async function getCalendarEvents(hass,entity,days,force=false){
  const historyDays=7;const key=entity+'|'+days+'|'+Math.floor(Date.now()/86400000);
  const cached=calendarCache.get(key);
  if(!force&&cached&&Date.now()-cached.when<300000)return cached.promise;
  const promise=hass.callWS({type:'call_service',domain:'calendar',service:'get_events',service_data:{start_date_time:new Date(Date.now()-historyDays*86400000).toISOString(),duration:{days:days+historyDays}},target:{entity_id:entity},return_response:true}).then(response=>{
    const events=response?.response?.[entity]?.events??response?.[entity]?.events??response?.result?.response?.[entity]?.events;
    if(!Array.isArray(events))throw Error('Calendar response missing events');
    return events.map(normalize).filter(e=>Number.isFinite(e.start)&&Number.isFinite(e.end)&&e.end>e.start).sort((a,b)=>a.start-b.start);
  });
  calendarCache.set(key,{when:Date.now(),promise});
  promise.catch(()=>{if(calendarCache.get(key)?.promise===promise)calendarCache.delete(key)});
  return promise;
}
const LANGUAGE_CATALOG={"en":{"overview":"OVERVIEW","motorsport":"Motorsport","upcoming":"Upcoming and scheduled sessions","series_count":"series","next_session":"Next session","scheduled_live":"Scheduled session in progress","calendar":"Calendar","no_session":"No upcoming session","no_events":"No events","no_upcoming":"No upcoming sessions found.","days":"Days","hours":"Hours","minutes":"Minutes","all_day":"All day","upcoming_rally":"Upcoming rally","remaining":"remaining","weekend_schedule":"Weekend schedule","show_schedule":"Show weekend schedule","hide_schedule":"Hide weekend schedule","finished_hint":"Completed sessions appear only when retained by the Lightsouts calendar.","empty_schedule":"No sessions found.","calendar_error":"Calendar","schedule_toggle":"Show or hide event schedule","view":"View","view_series":"Series card","view_overview":"Motorsport overview","layout":"Overview layout","layout_list":"Vertical list","layout_grid":"Two-column grid","calendar_entity":"Calendar entity","max_series":"Maximum series in overview","series":"Series (F1, MotoGP, WRC or all)","days_ahead":"Days ahead","refresh":"Refresh interval (minutes)","compact":"Compact card","hold_action":"Long press","hold_none":"No action","hold_navigate":"Open dashboard view","hold_more":"More information","navigation_path":"Dashboard navigation path","navigation_help":"Use the exact Home Assistant dashboard URL path.","language":"Language","language_auto":"Automatic (Home Assistant)","practice":"Practice","free_practice":"Free Practice","warm_up":"Warm Up","qualifying":"Qualifying","sprint":"Sprint","sprint_race":"Sprint Race","race":"Race","feature_race":"Feature Race","reverse_grid_race":"Reverse Grid Race","rally":"Rally","expand_series":"Expand series card","collapse_series":"Collapse series card","series_shortcuts":"Series shortcuts (optional)","shortcut_series":"Series","shortcut_action":"Shortcut action","shortcut_path":"Dashboard path for selected series","shortcut_help":"Long press on this series in Motorsport Overview. Leave action as None to disable."},"sv":{"overview":"ÖVERSIKT","motorsport":"Motorsport","upcoming":"Kommande och schemalagda sessioner","series_count":"serier","next_session":"Nästa session","scheduled_live":"Pågår enligt schema","calendar":"Kalender","no_session":"Ingen kommande session","no_events":"Inga händelser","no_upcoming":"Inga kommande sessioner hittades.","days":"Dagar","hours":"Timmar","minutes":"Minuter","all_day":"Heldag","upcoming_rally":"Kommande rally","remaining":"kvar","weekend_schedule":"Helgschema","show_schedule":"Visa helgschema","hide_schedule":"Dölj helgschema","finished_hint":"Avslutade pass visas när de finns kvar i Lightsouts-kalendern.","empty_schedule":"Inga sessioner hittades.","calendar_error":"Kalender","schedule_toggle":"Visa eller dölj helgschema","view":"Visningsläge","view_series":"Seriekort","view_overview":"Motorsportöversikt","layout":"Layout för översikten","layout_list":"Vertikal lista","layout_grid":"Rutnät (två kolumner)","calendar_entity":"Kalenderentitet","max_series":"Max antal serier i översikten","series":"Serie (F1, MotoGP, WRC eller all)","days_ahead":"Antal dagar framåt","refresh":"Uppdateringsintervall (minuter)","compact":"Kompakt kort","hold_action":"Vid långt tryck","hold_none":"Ingen åtgärd","hold_navigate":"Öppna dashboardflik","hold_more":"Mer information","navigation_path":"Dashboardens navigeringssökväg","navigation_help":"Använd exakt sökväg från Home Assistant.","language":"Språk","language_auto":"Automatiskt (Home Assistant)","practice":"Träning","free_practice":"Fri träning","warm_up":"Uppvärmning","qualifying":"Kval","sprint":"Sprint","sprint_race":"Sprintrace","race":"Race","feature_race":"Huvudrace","reverse_grid_race":"Race med omvänd startordning","rally":"Rally","expand_series":"Öppna seriekort","collapse_series":"Stäng seriekort","series_shortcuts":"Genvägar per serie (valfritt)","shortcut_series":"Serie","shortcut_action":"Genvägsåtgärd","shortcut_path":"Dashboard-sökväg för vald serie","shortcut_help":"Långtryck på denna serie i Motorsportöversikten. Välj Ingen åtgärd för att avaktivera."},"es":{"overview":"RESUMEN","motorsport":"Motor","upcoming":"Sesiones próximas y programadas","series_count":"categorías","next_session":"Próxima sesión","scheduled_live":"En curso según el horario","calendar":"Calendario","no_session":"No hay próximas sesiones","no_events":"Sin eventos","no_upcoming":"No se encontraron próximas sesiones.","days":"Días","hours":"Horas","minutes":"Minutos","all_day":"Todo el día","upcoming_rally":"Próximo rally","remaining":"restantes","weekend_schedule":"Programa del evento","show_schedule":"Mostrar programa","hide_schedule":"Ocultar programa","finished_hint":"Las sesiones finalizadas solo aparecen si permanecen en el calendario Lightsouts.","empty_schedule":"No se encontraron sesiones.","calendar_error":"Calendario","schedule_toggle":"Mostrar u ocultar programa","view":"Vista","view_series":"Tarjeta de categoría","view_overview":"Resumen de motor","layout":"Diseño del resumen","layout_list":"Lista vertical","layout_grid":"Cuadrícula de dos columnas","calendar_entity":"Entidad de calendario","max_series":"Número máximo de categorías","series":"Categoría (F1, MotoGP, WRC o all)","days_ahead":"Días de antelación","refresh":"Intervalo de actualización (minutos)","compact":"Tarjeta compacta","hold_action":"Pulsación larga","hold_none":"Sin acción","hold_navigate":"Abrir vista del panel","hold_more":"Más información","navigation_path":"Ruta de navegación del panel","navigation_help":"Utiliza la ruta exacta del panel de Home Assistant.","language":"Idioma","language_auto":"Automático (Home Assistant)","practice":"Práctica","free_practice":"Entrenamientos libres","warm_up":"Calentamiento","qualifying":"Clasificación","sprint":"Sprint","sprint_race":"Carrera sprint","race":"Carrera","feature_race":"Carrera principal","reverse_grid_race":"Carrera de parrilla invertida","rally":"Rally","expand_series":"Expandir tarjeta de categoría","collapse_series":"Cerrar tarjeta de categoría","series_shortcuts":"Accesos directos por categoría (opcional)","shortcut_series":"Categoría","shortcut_action":"Acción del acceso directo","shortcut_path":"Ruta del panel para la categoría","shortcut_help":"Pulsación larga en esta categoría del resumen. Sin acción para desactivar."}};
function resolveLanguage(configured,hass){
 const value=String(configured&&configured!=='auto'?configured:(hass?.locale?.language||hass?.language||'en')).toLowerCase().split(/[-_]/)[0];
 return Object.hasOwn(LANGUAGE_CATALOG,value)?value:'en';
}
const tr=(lang,key)=>LANGUAGE_CATALOG[lang]?.[key]??LANGUAGE_CATALOG.en[key]??key;
function localizedSession(name,lang){
 const source=String(name||'');
 const map=[['Free Practice','free_practice'],['Warm Up','warm_up'],['Sprint Race','sprint_race'],['Feature Race','feature_race'],['Reverse Grid Race','reverse_grid_race'],['Qualifying','qualifying'],['Practice','practice'],['Sprint','sprint'],['Race','race'],['Rally','rally']];
 for(const [prefix,key] of map)if(source.toLowerCase()===prefix.toLowerCase()||source.toLowerCase().startsWith(prefix.toLowerCase()+' '))return tr(lang,key)+source.slice(prefix.length);
 return source;
}
const localDate=(value,lang,opts)=>new Intl.DateTimeFormat(lang==='sv'?'sv-SE':lang==='es'?'es-ES':'en-GB',opts).format(new Date(value));
const COLORS={F1:'#078b52',F2:'#a71048',F3:'#bc501d','F1 Academy':'#073b70',MotoGP:'#a30b43',Moto2:'#4e609e',Moto3:'#7044a6',WRC:'#d80025',WEC:'#224b90',IMSA:'#226d89',IndyCar:'#bd3030','Indy NXT':'#366ba0',NASCAR:'#bd3030',"NASCAR O'Reilly":'#8c3b73','NASCAR Truck':'#a94a2c','Formula E':'#325ccc',Supercars:'#e24426',DTM:'#495b69',Superbike:'#8a2040'};
const FLAGS={Brazil:'🇧🇷',Qatar:'🇶🇦',Monaco:'🇲🇨',Portugal:'🇵🇹',Spain:'🇪🇸','United States':'🇺🇸','United Arab Emirates':'🇦🇪',Italy:'🇮🇹',Germany:'🇩🇪',France:'🇫🇷',Japan:'🇯🇵',Australia:'🇦🇺',Austria:'🇦🇹',Belgium:'🇧🇪',Netherlands:'🇳🇱',Canada:'🇨🇦',Mexico:'🇲🇽','United Kingdom':'🇬🇧',China:'🇨🇳',Thailand:'🇹🇭',Indonesia:'🇮🇩',Malaysia:'🇲🇾',Finland:'🇫🇮',Sweden:'🇸🇪',Norway:'🇳🇴',Denmark:'🇩🇰',Greece:'🇬🇷',Chile:'🇨🇱',Kenya:'🇰🇪',Paraguay:'🇵🇾',Croatia:'🇭🇷',Estonia:'🇪🇪',Poland:'🇵🇱',Ireland:'🇮🇪',India:'🇮🇳',Bahrain:'🇧🇭',Oman:'🇴🇲',Hungary:'🇭🇺'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const fmt=t=>new Intl.DateTimeFormat(undefined,{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(t));
const clock=t=>{let s=Math.max(0,Math.floor(t/1000));return [Math.floor(s/86400),Math.floor(s/3600)%24,Math.floor(s/60)%60,s%60].map(n=>String(n).padStart(2,'0'))};
const calendarTimestamp=value=>{if(/^\d{4}-\d{2}-\d{2}$/.test(String(value||''))){const [y,m,d]=value.split('-').map(Number);return new Date(y,m-1,d).getTime()}return Date.parse(value)};
function normalize(e){const info={};for(const line of String(e.description||'').split(/\r?\n/)){const match=line.match(/^\s*([^:]+):\s*(.*?)\s*,?\s*$/);if(match)info[match[1].toLowerCase().trim()]=match[2].replace(/,$/,'').trim()}const short=String(e.summary||'').split(':')[0].trim();const series=short||info.series||'Unknown';const start=calendarTimestamp(e.start),end=calendarTimestamp(e.end);return {series,full:info.series||series,event:info.event||e.summary||'Event',session:info.session||'Session',location:info.location||e.location||'',country:String(info.location||e.location||'').split(',').pop().trim(),start,end,allDay:!!e.all_day||/^\d{4}-\d{2}-\d{2}$/.test(String(e.start))}}
const shortCountdown=ms=>{const [d,h,m]=clock(ms);return d+'d '+h+'h '+m+'m'};
const scheduleIcon=name=>/qualif|shootout|hyperpole|superpole/i.test(name)?'⏱':/practic|warm up/i.test(name)?'🔧':/sprint/i.test(name)?'⚡':'⚑';
const OVERVIEW_CSS=`
.overview-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:16px}
.overview-title{font-size:23px;font-weight:800;letter-spacing:-.4px}
.overview-subtitle{font-size:12px;opacity:.75;margin-top:3px}
.overview-list{display:grid;grid-template-columns:minmax(0,1fr);gap:9px}.overview-list.grid-layout{grid-template-columns:repeat(2,minmax(0,1fr));align-items:start}.overview-list.grid-layout>.overview-group{min-width:0;width:100%}.overview-list.grid-layout .overview-entry{grid-template-columns:minmax(0,1fr);gap:6px}.overview-list.grid-layout .overview-entry-time{text-align:left}.overview-list.grid-layout .overview-entry-time strong{display:block;margin-right:0}.overview-list.grid-layout .overview-entry{padding:11px}.overview-list.grid-layout .overview-entry-session{line-height:1.35}.overview-list.grid-layout .overview-entry-time{font-size:11px}
.overview-group{min-width:0}.overview-entry{width:100%;color:#fff;font:inherit;text-align:left;cursor:pointer;--series:#294f71;position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:13px 14px;border-radius:10px;background:linear-gradient(110deg,var(--series),#101d2d 82%);border:1px solid #ffffff2c;min-width:0}
.overview-series{background:linear-gradient(115deg,var(--series),#0d1a2d 80%);border-radius:11px;padding:13px;min-width:0}
.overview-series-main{display:block;width:100%;padding:0;border:0;background:transparent;color:inherit;text-align:left;font:inherit;cursor:pointer}
.overview-series .title{font-size:clamp(20px,3vw,27px);margin:12px 0 5px}
.overview-series .count{margin:12px 0}
.overview-series .bottom{gap:12px}
.overview-series .btn{margin-top:10px}
.overview-series .schedule{margin-top:10px}
.overview-entry:focus-visible,.overview-series-main:focus-visible,.overview-schedule-toggle:focus-visible{outline:2px solid #fff;outline-offset:2px}
.overview-entry:focus-visible{outline:2px solid #fff;outline-offset:2px}.overview-schedule{margin:6px 0 4px}.overview-entry.active{outline:2px solid #ffca66;outline-offset:-2px}
.overview-entry-title{font-weight:750;font-size:14px}
.overview-entry-event{font-size:13px;margin-top:3px;overflow-wrap:anywhere}
.overview-entry-session{font-size:11px;opacity:.8;margin-top:4px}
.overview-entry-time{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;font-size:12px}
.overview-entry-time strong{display:block;font-size:18px}
.overview-empty{padding:20px 8px;opacity:.8}
@container (max-width:340px){.overview-list.grid-layout{grid-template-columns:minmax(0,1fr)}}@media(max-width:360px){.overview-entry{padding:10px;gap:6px}.overview-entry-time strong{font-size:15px}}
`;
const css=`:host{display:block;color:#fff;container-type:inline-size}*{box-sizing:border-box}.shell{font-family:var(--paper-font-body1_-_font-family,Arial,sans-serif);background:linear-gradient(115deg,var(--accent),#0d1a2d 72%);border-radius:16px;padding:18px;color:#fff;overflow:hidden;touch-action:pan-y;user-select:none}.top,.bottom,.line{display:flex;align-items:center;justify-content:space-between;gap:10px}.badge{font-size:12px;font-weight:700;background:#071321c9;border-radius:5px;padding:5px 8px}.title{font-size:clamp(22px,3.8vw,30px);font-weight:750;line-height:1.15;overflow-wrap:anywhere;margin:14px 0 6px}.place{opacity:.86;font-size:14px}.count{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;margin:17px 0}.cell{background:#050c15ac;border-radius:6px;text-align:center;padding:10px 2px}.num{font-size:clamp(19px,4vw,29px);font-weight:750;font-variant-numeric:tabular-nums}.unit{opacity:.75;font-size:11px}.bottom{background:#060b14aa;padding:10px;border-radius:6px;font-size:13px}.schedule{padding:12px;background:#071321a6;border-radius:8px;margin-top:12px}.line{border-bottom:1px solid #ffffff24;padding:8px 0;font-size:13px}.line:last-child{border:0}.line.finished{opacity:.55;text-decoration:line-through}.line.next{border-left:3px solid #73e9b0;padding-left:8px;background:#ffffff0f}.line>span:first-child{flex:1;min-width:0}.schedule-hint{font-size:11px;opacity:.72;margin:8px 0 0}.status{opacity:.8;font-size:11px}.btn{background:#ffffff1c;color:#fff;border:1px solid #ffffff55;border-radius:7px;padding:8px 12px;cursor:pointer;margin-top:12px}.error{font-size:12px;margin-top:8px;color:#ffe0b2}.compact .title{font-size:21px}.compact .count{margin:10px 0}.compact .cell{padding:6px 2px}@media(max-width:400px){.shell{padding:13px}.unit{font-size:10px}.num{font-size:20px}.place{font-size:12px}}`;
class MotorsportCard extends HTMLElement{
constructor(){super();this.attachShadow({mode:'open'});this._config={};this._events=[];this._expanded=false;this._lastFetch=0;this._loading=false;this._timer=null;this._holdTimer=null;this._held=false;this._startPos=null;this._renderedKey='';this._refreshGeneration=0;this._overviewExpandedKey=null;this._overviewScheduleExpanded=false;this._overviewChoices=[]}
setConfig(config){if(!config||typeof config!=='object')throw Error('Missing config');this._config={calendar_entity:'auto',series:'all',days_ahead:120,refresh_minutes:30,view:'series',language:'auto',overview_layout:'list',compact:false,hold_action:{action:'none'},...config};this._lastFetch=0;this._renderedKey='';this.render();this.fetchEvents()}
set hass(h){const previous=resolveLanguage(this._config.language,this._hass);this._hass=h;if(previous!==resolveLanguage(this._config.language,h))this.render();if(!this._timer)this._timer=setInterval(()=>this.tick(),1000);if(!this._lastFetch)this.fetchEvents()}
connectedCallback(){this.render()}
disconnectedCallback(){clearInterval(this._timer);this._timer=null;clearTimeout(this._holdTimer)}
getCardSize(){return this._config.view==='overview'?Math.max(3,Math.min(8,this._events.length)):this._expanded?6:3}
static getStubConfig(){return {type:'custom:motorsport-card',calendar_entity:'auto',series:'all'}}
static getConfigElement(){return document.createElement('motorsport-card-editor')}
tick(){const now=Date.now();if(now-this._lastFetch>=Math.max(5,Number(this._config.refresh_minutes)||30)*60000)this.fetchEvents();if(this._config.view==='overview'){const minute=Math.floor(now/60000);if(this._renderedKey!=='overview|'+minute)this.render();return}const next=this.choose(now);const key=next?.series+'|'+next?.event+'|'+next?.start+'|'+(next&&now>=next.start);if(key!==this._renderedKey){this.render();return}const cells=this.shadowRoot.querySelectorAll('[data-count]');if(cells.length===3){const values=next?clock(next.start-now).slice(0,3):['--','--','--'];cells.forEach((el,i)=>{if(el.textContent!==values[i])el.textContent=values[i]})}}
choose(now=Date.now()){const chosen=String(this._config.series||'all').toLowerCase();const filtered=this._events.filter(e=>(chosen==='all'||chosen===e.series.toLowerCase()||chosen===e.full.toLowerCase())&&e.end>now);return filtered.find(e=>e.start<=now&&now<e.end)||filtered[0]||null}
async fetchEvents(){if(!this._hass||this._loading)return;this._loading=true;const generation=++this._refreshGeneration;try{const entity=resolveCalendarEntity(this._hass,this._config.calendar_entity);const days=Math.max(1,Math.min(365,Number(this._config.days_ahead)||120));const events=await getCalendarEvents(this._hass,entity,days);if(generation!==this._refreshGeneration)return;this._events=events;this._error=''}catch(e){if(generation===this._refreshGeneration)this._error=String(e.message||e)}finally{this._loading=false;this._lastFetch=Date.now();this.render()}}
onHold(){this.performHoldAction(this._config.hold_action||{action:'none'})}
renderOverview(){
  const now=Date.now(),lang=resolveLanguage(this._config.language,this._hass);
  const choices=[...new Set(this._events.map(e=>e.series))].map(series=>{
    const events=this._events.filter(e=>e.series===series&&e.end>now);
    return events.find(e=>e.start<=now&&now<e.end)||events[0]||null;
  }).filter(Boolean).sort((a,b)=>Math.max(a.start,now)-Math.max(b.start,now)||a.series.localeCompare(b.series));
  const limit=Math.max(1,Math.min(30,Number(this._config.max_series)||12));
  const list=choices.slice(0,limit);
  const rows=list.map((e,index)=>{
    const active=e.start<=now&&now<e.end;
    const dateLabel=e.allDay?tr(lang,'all_day'):localDate(e.start,lang,{weekday:'short',day:'numeric',month:'short'});
    const remaining=active?tr(lang,'scheduled_live'):e.allDay?tr(lang,'upcoming_rally'):shortCountdown(e.start-now)+' '+tr(lang,'remaining');
    const key=JSON.stringify([e.series,e.event]);
    const expanded=this._overviewExpandedKey===key;
    const color=COLORS[e.series]||'#21476b';
    if(!expanded){
      return `<div class="overview-group"><button type="button" class="overview-entry ${active?'active':''}" data-overview-index="${index}" data-series-hold="${index}" aria-expanded="false" aria-label="${esc(e.series+' '+e.event+' – '+tr(lang,'expand_series'))}" style="--series:${color}"><div><div class="overview-entry-title">${esc(e.series)} · ${FLAGS[e.country]||'🏁'}</div><div class="overview-entry-event">${esc(e.event)}</div><div class="overview-entry-session">${esc(localizedSession(e.session,lang))} · ${esc(remaining)}</div></div><div class="overview-entry-time"><strong>${e.allDay?'📅':localDate(e.start,lang,{hour:'2-digit',minute:'2-digit'})}</strong>${esc(dateLabel)}</div></button></div>`;
    }
    const schedule=this._events.filter(item=>item.series===e.series&&item.event===e.event).sort((x,y)=>x.start-y.start);
    const values=clock(e.start-now).slice(0,3);
    const sessions=schedule.map(item=>{
      const finished=item.end<=now,highlighted=item.start===e.start&&item.end===e.end;
      return `<div class="line ${finished?'finished':highlighted?'next':''}"><span>${scheduleIcon(item.session)} ${esc(localizedSession(item.session,lang))}</span><span>${item.allDay?tr(lang,'all_day'):localDate(item.start,lang,{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span></div>`;
    }).join('');
    return `<div class="overview-group expanded"><div class="overview-series" style="--series:${color}">
      <button type="button" class="overview-series-main" data-overview-index="${index}" data-series-hold="${index}" aria-expanded="true" aria-label="${esc(e.series+' '+e.event+' – '+tr(lang,'collapse_series'))}">
        <div class="top"><span class="badge">🏁 ${esc(e.series)}</span><span class="status">${active?'🔴 '+esc(tr(lang,'scheduled_live')):esc(tr(lang,'next_session'))} <span aria-hidden="true">⌃</span></span></div>
        <div class="title">${esc(e.event)}</div><div class="place">${FLAGS[e.country]||'🏁'} ${esc(e.location)}</div>
        <div class="count">${values.map((n,i)=>`<div class="cell"><div class="num" data-overview-count="${index}-${i}">${n}</div><div class="unit">${esc([tr(lang,'days'),tr(lang,'hours'),tr(lang,'minutes')][i])}</div></div>`).join('')}</div>
        <div class="bottom"><span>${esc(localizedSession(e.session,lang))}</span><span>${e.allDay?esc(tr(lang,'all_day')):localDate(e.start,lang,{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span></div>
      </button>
      <button type="button" class="btn overview-schedule-toggle" data-schedule-index="${index}" aria-expanded="${this._overviewScheduleExpanded}" aria-label="${esc(tr(lang,this._overviewScheduleExpanded?'hide_schedule':'show_schedule'))}">${esc(tr(lang,this._overviewScheduleExpanded?'hide_schedule':'show_schedule'))}</button>
      ${this._overviewScheduleExpanded?`<div class="schedule overview-schedule"><strong>${esc(tr(lang,'weekend_schedule'))}</strong>${sessions||'<p>'+esc(tr(lang,'empty_schedule'))+'</p>'}<div class="schedule-hint">${esc(tr(lang,'finished_hint'))}</div></div>`:''}
    </div></div>`;
  }).join('');
  this._overviewChoices=list;
  this._renderedKey='overview|'+Math.floor(now/60000);
  this.shadowRoot.innerHTML=`<style>${css}${OVERVIEW_CSS}</style><div class="shell" style="--accent:#12395c"><div class="overview-head"><div><div class="overview-title">🏁 ${esc(tr(lang,'motorsport'))}</div><div class="overview-subtitle">${esc(tr(lang,'upcoming'))} · ${choices.length} ${esc(tr(lang,'series_count'))}</div></div><span class="badge">${esc(tr(lang,'overview'))}</span></div><div class="overview-list ${this._config.overview_layout==='grid'?'grid-layout':''}">${rows||'<div class="overview-empty">'+esc(tr(lang,'no_upcoming'))+'</div>'}</div>${this._error?'<div class="error">'+esc(tr(lang,'calendar_error'))+': '+esc(this._error)+'</div>':''}</div>`;
  this.shadowRoot.querySelectorAll('[data-overview-index]').forEach(button=>button.addEventListener('click',()=>{
    const selected=this._overviewChoices[Number(button.dataset.overviewIndex)];
    if(!selected)return;
    const key=JSON.stringify([selected.series,selected.event]);
    if(this._overviewExpandedKey===key){this._overviewExpandedKey=null;this._overviewScheduleExpanded=false;}
    else{this._overviewExpandedKey=key;this._overviewScheduleExpanded=false;}
    this.renderOverview();
  }));
  this.shadowRoot.querySelectorAll('[data-schedule-index]').forEach(button=>button.addEventListener('click',()=>{
    this._overviewScheduleExpanded=!this._overviewScheduleExpanded;
    this.renderOverview();
  }));
  this.shadowRoot.querySelectorAll('[data-series-hold]').forEach(button=>{
    let timer=null,start=null,held=false;
    const cancel=()=>{clearTimeout(timer);timer=null;};
    button.addEventListener('pointerdown',event=>{
      if(event.button!==0&&event.pointerType==='mouse')return;
      held=false;start=[event.clientX,event.clientY];cancel();
      if(!this.hasSeriesHold(this._overviewChoices[Number(button.dataset.seriesHold)]?.series))return;
      timer=setTimeout(()=>{
        held=true;const selected=this._overviewChoices[Number(button.dataset.seriesHold)];
        if(selected)this.onHoldForSeries(selected.series);
      },650);
    });
    button.addEventListener('pointermove',event=>{if(start&&Math.hypot(event.clientX-start[0],event.clientY-start[1])>12)cancel();});
    for(const name of ['pointerup','pointercancel','pointerleave'])button.addEventListener(name,cancel);
    button.addEventListener('contextmenu',event=>{
      const selected=this._overviewChoices[Number(button.dataset.seriesHold)];
      if(selected&&this.hasSeriesHold(selected.series))event.preventDefault();
    });
    // Suppress the click generated by a completed long press.
    button.addEventListener('click',event=>{if(held){event.stopImmediatePropagation();held=false;}},true);
  });
}
hasSeriesHold(series){
 const actions=this._config.hold_actions||{};
 const key=Object.keys(actions).find(name=>name.toLowerCase()===String(series).toLowerCase());
 const action=key?actions[key]:null;
 return !!action&&(action.action==='more-info'||(action.action==='navigate'&&typeof action.navigation_path==='string'&&action.navigation_path.startsWith('/')));
}
onHoldForSeries(series){
 const actions=this._config.hold_actions||{};
 const key=Object.keys(actions).find(name=>name.toLowerCase()===String(series).toLowerCase());
 const action=key?actions[key]:null;
 if(this.hasSeriesHold(series))this.performHoldAction(action);
}
performHoldAction(a){
 if(a?.action==='navigate'&&typeof a.navigation_path==='string'&&a.navigation_path.startsWith('/')){
   history.pushState(null,'',a.navigation_path);
   window.dispatchEvent(new Event('location-changed'));
 }else if(a?.action==='more-info'){
   const entityId=resolveCalendarEntity(this._hass,this._config.calendar_entity);
   this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId},bubbles:true,composed:true}));
 }
}
render(){if(!this.shadowRoot)return;if(this._config.view==='overview'){this.renderOverview();return}const lang=resolveLanguage(this._config.language,this._hass);const now=Date.now(),chosen=String(this._config.series||'all').toLowerCase();const filtered=this._events.filter(e=>(chosen==='all'||chosen===e.series.toLowerCase()||chosen===e.full.toLowerCase())&&e.end>now);const next=this.choose(now),current=next&&next.start<=now&&now<next.end,accent=COLORS[next?.series]||'#174a80',values=next?clock(next.start-now).slice(0,3):['--','--','--'];const schedule=next?this._events.filter(e=>e.series===next.series&&e.event===next.event).sort((a,b)=>a.start-b.start):[];this._renderedKey=next?.series+'|'+next?.event+'|'+next?.start+'|'+!!current;this.shadowRoot.innerHTML=`<style>${css}</style><div class="shell ${this._config.compact?'compact':''}" style="--accent:${accent}"><div class="top"><span class="badge">🏁 ${esc(next?.series||this._config.series||'Motorsport')}</span><span class="status">${current?'🔴 '+tr(lang,'scheduled_live'):next?tr(lang,'next_session'):tr(lang,'calendar')}</span></div><div class="title">${esc(next?.event||tr(lang,'no_session'))}</div><div class="place">${FLAGS[next?.country]||'🏁'} ${esc(next?.location||'')}</div><div class="count">${values.map((n,i)=>`<div class="cell"><div class="num" data-count>${n}</div><div class="unit">${[tr(lang,'days'),tr(lang,'hours'),tr(lang,'minutes')][i]}</div></div>`).join('')}</div><div class="bottom"><span>${esc(next?localizedSession(next.session,lang):tr(lang,'no_events'))}</span><span>${next?(next.allDay?tr(lang,'all_day'):localDate(next.start,lang,{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})):'—'}</span></div>${this._expanded?`<div class="schedule"><strong>${esc(tr(lang,'weekend_schedule'))}</strong>${schedule.map(e=>`<div class="line ${e.end<=now?'finished':e.start===next.start?'next':''}"><span>${scheduleIcon(e.session)} ${esc(localizedSession(e.session,lang))}</span><span>${e.allDay?tr(lang,'all_day'):localDate(e.start,lang,{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span></div>`).join('')||'<p>'+esc(tr(lang,'empty_schedule'))+'</p>'}</div>`:''}${this._error?`<div class="error">${esc(tr(lang,'calendar_error'))}: ${esc(this._error)}</div>`:''}<button class="btn" type="button" aria-expanded="${this._expanded}">${esc(tr(lang,this._expanded?'hide_schedule':'show_schedule'))}</button></div>`;const root=this.shadowRoot.querySelector('.shell');root.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;this._held=false;this._startPos=[e.clientX,e.clientY];clearTimeout(this._holdTimer);this._holdTimer=setTimeout(()=>{this._held=true;this.onHold()},650)});root.addEventListener('pointermove',e=>{if(this._startPos&&Math.hypot(e.clientX-this._startPos[0],e.clientY-this._startPos[1])>12)clearTimeout(this._holdTimer)});for(const kind of ['pointerup','pointercancel','pointerleave'])root.addEventListener(kind,()=>clearTimeout(this._holdTimer));root.addEventListener('contextmenu',e=>{if((this._config.hold_action||{}).action!=='none')e.preventDefault()});root.addEventListener('click',e=>{if(e.target.closest('button')||this._held)return;this._expanded=!this._expanded;this.render()});root.querySelector('button').addEventListener('click',e=>{e.stopPropagation();this._expanded=!this._expanded;this.render()})}
}
if(!customElements.get('motorsport-card'))customElements.define('motorsport-card',MotorsportCard);
window.customCards=window.customCards||[];if(!window.customCards.some(c=>c.type==='motorsport-card'))window.customCards.push({type:'motorsport-card',name:'Lightsouts Motorsport Card',description:'Lightsouts calendar countdown and schedule'});

class MotorsportCardEditor extends HTMLElement{
  constructor(){super();this.attachShadow({mode:'open'});this._config={};this._selectedShortcutSeries='F1'}
  setConfig(config){
    const incoming={...config};
    const changed=JSON.stringify(incoming)!==JSON.stringify(this._config);
    this._config=incoming;
    // HA echoes config-changed back to the editor. Keep focused inputs alive.
    if(changed)this.render();
  }
  set hass(h){
    const previous=resolveLanguage(this._config.language,this._hass);
    this._hass=h;
    // Entity and sensor updates must not replace active select/input elements.
    if(previous!==resolveLanguage(this._config.language,h))this.render();
  }
  render(){const lang=resolveLanguage(this._config.language,this._hass);
    this.shadowRoot.innerHTML=`<style>
    :host{display:block;color:var(--primary-text-color);font:inherit}
    .fields{display:grid;gap:12px;padding:12px}
    label{display:grid;gap:5px;font-size:13px}label[hidden],fieldset[hidden]{display:none}.shortcut-fields{border:1px solid var(--divider-color,#888);border-radius:8px;padding:10px;display:grid;gap:10px}.shortcut-fields legend{padding:0 5px;font-weight:600}
    input,select{background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color,#888);border-radius:6px;padding:9px;width:100%;font:inherit}
    .check{display:flex;align-items:center}.check input{width:auto;margin-right:8px}
    small{opacity:.7}
    </style><div class="fields">
    <label>${esc(tr(lang,'language'))}<select data-key="language"><option value="auto" ${!this._config.language||this._config.language==='auto'?'selected':''}>${esc(tr(lang,'language_auto'))}</option><option value="en" ${this._config.language==='en'?'selected':''}>English</option><option value="es" ${this._config.language==='es'?'selected':''}>Español</option><option value="sv" ${this._config.language==='sv'?'selected':''}>Svenska</option></select></label><label>${esc(tr(lang,'calendar_entity'))}<input data-key="calendar_entity" value="${esc(this._config.calendar_entity||'auto')}"></label>
    <label>${esc(tr(lang,'view'))}<select data-key="view"><option value="series" ${this._config.view!=='overview'?'selected':''}>${esc(tr(lang,'view_series'))}</option><option value="overview" ${this._config.view==='overview'?'selected':''}>${esc(tr(lang,'view_overview'))}</option></select></label>
    <label data-overview-only ${this._config.view==='overview'?'':'hidden'}>${esc(tr(lang,'layout'))}<select data-key="overview_layout"><option value="list" ${this._config.overview_layout!=="grid"?"selected":""}>${esc(tr(lang,'layout_list'))}</option><option value="grid" ${this._config.overview_layout==="grid"?"selected":""}>${esc(tr(lang,'layout_grid'))}</option></select></label><label data-overview-only ${this._config.view==='overview'?'':'hidden'}>${esc(tr(lang,'max_series'))}<input type="number" min="1" max="30" data-key="max_series" value="${Number(this._config.max_series)||12}"></label>
    <label>${esc(tr(lang,'series'))}<input data-key="series" value="${esc(this._config.series||'all')}"></label>
    <label>${esc(tr(lang,'days_ahead'))}<input type="number" min="1" max="365" data-key="days_ahead" value="${Number(this._config.days_ahead)||120}"></label>
    <label>${esc(tr(lang,'refresh'))}<input type="number" min="5" max="1440" data-key="refresh_minutes" value="${Number(this._config.refresh_minutes)||30}"></label>
    <label class="check"><input type="checkbox" data-key="compact" ${this._config.compact?'checked':''}> ${esc(tr(lang,'compact'))}</label>
    <label data-series-only ${this._config.view==='overview'?'hidden':''}>${esc(tr(lang,'hold_action'))}<select data-key="hold_action"><option value="none">${esc(tr(lang,'hold_none'))}</option><option value="navigate" ${this._config.hold_action?.action==='navigate'?'selected':''}>${esc(tr(lang,'hold_navigate'))}</option><option value="more-info" ${this._config.hold_action?.action==='more-info'?'selected':''}>${esc(tr(lang,'hold_more'))}</option></select></label>
    <fieldset class="shortcut-fields" data-overview-only ${this._config.view==='overview'?'':'hidden'}><legend>${esc(tr(lang,'series_shortcuts'))}</legend>
      <label>${esc(tr(lang,'shortcut_series'))}<select data-key="shortcut_series">${Object.keys(COLORS).map(name=>`<option value="${esc(name)}" ${name===this._selectedShortcutSeries?'selected':''}>${esc(name)}</option>`).join('')}</select></label>
      <label>${esc(tr(lang,'shortcut_action'))}<select data-key="shortcut_action">
      <option value="none">${esc(tr(lang,'hold_none'))}</option>
      <option value="navigate" ${this._config.hold_actions?.[this._selectedShortcutSeries]?.action==='navigate'?'selected':''}>${esc(tr(lang,'hold_navigate'))}</option>
      <option value="more-info" ${this._config.hold_actions?.[this._selectedShortcutSeries]?.action==='more-info'?'selected':''}>${esc(tr(lang,'hold_more'))}</option>
      </select></label>
      <label>${esc(tr(lang,'shortcut_path'))}<input data-key="shortcut_path" placeholder="/lovelace/f1-sensor" value="${esc(this._config.hold_actions?.[this._selectedShortcutSeries]?.navigation_path||'')}"></label>
      <small>${esc(tr(lang,'shortcut_help'))}</small>
      </fieldset><label data-series-only ${this._config.view==='overview'?'hidden':''}>${esc(tr(lang,'navigation_path'))}<input data-key="navigation_path" placeholder="/lovelace/f1-sensor" value="${esc(this._config.hold_action?.navigation_path||'')}"><small>${esc(tr(lang,'navigation_help'))}</small></label>
    </div>`;
    for(const el of this.shadowRoot.querySelectorAll('[data-key]'))el.addEventListener('change',()=>{
      const key=el.dataset.key,config={...this._config};
      if(key==='shortcut_series'){
        this._selectedShortcutSeries=el.value;
        const action=config.hold_actions?.[el.value]||{action:'none'};
        const select=this.shadowRoot.querySelector('[data-key="shortcut_action"]');
        const path=this.shadowRoot.querySelector('[data-key="shortcut_path"]');
        if(select)select.value=action.action||'none';
        if(path)path.value=action.navigation_path||'';
        return;
      }
      if(key==='shortcut_action'||key==='shortcut_path'){
        const name=this._selectedShortcutSeries;
        const actions={...(config.hold_actions||{})};
        const current={...(actions[name]||{action:'none'})};
        if(key==='shortcut_action')current.action=el.value;
        else current.navigation_path=el.value;
        if(current.action==='none'&&!current.navigation_path)delete actions[name];
        else actions[name]=current;
        config.hold_actions=actions;
      }
      else if(key==='hold_action')config.hold_action={...config.hold_action,action:el.value};
      else if(key==='navigation_path')config.hold_action={...config.hold_action,navigation_path:el.value};
      else if(key==='compact')config.compact=el.checked;
      else if(['days_ahead','refresh_minutes','max_series'].includes(key))config[key]=Number(el.value);
      else config[key]=el.value;
      this._config=config;
      if(key==='language')this.render();
      if(key==='view'){
        this.shadowRoot.querySelectorAll('[data-overview-only]').forEach(field=>{field.hidden=config.view!=='overview'});
        this.shadowRoot.querySelectorAll('[data-series-only]').forEach(field=>{field.hidden=config.view==='overview'});
      }
      this.dispatchEvent(new CustomEvent('config-changed',{detail:{config},bubbles:true,composed:true}));
    });
  }
}
if(!customElements.get('motorsport-card-editor'))customElements.define('motorsport-card-editor',MotorsportCardEditor);
