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
