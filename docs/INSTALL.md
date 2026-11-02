# 安装与首次使用

适用 Craftime Design **v0.4.0**。通常选择下面的“作为 Skill 使用”即可。希望使用插件面板或 MCP 的成员，再看 [进阶兼容说明](COMPATIBILITY.md)。

## 作为 Skill 使用

### 1. 获取文件

在 GitHub 仓库点击 **Code → Download ZIP**，完整解压；也可以用 Git 克隆：

```sh
git clone https://github.com/Cherry-Yiran/Craftime-Design.git
```

仓库若为私有，需要读取权限；公开仓库可直接读取。保留解压后的文件结构。

### 2. 放入你的项目

找到仓库里的 `skills/`，将里面的**五个完整技能文件夹**复制到你实际工作的项目目录：

| 工具 | 复制到项目中的位置 |
| --- | --- |
| Claude Code | `.claude/skills/` |
| WorkBuddy / CodeBuddy | `.codebuddy/skills/` |
| Codex | `.agents/skills/` |
| Cursor | `.cursor/skills/` |
| Gemini CLI | `.gemini/skills/` |
| GitHub Copilot | `.github/skills/` |
| OpenCode | `.opencode/skills/` |

例如 WorkBuddy 项目应是：

```text
你的设计项目/
└── .codebuddy/
    └── skills/
        ├── craftime-figma-ui/
        │   ├── SKILL.md
        │   ├── references/
        │   └── scripts/
        ├── craftime-review/
        ├── craftime-setup/
        ├── craftime-status/
        └── craftime-refresh/
```

五个文件夹各自都有 SKILL.md，其余资源照原样保留。不要多套一层 `skills/skills/`，也不要只复制单个 SKILL.md。若目标已有同名技能或你改过规则，先对比合并，保留定制内容。

WorkBuddy 的项目级目录依据 [官方项目配置说明](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Project)。请在 WorkBuddy 中打开这个项目；仅把文件放在下载目录，不代表当前项目会加载它。

Claude 桌面版/Cowork与 Claude Code 是不同入口；它们的技能/插件导入方式以实际客户端为准，详见 [兼容说明](COMPATIBILITY.md)，不直接执行上面的本地目录步骤。

### 可选：用已有脚本复制

如果电脑有 Node.js 22+，可在本仓库根目录执行：

```sh
node scripts/install-agent.mjs --agent claude --target "/你的项目绝对路径" --dry-run
node scripts/install-agent.mjs --agent claude --target "/你的项目绝对路径"
```

把 `claude` 换为 `codex`、`cursor`、`gemini`、`copilot`、`opencode` 或 `generic`。`--target` 必须是已存在的项目目录，`--dry-run` 只预览。

**脚本目前没有 `workbuddy` 或 `deepseek` 参数。** WorkBuddy 按上面的 `.codebuddy/skills/` 手动复制；DeepSeek 按它所在的 Agent 安装。脚本不修改已有项目指令、宿主设置或账号，不注册 MCP；发现冲突或本地改动会停止。

### 3. 确认已加载

重新加载 Agent 的技能，或在目标项目开始新会话，然后发送：

```text
请检查本项目是否加载了 Craftime Design 的五个技能，
说明实际读取的技能来源和版本。
这一步只检查接入，不修改 Figma。
```

以宿主的技能列表和实际读取结果为准。未发现时检查目录、技能是否启用、项目是否正确，以及客户端是否支持 SKILL.md。没有原生技能发现功能、但能读本地文件的 Agent，可让它读取下载仓库中的 `CRAFTIME.md`。

### 4. 开始任务

```text
使用 craftime-figma-ui，按 Craftime 规范优化这个页面：[链接或截图]。
平台：Web。交付：一屏效果。
保留未要求修改的文案、交互、导航和顶部。
```

只做检查时改用 `craftime-review`，并说明“只读，先不要修改”。已有上下文就直接延续，不需要每次重填全部信息；新会话是否默认采用由实际宿主设置决定。

## 需要实际操作 Figma 时

在当前 Agent 中连接自己的 Figma 工具和账号，确认可访问 [规范组件库](https://www.figma.com/design/03EUC7nSmTdbnEjMOWAQ3U?node-id=2173-505) 与目标文件。

Skill 提供规则与流程；Figma 工具提供实际读取/写入能力。只读连接只能检查，具备相应写入能力和权限后才可编辑。安装本包不会自动登录 Figma，也不等于开启了原生可编辑写回。

本包 MCP 提供规则读取与提交记录的检查，并非 Figma 编辑服务。仅有截图时可以按材料分析，但不能宣称完成实时规范读取或 Figma 修改。

## 更新

重新获取仓库中的最新 `skills/`，在保留本地定制的前提下更新五个目录。通过安装脚本安装的成员，可在更新仓库后重跑相同命令；冲突先合并，不强制覆盖。

重新加载技能或开始新会话，再核对实际执行版本。仅下载新文件不代表已有会话已加载更新。

## Codex 原生插件方式（可选）

希望使用已有规范开关面板的 Codex 成员，可以选择插件方式，无需再重复复制同名技能：

```sh
codex plugin marketplace add Cherry-Yiran/Craftime-Design --ref main
codex plugin add craftime-design@craftime-design-team
```

下载 ZIP 后也可在解压根目录执行 `codex plugin marketplace add .`，再执行相同的 `codex plugin add` 命令。保留隐藏配置文件及源目录。

安装后重开桌面应用，输入“使用 Craftime Design，检查启用状态并打开规范面板”。仅支持所需附件协议的宿主才显示开关；开启只证明当前聊天采用流程，不证明设计已通过检查。

Git 来源更新：

```sh
codex plugin marketplace upgrade craftime-design-team
```

按客户端提示刷新或重装；旧聊天附件需要核对版本，必要时关闭再重新开启。原生插件和其他 MCP 入口的细节见 [兼容说明](COMPATIBILITY.md)。

## 常见问题

| 情况 | 处理 |
| --- | --- |
| AI 没有发现技能 | 检查当前项目与技能目录，重载技能/新建会话，确认启用状态 |
| WorkBuddy 使用 DeepSeek | 按 WorkBuddy 的目录安装；模型选择不改变技能位置 |
| 只有 DeepSeek 聊天网页 | 先确认该产品实际支持什么文件/技能功能，不直接视为本地 Agent 安装 |
| 无法读取 Figma | 单独检查 Figma 连接、账号和文件权限 |
| 能查看但不能改稿 | 核对该工具是否具有实际写入能力；只读授权不等于可编辑 |
| 运行脚本时找不到 node | 安装 Node.js 22+，或直接手动复制技能；纯规则阅读无需本包 MCP |
| 组织限制自定义技能/插件 | 使用组织允许的安装入口，由管理员配置相应来源 |

安装格式依据见 [兼容文档中的官方来源](COMPATIBILITY.md)。本指南不代表已在每个客户端完成实际安装与 Figma 操作验收。
