const app = new Ju({name: 'Craftime 规范', version: CLIENT_VERSION}, {availableDisplayModes: ['inline', 'fullscreen']}, {autoResize: true});
const extensions = new La(app);
const element = id => document.getElementById(id);
let controller;
function render(state) {
  element('state').textContent = state.phase === 'connecting' ? '正在连接 Codex…' : state.phase === 'unsupported' ? '输入框状态不可用' : state.phase === 'syncing' ? '正在同步规范…' : state.enabled ? '规范已开启' : '规范未开启';
  element('toggle').setAttribute('aria-checked', String(state.enabled));
  element('toggle').disabled = state.busy || ['connecting', 'unsupported'].includes(state.phase);
  const stale = state.enabled && state.rules?.version && state.contextVersion && state.rules.version !== state.contextVersion;
  element('detail').textContent = stale ? '当前聊天仍使用旧版附件；关闭后重新开启可更新规范。' : state.enabled ? '已附加到当前聊天。接下来直接描述页面需求即可。' : '打开开关后，输入框会显示规范附件。';
  element('guide').textContent = state.enabled ? '输入框应显示：Craftime 规范 · 已开启。无需再输入“使用规范”。' : '输入框没有“已开启”附件时，不能确认规范已开启。';
  const error = state.error || state.versionError;
  element('error').hidden = !error; element('error').textContent = error || '';
  element('version').textContent = state.rules?.version ? `v${state.rules.version}${stale ? ` · 附件 v${state.contextVersion}` : ''}` : '版本未确认';
  if (state.rules?.specification) element('source').href = state.rules.specification;
  document.documentElement.dataset.craftimeState = state.phase;
}
async function loadRules() {
  const result = await app.callServerTool({name: 'craftime_get_rules', arguments: {}});
  if (result.isError) throw new Error('无法读取 Craftime 规范工作流，尚未开启。');
  return validateRules(result.structuredContent);
}
app.addEventListener('hostcontextchanged', () => {
  const context = app.getHostContext();
  if (context?.theme) vw(context.theme);
  if (context?.styles?.variables) hw(context.styles.variables);
  const current = extensions.modelContext?.getCurrent();
  if (controller && current !== undefined) void controller.hostChanged(current);
});
element('toggle').addEventListener('click', () => { void controller?.change(!controller.enabled); });
element('source').addEventListener('click', event => { event.preventDefault(); void app.openLink({url: element('source').href}); });
try {
  await app.connect();
  controller = new SpecController(extensions.modelContext, loadRules, render);
  controller.ready(extensions.modelContext?.getCurrent());
  await controller.refreshRules();
} catch {
  element('state').textContent = '尚未连接 Codex';
  element('detail').textContent = '这个面板需要从 Craftime 插件中打开，才能把规范附加到聊天输入框。';
  element('error').hidden = false; element('error').textContent = '当前规范未开启。';
  element('version').textContent = '版本未确认';
}
