# 节点读回检查

MCP 工具 `craftime_check_design({readback})` 与脚本 `scripts/check-design-readback.mjs` 使用相同逻辑。工具不访问 Figma、不修改设计，也不识别截图内容。它核对调用者提供的实际读回与已人工复核的截图记录；不得伪造这些证据。颜色继续单独运行 `check-color-semantics.mjs`。

[四项设计决策](design-decisions.md) 需要另外结合实际来源、截图及交付清单核对：移动端独立布局、视觉密度、图标语义辨识与全部目标同步完成情况，不由结构化检查器自动判断。沿用现有交付记录，不伪造额外字段来宣称自动验收通过。

调用前，用 Figma 工具读取本次目标与相关实时定义。保存完整读回，以下格式是整理证据的契约。模拟测试数据只能验证检查器，不能用于验收真实页面。

```json
{
  "scope": {
    "targetFileKey": "actual-file", "targetNodeId": "actual-node", "readAt": "ISO date",
    "categories": {
      "texts": {"inScope": true},
      "icons": {"inScope": false, "reason": "本次未新增或修改图标"},
      "instances": {"inScope": false, "reason": "本次范围无组件复用"},
      "protectedRegions": {"inScope": false, "reason": "仅编辑独立素材，不含固定区域"}
    }
  },
  "texts": [{
    "id": "actual-node", "platform": "web", "language": "latin", "migration": "current",
    "evidence": {"fileKey": "actual-file", "nodeId": "actual-node", "readAt": "ISO date"},
    "screenshot": {"reference": "实际截图路径或资源", "reviewed": true},
    "actual": {"type": "TEXT", "styleId": "actual-style", "fontFamily": "Open Sans", "fontWeight": 400, "fontSize": 16, "lineHeight": {"unit": "PIXELS", "value": 24}, "letterSpacing": {"unit": "PIXELS", "value": 0}},
    "expected": {"role": "Body/Default", "styleId": "actual-style", "source": {"fileKey": "source-file", "nodeId": "style-or-definition-id", "readAt": "ISO date"}, "fontFamily": "Open Sans", "fontWeight": 400, "fontSize": 16, "lineHeight": {"unit": "PIXELS", "value": 24}, "letterSpacing": {"unit": "PIXELS", "value": 0}}
  }]
}
```

- 每项均需 `id`、`evidence` 和经人工复核的 `screenshot`。缺少证据返回“待验证”；已知值不符返回“有偏差”，即使同时缺少别的证据也保留偏差。
- `texts`：实时 expected 属性与实际属性逐项比较，不能把旧资产索引当作实时定义。每个混合文字样式段单独成记录，`id` 保持节点 ID，另记 segment 范围；`mixed: true` 不能作为已完成分段。历史稿使用 `migration: historical` 并记录 `historicalSource`，不自动迁移字体。中文使用 Figma 实际具体字体与对应定义比较，不能把浏览器 system-ui 写成 Figma 字体。
- `icons`：提供 `officialSource`（MingCute 官网）、`iconName`、`assetRevision`。actual 记录 `finalWidth/finalHeight` 及 `paths`，每条包含 `type: VECTOR`、`editable`、`vectorPathsCount`、真实 `strokes`、最终尺寸下的 `effectiveStrokeWeightPx`、`strokeVariableId` 和 `strokeVariableName`。填充轮廓即使写有 strokeWeight=1.67 也不能通过。来源和保形需另外核对原图与最终截图；本工具不自动做图像比对。
- `instances`：actual / expected 含 `mainComponentKey`、`sourceFileKey`、`platform`、`state`；actual 还需 `type: INSTANCE`、`mainComponentId`，expected 需实时 `source`。跨文件使用 key 核对身份，导入后的本地 ID 不必等于来源 ID。变体内容覆盖仍需现场检查。
- `protectedRegions`：`region` 为 `navigation/header`，来源使用指定精确文件与节点；`before/after` 均提供 `structure/layout/style/text/bindings/reactions/ancestorEffects` 的递归快照。快照覆盖后代、变量解析与受影响父级，不只截取根节点。beforeScreenshot 与 screenshot 都需真实截图与复核。数组顺序保留，对象键顺序无关；不同快照表示偏差，不以最终截图替代基线。
- 例外保持单独记录，用户授权来源必须可追溯；不要篡改 expected 值让不符项通过。完整新页面设置 `scope.fullPage: true` 并覆盖 navigation 和 header；既有局部修改也须核对可能受父级或共享定义影响的固定区域。排除项不是通过项。

输出仅为所提供记录的检查结果。范围完整性、来源真实性、视觉判断和 Present 交互仍由实际检查负责。
