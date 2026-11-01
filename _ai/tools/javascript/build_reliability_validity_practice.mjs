// Build the November 4 workbook with the same raw-data-first workflow as the
// earlier course exercises. Run with OUTPUT_DIR and optional PREVIEW_DIR using
// Codex's bundled Node runtime and @oai/artifact-tool dependency.
import fs from 'node:fs/promises';
import path from 'node:path';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const [outDir, previewDir] = process.argv.slice(2);
if (!outDir) throw new Error('Usage: node build_reliability_validity_practice.mjs OUTPUT_DIR [PREVIEW_DIR]');
const target = path.join(outDir, 'reliability_validity_practice.xlsx');
try { await fs.access(target); throw new Error(`Refusing to overwrite ${target}`); }
catch (error) { if (error.code !== 'ENOENT') throw error; }

// All records are invented for teaching. Fixed calibration masses isolate
// systematic error. The cohort has complete follow-up and no baseline cases,
// so row proportions represent one-week risks rather than prevalence.
const masses = [40,50,60,70,80,90].map((x,i) => [`M${i+1}`,x,x+5,x+5]);
const cohort = Array.from({length:20},(_,i) => [
  `S${String(i+1).padStart(2,'0')}`, i<10 ? 'Short' : 'Not short',
  (i<6 || (i>=10 && i<12)) ? 'Yes' : 'No'
]);
const wb = Workbook.create();
const purple = '#4D1979';
for (const name of ['Practice','Answer Key']) {
  const s = wb.worksheets.add(name);
  const key = name === 'Answer Key';
  s.showGridLines=false;
  s.tabColor=key ? '#A3A9AC' : purple;
  s.getRange('A1:M52').format.font={name:'Arial',size:11,color:'#222222'};
  s.getRange('A1:M52').format.rowHeight=25;
  s.getRange('A1:A52').format.columnWidth=12;
  s.getRange('B1:D52').format.columnWidth=17;
  s.getRange('E1:E52').format.columnWidth=3;
  s.getRange('F1:F52').format.columnWidth=29;
  s.getRange('G1:I52').format.columnWidth=14;
  s.getRange('J1:J52').format.columnWidth=3;
  s.getRange('K1:M52').format.columnWidth=12;
  s.freezePanes.freezeRows(1);

  // Merge only instructional prose, preserving individual data and result cells.
  function prose(address,text,bold=false) {
    s.mergeCells(address);
    const r=s.getRange(address);
    r.values=[[text]];
    r.format.wrapText=true;
    r.format.verticalAlignment='center';
    r.format.font.bold=bold;
  }
  function header(address) {
    s.getRange(address).format={fill:purple,font:{bold:true,color:'#FFFFFF'},wrapText:true,verticalAlignment:'center'};
  }
  function answer(address,formula,format='0.00') {
    s.getRange(address).format.fill=key?'#F0EAF6':'#FFF2CC';
    s.getRange(address).setNumberFormat(format);
    if(key) s.getRange(address).formulas=[[formula]];
  }
  s.getRange('A1:D1').values=[['Mass ID','Reference (kg)','Reading 1 (kg)','Reading 2 (kg)']];
  s.getRange('A1:D1').format.rowHeight=34;
  s.getRange('A2:D7').values=masses;
  header('A1:D1');
  prose('F1:M1',`Reliability and Validity: ${name}`,true);
  s.getRange('F1').format.font.size=16;
  prose('F2:M3',key ? 'Worked solutions use the original fictional data. Inspect each formula in the formula bar.' : 'Complete the yellow answer cells and written responses. Try both exercises before opening Answer Key.');
  prose('F4:M4','A. Repeatable readings and measurement error',true);
  s.getRange('F5:I5').values=[['Mass ID','R2 minus R1','R1 minus ref.','R2 minus ref.']];
  header('F5:I5');
  s.getRange('F5:I5').format.rowHeight=34;
  for(let i=0;i<6;i++) {
    const row=i+6, source=i+2;
    s.getRange(`F${row}`).formulas=[[`=A${source}`]];
    answer(`G${row}`,`=D${source}-C${source}`);
    answer(`H${row}`,`=C${source}-B${source}`);
    answer(`I${row}`,`=D${source}-B${source}`);
  }
  s.getRange('F12:F13').values=[['Mean difference (kg)'],['r: reference vs. reading 1']];
  for(const col of ['G','H','I']) answer(`${col}12`,`=AVERAGE(${col}6:${col}11)`);
  answer('G13','=CORREL(B2:B7,C2:C7)','0.000');
  prose('K5:M7','In G6 enter =D2-C2. In H6 enter =C2-B2. In I6 enter =D2-B2. Fill each down to row 11.');
  prose('K9:M13','Average each difference column in row 12. In G13 enter =CORREL(B2:B7,C2:C7). Compare the differences with r.');
  prose('F15:M16',key ? 'Repeated readings agree exactly, but both readings are 5 kg too high. The scale is repeatable and systematically inaccurate.' : 'Explain what the repeated readings and reference differences tell you:');
  prose('F17:M18',key ? 'r = 1.000 despite the 5 kg error. Correlation alone cannot establish agreement or accuracy.' : 'Does r establish that the scale is accurate? Explain:');
  prose('A9:D10','Fictional calibration data: known reference masses measured twice under the same conditions.');

  s.getRange('A12:C12').values=[['Student','Sleep group','New fatigue']];
  s.getRange('A13:C32').values=cohort;
  header('A12:C12');
  s.getRange('B13:B32').dataValidation={rule:{type:'list',values:['Short','Not short']}};
  s.getRange('C13:C32').dataValidation={rule:{type:'list',values:['Yes','No']}};
  prose('F20:M20','B. Reconstruct a 2×2 table and compare risks',true);
  s.getRange('F22:I25').values=[['Sleep group','Yes','No','Total'],['Short',null,null,null],['Not short',null,null,null],['Total',null,null,null]];
  header('F22:I22');
  for(const row of [23,24]) {
    for(const col of ['G','H']) answer(`${col}${row}`,`=COUNTIFS($B$13:$B$32,$F${row},$C$13:$C$32,${col}$22)`,'0');
    answer(`I${row}`,`=SUM(G${row}:H${row})`,'0');
  }
  for(const col of ['G','H','I']) answer(`${col}25`,`=SUM(${col}23:${col}24)`,'0');
  prose('K22:M25','G23 counts Short + Yes. Use =COUNTIFS($B$13:$B$32,$F23,$C$13:$C$32,G$22). Copy across to H23, then down to row 24.');
  s.getRange('F27:F32').values=[['Risk: short sleep'],['Risk: not short sleep'],['Risk ratio'],['Risk difference'],['Odds ratio'],['Short sleep among cases']];
  answer('G27','=G23/I23','0.0%');
  answer('G28','=G24/I24','0.0%');
  answer('G29','=G27/G28','0.00');
  answer('G30','=G27-G28','0.0%');
  answer('G31','=(G23*H24)/(H23*G24)','0.00');
  answer('G32','=G23/G25','0.0%');
  prose('H27:M28','Risks: Yes / row total. G27 =G23/I23 and G28 =G24/I24. Format as Percent.');
  prose('H29:M30','RR =G27/G28. Difference =G27-G28. A difference displayed as 40.0% means 40 percentage points.');
  prose('H31:M32','OR =(G23*H24)/(H23*G24). Among cases =G23/G25. This last denominator answers a different question.');
  prose('A34:D37','Fictional one-week cohort. Short = usual sleep <7 h/night; Not short = ≥7 h/night. All 20 start without fatigue and complete follow-up. New fatigue = reported new episode during that week.');
  prose('A39:D42','These records were invented for APHS 20203, 2026-11-04. They are separate from project datasets A–C. The sleep grouping is a teaching definition.');
  prose('F34:M35',key ? 'One-week risk: 60.0% with short sleep and 20.0% without. RR = 3.00; risk difference = 40 percentage points.' : 'Interpret the two risks, risk ratio, and risk difference in a sentence:');
  prose('F37:M38',key ? 'OR = 6.00 compares odds, not risks. Of the 8 cases, 6 (75.0%) had short sleep. That is different from the risk among short sleepers (60.0%).' : 'Explain the odds ratio and why G32 differs from the risk in G27:');
  prose('F40:M41',key ? 'This observational association does not establish that sleep caused fatigue. Other differences, reporting error, and chance could contribute.' : 'Does this result establish causation? What limits generalization?');
  prose('F43:M44',key ? 'Example limitations: students may report fatigue differently; volunteers from one campus may not represent other populations. Standard definitions and broader sampling address different problems.' : 'Identify one measurement concern and one generalizability concern:');
  prose('F46:M47','Lesson practice only. Prep 3 still uses your assigned data, continuous summaries, histogram, scatterplot, interpretations, and contributions. No categorical analysis is added to Prep 3.',true);
  prose('F49:M52','2×2 formula reference: CDC Field Epidemiology Manual, Analyzing and Interpreting Data. https://www.cdc.gov/field-epi-manual/php/chapters/analyze-interpret-data.html');
  // Give students explicit writable response cells instead of requiring them
  // to overwrite the questions. The answer key keeps its worked explanations.
  if(!key) {
    for(const [promptRow,responseRow] of [[15,16],[17,18],[34,35],[37,38],[40,41],[43,44]]) {
      const prompt=s.getRange(`F${promptRow}`).values[0][0];
      s.unmergeCells(`F${promptRow}:M${responseRow}`);
      prose(`F${promptRow}:M${promptRow}`,prompt);
      prose(`F${responseRow}:M${responseRow}`,'');
      s.getRange(`F${responseRow}:M${responseRow}`).format.fill='#FFF2CC';
      s.getRange(`F${responseRow}:M${responseRow}`).format.rowHeight=42;
    }
  }
}

// Verify against direct arithmetic, then perturb a genuine input to establish
// recalculation. Restore it before export so the key matches the slide answers.
const key=wb.worksheets.getItem('Answer Key');
wb.recalculate();
const expected={G12:0,H12:5,I12:5,G13:1,G23:6,H23:4,I23:10,G24:2,H24:8,I24:10,G25:8,H25:12,I25:20,G27:.6,G28:.2,G29:3,G30:.4,G31:6,G32:.75};
for(const [cell,value] of Object.entries(expected)) {
  const actual=key.getRange(cell).values[0][0];
  if(typeof actual!=='number'||!Number.isFinite(actual)||Math.abs(actual-value)>1e-10) throw new Error(`Incorrect answer at ${cell}`);
}
key.getRange('C13').values=[['No']];
wb.recalculate();
if(Math.abs(key.getRange('G29').values[0][0]-2.5)>1e-10) throw new Error('Cohort recalculation failed');
key.getRange('C13').values=[['Yes']];
key.getRange('C2').values=[[46]];
wb.recalculate();
if(Math.abs(key.getRange('H12').values[0][0]-31/6)>1e-10) throw new Error('Calibration recalculation failed');
key.getRange('C2').values=[[45]];
wb.recalculate();
console.log((await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#NUM!|#N/A',options:{useRegex:true,maxResults:20}})).ndjson);
console.log('Verified original answers and two input-change recalculation checks.');
await fs.mkdir(outDir,{recursive:true});
await (await SpreadsheetFile.exportXlsx(wb)).save(target);
if(previewDir) {
  await fs.mkdir(previewDir,{recursive:true});
  for(const name of ['Practice','Answer Key']) {
    for(const [part,range] of [['top','A1:M18'],['bottom','F20:M47']]) {
      const blob=await wb.render({sheetName:name,range,scale:1.5,format:'png'});
      await fs.writeFile(path.join(previewDir,`${name.replaceAll(' ','_')}-${part}.png`),new Uint8Array(await blob.arrayBuffer()));
    }
  }
}
console.log(target);
