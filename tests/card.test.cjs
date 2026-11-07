/* Run: node --test tests/card.test.cjs */
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../dist/motorsport-card.js'), 'utf8');
const registrations = new Map();
const sandbox = {HTMLElement: class {}, customElements: {get: n=>registrations.get(n),define: (n,v)=>registrations.set(n,v)},window:{customCards:[]},Intl,Date,Math,String,Number,Array,Map,Error,RegExp,Promise,setInterval,clearInterval,clearTimeout,setTimeout};
vm.createContext(sandbox);
vm.runInContext(source,sandbox);
const normalize = e => vm.runInContext('normalize('+JSON.stringify(e)+')',sandbox);
test('registers card and editor',()=>{assert.ok(registrations.has('motorsport-card'));assert.ok(registrations.has('motorsport-card-editor'))});
test('MotoGP session description and UTC timestamps',()=>{
 const e=normalize({summary:'MotoGP: Losail International Circuit (Qatar)',start:'2026-11-08T12:40:00+00:00',end:'2026-11-08T12:50:00+00:00',description:'Series: MotoGP,\nEvent: Qatar Grand Prix,\nSession: Warm Up,\nLocation: Losail International Circuit, Qatar'});
 assert.equal(e.series,'MotoGP');assert.equal(e.event,'Qatar Grand Prix');assert.equal(e.session,'Warm Up');assert.equal(e.country,'Qatar');assert.equal(e.start,Date.parse('2026-11-08T12:40:00Z'));
});
test('F1 and F1 Academy are different series',()=>{
 const mk=summary=>normalize({summary,start:'2026-11-21T04:00:00Z',end:'2026-11-21T06:00:00Z',description:'Event: Las Vegas'});
 assert.equal(mk('F1: Las Vegas Street Circuit').series,'F1');
 assert.equal(mk('F1 Academy: Las Vegas Street Circuit').series,'F1 Academy');
});
test('WRC calendar date-only entries are all-day',()=>{
 const e=normalize({summary:'WRC: Monte-Carlo',start:'2027-01-21',end:'2027-01-25',description:'Series: WRC,\nEvent: Rallye Monte-Carlo,\nSession: Rally'});
 assert.equal(e.allDay,true);assert.equal(e.event,'Rallye Monte-Carlo');
 assert.equal(new Date(e.start).getHours(),0);
});
test('countdown returns days/hours/minutes/seconds',()=>{
 assert.equal(JSON.stringify(vm.runInContext('clock(90123000)',sandbox)),JSON.stringify(['01','01','02','03']));
});

test('human countdown for overview uses days hours minutes',()=>{
 assert.equal(vm.runInContext('shortCountdown(90123000)',sandbox),'01d 01h 02m');
});
test('schedule session categories use distinct icon names',()=>{
 assert.equal(vm.runInContext("scheduleIcon('Free Practice 1')",sandbox),'🔧');
 assert.equal(vm.runInContext("scheduleIcon('Qualifying')",sandbox),'⏱');
 assert.equal(vm.runInContext("scheduleIcon('Sprint')",sandbox),'⚡');
});
test('overview and series card expose layout options',()=>{
 const Card=registrations.get('motorsport-card');
 const sourceText=String(Card);
 assert.match(sourceText,/overview_layout/);
 assert.match(sourceText,/data-count/);
});

test('auto-detects renamed Lightsouts entity instead of assuming calendar.lightsouts',()=>{
 const hass={states:{'calendar.externa_sensorer_lightsouts':{state:'on'},'calendar.personal':{state:'off'}}};
 const result=vm.runInContext('resolveCalendarEntity('+JSON.stringify(hass)+',"auto")',sandbox);
 assert.equal(result,'calendar.externa_sensorer_lightsouts');
});
test('legacy default resolves unique renamed calendar',()=>{
 const hass={states:{'calendar.externa_sensorer_lightsouts':{state:'on'}}};
 const result=vm.runInContext('resolveCalendarEntity('+JSON.stringify(hass)+',"calendar.lightsouts")',sandbox);
 assert.equal(result,'calendar.externa_sensorer_lightsouts');
});
test('explicit missing calendar returns a useful error',()=>{
 const hass={states:{'calendar.externa_sensorer_lightsouts':{state:'on'}}};
 assert.throws(()=>vm.runInContext('resolveCalendarEntity('+JSON.stringify(hass)+',"calendar.unknown")',sandbox),/Kalenderentiteten/);
});
test('multiple matching calendars require explicit selection',()=>{
 const hass={states:{'calendar.lightsouts_a':{},'calendar.lightsouts_b':{}}};
 assert.throws(()=>vm.runInContext('resolveCalendarEntity('+JSON.stringify(hass)+',"auto")',sandbox),/Flera Lightsouts/);
});
test('grid CSS uses host as responsive container',()=>{
 assert.ok(source.includes(':host{display:block;color:#fff;container-type:inline-size'));
 assert.ok(source.includes('@container (max-width:340px)'));
});

test('overview supports click-to-expand the selected event schedule',()=>{
 assert.match(source,/data-overview-index/);
 assert.match(source,/this\._overviewExpandedKey/);
 assert.match(source,/selected\.series,selected\.event/);
 assert.match(source,/item\.series===e\.series&&item\.event===e\.event/);
 assert.match(source,/aria-expanded/);
});

test('language defaults to Home Assistant locale and supports regional variants',()=>{
 assert.equal(vm.runInContext("resolveLanguage('auto',{locale:{language:'sv-SE'}})",sandbox),'sv');
 assert.equal(vm.runInContext("resolveLanguage('auto',{locale:{language:'es-ES'}})",sandbox),'es');
 assert.equal(vm.runInContext("resolveLanguage('auto',{locale:{language:'en-US'}})",sandbox),'en');
 assert.equal(vm.runInContext("resolveLanguage('auto',{locale:{language:'fr-FR'}})",sandbox),'en');
 assert.equal(vm.runInContext("resolveLanguage('sv',{locale:{language:'en'}})",sandbox),'sv');
});
test('all three languages have consistent keys',()=>{
 const all=vm.runInContext('LANGUAGE_CATALOG',sandbox);
 const keys=Object.keys(all.en).sort().join('|');
 for(const lang of ['sv','es'])assert.equal(Object.keys(all[lang]).sort().join('|'),keys);
});
test('session labels are translated without modifying original event fields',()=>{
 assert.equal(vm.runInContext("localizedSession('Warm Up','sv')",sandbox),'Uppvärmning');
 assert.equal(vm.runInContext("localizedSession('Qualifying 2','es')",sandbox),'Clasificación 2');
 assert.equal(vm.runInContext("localizedSession('Free Practice 1','en')",sandbox),'Free Practice 1');
 assert.equal(vm.runInContext("localizedSession('Unknown Session','es')",sandbox),'Unknown Session');
});
test('language selector exists in Lovelace visual editor',()=>{
 assert.match(source,/data-key="language"/);
 assert.match(source,/language_auto/);
 assert.match(source,/if\(key==='language'\)this\.render\(\)/);
});

test('editor retains dropdown DOM across routine hass state updates',()=>{
 const Editor=registrations.get('motorsport-card-editor');
 const editor=Object.create(Editor.prototype);
 editor._config={language:'auto',view:'overview'};
 let renders=0;
 editor.render=()=>{renders++};
 editor.hass={locale:{language:'sv-SE'},states:{a:{state:'1'}}};
 assert.equal(renders,1,'initial locale switch may redraw');
 editor.hass={locale:{language:'sv-SE'},states:{a:{state:'2'}}};
 editor.hass={locale:{language:'sv-SE'},states:{a:{state:'3'}}};
 assert.equal(renders,1,'entity updates must not rebuild input elements');
 editor.setConfig({language:'auto',view:'overview'});
 assert.equal(renders,1,'config echoes should not rebuild input elements');
 editor.setConfig({language:'auto',view:'series'});
 assert.equal(renders,2,'real configuration changes still redraw');
 editor.hass={locale:{language:'en-US'},states:{}};
 assert.equal(renders,3,'an actual language change triggers redraw');
});

test('overview-only options are hidden for series cards',()=>{
 assert.match(source,/data-overview-only/);
 assert.match(source,/this\._config\.view==='overview'\?'':'hidden'/);
 assert.match(source,/label\[hidden\]\{display:none\}/);
 assert.match(source,/label\.hidden=config\.view!=='overview'/);
});

test('overview expands full Series Card and keeps weekend schedule independent',()=>{
 const Card=registrations.get('motorsport-card');
 const card=Object.create(Card.prototype);
 const now=Date.now();
 const sample=(series,event,session,hours)=>({
   series,full:series,event,session,location:'Circuit, Qatar',country:'Qatar',
   start:now+hours*3600000,end:now+(hours+1)*3600000,allDay:false
 });
 card._config={view:'overview',language:'sv',overview_layout:'grid',max_series:12,hold_actions:{}};
 card._hass={locale:{language:'sv-SE'}};
 card._events=[sample('MotoGP','Qatar Grand Prix','Warm Up',12),sample('MotoGP','Qatar Grand Prix','Race',16),sample('F1','São Paulo Grand Prix','Race',18)];
 card._overviewExpandedKey=null;card._overviewScheduleExpanded=false;card._error='';
 const listeners={};
 card.shadowRoot={
   innerHTML:'',
   querySelectorAll(selector){
     const html=this.innerHTML;
     const attr=selector.slice(1,-1).split('=')[0];
     const matches=[...html.matchAll(new RegExp(attr+'="(\\\\d+)"','g'))].map(m=>m[1]);
     return [...new Set(matches)].map(value=>({
       dataset:attr==='data-overview-index'?{overviewIndex:value}:attr==='data-schedule-index'?{scheduleIndex:value}:{seriesHold:value},
       addEventListener(name,fn,capture){(listeners[attr+':'+value+':'+name+':'+Boolean(capture)]=fn)}
     }));
   }
 };
 const event={stopImmediatePropagation(){}};
 const click=(type,index)=>listeners[type+':'+index+':click:false'](event);
 card.renderOverview();
 assert.doesNotMatch(card.shadowRoot.innerHTML,/data-overview-count/,'initial overview remains compact');
 click('data-overview-index',0);
 assert.match(card.shadowRoot.innerHTML,/data-overview-count/,'selected series expands into full card with countdown');
 assert.match(card.shadowRoot.innerHTML,/Visa helgschema/);
 assert.doesNotMatch(card.shadowRoot.innerHTML,/class="schedule overview-schedule"/);
 click('data-schedule-index',0);
 assert.match(card.shadowRoot.innerHTML,/class="schedule overview-schedule"/,'schedule opens within full card');
 assert.match(card.shadowRoot.innerHTML,/Qatar Grand Prix/);
 click('data-overview-index',0);
 assert.doesNotMatch(card.shadowRoot.innerHTML,/data-overview-count/,'tapping expanded main card closes it');
 assert.equal(card._overviewScheduleExpanded,false,'closing resets schedule');
});
test('overview per-series hold uses exact series shortcut, without global fallback',()=>{
 const Card=registrations.get('motorsport-card');
 const card=Object.create(Card.prototype);
 card._config={hold_action:{action:'navigate',navigation_path:'/lovelace/default'},hold_actions:{
   F1:{action:'navigate',navigation_path:'/lovelace/f1-sensor'},
   MotoGP:{action:'none'}
 }};
 const fired=[];
 card.performHoldAction=action=>fired.push(action);
 assert.equal(card.hasSeriesHold('F1'),true);
 assert.equal(card.hasSeriesHold('MotoGP'),false);
 assert.equal(card.hasSeriesHold('WRC'),false);
 card.onHoldForSeries('F1');
 card.onHoldForSeries('MotoGP');
 card.onHoldForSeries('WRC');
 assert.equal(fired.length,1);
 assert.equal(fired[0].navigation_path,'/lovelace/f1-sensor');
});
test('new translation keys are present for all languages',()=>{
 const catalog=vm.runInContext('LANGUAGE_CATALOG',sandbox);
 for(const lang of ['en','sv','es']){
   for(const key of ['expand_series','collapse_series','series_shortcuts','shortcut_series','shortcut_action','shortcut_path'])
     assert.equal(typeof catalog[lang][key],'string',lang+': '+key);
 }
});
