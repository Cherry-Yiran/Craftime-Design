# Craftime Design

<img src="assets/craftime-logo.svg" width="64" height="64" alt="Craftime Design">

按 Craftime UI 规范设计、检查 Figma 页面，并维护规范索引。当前版本 **0.3.1**。

## 使用

在 Codex 桌面版安装 [Craftime Design](https://chatgpt.com/plugins/plugins_6acb236925448191aa2fddc2281b43b1)，连接自己的 Figma 账号并取得目标文件权限。插件使用本地 MCP 服务，需要 Node.js 22 或更高版本。

打开插件的规范开关面板，把工作流附到当前聊天输入框，再描述页面需求。规范来源为 [Craftime UI](https://www.figma.com/design/h2Yu0Mg9J23KCatfp4uBgh/Craftime-UI)。安装插件不会自动授予 Figma 文件权限，打开面板也不会修改 Figma。

示例：

- 使用 Craftime Design，按规范在指定 Figma 文件里设计页面。
- 使用 Craftime Design，检查这个 Figma 画板是否符合规范。
- 使用 Craftime Design，读取最新规范并报告资产索引的变化。

## 内容

| 路径 | 用途 |
| --- | --- |
| `plugin.json` | 标准插件清单 |
| `.codex-plugin/plugin.json` | Codex 兼容清单 |
| `mcp.json` / `.mcp.json` | 本地 MCP 服务配置 |
| `.app.json` | Figma 连接依赖 |
| `server/index.mjs` | 已打包的 MCP 服务入口 |
| `assets/craftime-panel.html` | 已打包的规范开关面板 |
| `assets/craftime-logo.svg` | 橙色四瓣图标 |
| `skills/` | 页面设计、规范检查、刷新、接入和状态查询五个技能 |

服务和面板已包含发布版本的打包代码，不需要执行 npm install。本仓库保存发布包完整源码；当前发布包未包含打包前的开发工程。

## 本地检查与打包

```sh
node --check server/index.mjs
node server/index.mjs
```

第二条命令启动 stdio MCP 服务，供支持 MCP 的宿主连接。单独启动服务不代表 Figma 已连接或面板已通过宿主验收。

使用本地插件时，通过目标宿主支持的安装流程选择此目录。修改后在宿主中重新安装或刷新插件，不要直接改安装缓存。

制作只包含插件文件的 ZIP（在仓库根目录执行）：

```sh
python3 - <<'PY'
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root = Path('.')
with ZipFile('../craftime-design-0.3.1.zip', 'w', ZIP_DEFLATED) as archive:
    for name in ('plugin.json', 'mcp.json', '.mcp.json', '.app.json'):
        archive.write(name, f'craftime-design/{name}')
    for directory in ('.codex-plugin', 'assets', 'server', 'skills'):
        for path in sorted((root / directory).rglob('*')):
            if path.is_file():
                archive.write(path, f'craftime-design/{path.as_posix()}')
PY
```

GitHub 保存与账号插件发布是两个步骤。推送本仓库不会自动更新账号中的插件，后续发布需采用插件宿主支持的更新流程。

## 第三方依赖

打包代码的第三方许可见 [THIRD-PARTY-NOTICES.md](assets/THIRD-PARTY-NOTICES.md)。本次源码备份未新增开源许可证。
