import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { installAgent, skillLocations } from '../scripts/install-agent.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
async function sandbox(fn) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'craftime agent test '));
  try { return await fn(dir); } finally { await fs.rm(dir, { recursive: true, force: true }); }
}
test('every project adapter installs complete skills with resolvable relative references', async () => sandbox(async dir => {
  for (const agent of Object.keys(skillLocations)) {
    const project = path.join(dir, agent); await fs.mkdir(project);
    const result = await installAgent({ agent, target: project });
    assert.equal(result.mcpConfigured, false); assert.equal(result.skills.length, 5);
    const walk = async current => {
      for (const entry of await fs.readdir(current, { withFileTypes: true })) {
        const file = path.join(current, entry.name);
        if (entry.isDirectory()) await walk(file);
        else if (entry.name.endsWith('.md')) {
          const text = await fs.readFile(file, 'utf8');
          for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
            const link = match[1]; if (/^(https?:|#)/.test(link)) continue;
            await fs.access(path.resolve(path.dirname(file), link.split('#')[0]));
          }
        }
      }
    };
    await walk(result.destination);
    const runtime = JSON.parse(await fs.readFile(path.join(result.destination, 'craftime-figma-ui/references/runtime.json')));
    assert.equal(runtime.version, result.version);
    const again = await installAgent({ agent, target: project }); assert.deepEqual(again.writes, []);
  }
}));
test('dry run does not create files or alter project instructions', async () => sandbox(async dir => {
  await fs.writeFile(path.join(dir, 'AGENTS.md'), 'user instructions');
  const result = await installAgent({ agent: 'cursor', target: dir, dryRun: true });
  assert.ok(result.writes.length); assert.deepEqual(await fs.readdir(dir), ['AGENTS.md']);
  assert.equal(await fs.readFile(path.join(dir, 'AGENTS.md'), 'utf8'), 'user instructions');
}));
test('a user edit prevents the entire update before any file is changed', async () => sandbox(async dir => {
  const result = await installAgent({ agent: 'claude', target: dir });
  const edited = path.join(result.destination, 'craftime-figma-ui/SKILL.md');
  const untouched = path.join(result.destination, 'craftime-review/SKILL.md');
  const before = await fs.readFile(untouched); await fs.writeFile(edited, 'user edit');
  await assert.rejects(installAgent({ agent: 'claude', target: dir }), /no changes made/);
  assert.equal(await fs.readFile(edited, 'utf8'), 'user edit'); assert.deepEqual(await fs.readFile(untouched), before);
}));
test('unmanaged collisions and symlink destinations are preserved', async () => sandbox(async dir => {
  const skill = path.join(dir, '.cursor/skills/craftime-setup'); await fs.mkdir(skill, { recursive: true });
  await fs.writeFile(path.join(skill, 'SKILL.md'), 'existing skill');
  await assert.rejects(installAgent({ agent: 'cursor', target: dir }), /no changes made/);
  const external = path.join(dir, 'external'); await fs.mkdir(external); await fs.mkdir(path.join(dir, '.claude'));
  await fs.symlink(external, path.join(dir, '.claude/skills'), 'dir');
  await assert.rejects(installAgent({ agent: 'claude', target: dir }), /symbolic link/);
  assert.deepEqual(await fs.readdir(external), []);
}));
test('tampered installation records cannot delete files outside owned skill folders', async () => sandbox(async dir => {
  const result = await installAgent({ agent: 'generic', target: dir });
  const statePath = path.join(result.destination, '.craftime-design-install.json');
  const state = JSON.parse(await fs.readFile(statePath)); state.files['../../outside'] = 'a'.repeat(64);
  await fs.writeFile(statePath, JSON.stringify(state));
  await assert.rejects(installAgent({ agent: 'generic', target: dir }), /Unsafe/);
}));
test('managed stale resources are removed without touching unrelated project files', async () => sandbox(async dir => {
  const result = await installAgent({ agent: 'gemini', target: dir });
  const statePath = path.join(result.destination, '.craftime-design-install.json');
  const state = JSON.parse(await fs.readFile(statePath));
  const stale = 'craftime-setup/old.txt'; const bytes = Buffer.from('old');
  const { createHash } = await import('node:crypto'); state.files[stale] = createHash('sha256').update(bytes).digest('hex');
  await fs.writeFile(path.join(result.destination, stale), bytes); await fs.writeFile(statePath, JSON.stringify(state));
  await fs.writeFile(path.join(dir, 'GEMINI.md'), 'user context');
  const next = await installAgent({ agent: 'gemini', target: dir }); assert.deepEqual(next.removals, [stale]);
  await assert.rejects(fs.access(path.join(result.destination, stale)));
  assert.equal(await fs.readFile(path.join(dir, 'GEMINI.md'), 'utf8'), 'user context');
}));

async function verifyMcp(config, protocolVersion, cwd) {
  const child = spawn(process.execPath, config.args, { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
  let buffer = '', stderr = '', next = 1; const pending = new Map();
  child.stderr.on('data', data => { stderr += data; });
  child.stdout.on('data', data => {
    buffer += data;
    while (buffer.includes('\n')) {
      const i = buffer.indexOf('\n'), line = buffer.slice(0, i); buffer = buffer.slice(i + 1);
      if (!line.trim()) continue;
      const message = JSON.parse(line), entry = pending.get(message.id);
      if (entry) { clearTimeout(entry.timer); pending.delete(message.id); message.error ? entry.reject(Error(JSON.stringify(message.error))) : entry.resolve(message.result); }
    }
  });
  const request = (method, params = {}) => new Promise((resolve, reject) => {
    const id = next++; const timer = setTimeout(() => reject(Error(`MCP timed out: ${stderr}`)), 5000);
    pending.set(id, { resolve, reject, timer }); child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
  try {
    const init = await request('initialize', { protocolVersion, capabilities: {}, clientInfo: { name: 'plain-mcp-client-test', version: '1' } });
    assert.equal(init.protocolVersion, protocolVersion);
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
    const list = await request('tools/list'); assert.ok(list.tools.some(t => t.name === 'craftime_get_rules'));
    const rules = await request('tools/call', { name: 'craftime_get_rules', arguments: {} });
    const plain = JSON.parse(rules.content.find(c => c.type === 'text').text);
    assert.equal(plain.plugin, 'craftime-design'); assert.equal(plain.liveSpecificationRead, false);
    assert.equal(plain.version, JSON.parse(await fs.readFile(path.join(root, 'plugin.json'))).version);
    const check = await request('tools/call', { name: 'craftime_check_design', arguments: { readback: {} } });
    assert.equal(JSON.parse(check.content[0].text).status, '待验证');
  } finally {
    child.stdin.end(); child.kill(); for (const entry of pending.values()) clearTimeout(entry.timer);
  }
}
test('Claude override and Gemini manifests start real MCP without an App UI or original working directory', async () => sandbox(async dir => {
  const clone = path.join(dir, 'plugin source with spaces'); await fs.cp(root, clone, { recursive: true });
  const claude = JSON.parse(await fs.readFile(path.join(clone, '.claude-plugin/plugin.json')));
  const defaults = JSON.parse(await fs.readFile(path.join(clone, '.mcp.json'))).mcpServers;
  const effective = { ...defaults, ...claude.mcpServers }['craftime-design'];
  effective.args = effective.args.map(s => s.replaceAll('${CLAUDE_PLUGIN_ROOT}', clone));
  await verifyMcp(effective, '2024-11-05', dir);
  const gemini = JSON.parse(await fs.readFile(path.join(clone, 'gemini-extension.json'))).mcpServers['craftime-design'];
  gemini.args = gemini.args.map(s => s.replaceAll('${extensionPath}', clone));
  await verifyMcp(gemini, '2025-03-26', dir);
}));
