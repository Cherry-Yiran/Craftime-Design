---
name: craftime-setup
description: 安装 Craftime Design 后打开规范开关面板，让用户在输入框确认当前聊天的开启状态，并只读验证 Figma 接入。
---

# Craftime Design 接入检查

先遵循 [输入框规范开关](../craftime-figma-ui/references/composer.md)。若 `craftime_open` 可用，打开面板，让用户通过开关把规范附到当前聊天输入框。不要用聊天中的绿色提示冒充已附加状态；新工具未加载时明确报告。随后按 [规范使用反馈](../craftime-figma-ui/references/interaction.md) 只读检查接入。

- 查看 Figma 工具是否可用，并只读获取 [Craftime 组件规范](https://www.figma.com/design/03EUC7nSmTdbnEjMOWAQ3U?node-id=2173-505) 的文件页面清单和文字样式。优先使用已连接工具；缺少连接时引导启用 Figma，继续说明插件用法。
- 接入检查仅获取规范目录与样式定义，不遍历业务页面或自动寻找现成 UI；页面查找仅在用户明确要求时进行。做完整页面默认原样加入指定导航和顶部，来源见 craftime-figma-ui。
- 不以插件已安装推断用户已认证；不以源文件可读推断目标文件可编辑。编辑能力在成员选择目标文件后按实际权限核实，不通过创建测试画板验证。
- 简短报告“规范可读取 / 需要连接或文件权限”，不给未测试的行为通过结论。
- 说明开启一次后直接输入页面需求即可，无需每次指定规范。页面请求附目标 Figma 文件、平台、语言和业务需求，已有上下文无需重复填。
- 项目希望每次设计都采用规则时，可在项目指令中要求调用本插件的 craftime-figma-ui 技能。不要覆盖已有项目指令；用户要求配置时才修改。
- 安装本插件和 Figma 不会自动授予文件权限，成员使用自己的账号连接。


