# 更新日志 / Changelog

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## 0.5.0

跟随上游 [MeteorNOX/DeepSeek-Balance-Whale-Widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget) 从 v0.3.0 升到 **v0.3.18**，**支持官方桌面版（Electron 客户端）**；本仓库两处增量重新落到新基座上。

- **新增：官方桌面端（Electron）可用**。上游 v0.3.12 起，桌面壳的 `index.html` 是安装包静态 `dist` 直出（`dsh-app://app/`），**不经过宿主 `renderIndex()`**，所以老的 `tapIndex`（函数式 HTML 变换）结构上过不了 IPC —— 表现就是「桌面端右下角什么都没有，控制台也不报错」。本版本随上游一并带上新链路：订阅 `webserver/index-inject` 推一行**内联 `script` 行**（不是 `script-src` 行：后者加载失败会 reject 掉 boot，正是 issue #154 那个「关掉插件后刷新应用起不来」的致命错误），由行内脚本自建 `<script src="/dsh-whale/widget.js">` 并吞掉 `onerror`；注入行在 `apply()` 首步注册，不被服务就绪推迟（issue #152/#153 的竞态）
- **整合**：上游 v0.3.1 → v0.3.18 的全部内容整体到位 —— 音效与提示面板（四入口 + 折叠）、对话名模块、DSH 账号登录态读余额、凭据外带安全修复（S1）、信任栅栏 fail-closed、记账分本可见性、峰谷补法定节假日、Codex 本地会话统计、气泡抢占顺序、桌面端窗口键避让、`wait.json` 等
- **保留增量（重新落盘，非 cherry-pick）**：顶碗 / 拿碗两套形象仍以「内置角色」形式随包提供（不可删、可置顶、旧 `roles.json` 兜底补回、前端隐藏删除按钮）；钢管音效仍为第三套内置预置组（`pipe` / `p1` / `p2`，按下 = 撞击 + 前段余音，松开 = 后段余音），可用于按压、松开与任务结束音
- **保留加固**：`size.json` 读写两侧夹紧（scale 0.6–2.5 / vol 0–1）与原子写；`role-image` / `audio-fragment` / `bubble-img` 的 id 一律按 `^[A-Za-z0-9_-]{1,64}$` 白名单校验、并以匹配结果构造路径；分桶时间兼容 epoch 秒 / 毫秒 / ISO 字符串；去掉余额与用量端点上的 `Access-Control-Allow-Origin: *`（同源不需要；上游 v0.3.18 仍带这一条）
- **说明**：上游 v0.3.1 起的账本原子写（`lib/index.js` 的临时文件 + rename）与「余额缓存按写入时刻计 TTL」本版本**直接沿上游实现**，不再保留本仓库旧写法；跨天首次观测的记账口径由上游 `lib/accounting.mjs` 重设计覆盖
- **工程**：`npm test` 从「纯函数自检」扩成两层 —— `test/helpers.test.mjs`（纯函数 + **fork 不变量**：内置角色、钢管音效、桌面端注入行、包名 / patch id / 版本三处一致性）与 `test/host-smoke.test.mjs`（假宿主把 `lib/index.js` 真跑起来逐条打增量路由，不碰真实 `$DSH_HOME`）；专门防「跟随上游时增量悄悄丢失」。同时引入上游的 0 依赖维护脚本与 CI（`tools/ci-audit.mjs` 等，包名断言已改为本仓库，并把 `npm test` 加进 `ci.yml`）
- **变更**：版本号 0.5.0（本仓库自己的版本线，包内 `version` 字段同步）；路由前缀仍与上游一致（`/dsh-whale/`），**与原版不可共存**于同一 profile

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
