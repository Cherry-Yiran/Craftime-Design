# Craftime Design

<img src="assets/craftime-logo.svg" width="64" height="64" alt="Craftime Design">

按 Craftime 实时规范设计、检查 Figma 页面。当前版本 **0.4.0**（2026-11-02），包含五个技能、规范开关面板与本地 stdio MCP 服务。

## 多 Agent 使用

支持 Codex 原有插件、Claude Code 原生插件、Gemini CLI 扩展，以及 Cursor / Copilot / OpenCode 的项目 Agent Skills 安装入口。其他工具可读取 [通用入口](CRAFTIME.md)。所有入口共用 `skills/`，不维护多套设计规范。

[完整兼容矩阵与安装说明](docs/COMPATIBILITY.md) 区分规则、MCP检查、Figma连接和面板能力。没有Codex附件协议时使用纯技能流程，Figma需各工具单独连接；尚未逐一完成各客户端安装验收。

## 同事安装

本仓库若为私有，使用前需维护者授予 GitHub 读取权限；公开后可直接读取。安装说明见 [同事安装指南](docs/INSTALL.md)。

已安装支持 Plugins 的 Codex 桌面版、Codex CLI 和 Node.js 22+ 后，在能够读取本仓库的电脑终端执行：

```sh
codex plugin marketplace add Cherry-Yiran/Craftime-Design --ref main
codex plugin add craftime-design@craftime-design-team
```

重新打开桌面应用，选用 Craftime Design。每位同事须连接自己的 Figma 账号，并具有规范文件和目标文件权限。插件不包含登录凭据，也不会授予文件权限。无需 npm install。

本仓库提供团队 Git marketplace 分发；维护者个人账号里的私有插件链接不作为同事的安装前提。桌面安装功能及组织允许的来源，以接收者当前客户端与组织策略为准。

## 开始使用

以下开关步骤仅适用于支持所需附件协议的 Codex 宿主。其他 Agent 明确请求采用 `craftime-figma-ui` 即可，具体入口见兼容指南。

输入「使用 Craftime Design，检查启用状态并打开规范面板」，在当前聊天开启规范工作流后再描述任务，例如：

- 按规范在指定 Figma 文件里设计页面。
- 检查这个 Figma 画板是否符合规范。
- 读取最新规范并报告资产索引的变化。

开关附件只表示本聊天采用工作流，不表示已实时读取 Figma 或页面已验收。基础规范来源为 [Craftime 组件库](https://www.figma.com/design/03EUC7nSmTdbnEjMOWAQ3U?node-id=2173-505)，业务参考仅在获准范围读取。

## 本版内容

- 新增跨Agent执行方式、Claude/Gemini入口、七种项目技能安装目标与通用Markdown入口。

- 移动端独立设计：读取同模块移动稿与移动端规范，再组织窄屏与触屏布局。
- 简洁与信息密度：减少无用途分隔和重复辅助信息，保留必要内容。
- 图标语义避撞：检查关联动作的含义与轮廓，保留 MingCute 与原生描边规则。
- 交付范围与定稿同步：按一屏、流程或全部状态交付，以用户最新定稿为准。
- 保留现有颜色语义、链接色、固定导航与顶部保护、字体及来源规则。

## 开发与验证

```sh
node scripts/build-panel.mjs
node --test tests/*.test.mjs
node tests/mcp-integration.mjs
```

| 路径 | 用途 |
| --- | --- |
| `plugin.json` / `.codex-plugin/plugin.json` | 标准与兼容清单 |
| `mcp.json` / `.mcp.json` / `.app.json` | 本地 MCP 与 Figma App 依赖 |
| `.agents/plugins/marketplace.json` | 团队安装目录，插件来源为仓库根目录 |
| `server/index.mjs` / `assets/craftime-panel.html` | 已打包服务与规范面板 |
| `ui/` / `scripts/` / `tests/` | 面板源、构建与测试 |
| `skills/` | 五个技能、规则参考与读回检查 |
| `docs/INSTALL.md` / `docs/COMPATIBILITY.md` | 安装、更新与各Agent能力边界 |
| `.claude-plugin/` / `gemini-extension.json` | Claude/Gemini原生入口 |
| `scripts/install-agent.mjs` | 项目技能安装、预览及受控更新 |

v0.4.0 的 51 项测试和 9 项本地 stdio MCP 集成检查已通过；这不代表接收者电脑安装、真实输入框、宿主重载或 Figma 页面已验收。控制器测试使用模拟宿主；读回检查只核对提交的证据，不自动读取 Figma。

维护源码目录后重建面板，通过宿主支持的更新流程刷新；不要直接编辑安装缓存。推送本仓库不会自动更新维护者的账号插件。第三方许可见 [THIRD-PARTY-NOTICES.md](assets/THIRD-PARTY-NOTICES.md)；未新增开源许可证。
