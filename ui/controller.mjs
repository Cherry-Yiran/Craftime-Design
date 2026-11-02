export function validateRules(value) {
  if (value?.plugin !== 'craftime-design' || typeof value.version !== 'string' || !/^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(value.version) || typeof value.workflow !== 'string' || !value.workflow.trim()) throw new Error('无法读取 Craftime 规范工作流，尚未开启。');
  const source = new URL(value.specification);
  if (source.protocol !== 'https:' || source.hostname !== 'www.figma.com' || !source.pathname.startsWith('/design/')) throw new Error('规范来源无效，尚未开启。');
  return value;
}

export class SpecController {
  constructor(api, loadRules, render = () => {}) {
    this.api = api; this.loadRules = loadRules; this.render = render;
    this.enabled = false; this.phase = 'connecting'; this.busy = false;
    this.observed = 0; this.updateId = null; this.rules = null;
    this.contextVersion = null; this.error = null; this.versionError = null;
    this.intent = null; this.removalPending = false; this.hostState = null;
  }
  show() { this.render(this); }
  restore(context) {
    this.observed += 1;
    if (this.phase === 'unsupported') return;
    const state = context?.structuredContent?.craftime;
    this.hostState = context;
    const acknowledged = typeof context?.updateId === 'string' && !!context.updateId.trim();
    const titled = context?.content?.some(item => item.type === 'text' && item._meta?.['openai/title'] === 'Craftime 规范 · 已开启') === true;
    this.enabled = state?.plugin === 'craftime-design' && state.scope === 'current-chat' && state.enabled === true && acknowledged && titled;
    this.updateId = this.enabled ? context.updateId : null;
    this.contextVersion = this.enabled && typeof state.version === 'string' ? state.version : null;
    this.phase = this.enabled ? 'on' : 'off'; this.error = null; this.show();
  }
  ready(context) {
    if (!this.api || context === undefined) {
      this.phase = 'unsupported'; this.error = '当前客户端未提供可确认的输入框规范附件。当前规范未开启。'; this.show(); return;
    }
    this.restore(context);
  }
  async refreshRules() {
    try { this.rules = validateRules(await this.loadRules()); this.versionError = null; }
    catch (error) { this.versionError = error?.message || '版本读取失败'; }
    this.show(); return this.rules;
  }
  async change(enabled, visible = true) {
    if (!this.api || this.busy || ['connecting', 'unsupported'].includes(this.phase)) return false;
    this.busy = true; this.intent = enabled; this.phase = 'syncing'; this.error = null; this.show();
    const observed = this.observed;
    let success = false;
    try {
      if (enabled) this.rules = validateRules(await this.loadRules());
      // Removal or a host-context change during rule loading cancels a stale enable.
      if (enabled && this.observed !== observed) return false;
      const rules = this.rules;
      const state = {plugin: 'craftime-design', enabled, scope: 'current-chat', version: rules?.version ?? this.contextVersion, source: rules?.specification ?? null, liveSpecificationRead: false};
      const text = enabled
        ? `本聊天已开启 Craftime 规范工作流。后续创建、修改或检查 Figma 页面时默认执行下方工作流；普通聊天不触发 Figma 操作。用户明确例外优先。此附件仅表示工作流开启，不证明实时规范已读取或画板合规。\n规范源：${rules.specification}\n插件版本：${rules.version}\n\n${rules.workflow}`
        : '本聊天的 Craftime 规范自动采用已关闭。不要依据历史开启记录或项目默认路由自动采用此插件；用户之后明确要求采用时除外。';
      const content = visible
        ? [{type: 'text', text, _meta: {'openai/title': enabled ? 'Craftime 规范 · 已开启' : 'Craftime 规范 · 未开启'}}]
        : [{type: 'text', text, annotations: {audience: ['assistant']}}];
      const result = await this.api.update({content, structuredContent: {craftime: state}});
      const ack = typeof result?.updateId === 'string' && !!result.updateId.trim();
      const hostState = this.hostState?.structuredContent?.craftime;
      const hostAck = typeof this.hostState?.updateId === 'string' && !!this.hostState.updateId.trim();
      const confirmedByHost = this.observed !== observed && hostAck && hostState?.plugin === 'craftime-design' && hostState.scope === 'current-chat' && hostState.enabled === enabled && this.enabled === enabled && (!enabled || this.contextVersion === rules.version);
      if (!ack && !confirmedByHost) throw new Error('Codex 未确认规范附件已接收，当前状态未更新。');
      if (this.observed === observed && !this.removalPending) {
        this.enabled = enabled; this.updateId = enabled ? result.updateId : null;
        this.contextVersion = enabled ? rules.version : null; this.phase = enabled ? 'on' : 'off';
      }
      success = true;
    } catch (error) {
      this.error = error?.message || '规范附件同步失败。'; this.phase = this.enabled ? 'on' : 'off';
    } finally {
      this.busy = false; this.intent = null; this.show();
      if (this.removalPending) { this.removalPending = false; await this.change(false, false); }
    }
    return success;
  }
  async hostChanged(context) {
    const removed = context === null && (this.enabled || this.intent === true);
    this.restore(context);
    if (!removed) return;
    if (this.busy) this.removalPending = true;
    else await this.change(false, false);
  }
}
