# 同事安装指南

适用 Craftime Design v0.3.11，2026-11-02。

## 准备

1. 使用支持 Plugins 的 Codex 桌面版，并安装可运行 `codex plugin` 的 CLI。
2. 准备 Node.js 22 或更新版本，确保桌面应用启动的进程能找到 `node`。MCP 服务已包含依赖，无需 npm install。
3. 获得私有仓库 `Cherry-Yiran/Craftime-Design` 的读取权限，并在本机完成 GitHub Git 身份验证。能在网页打开私有仓库，不代表本机 Git 已认证；可先用 `git ls-remote https://github.com/Cherry-Yiran/Craftime-Design.git HEAD` 检查。
4. 使用自己的 Figma 连接，取得 [规范组件库](https://www.figma.com/design/03EUC7nSmTdbnEjMOWAQ3U?node-id=2173-505) 和本次目标设计文件的访问权限。

## 从 GitHub 安装

在终端执行：

```sh
codex plugin marketplace add Cherry-Yiran/Craftime-Design --ref main
codex plugin add craftime-design@craftime-design-team
```

如桌面应用提供“添加插件市场”入口，也可输入仓库地址 `https://github.com/Cherry-Yiran/Craftime-Design`，再从 Craftime Design 团队插件市场安装；不要输入 raw marketplace.json 地址。入口名称与可用性按客户端版本及组织策略为准。

重开桌面应用，在新聊天选择 Craftime Design。输入「使用 Craftime Design，检查启用状态并打开规范面板」，开启本聊天工作流，再提供目标 Figma 链接和需求。不要在同一聊天同时启用同名账号版和仓库版。

## 下载 ZIP 后本地安装

在 GitHub 仓库页面点击 Code → Download ZIP，完整解压到长期保留的目录；隐藏的 `.agents`、`.codex-plugin`、`.app.json` 和 `.mcp.json` 必须保留。在解压目录执行：

```sh
codex plugin marketplace add .
codex plugin add craftime-design@craftime-design-team
```

本地来源不会自动跟随 GitHub 更新；保留原目录。更新时下载新版到该目录或改用 Git 来源。此仓库 ZIP 包含插件和市场入口，不是账号插件后台专用的纯插件上传包。

## 更新 Git 来源

```sh
codex plugin marketplace upgrade craftime-design-team
```

重开桌面应用，检查插件面板版本；如客户端提示重新安装或更新，按其流程完成。已有聊天的规范附件可能仍是旧版本，应在当前聊天关闭并重新开启工作流，核对显示的版本后继续；不能只凭仓库更新认定聊天已刷新。

## 常见问题

- **仓库无法读取**：确认维护者已添加读取权限、本机 Git 已认证；不要把账号令牌写进仓库或分享包。
- **没有 plugin 子命令**：更新到支持该功能的 Codex CLI/桌面版本，使用 `codex plugin --help` 核对。
- **找不到 node / MCP 无法启动**：检查 `node --version` 为22+，以及桌面应用可见的 PATH；安装运行环境后重新启动桌面应用。
- **Figma 文件不可读**：连接自己的 Figma 账号，单独申请文件权限。插件安装成功与 Figma 授权是两步。
- **被组织策略限制**：由工作区管理员配置允许的插件来源与认证，不通过改插件文件绕过策略。

安装与市场格式依据 [OpenAI 插件打包文档](https://developers.openai.com/plugins/build/plugins)；命令已按维护者当前 CLI 帮助核对。接收者实际安装、桌面面板与实时 Figma 操作尚未实测。
