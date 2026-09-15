# 更新日志 / Changelog

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## 0.4.0

整合上游 [MeteorNOX/DeepSeek-Balance-Whale-Widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget) v0.3.0：重复功能全部改用原作者实现，本仓库聚焦保留两项增量。

- **整合**：以上游 v0.3.0 为基座整体替换——自定义泡泡系统（点击序列 / 加权并列 / 模块化排版）、小鲸鱼记账 v2（dayStart 口径 + 归档）、33 个厂商余额/额度模板、余额预警与今日预算、任务结束音、自定义角色与音效组导入、吸附与翻转自定义、Codex 本地会话统计等全部随上游到位
- **保留增量**：顶碗 / 拿碗两套形象接入上游「角色」系统，注册为内置角色（不可删、可置顶、持久保存，旧 roles.json 自动补回）；钢管音效（P1/P2.mp3）注册为上游「音效组」第三套内置预设（pipe），可用于按压/松开与任务结束音
- **安全加固**：role-image / bubble-img / audio-fragment 等路由的 id 一律按 `^[A-Za-z0-9_-]{1,64}$` 白名单校验并以匹配结果构造路径
- **合并 0.3.1**：远端 0.3.1 的修复全部移植到新基座——原子写、scale/vol 夹紧、分桶时间兼容毫秒与 ISO、移除 CORS 通配、余额缓存按写入时刻计 TTL（跨天记账一条上游 dayStart 重设计已天然覆盖，无需移植）
- **变更**：路由前缀回到上游的 `/dsh-whale/`，与原版**不可共存**于同一 Web profile（原 0.3.x 的 `/dsh-whale-bowl/` 前缀废弃）；插件 id 仍为 `dsh-whale-widget-bowl`

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
