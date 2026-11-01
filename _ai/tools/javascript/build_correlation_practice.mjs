// Build the November 2 teaching workbook. Requires @oai/artifact-tool from
// Codex's bundled runtime; run with an output directory and optional preview directory.
// The two tabs intentionally repeat the original data so students can compare
// their work with an unchanged answer key after practicing.
import fs from 'node:fs/promises';
import path from 'node:path';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const outDir = process.argv[2];
const previewDir = process.argv[3];
if (!outDir) throw new Error('Usage: node build_correlation_practice.mjs OUTPUT_DIR [PREVIEW_DIR]');
const target = path.join(outDir, 'correlation_practice.xlsx');
try { await fs.access(target); throw new Error(`Refusing to overwrite ${target}`); }
catch (error) { if (error.code !== 'ENOENT') throw error; }

// Fictional, paired observations for teaching. These are not the project datasets
// A-D, real student measurements, or a validated clinical stress instrument.
const sleep = [5,7,6,8,6.5,9,5.5,7.5,6,8.5,7,5,8,6.5,7.5,5.5,9,6,8.5,7];
const stress = [28,22,26,18,24,16,30,21,18,17,25,27,20,22,15,24,14,27,19,20];
const screen = [5,4,6,2,4,3,6,4,3,2,6,5,4,5,3,4,2,6,3,5];
const data = sleep.map((x,i) => [`S${String(i+1).padStart(2,'0')}`,x,stress[i],screen[i]]);
const wb = Workbook.create();
const purple = '#4D1979';

// Keep the raw-data-first layout used in last week's workbook. Merged cells are
// limited to prose blocks, leaving every data column and calculation editable.
for (const name of ['Practice', 'Answer Key']) {
  const s = wb.worksheets.add(name);
  const key = name === 'Answer Key';
  s.showGridLines = false;
  s.tabColor = key ? '#A3A9AC' : purple;
  s.getRange('A1:N37').format.font = {name:'Arial',size:11,color:'#222222'};
  s.getRange('A1:N37').format.rowHeight = 24;
  s.getRange('A1:A21').format.columnWidth = 11;
  s.getRange('B1:D21').format.columnWidth = 16;
  s.getRange('E1:E37').format.columnWidth = 3;
  s.getRange('F1:F37').format.columnWidth = 32;
  s.getRange('G1:N37').format.columnWidth = 9;
  s.getRange('A1:D1').values = [['student','sleep_hours','stress_score','screen_hours']];
  s.getRange('A2:D21').values = data;
  s.getRange('A1:D1').format = {fill:purple,font:{bold:true,color:'#FFFFFF'}};
  s.getRange('B2:B21').setNumberFormat('0.0');
  s.getRange('C2:D21').setNumberFormat('0');
  s.freezePanes.freezeRows(1);

  function prose(address,text,bold=false) {
    s.mergeCells(address);
    const range=s.getRange(address);
    range.values=[[text]];
    range.format.wrapText=true;
    range.format.verticalAlignment='center';
    range.format.font.bold=bold;
  }
  prose('F1:N1',`Correlation ${key ? 'Answer Key' : 'Practice'}`,true);
  s.getRange('F1').format.font.size=16;
  s.getRange('F3:F5').values=[["Pearson's r"],['r squared'],['Number of paired observations']];
  s.getRange('G3:G5').format.fill=key ? '#F0EAF6' : '#FFF2CC';
  s.getRange('G3:G4').setNumberFormat('0.000');
  s.getRange('G5').setNumberFormat('0');
  if (key) {
    s.getRange('G3:G5').formulas=[['=CORREL(B2:B21,C2:C21)'],['=G3^2'],['=COUNT(B2:B21)']];
    prose('I3:N3',"r: =CORREL(B2:B21,C2:C21)");
    prose('I4:N4','r squared: =G3^2');
    prose('I5:N5','n: =COUNT(B2:B21)');
  }
  prose('F7:N7','1. Select B1:C21. Insert an XY scatter chart with markers only.');
  prose('F8:N8','2. Verify X = sleep_hours and Y = stress_score. Keep rows paired.');
  prose('F9:N9','3. Add a descriptive chart title and axis titles, including units.');
  prose('F10:N10','4. Describe direction, strength, linearity, and possible outliers.');
  prose('F11:N11','5. For lesson practice, calculate r, r squared, and n in G3:G5.');
  prose('F12:N13','Prep 3: use your assigned project data and report visual interpretations. Do not report r or r squared for Prep 3.',true);
  if (!key) {
    prose('F15:N16','Place your scatterplot below. Yellow cells are for your calculations.');
    s.getRange('F17:N30').format.borders={preset:'outside',style:'thin',color:'#CCCCCC'};
  } else {
    // Bind both axes to numeric cells so the exported chart is editable in Excel
    // and follows changes to this tab's original teaching observations.
    const chart=s.charts.add('scatter',s.getRange('B1:C21'));
    chart.title='Sleep Duration and Stress Score';
    chart.titleTextStyle.typeface='Arial';
    chart.titleTextStyle.fontSize=17;
    chart.hasLegend=false;
    chart.setPosition('F15','N30');
    chart.xAxis={axisType:'valueAxis',numberFormatCode:'0.0',numberFormatSourceLinked:false,textStyle:{typeface:'Arial',fontSize:12}};
    chart.yAxis={numberFormatCode:'0',numberFormatSourceLinked:false,textStyle:{typeface:'Arial',fontSize:12}};
    chart.xAxis.title.text='Sleep duration (hours/night)';
    chart.yAxis.title.text='Fictional stress score (points)';
    chart.series.items[0].fill=purple;
    console.log('chart binding',chart.series.items[0].categoryFormula,chart.series.items[0].formula);
  }
  prose('F32:N32',key ? 'Example visual interpretation' : 'Write three observations before opening Answer Key',true);
  prose('F33:N34',key ? 'Students reporting more sleep generally have lower stress scores. The downward pattern is fairly strong and approximately linear.' : 'Direction and strength:');
  prose('F35:N36',key ? 'The point at 6 hours and 18 stress points sits below nearby observations. Check it, but do not remove it simply because it differs.' : 'Linearity and possible outliers:');
  prose('A23:D25','Source: fictional teaching data created for APHS 20203, 2026-11-02. Sleep and screen time are hours/day; stress is an illustrative score.');
  prose('A27:D29','screen_hours is included only for the correlation-matrix example. Graph B and C for this exercise.');
}

// Check the answer independently of the spreadsheet engine, and verify that
// changing an input recalculates the result before restoring the teaching data.
function correlation(x,y) {
  const mx=x.reduce((a,b)=>a+b)/x.length, my=y.reduce((a,b)=>a+b)/y.length;
  return x.reduce((s,v,i)=>s+(v-mx)*(y[i]-my),0)/Math.sqrt(x.reduce((s,v)=>s+(v-mx)**2,0)*y.reduce((s,v)=>s+(v-my)**2,0));
}
const key=wb.worksheets.getItem('Answer Key');
const expected=correlation(sleep,stress);
if(Math.abs(key.getRange('G3').values[0][0]-expected)>1e-10) throw new Error('Correlation calculation mismatch');
key.getRange('C2').values=[[10]];
const altered=[10,...stress.slice(1)];
if(Math.abs(key.getRange('G3').values[0][0]-correlation(sleep,altered))>1e-10) throw new Error('Recalculation failed');
key.getRange('C2').values=[[stress[0]]];
wb.recalculate();
console.log((await wb.inspect({kind:'table',range:"'Answer Key'!F3:G5",include:'values,formulas',tableMaxRows:3,tableMaxCols:2})).ndjson);
console.log((await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!',options:{useRegex:true,maxResults:20}})).ndjson);
if(previewDir) {
  await fs.mkdir(previewDir,{recursive:true});
  for(const name of ['Practice','Answer Key']) {
    const preview=await wb.render({sheetName:name,range:'A1:N37',scale:1.5,format:'png'});
    await fs.writeFile(path.join(previewDir,`${name}.png`),new Uint8Array(await preview.arrayBuffer()));
  }
}
await fs.mkdir(outDir,{recursive:true});
await (await SpreadsheetFile.exportXlsx(wb)).save(target);
console.log(`Saved ${target}; r=${expected}; r squared=${expected**2}`);
