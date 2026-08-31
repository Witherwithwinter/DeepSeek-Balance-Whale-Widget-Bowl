# DeepSeek Balance Whale Widget Bowl（DSH 铁盆鲸鱼娘挂件）

![DSH 铁盆鲸鱼娘挂件](assets/DSH2.png)

DeepSeek Harness（DSH）Web 界面右下角的常驻余额挂件。基于 [MeteorNOX/DeepSeek-Balance-Whale-Widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget) 修改的 **铁盆鲸鱼娘版**：新增 **三套形象切换**（默认 / 顶碗 / 拿碗）与 **钢管音效**，其余功能与原版一致（余额 + 今日已用 + 每轮对话消耗统计 + Q 弹拖拽 + 随机台词）。本插件是标准 DSH bundle 插件包。

> 与上游的差异一览：
> - 🎭 新增「形象」菜单（菜单第一行）：**默认**（原作者鲸鱼娘）/ **顶碗**（头顶铁盆）/ **拿碗**（手端铁盆），选择持久化、重启保持
> - 🔊 音效新增 **钢管**（经典金属管落地声：按下=撞击"哐"，松开=余音"嗡……"）
> - 🛣️ 所有 HTTP 路由前缀改为 `/dsh-whale-bowl/`，插件 id 改为 `dsh-whale-widget-bowl`，可与原版共存
> - 🖼️ 顶碗 / 拿碗形象均为高清抠图，人物主体大小已对齐（脸宽一致、1179×1179 正方形透明画布）

## 特性

- 🐋 **常驻自启**：随 DSH Web 界面每次打开自动出现（标准 DSH bundle 插件）
- 🎭 **形象切换**：菜单第一行「形象」三选一——默认（原版鲸鱼娘）/ 顶碗 / 拿碗，即时换图、持久保存
- 💰 **余额**：60 秒自动刷新 + 点击鲸鱼手动刷新；余额变化时数字**滚动动画**；瞬时网络抖动自动沿用最近余额不报错
- 📊 **今日已用**：两种模式任选（见下），显示今日消耗金额
  - **小鲸鱼记账（推荐，免令牌）**：不需要任何会话令牌，鲸鱼娘每次观测余额后用余额差值自动记账（`.dshw-usage.json`，跨天自动归零归档）
  - **实时·令牌**：填入平台会话令牌后直接调用平台用量接口，按**峰谷定价**（工作日高峰 9:00–12:00 与 14:00–18:00，其余空闲）实时换算今日已用
- 💬 **每轮对话消耗统计**：监听本机会话事件，每轮对话结束后弹出本轮消耗金额（精确 usage，非估算），自动关闭时间可调
- 🖱️ **拖拽 + 四边四分之一吸附**，左吸附整体水平镜像翻转（文字同步反向）
- 🧸 **按压 Q 弹**玩偶效果 + 按压/松手音效（小黄鸭 / 音效1 / **钢管**，缺失时静默降级）
- 🎚️ **汉堡菜单**（悬停鲸鱼右上角出现）：形象、大小滑块（0.6–2.5 倍）、音效、音量、用量模式、峰谷文案、气泡开关、每轮消耗开关与自动关闭时间、滚动条避让
- 💬 **随机台词**：点击气泡切换随机台词段（加权随机，含峰谷提示/今日已用/gif/卖萌吐槽），5 秒自动收起
- 📐 随浏览器窗口自动缩放；文字位置/字号与图片联动

## 目录结构

```text
DeepSeek-Balance-Whale-Widget-Bowl/
├── package.json            # DSH bundle 插件元数据（dsh.bundle.patch → cordis.patch.yml）
├── cordis.patch.yml        # 插件挂载声明（id: dsh-whale-widget-bowl）
├── screenshots.json        # 插件市场展示图声明（1-8 张，路径相对本文件）
├── lib/
│   └── index.js            # 宿主侧插件本体（HTTP 路由 / 前端 widget.js / 定价表 / 形象与音效注册表）
├── test/
│   └── helpers.test.mjs    # 纯函数自检（npm test）
├── assets/
│   ├── DSH2.png            # README 顶部展示图
│   ├── DSniang1.png        # 默认形象（原版鲸鱼娘，610×610 cut-out）
│   ├── DSniang-bowl.png    # 顶碗形象（1179×1179 cut-out）
│   ├── DSniang-hold.png    # 拿碗形象（1179×1179 cut-out）
│   ├── DSniang02.png       # 备用整图（兼容旧版手动安装路径）
│   ├── rua.gif             # 随机台词 gif（可选）
│   ├── Ya1.mp3 / Ya2.mp3   # 小黄鸭音效（可选）
│   ├── D1.mp3 / D2.mp3     # 音效1（可选）
│   └── P1.mp3 / P2.mp3     # 钢管音效：按下=撞击段，松开=余音段（可选）
└── whale-widget-prompt.md  # 完整规格/维护提示词
```

## 安装

### 方式 A：从 GitHub 安装（推荐）

无需本地克隆，一条命令安装：

```powershell
dsh plugin --profile web add github:Witherwithwinter/DeepSeek-Balance-Whale-Widget-Bowl
```

- 装完后插件会出现在 DSH 的**插件管理页面**里，可直接在页面里更新
- 网络环境需要代理时，先设置代理环境变量再执行：
  ```powershell
  $env:http_proxy="http://<ip>:<port>"; $env:https_proxy="http://<ip>:<port>"; dsh plugin --profile web add github:Witherwithwinter/DeepSeek-Balance-Whale-Widget-Bowl
  ```

### 方式 B：本地 link 安装（开发用）

在仓库根目录（`package.json` 所在目录）执行：

```powershell
dsh plugin --profile web add link:.
```

- `link:.` 表示链接当前目录，仓库根目录本身就是插件包（**不要**写成 `link:.\dsh-whale-widget-bowl` 这种带子目录的路径）
- 也可以在 DSH 的 profile `package.json` 中手动登记：
  ```jsonc
  // ~/.dsh/profiles/desktop/package.json（web 端同理改 profiles/web）
  {
    "dependencies": {
      "dsh-whale-widget-bowl": "link:C:/你的路径/DeepSeek-Balance-Whale-Widget-Bowl"
    },
    "dsh": { "profile": { "bundles": [ "...", "dsh-whale-widget-bowl" ] } }
  }
  ```
- link 安装后修改源码/图片，**重启 DSH** 即生效（ESM 模块缓存 + 图片内存缓存）

### 与原版共存

原版插件如同时安装，二者路由前缀不同（`/dsh-whale/` vs `/dsh-whale-bowl/`）可共存；建议在 profile patch 中将原版 `disabled: true`。

安装完成后重启 DSH，右下角出现鲸鱼娘即成功。

## 形象切换与换图指南

菜单第一行「形象」可在三套形象间即时切换，选择写入 `size.json` 的 `skin` 字段（`default` / `bowl` / `hold`），重启保持。

| 默认 | 顶碗 | 拿碗 |
|:---:|:---:|:---:|
| <img src="assets/DSniang1.png" width="240" alt="默认形象"/> | <img src="assets/DSniang-bowl.png" width="240" alt="顶碗形象"/> | <img src="assets/DSniang-hold.png" width="240" alt="拿碗形象"/> |
| `assets/DSniang1.png` | `assets/DSniang-bowl.png` | `assets/DSniang-hold.png` |

想替换/新增形象时，按以下规格制作图片：

| 项目 | 规格 |
|---|---|
| 背景 | 完全透明（cut-out 抠图） |
| 画布 | **正方形**（挂件 CSS 按正方形拉伸，非正方形会变形） |
| 人物 | 底部对齐、水平居中；**人物高度撑满画布高度** |
| 多形象对齐 | 各形象**人物主体大小一致**（以脸部宽度为基准对齐，而非图片总高——装饰物如铁盆会虚增身高） |

替换步骤：

1. 用新图覆盖 `assets/DSniang-bowl.png`（顶碗）或 `assets/DSniang-hold.png`（拿碗）；默认形象对应 `assets/DSniang1.png`
2. 若是新增形象，在 `lib/index.js` 的 `SKIN_FILES`（宿主）和 `skinSelect`（前端下拉）各加一条
3. 重启 DSH 生效

## 音效说明

菜单「音效」三选一：小黄鸭（Ya1/Ya2）/ 音效1（D1/D2）/ **钢管**（P1/P2）。按压时播 `press`，松手播 `release`；对应 mp3 缺失时静默降级为无声。钢管音效的分段逻辑：视频中钢管只撞击一次（0.2s），故按下取**撞击+前段余音**，松开取**后段余音**（带淡入衔接），避免两段听起来重复。

## 令牌与用量模式

> **默认不需要任何令牌。** 只需配置 `DEEPSEEK_API_KEY`（拉取余额必需），「今日已用」自动使用**小鲸鱼记账**模式（余额差值本地记账），开箱即用。

- **小鲸鱼记账（默认）**：零配置，观测余额差值自动记账，账本在 `$DSH_HOME/.dshw-usage.json`，跨天归零、保留 30 天
- **实时·令牌（可选）**：需要 `DEEPSEEK_PLATFORM_TOKEN`（DeepSeek **平台网页**会话令牌，非 `sk-` API key）。获取：登录 platform.deepseek.com → F12 → Network → 找 `usage/by_api_key/amount` 请求 → 复制 `Authorization` 头 → 配置为 DSH 凭据。按**峰谷定价**精确换算（定价表在 `lib/index.js` 顶部 `PRICING`，调价可自行修改）
- **每轮对话消耗**：监听本机会话事件按真实 usage 结算，无需任何令牌

## HTTP 接口（宿主路由）

所有路由前缀为 `/dsh-whale-bowl/`：

| 路由 | 说明 |
|---|---|
| `GET image.png?skin=default\|bowl\|hold` | 返回对应形象 PNG（按 skin 内存缓存，`no-store`） |
| `GET balance.json` | 余额 + 今日已用（永远 200 + JSON） |
| `GET last-turn.json` | 最近一轮对话消耗 `{seq, turn, amount, tokens}` |
| `GET size.json` / `PUT` | 挂件配置（scale/vol/soundSet/usageMode/**skin** 等），PUT 写盘持久化 |
| `GET sound/press.mp3?set=…`、`release.mp3?set=…` | 按音效集返回按压/松手音效 |
| `GET widget.js` | 前端挂件源码（tapIndex 自动注入 `<script defer>`） |

## 验证

```powershell
curl "http://127.0.0.1:<端口>/dsh-whale-bowl/image.png?skin=hold"
curl "http://127.0.0.1:<端口>/dsh-whale-bowl/balance.json"
curl "http://127.0.0.1:<端口>/dsh-whale-bowl/size.json"
```

- 端口以本机 DSH 实际监听为准（`netstat -ano | findstr <DSH进程PID>`）。路由带鉴权时 curl 可能返回 403，以浏览器/挂件实际表现为准
- `size.json` 中 `skin` 与 `soundSet` 应与菜单当前选择一致

## 常见问题

- **挂件不出现**：确认插件已登记进 profile 的 `dsh.profile.bundles` 且 `pnpm install` 成功；重启 DSH。
- **改了图片/代码不生效**：宿主对图片按 skin 内存缓存，需**重启 DSH**；前端 JS 同理。
- **换图后人物变形**：画布不是正方形（CSS 按正方形拉伸）。
- **换图后人物忽大忽小**：多形象未按"人物主体（脸宽）"对齐，参考上方换图指南。
- **没有声音**：确认 `assets/*.mp3` 在包内；缺失时静默降级。
- **余额报「未配置 DEEPSEEK_API_KEY」**：去 DSH 凭据服务配置。

## 开发与维护

完整规格、视觉参数、架构结论见 `whale-widget-prompt.md`（其中已补记本 fork 的形象切换与钢管音效规格）。

自检（不需要 DSH 运行时，校验峰谷判定与配置夹紧等纯函数）：

```powershell
npm test
```

## 许可证

本项目基于 **MIT License** 开源，详见 [LICENSE](LICENSE)。原版作者 [MeteorNOX](https://github.com/MeteorNOX)，感谢其优秀的工作。
