import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const skillLocations = Object.freeze({
  codex: '.agents/skills', claude: '.claude/skills', cursor: '.cursor/skills',
  gemini: '.gemini/skills', copilot: '.github/skills', opencode: '.opencode/skills',
  generic: '.agents/skills',
});
const sourceRoot = fileURLToPath(new URL('../', import.meta.url));
const stateName = '.craftime-design-install.json';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
async function statOrNull(file) {
  try { return await fs.lstat(file); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
}
async function noSymlinks(root, relative) {
  let current = root;
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    const stat = await statOrNull(current);
    if (stat?.isSymbolicLink()) throw Error(`Refusing symbolic link: ${current}`);
    if (stat && current !== path.join(root, relative) && !stat.isDirectory()) throw Error(`Not a directory: ${current}`);
  }
}
async function collect(directory, prefix = '') {
  const files = {};
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw Error(`Source contains a symbolic link: ${relative}`);
    if (entry.isDirectory()) Object.assign(files, await collect(path.join(directory, entry.name), relative));
    else if (entry.isFile()) files[relative] = await fs.readFile(path.join(directory, entry.name));
    else throw Error(`Unsupported source file: ${relative}`);
  }
  return files;
}
function validOwnedPath(file, names) {
  return typeof file === 'string' && !file.includes('\\') && !file.includes('\0') &&
    !file.split('/').some(s => !s || s === '.' || s === '..') && names.has(file.split('/')[0]);
}

// Project-scoped, skills-only installation. No host settings, credentials, or MCP registration are changed.
export async function installAgent({ agent, target, dryRun = false, root = sourceRoot }) {
  if (!Object.hasOwn(skillLocations, agent)) throw Error(`Unknown agent. Choose: ${Object.keys(skillLocations).join(', ')}`);
  if (!target) throw Error('--target must name an existing project directory');
  const project = await fs.realpath(path.resolve(target));
  if (!(await fs.stat(project)).isDirectory()) throw Error('Target is not a directory');
  if (project === path.parse(project).root) throw Error('Choose a project directory, not a filesystem root');
  const location = skillLocations[agent];
  await noSymlinks(project, location);
  const destination = path.join(project, location);
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'plugin.json'), 'utf8'));
  const files = await collect(path.join(root, 'skills'));
  const names = new Set(Object.keys(files).map(f => f.split('/')[0]));
  if (manifest.name !== 'craftime-design' || !names.has('craftime-figma-ui')) throw Error('Not a Craftime source package');
  const statePath = path.join(destination, stateName);
  await noSymlinks(project, `${location}/${stateName}`);
  let previous = { files: {} };
  if (await statOrNull(statePath)) {
    previous = JSON.parse(await fs.readFile(statePath, 'utf8'));
    if (previous.name !== 'craftime-design' || previous.format !== 1 || !previous.files || typeof previous.files !== 'object' || Array.isArray(previous.files)) throw Error('Invalid Craftime installation record');
    for (const [file, hash] of Object.entries(previous.files)) {
      if (!validOwnedPath(file, names) || typeof hash !== 'string' || !/^[a-f0-9]{64}$/.test(hash)) throw Error('Unsafe Craftime installation record');
    }
  }
  const writes = [], removals = [], conflicts = [];
  for (const file of new Set([...Object.keys(previous.files), ...Object.keys(files)])) {
    if (!validOwnedPath(file, names)) throw Error(`Unsafe source path: ${file}`);
    await noSymlinks(project, `${location}/${file}`);
    const full = path.join(destination, file);
    const stat = await statOrNull(full);
    if (stat && !stat.isFile()) { conflicts.push(file); continue; }
    const current = stat ? await fs.readFile(full) : null;
    const next = files[file];
    if (next && current?.equals(next)) continue;
    if (current && (!previous.files[file] || digest(current) !== previous.files[file])) { conflicts.push(file); continue; }
    if (next) writes.push(file);
    else if (current) removals.push(file);
  }
  if (conflicts.length) throw Error(`Existing or locally modified files were preserved; no changes made: ${conflicts.join(', ')}`);
  const result = {
    name: manifest.name, version: manifest.version, agent, skills: [...names].sort(),
    destination, dryRun, writes, removals, mcpConfigured: false,
    hostLoaded: 'not verified', figmaConnected: 'not verified',
  };
  if (dryRun) return result;
  for (const file of writes) {
    const full = path.join(destination, file);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, files[file]);
  }
  for (const file of removals) await fs.unlink(path.join(destination, file));
  await fs.mkdir(destination, { recursive: true });
  await fs.writeFile(statePath, JSON.stringify({
    name: manifest.name, version: manifest.version, format: 1,
    files: Object.fromEntries(Object.entries(files).map(([f, bytes]) => [f, digest(bytes)])),
  }, null, 2) + '\n');
  return result;
}

async function main() {
  const args = process.argv.slice(2), options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--help') {
      console.log('node scripts/install-agent.mjs --agent <codex|claude|cursor|gemini|copilot|opencode|generic> --target <project> [--dry-run]\nCopies all five skills and their resources. Preserves modified files; does not edit host settings or register MCP.');
      return;
    }
    if (args[i] === '--dry-run') options.dryRun = true;
    else if (args[i] === '--agent' || args[i] === '--target') {
      const key = args[i].slice(2), value = args[++i];
      if (!value || value.startsWith('--') || Object.hasOwn(options, key)) throw Error(`Invalid --${key}`);
      options[key] = value;
    } else throw Error(`Unknown option: ${args[i]}`);
  }
  console.log(JSON.stringify(await installAgent(options), null, 2));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
