import fs from 'node:fs';
const root = new URL('../', import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), 'utf8');
const manifest = JSON.parse(read('plugin.json'));
const controller = read('ui/controller.mjs').replace(/^export /gm, '');
const app = read('ui/panel.mjs');
const shell = read('ui/sdk-shell.html');
fs.writeFileSync(new URL('assets/craftime-panel.html', root), `${shell}\nconst CLIENT_VERSION = ${JSON.stringify(manifest.version)};\n${controller}\n${app}\n</script></body></html>\n`);

// Keep compatibility entrypoints and the standalone skill snapshot on the same release.
for (const path of ['.codex-plugin/plugin.json', '.claude-plugin/plugin.json', 'gemini-extension.json', 'skills/craftime-figma-ui/references/runtime.json']) {
  const file = new URL(path, root);
  if (!fs.existsSync(file)) continue;
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (data.name !== manifest.name) throw new Error(`Plugin identity mismatch: ${path}`);
  data.version = manifest.version;
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}
