# Craftime 通用 Agent 入口

仅在用户请求 Craftime 设计、评审、接入、状态查询或规范维护时采用以下对应流程。此文件可供没有原生插件/技能发现的 Agent 读取；需要能够访问本仓库的引用文件，不是单文件 Figma 编辑器。

先读 [跨 Agent 执行方式](skills/craftime-figma-ui/references/host-compatibility.md)，再按当前任务读取一个入口：

- 设计/优化页面：[craftime-figma-ui](skills/craftime-figma-ui/SKILL.md)
- 只读评审：[craftime-review](skills/craftime-review/SKILL.md)
- 检查连接：[craftime-setup](skills/craftime-setup/SKILL.md)
- 查询实际采用状态：[craftime-status](skills/craftime-status/SKILL.md)
- 核对或更新规范索引：[craftime-refresh](skills/craftime-refresh/SKILL.md)

没有 Codex 面板时直接采用对应技能，不要求不存在的开关或显示虚构的已挂载状态。规范读取、Figma编辑权限与交付检查分别按实际证据报告。只读评审不自动修改；用户最新范围与定稿优先，固定导航/顶部继续保护。

安装方式与验证边界见 [兼容说明](docs/COMPATIBILITY.md)。
