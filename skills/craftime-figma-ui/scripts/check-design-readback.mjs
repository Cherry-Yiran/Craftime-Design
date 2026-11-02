import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { checkTypographyRecords } from './check-typography.mjs';

const present = value => typeof value === 'string' && !!value.trim();
const equal = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}
const categories = ['texts', 'icons', 'instances', 'protectedRegions'];
const protectedIds = {navigation: '1336:145424', header: '1336:144845'};
const snapshotFields = ['structure', 'layout', 'style', 'text', 'bindings', 'reactions', 'ancestorEffects'];

export function checkDesignReadback(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('Expected a readback object');
  const issues = [], pending = [], excluded = [];
  let checkedRecords = 0;
  const missing = (id, property) => pending.push({id: id ?? null, property});
  const mismatch = (id, property, actual, expected) => issues.push({id, property, actual, expected});
  const compare = (id, property, actual, expected) => {
    if (actual === undefined || expected === undefined || actual === null || expected === null) missing(id, property);
    else if (!equal(actual, expected)) mismatch(id, property, actual, expected);
  };
  const evidence = (item, screenshot = true) => {
    const id = item?.id;
    if (!present(id)) missing(id, 'id');
    for (const key of ['fileKey', 'nodeId', 'readAt']) if (!present(item?.evidence?.[key])) missing(id, `evidence.${key}`);
    if (item?.evidence?.nodeId && item.evidence.nodeId !== id) mismatch(id, 'evidence.nodeId', item.evidence.nodeId, id);
    if (screenshot && (!present(item?.screenshot?.reference) || item.screenshot.reviewed !== true)) missing(id, 'reviewed screenshot');
  };
  const definition = item => {
    for (const key of ['fileKey', 'nodeId', 'readAt']) if (!present(item.expected?.source?.[key])) missing(item.id, `expected.source.${key}`);
  };
  for (const key of ['targetFileKey', 'targetNodeId', 'readAt']) if (!present(input.scope?.[key])) missing(null, `scope.${key}`);
  if (input.scope?.fullPage === true) {
    for (const region of Object.keys(protectedIds)) {
      if (input.scope?.categories?.protectedRegions?.inScope !== true || !input.protectedRegions?.some(item => item?.region === region)) missing(null, `fullPage.${region}`);
    }
  }
  for (const category of categories) {
    const applicability = input.scope?.categories?.[category];
    if (applicability?.inScope === false && present(applicability.reason)) {
      if (Array.isArray(input[category]) && input[category].length) mismatch(null, `${category}.scope`, 'records supplied for excluded category', 'no records');
      excluded.push({category, reason: applicability.reason}); continue;
    }
    if (applicability?.inScope !== true) missing(null, `${category}.applicability`);
    const records = input[category];
    if (!Array.isArray(records) || !records.length) { missing(null, `${category}.records`); continue; }
    for (const item of records) {
      checkedRecords++;
      if (!item || typeof item !== 'object') { missing(null, `${category}.record`); continue; }
      const id = item.id;
      evidence(item);
      const actual = item.actual ?? {}, expected = item.expected ?? {};
      if (category === 'texts') {
        const semantic = checkTypographyRecords([item]);
        issues.push(...semantic.issues);
        pending.push(...semantic.pending);
        definition(item);
        compare(id, 'type', actual.type, 'TEXT');
        if (!present(expected.role)) missing(id, 'expected.role');
        if (!present(expected.styleId)) missing(id, 'expected.styleId');
        else compare(id, 'styleId', actual.styleId, expected.styleId);
        for (const property of ['fontFamily', 'fontWeight', 'fontSize', 'lineHeight', 'letterSpacing']) compare(id, property, actual[property], expected[property]);
        if (item.platform === 'web' && item.language === 'latin' && item.migration === 'current') compare(id, 'webLatinFont', actual.fontFamily, 'Open Sans');
        if (!present(item.platform) || !present(item.language) || !present(item.migration)) missing(id, 'platform/language/migration');
        if (item.migration === 'historical' && !present(item.historicalSource)) missing(id, 'historicalSource');
        // Mixed text must be expanded into individual segment records, never a guessed uniform style.
        if (actual.mixed === true) missing(id, 'separate styled segment records');
      }
      if (category === 'icons') {
        let official = false;
        try { const url = new URL(item.officialSource); official = url.protocol === 'https:' && ['www.mingcute.com', 'mingcute.com'].includes(url.hostname); } catch {}
        if (!present(item.officialSource)) missing(id, 'officialSource');
        else if (!official) mismatch(id, 'officialSource', item.officialSource, 'https://www.mingcute.com/');
        if (!present(item.iconName) || !present(item.assetRevision)) missing(id, 'iconName/assetRevision');
        if (!Number.isFinite(actual.finalWidth) || !Number.isFinite(actual.finalHeight)) missing(id, 'final size');
        else if (actual.finalWidth <= 0 || actual.finalHeight <= 0) mismatch(id, 'final size', [actual.finalWidth, actual.finalHeight], 'positive px dimensions');
        if (!Array.isArray(actual.paths) || !actual.paths.length) missing(id, 'actual native paths');
        else for (const path of actual.paths) {
          compare(id, 'path.type', path.type, 'VECTOR');
          compare(id, 'path.editable', path.editable, true);
          if (!Number.isInteger(path.vectorPathsCount)) missing(id, 'vectorPathsCount');
          else if (path.vectorPathsCount < 1) mismatch(id, 'vectorPathsCount', path.vectorPathsCount, 'at least one path');
          if (!Array.isArray(path.strokes)) missing(id, 'path.strokes');
          else if (!path.strokes.some(paint => paint.type === 'SOLID' && paint.visible !== false && (paint.opacity ?? 1) > 0)) mismatch(id, 'visible real Stroke', path.strokes, 'visible SOLID stroke');
          if (!Number.isFinite(path.effectiveStrokeWeightPx)) missing(id, 'effectiveStrokeWeightPx');
          else if (Math.abs(path.effectiveStrokeWeightPx - 1.67) > 0.001) mismatch(id, 'effectiveStrokeWeightPx', path.effectiveStrokeWeightPx, 1.67);
          compare(id, 'strokeVariableName', path.strokeVariableName, 'icon/stroke-width');
          if (!present(path.strokeVariableId)) missing(id, 'strokeVariableId');
        }
      }
      if (category === 'instances') {
        definition(item);
        compare(id, 'type', actual.type, 'INSTANCE');
        for (const property of ['mainComponentKey', 'sourceFileKey', 'platform', 'state']) {
          if (!present(expected[property])) missing(id, `expected.${property}`);
          else compare(id, property, actual[property], expected[property]);
        }
        if (!present(actual.mainComponentId)) missing(id, 'mainComponentId');
      }
      if (category === 'protectedRegions') {
        if (!Object.hasOwn(protectedIds, item.region)) { missing(id, 'known region (navigation/header)'); continue; }
        compare(id, 'sourceFileKey', item.sourceFileKey, 'RFpf6Kksqu6SFsnjxjIn5l');
        compare(id, 'sourceNodeId', item.sourceNodeId, protectedIds[item.region]);
        for (const field of snapshotFields) compare(id, `snapshot.${field}`, item.after?.[field], item.before?.[field]);
        if (!present(item.beforeScreenshot?.reference) || item.beforeScreenshot.reviewed !== true) missing(id, 'reviewed before screenshot');
      }
    }
  }
  // No whole-page claim: coverage is declared by the caller and independently reviewed.
  return {status: issues.length ? '有偏差' : pending.length || !checkedRecords ? '待验证' : '通过', checkedRecords, issues, pending, excluded,
    scope: 'Provided records only. No live Figma read, completeness audit, screenshot rendering, prototype test or whole-page approval is performed by this tool.'};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.argv[2]) { process.stderr.write('Usage: node check-design-readback.mjs /absolute/path/to/readback.json\n'); process.exitCode = 2; }
  else { const result = checkDesignReadback(JSON.parse(await readFile(process.argv[2], 'utf8'))); process.stdout.write(JSON.stringify(result, null, 2) + '\n'); process.exitCode = result.status === '通过' ? 0 : 1; }
}
