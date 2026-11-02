# Craftime Design

<img src="assets/craftime-logo.svg" width="64" height="64" alt="Craftime Design">

**让 AI 按 Craftime 的设计规范协助做页面、优化样式和检查设计稿。**

这是给 Craftime 团队使用的一套 **Agent Skills（技能）**。它把已确认的设计规则、Figma 规范来源和检查方法交给 AI，减少反复解释字体、颜色、组件及交付要求的工作。当前版本 **v0.4.0**。

通常安装 `skills/` 中的技能就可以开始使用；插件面板和 MCP 是可选的增强方式。**连接 Figma 后能做哪些操作，取决于你使用的 Agent 和实际授权。**

[开始安装](docs/INSTALL.md) · [各 Agent 的详细说明](docs/COMPATIBILITY.md) · [通用规则入口](CRAFTIME.md) · [更新记录](CHANGELOG.md)

## 可以帮你做什么

| 场景 | 作用 |
| --- | --- |
| 设计新页面 | 根据相关实时规范选择文字、颜色和组件，在本次需求范围内组织页面 |
| 优化已有页面 | 改善主次、留白、信息密度和图标辨识，保留未要求修改的内容与交互 |
| 检查设计稿 | 对照规范核对属性、引用和截图，区分已确认偏差、建议与待验证项 |
| 制作移动端 | 先看同模块移动稿与移动端规范，再安排窄屏信息和触屏操作 |
| 同步定稿与状态 | 以用户最新稿为准，按一屏、流程或全部状态的实际范围交付 |
| 查询规范使用情况 | 说明本次到底用了哪些规则、读了哪些来源、完成了哪些检查 |

其中包含颜色与字体语义、MingCute 图标及原生描边、固定导航/顶部保护，以及移动端独立设计、简洁与信息密度、图标语义避撞和定稿同步规则。具体值与适用范围以相应技能、用户最新要求和本次读取的正式来源为准。

## 怎么开始

1. 下载本仓库，按 [安装指南](docs/INSTALL.md) 把五个技能完整放入你所用 Agent 的技能目录。
2. 在 Agent 中打开目标项目，重新加载技能或开始新会话。
3. 发送下面任一示例，附上目标页面链接、截图或需求。
4. 需要直接读取或修改 Figma 时，再连接自己的 Figma 账号与工具，并取得相关文件权限。

**优化页面：**

```text
使用 Craftime Design，帮我优化这个页面：[Figma 链接或截图]。
按 Craftime 规范处理，保留未要求修改的布局、文案和交互。
这次只需要一屏效果。
```

**检查设计稿：**

```text
使用 craftime-review，只读检查这个画板：[Figma 链接]。
说明已确认的偏差、建议和待验证项，先不要修改。
```

**制作移动端：**

```text
使用 craftime-figma-ui，制作这个模块的移动端页面：[需求与目标链接]。
先读取同模块移动稿和移动端间距规范，再独立安排布局。
```

如果 AI 没有自动发现技能，可让它先读取本仓库的 [CRAFTIME.md](CRAFTIME.md)。这是通用入口，仍需当前工具能够访问相应文件和引用资源。当前会话是否已采用规则，应以实际执行记录为准。

## 我用的工具能装吗

支持 `SKILL.md` 的 Agent 可以按各自目录使用同一套技能：

| 工具 | 项目内的技能目录 |
| --- | --- |
| Claude Code | `.claude/skills/` |
| WorkBuddy / CodeBuddy | `.codebuddy/skills/` |
| Codex | `.agents/skills/` |
| Cursor | `.cursor/skills/` |
| Gemini CLI | `.gemini/skills/` |
| GitHub Copilot | `.github/skills/` |
| OpenCode | `.opencode/skills/` |

Claude 桌面版、Cowork及其他云端产品需按其实际技能/插件导入方式使用，不能直接套用 Claude Code 的本地目录。更多入口和验证边界见 [兼容说明](docs/COMPATIBILITY.md)。

**DeepSeek 是模型选择，技能安装方式看承载它的工具。** 例如在 WorkBuddy 中选择 DeepSeek，按 WorkBuddy 的技能方式安装；仅更换模型不会自动获得 Figma 或本地文件权限。

## 五个技能怎么选

| 技能 | 用途 |
| --- | --- |
| `craftime-figma-ui` | 按规范设计或优化页面，日常主要使用这个 |
| `craftime-review` | 只读检查已有设计；获得修复授权后才修改 |
| `craftime-setup` | 检查技能、宿主能力和 Figma 接入 |
| `craftime-status` | 查询实际规范采用与检查证据 |
| `craftime-refresh` | 核对规范索引变化，按授权范围维护 |

请保留全部五个目录及其中的 `references`、`scripts` 等资源；它们之间存在引用。安装或升级不会自动授予 Figma 文件权限，也不保证 AI 每次执行都无偏差，结果仍需依据节点与截图检查。

## Figma 规范来源

- [Craftime 组件规范](https://www.figma.com/design/03EUC7nSmTdbnEjMOWAQ3U?node-id=2173-505)：基础定义与相关组件的来源。
- [Craftime UI](https://www.figma.com/design/h2Yu0Mg9J23KCatfp4uBgh/Craftime-UI?node-id=122-56)：获准查找业务参考时使用；不是自动遍历所有业务页面的授权。
- 固定导航、完整顶部及其他特例，按技能中记录的精确来源与用户最新要求执行。

本地规则与索引用于指导工作，**不能代替本次实时读取**。没有 Figma 连接时，可基于已提供材料做规则分析或本地工作；不能把这些结果说成已经修改或验收了 Figma。

## 可选能力与维护

如果使用 Codex 插件面板、Claude Code 插件、Gemini 扩展或本地 MCP 检查工具，请阅读 [详细兼容说明](docs/COMPATIBILITY.md)。纯技能阅读无需先配置面板或本包 MCP；运行附带的 Node.js 检查脚本或服务需要 Node.js 22+，无需 npm install。

维护者可在仓库目录运行：

```sh
node scripts/build-panel.mjs
node --test tests/*.test.mjs
node tests/mcp-integration.mjs
```

v0.4.0 已通过51项测试与9项本地 stdio MCP 集成检查；各客户端实际加载、接收者安装和实时 Figma 操作尚未逐一验收。推送本仓库与发布账号插件是两个步骤。第三方许可见 [THIRD-PARTY-NOTICES.md](assets/THIRD-PARTY-NOTICES.md)，未新增开源许可证。
