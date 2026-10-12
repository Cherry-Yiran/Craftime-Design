# 输入框规范开关

0.3.0 提供自己的 MCP App。通过 `craftime_open` 打开“Craftime · 规范开关”；用户开启后，App 调用宿主的 `ui/update-model-context`，附上完整设计工作流、规范源、版本与当前聊天的开启状态。可见标题为“Craftime 规范 · 已开启”。

- 输入框附件表示当前聊天默认采用该工作流；用户接下来直接输入页面需求即可。它不代表已读取实时 Figma、资产绑定已验证或画板合规。
- 同一 App 实例的更新替换此前上下文。App 重新挂载时，从宿主返回的 `openai/modelContext` 恢复，而不使用本地存储伪造开启状态。
- 只有宿主返回有效 `updateId` 或返回已附加的规范内容时，面板才显示已开启。不支持该能力、读取工作流失败或更新失败时，不能声称已经开启。
- 关闭开关替换为“Craftime 规范 · 未开启”。用户移除附件时，面板关闭，并只发送隐藏的关闭状态以覆盖历史开启记录；不重新添加用户已移除的可见附件。
- 当前附加上下文的 `craftime.enabled: false` 优先于历史开启记录与项目的默认采用路由。关闭自动采用后，用户的明确请求仍优先。
- 作用范围是当前聊天。不能声称已经改变 Codex 全局输入框、所有团队成员或其他聊天的状态。面板开启不授予 Figma 文件权限。

安装旧版本或新工具暂未被宿主加载时，说明真实情况。不要要求每条页面指令重复写“使用 Craftime”，也不把事后聊天提示当作发送前的可见附件。

插件流程不能绕过用户意图，也不能强制保证 agent 合规；完成页面后仍需检查节点、绑定与截图。

依据：[OpenAI MCP Extensions：模型上下文](https://github.com/openai/mcp-extensions/blob/main/docs/spec.md#uiupdate-model-context-extensions)。
