import fs from 'node:fs';
const root = new URL('../', import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), 'utf8');
const manifest = JSON.parse(read('plugin.json'));
const controller = read('ui/controller.mjs').replace(/^export /gm, '');
const app = read('ui/panel.mjs');
const shell = read('ui/sdk-shell.html');
fs.writeFileSync(new URL('assets/craftime-panel.html', root), `${shell}\nconst CLIENT_VERSION = ${JSON.stringify(manifest.version)};\n${controller}\n${app}\n</script></body></html>\n`);
