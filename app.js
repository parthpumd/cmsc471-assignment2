const $ = s => document.querySelector(s);
const ns = 'http://www.w3.org/2000/svg';
const fmt = n => n.toFixed(2);
const signed = n => `${n > 0 ? '+' : ''}${fmt(n)}`;
const mean = rows => rows.reduce((sum, r) => sum + r.gap, 0) / rows.length;
const chosen = enrollmentData.filter(r => r.female >= r.male).sort((a,b) => b.female-a.female).slice(0,8);
let audited = false;
function node(tag, attrs, text) {
 const e = document.createElementNS(ns, tag);
 Object.entries(attrs).forEach(([k,v]) => e.setAttribute(k,v));
 if (text !== undefined) e.textContent = text;
 return e;
}
function draw(selector, rows, dark=false) {
 const svg = $(selector);
 svg.replaceChildren();
 const width=1000,left=180,right=105,top=65,rowHeight=30,height=top+rows.length*rowHeight+20;
 const x = value => left+value/100*(width-left-right);
 const ink=dark?'#e7efdf':'#18352f',muted=dark?'#b3c5be':'#53685f',grid=dark?'#345052':'#e1e8e1';
 svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
 svg.append(node('title',{},`${rows.length} economies: female and male adjusted net primary enrollment, 2017`));
 svg.append(node('text',{x:left,y:16,fill:muted,'font-size':12},'Adjusted net enrollment (%)'));
 svg.append(node('text',{x:width-8,y:16,fill:muted,'font-size':12,'text-anchor':'end'},'Female − male (pp)'));
 for(let tick=0;tick<=100;tick+=20){
  svg.append(node('line',{x1:x(tick),x2:x(tick),y1:40,y2:height-15,stroke:grid}));
  svg.append(node('text',{x:x(tick),y:35,fill:muted,'font-size':12,'text-anchor':'middle'},tick));
 }
 rows.forEach((r,i)=>{
  const y=top+i*rowHeight;
  const g=node('g',{'tabindex':0,'role':'img','aria-label':`${r.name}: female ${fmt(r.female)} percent, male ${fmt(r.male)} percent, gap ${signed(r.gap)} percentage points`});
  g.append(node('rect',{x:0,y:y-13,width,height:28,fill:i%2===0?(dark?'#1c3638':'#f6f8f4'):'transparent',opacity:.65}));
  g.append(node('text',{x:left-13,y:y+4,fill:ink,'font-size':12,'text-anchor':'end'},r.name));
  g.append(node('line',{x1:x(r.female),x2:x(r.male),y1:y,y2:y,stroke:dark?'#a4b9ab':'#9eaaa2','stroke-width':3}));
  g.append(node('circle',{cx:x(r.male),cy:y,r:5,fill:dark?'#f1b580':'#b24c22',stroke:dark?'#152e30':'white','stroke-width':1}));
  g.append(node('circle',{cx:x(r.female),cy:y,r:4,fill:dark?'#7bd2ca':'#007d83',stroke:dark?'#152e30':'white','stroke-width':1}));
  g.append(node('text',{x:width-8,y:y+4,fill:ink,'font-size':12,'text-anchor':'end'},signed(r.gap)));
  g.append(node('title',{},`${r.name} · Female ${fmt(r.female)}% · Male ${fmt(r.male)}% · Gap ${signed(r.gap)} pp`));
  const show = e => {const t=$('#tooltip');t.textContent=`${r.name} · Female: ${fmt(r.female)}% · Male: ${fmt(r.male)}% · Gap: ${signed(r.gap)} pp`;t.hidden=false;const rect=g.getBoundingClientRect();t.style.left=`${Math.min(e.clientX||rect.left+200,window.innerWidth-290)}px`;t.style.top=`${Math.min((e.clientY||rect.top)+18,window.innerHeight-95)}px`;};
  g.addEventListener('pointermove',show);g.addEventListener('focus',show);
  g.addEventListener('pointerleave',()=>$('#tooltip').hidden=true);g.addEventListener('blur',()=>$('#tooltip').hidden=true);
  svg.append(g);
 });
 if(!rows.length)svg.append(node('text',{x:left,y:60,fill:ink,'font-size':14},'No matching observations. Clear the search or reset the view.'));
}
function renderWhite(){
 const region=$('#region').value,query=$('#search').value.trim().toLowerCase(),sort=$('#sort').value;
 const rows=enrollmentData.filter(r=>(region==='all'||r.region===region)&&r.name.toLowerCase().includes(query));
 rows.sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):sort==='female'?b.female-a.female:a.gap-b.gap);
 const biggest=rows.length?rows.reduce((a,b)=>Math.abs(a.gap)>Math.abs(b.gap)?a:b):null;
 $('#metrics').innerHTML=`<div class="metric"><strong>${rows.length}</strong><span>economies in the current view</span></div><div class="metric"><strong>${rows.length?signed(mean(rows)):'—'} <small>pp</small></strong><span>unweighted mean female–male gap</span></div><div class="metric"><strong>${biggest?fmt(Math.abs(biggest.gap)):'—'} <small>pp</small></strong><span>largest absolute gap${biggest?' · '+biggest.name:''}</span></div>`;
 $('#count').textContent=`Showing ${rows.length} of ${enrollmentData.length} eligible economies · 2017 only · Scroll inside the chart to inspect every row. Hover or focus a row for exact rates.`;
 draw('#white-chart',rows);
 $('#table').replaceChildren(...rows.map(r=>{const tr=document.createElement('tr');[r.name,r.region,fmt(r.female),fmt(r.male),signed(r.gap)].forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.append(td)});return tr}));
}
function renderBlack(){
 const rows=audited?[...enrollmentData].sort((a,b)=>a.gap-b.gap):chosen;
 $('#black-heading').textContent=audited?'The omitted economies change the story.':'Primary education has reached gender equality.';
 $('#black-deck').textContent=audited?'All eligible observations, with the same scale and same source. Enrollment gaps run in both directions.':'Girls match or outperform boys across leading education markets. The access gap is behind us.';
 const n=enrollmentData.filter(r=>r.female>=r.male).length;
 $('#black-number').textContent=audited?`${n}/80`:'100%';
 $('#black-number-label').textContent=audited?'eligible economies have female enrollment at or above male enrollment; this is not a measure of equality':'of featured economies have female enrollment at or above male enrollment';
 $('#black-note').textContent=audited?'World Bank · all 80 comparable economies · 2017 · not a worldwide population estimate':'World Bank · adjusted net primary enrollment · selected economies · 2017';
 $('#audit').textContent=audited?'Return to the selective frame':'Reveal what this frame leaves out';
 $('#audit').setAttribute('aria-pressed',String(audited));
 $('#audit-box').hidden=!audited;
 $('#audit-box').textContent=`Selection recipe: retain economies where female enrollment ≥ male enrollment, rank by female enrollment, take the top 8. This hides ${enrollmentData.length-chosen.length} eligible economies. The full sample’s female–male gap ranges from ${signed(Math.min(...enrollmentData.map(r=>r.gap)))} to ${signed(Math.max(...enrollmentData.map(r=>r.gap)))} percentage points. Neither a favorable subset nor a near-zero mean establishes equal access everywhere.`;
 draw('#black-chart',rows,true);
}
[...new Set(enrollmentData.map(r=>r.region))].sort().forEach(region=>{const option=document.createElement('option');option.value=region;option.textContent=region;$('#region').append(option)});
$('#region').addEventListener('change',renderWhite);$('#sort').addEventListener('change',renderWhite);$('#search').addEventListener('input',renderWhite);
$('#reset').addEventListener('click',()=>{$('#region').value='all';$('#sort').value='gap';$('#search').value='';renderWhite()});
$('#audit').addEventListener('click',()=>{audited=!audited;renderBlack()});
renderWhite();renderBlack();
