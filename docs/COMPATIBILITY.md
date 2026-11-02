# Agent 兼容与能力边界

Craftime Design v0.4.0，2026-11-02。设计规则只有一份，维护在 `skills/`；宿主差异由兼容说明和安装入口处理，不为每个 Agent 复制一套规范。

普通使用先看 [Skill 安装与首次使用](INSTALL.md)。通常复制五个技能目录即可；以下插件、扩展和 MCP 配置为可选入口。

## 支持入口

| Agent | 安装方式 | 规则与检查 | 面板与 Figma |
| --- | --- | --- | --- |
| Codex | 原有团队 marketplace；或项目 `.agents/skills/` | 五个技能、检查脚本、stdio MCP | 原面板需宿主附件协议；Figma App 及文件权限独立 |
| WorkBuddy / CodeBuddy | 手动复制到项目 `.codebuddy/skills/` | 同一套技能与引用；不需要新增适配层 | 打开对应项目并核对技能启用状态；Figma另行连接 |
| Claude Code | `.claude-plugin/` 原生插件；或项目 `.claude/skills/` | 同一套技能；原生插件携带 MCP 配置 | 不依赖 Codex 开关；另配本环境 Figma 工具 |
| Cursor | 项目 `.cursor/skills/` | 技能与脚本；可另配 stdio MCP | 不要求 Codex 附件；Figma 能力由本环境连接决定 |
| Gemini CLI | `gemini-extension.json` 扩展；或项目 `.gemini/skills/` | 同一套技能；扩展携带 MCP 配置 | 无面板时以文字确认本次采用；另配 Figma |
| GitHub Copilot | 项目 `.github/skills/` | 技能与脚本；MCP 按实际 Copilot 产品配置 | 云端/本地权限及工具可用性分别核实 |
| OpenCode | 项目 `.opencode/skills/` | 技能与脚本；可另配 stdio MCP | 不依赖 Codex UI；另配 Figma |
| 其他支持 Markdown/Agent Skills 的工具 | `generic` 安装到 `.agents/skills/`，或读取根 `CRAFTIME.md` | 按工具实际文件、shell 能力执行 | 不保证自动发现或 Figma 写入，不虚构连接 |

Claude 桌面版/Cowork按其客户端的技能或插件导入功能使用；Claude Code 的 CLI 和目录步骤不自动适用于它们。DeepSeek 是模型选择，按实际承载它的 Agent 安装；不将独立聊天网页视为已有本地 Skill/MCP 能力。

“支持入口”指已按各宿主文档提供文件格式，不表示这些客户端已逐一安装验收，也不表示网页聊天框只上传一个文件就能获得 MCP 或 Figma 编辑能力。

## 共用安装脚本

在本仓库目录运行（`--target` 指同事的目标项目，需已存在）：

```sh
node scripts/install-agent.mjs --agent cursor --target "/path/to/design-project" --dry-run
node scripts/install-agent.mjs --agent cursor --target "/path/to/design-project"
```

将 `cursor` 换成 `codex`、`claude`、`gemini`、`copilot`、`opencode` 或 `generic`。WorkBuddy使用前述手动目录步骤；脚本没有workbuddy/deepseek参数。脚本使用Node.js文件API，不依赖Bash；Windows路径可写为 `C:\Work\DesignProject`，实际平台验证范围见下文。

- 一次安装五个技能及其引用、脚本、版本记录；不要只复制 SKILL.md。
- 只写目标项目的相应技能目录，不更改已有 AGENTS.md、CLAUDE.md、GEMINI.md，不改宿主设置、账号或 MCP 配置，也不安装到全局目录。
- 使用安装记录更新本包文件；发现同名冲突或用户本地修改会整体停止，保留原文件。更新前可先 `--dry-run`。不提供强制覆盖按钮；需要保留定制时先自行合并。
- 纯技能方式不需要本包 MCP 也可读规范并运行附带的检查脚本。安装后重载宿主技能或开启新会话，明确请求采用 Craftime；自动发现与激活以宿主实际行为为准。

示例请求：“使用 craftime-figma-ui，按 Craftime 规范优化这个页面；先核对当前工具与 Figma 权限。”

## 原生插件/扩展安装

Claude Code：

```sh
claude plugin marketplace add Cherry-Yiran/Craftime-Design
claude plugin install craftime-design@craftime-design-team
```

Gemini CLI：

```sh
gemini extensions install https://github.com/Cherry-Yiran/Craftime-Design.git
```

安装到该工具后核对技能发现与 MCP 状态，按宿主提示确认信任；不用重复执行纯技能安装，避免同名技能加载两份。私有仓库还需要相应 Git 读取权限。

Claude 的 manifest 用同名 `mcpServers` 条目覆盖默认 `.mcp.json` 中的 Codex 路径变量，采用 `${CLAUDE_PLUGIN_ROOT}`；Gemini 采用 `${extensionPath}`。原 Codex/Agent Plugins 配置保持 `${PLUGIN_ROOT}`，不将其中一种变量直接粘到其他宿主。

## 其他 MCP 客户端

在实际工具的 MCP 配置入口添加本地 stdio 服务，命令为 `node`，单独的参数为仓库绝对路径下的 `server/index.mjs`。保留该仓库目录。普通 `mcpServers` 配置示例（不是所有产品的顶层配置格式）：

```json
{
  "mcpServers": {
    "craftime-design": {
      "command": "node",
      "args": ["/absolute/path/to/Craftime-Design/server/index.mjs"]
    }
  }
}
```

Cursor 可使用项目 `.cursor/mcp.json` 的 `mcpServers`；VS Code、Copilot CLI、OpenCode 的配置结构各不相同，按对应工具官方设置接入，不直接覆盖其现有配置。服务端使用模块所在位置定位资源，运行工作目录无需恰好等于仓库根。

- `craftime_get_rules`：返回此版本规则及来源，文本结果可被普通 MCP 客户端读取。
- `craftime_check_design`：检查调用者提供的真实读回，缺证据仍为待验证，不自行读取 Figma。
- `craftime_open`：可选 MCP App 入口；无所需 UI/附件协议时跳过，不作为使用规范的前提。

## 验证记录

v0.4.0 已通过51项测试与9项本地 stdio MCP 集成检查。新增测试涵盖七种安装入口、完整相对引用、重复安装、只读预览、冲突保留、受控更新，以及 Claude/Gemini 路径变量解析后在带空格路径和不同工作目录下启动真实 MCP；普通客户端协议使用2024-11-05与2025-03-26。

这些检查不调用或模拟安装 Claude Code、Cursor、Gemini、Copilot、OpenCode 客户端。各客户端真实技能触发、宿主UI、Windows/Linux实际运行、Figma认证与写回仍待对应环境验证；后续真实使用发现差异时按具体客户端修正，不宣称所有 Agent 全功能一致。

## 格式依据

- [WorkBuddy 项目技能目录](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Project)

- [Claude 插件清单与 MCP 路径](https://code.claude.com/docs/en/plugins-reference)、[插件市场](https://code.claude.com/docs/en/plugin-marketplaces)
- [Cursor Skills](https://cursor.com/help/customization/skills)、[Cursor MCP](https://cursor.com/docs/mcp)
- [Gemini 扩展](https://geminicli.com/docs/extensions/reference/)、[Gemini Skills](https://geminicli.com/docs/cli/skills/)
- [Copilot Agent Skills](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills)
- [OpenCode Skills](https://opencode.ai/docs/skills/)
- [OpenAI 插件与 marketplace](https://developers.openai.com/plugins/build/plugins)

以上文档于2026-11-02核对。规则正文与授权边界仍由本包工作流及用户最新要求决定。
