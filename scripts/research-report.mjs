import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {chromium} from 'playwright';
// Render the checked-in research brief without a remote renderer or external fonts.
const source=readFileSync('docs/RESEARCH_BRIEF.md','utf8');
mkdirSync('.runtime/research',{recursive:true});
writeFileSync('.runtime/research/report-source.md',source);
const escape=text=>text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const inline=text=>escape(text).replace(/\[([^\]]+)\]\((https:\/\/[^)]+)\)/g,'<a href="$2">$1</a>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
let table=false;
const body=source.trim().split(/\r?\n\r?\n/).map(block=>{
  if(block.startsWith('|')){
    table=true;const rows=block.split(/\r?\n/).filter(row=>!/^\|[\s|:-]+\|$/.test(row));
    return `<table>${rows.map((row,i)=>`<tr>${row.split('|').slice(1,-1).map(cell=>`<${i?'td':'th'}>${inline(cell.trim())}</${i?'td':'th'}>`).join('')}</tr>`).join('')}</table>`;
  }
  const heading=block.match(/^(#{1,3}) (.+)$/);
  return heading?`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`:`<p>${inline(block.replace(/\r?\n/g,' '))}</p>`;
}).join('\n');
if(!table)throw Error('Research priority table missing');
const html=`<!doctype html><html lang="vi"><meta charset="UTF-8"><title>Statebound — Research brief</title><style>
@page{size:A4;margin:20mm 18mm 20mm}*{box-sizing:border-box}body{font:10.5pt/1.6 'Segoe UI',Arial,sans-serif;color:#292d23;margin:0}h1{font:600 29pt/1.15 'Segoe UI',Arial,sans-serif;letter-spacing:-1px;margin:8mm 0 7mm;padding-bottom:7mm;border-bottom:2px solid #d94324}h2{font-size:16pt;line-height:1.3;margin:8mm 0 3mm;break-after:avoid;color:#a6331c}p{margin:0 0 3mm;orphans:3;widows:3}a{color:#94361f;text-decoration:underline;text-underline-offset:2px}strong{font-weight:650}table{border-collapse:collapse;width:100%;font-size:9pt;margin:4mm 0 6mm}tr{break-inside:avoid}th,td{border:1px solid #cecec0;padding:3mm;vertical-align:top;text-align:left}th{background:#eeeee3}body>p:first-of-type{color:#686d5e;font-size:10pt}.label{font:9pt Consolas,monospace;letter-spacing:2px;color:#a6331c}@media screen{body{max-width:794px;padding:40px;margin:auto;background:#faf9f3}}
</style><body><div class="label">STATEBOUND / PRODUCT RESEARCH / 2026.09.07</div>${body}</body></html>`;
const path='.runtime/research/report.html';writeFileSync(path,html);
const browser=await chromium.launch();
try{
  const page=await browser.newPage();await page.goto(pathToFileURL(resolve(path)).href);
  await page.pdf({path:'submission/research-brief.pdf',format:'A4',printBackground:true,preferCSSPageSize:true,displayHeaderFooter:true,headerTemplate:'<span></span>',footerTemplate:'<div style="font:9px Arial;width:100%;margin:0 18mm;color:#686d5e;display:flex;justify-content:space-between"><span>Statebound · Evidence-led product research</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>'});
  const summary=await page.evaluate(()=>({headings:document.querySelectorAll('h2').length,links:document.querySelectorAll('a').length,tableRows:document.querySelectorAll('tr').length}));
  writeFileSync('.runtime/research/structure.json',JSON.stringify(summary,null,2));console.log(summary);
}finally{await browser.close();}
