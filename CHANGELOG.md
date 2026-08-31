# 更新日志 / Changelog

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## 0.3.1

修复与加固，无行为破坏性改动。

- **修复**：记账文件与尺寸配置改为原子写（临时文件 + rename），进程中断不再留下半截 JSON 导致当天用量整份丢失
- **修复**：`size.json` 持久化前夹紧取值——`scale` 限定 0.6–2.5、`vol` 限定 0–1；读取旧配置时同样夹紧
- **修复**：用量分桶时间兼容 epoch 毫秒与 ISO 字符串，此前非秒格式会被判为谷价导致令牌模式低估
- **修复**：移除余额/用量端点上的 `Access-Control-Allow-Origin: *`，挂件与端点同源不需要 CORS
- **修复**：余额缓存按写入时刻而非请求发起时刻计 TTL
- **修复**：跨天后的第一次观测会把夜间余额下降计入新的一天，不再整段丢弃
- **新增**：`screenshots.json`（插件市场展示图声明）、`test/helpers.test.mjs` 自检（`npm test`）、英文 README

## 0.3.0

铁盆鲸鱼娘挂件首次发布，基于 [MeteorNOX/DeepSeek-Balance-Whale-Widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget) 修改。

- 新增「形象」菜单：默认 / 顶碗 / 拿碗三套形象切换，选择持久化
- 新增钢管音效（按下＝撞击段，松开＝余音段）
- 路由前缀改为 `/dsh-whale-bowl/`、插件 id 改为 `dsh-whale-widget-bowl`，可与原版共存
- 其余功能同上游：余额、今日已用（记账 / 令牌两种模式）、每轮对话消耗、拖拽吸附、随机台词
