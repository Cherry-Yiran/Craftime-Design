import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const defaults=JSON.parse(await readFile(new URL('../references/typography-roles.json',import.meta.url),'utf8'));
const present=v=>typeof v==='string'&&!!v.trim();

export function checkTypographyRecords(records,rules=defaults){
  if(!Array.isArray(records))throw new TypeError('Expected typography records');
  const issues=[],pending=[],excluded=[];
  let checkedRecords=0;
  for(const item of records){
    if(!item||typeof item!=='object'){pending.push({id:null,property:'typography.record'});continue;}
    const id=item.id??null;
    if(item.platform!=='web'||item.migration!=='current'){
      excluded.push({id,reason:'Current Web policy only; preserve historical and other-platform sources'});continue;
    }
    checkedRecords++;
    if(!present(item.id))pending.push({id,property:'typography.id'});
    const actual=item.actual??{};
    if(actual.mixed===true)pending.push({id,property:'typography.separate styled segments'});
    const weight=actual.fontWeight;
    const axis=actual.fontName?.variationSettings?.wght??actual.fontVariationSettings?.wght;
    const numericWeight=Number.isFinite(weight)?weight:undefined;
    const numericAxis=Number.isFinite(axis)?axis:undefined;
    const effective=numericAxis??numericWeight;
    if(effective===undefined)pending.push({id,property:'typography.actual numeric fontWeight/wght'});
    if(numericWeight!==undefined&&numericAxis!==undefined&&Math.abs(numericWeight-numericAxis)>0.001){
      issues.push({id,property:'typography.axisMismatch',actual:{fontWeight:weight,wght:axis},expected:'matching true numeric weight and wght axis'});
    }
    if(effective!==undefined&&effective<rules.font.forbidWeightsBelow){
      issues.push({id,property:'typography.minimumWeight',actual:effective,expected:rules.font.forbidWeightsBelow});
    }
    const role=present(item.semanticRole)&&Object.hasOwn(rules.roles,item.semanticRole)?rules.roles[item.semanticRole]:null;
    if(!role){pending.push({id,property:'typography.semanticRole',actual:item.semanticRole??null});continue;}
    if(!present(item.usage?.purpose))pending.push({id,property:'typography.usage.purpose'});
    if(!present(item.usage?.kind))pending.push({id,property:'typography.usage.kind'});
    else if(item.usage.kind!==role.kind){
      issues.push({id,property:'typography.roleKind',actual:{semanticRole:item.semanticRole,kind:item.usage.kind},expected:role.kind});
    }
    if(effective!==undefined&&!role.allowedWeights.includes(effective)){
      issues.push({id,property:'typography.semanticWeight',actual:effective,expected:role.allowedWeights,semanticRole:item.semanticRole});
    }
    // Classification cannot excuse control text as a small content tag.
    if(item.usage?.kind==='control'&&effective!==undefined&&effective<600){
      if(!issues.some(x=>x.id===id&&x.property==='typography.semanticWeight'))issues.push({id,property:'typography.controlMinimum',actual:effective,expected:600});
    }
  }
  return {status:issues.length?'有偏差':pending.length||!checkedRecords?'待验证':'通过',checkedRecords,issues,pending,excluded,
    scope:'Semantic roles and purposes are supplied evidence, not inferred from names or screenshots. No Figma writes or global interception.'};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  if(!process.argv[2]){process.stderr.write('Usage: node check-typography.mjs /absolute/path/to/records.json\n');process.exitCode=2;}
  else{const result=checkTypographyRecords(JSON.parse(await readFile(process.argv[2],'utf8')));process.stdout.write(JSON.stringify(result,null,2)+'\n');process.exitCode=result.status==='通过'?0:1;}
}
