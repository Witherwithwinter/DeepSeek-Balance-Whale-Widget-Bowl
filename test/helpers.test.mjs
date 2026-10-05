// 纯函数自检 + fork 不变量自检：不需要 DSH 运行时。
//
// 覆盖两类东西：
//  ① 纯函数行为：峰谷判定（epoch 秒 / 毫秒 / ISO 字符串）、scale/vol 夹紧、价表。
//  ② fork 不变量：本仓库相对上游的增量（内置角色 / 钢管音效 / 加固）以及桌面端
//     注入链路是否在「同步上游」之后仍然存在。
//     ② 存在的理由：本仓库每次跟随上游都是「以上游为基座重新落增量」，最容易出的
//     事故就是某个增量在上游改版后悄悄丢了（或上游换了写法、增量变成死代码）。
//     把复查项写成断言，比靠人眼比对 4000 行 diff 靠谱。
// 运行：npm test
import fs from 'node:fs'

const read = (rel) => fs.readFileSync(new URL('../' + rel, import.meta.url), 'utf8')
const exists = (rel) => fs.existsSync(new URL('../' + rel, import.meta.url))

const src = read('lib/index.js')
const widget = read('assets/whale-widget.js')
const pkg = JSON.parse(read('package.json'))
const patch = read('cordis.patch.yml')

// 纯函数切片：这块区间的顶层声明不依赖 DSH 运行时，可以直接求值
const start = src.indexOf('const PEAK_HOURS')
const end = src.indexOf('const WIDGET_FILE_CANDIDATES')
if (start < 0 || end < 0 || end <= start) {
  throw new Error('lib/index.js 结构已变化：找不到 PEAK_HOURS / WIDGET_FILE_CANDIDATES 分界')
}
const { isPeakTime, toEpochSeconds, clampScale, clampVol, priceFor } = new Function(
  src.slice(start, end) + '\nreturn { isPeakTime, toEpochSeconds, clampScale, clampVol, priceFor }',
)()

let fail = 0
function eq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (!ok) fail++
  console.log((ok ? 'PASS ' : 'FAIL ') + name + ' -> ' + JSON.stringify(got) + (ok ? '' : ' (期望 ' + JSON.stringify(want) + ')'))
}
function has(name, haystack, needle) {
  const ok = haystack.indexOf(needle) >= 0
  if (!ok) fail++
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' —— 未找到：' + JSON.stringify(needle)))
}
function hasNot(name, haystack, needle) {
  const ok = haystack.indexOf(needle) < 0
  if (!ok) fail++
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' —— 不该出现：' + JSON.stringify(needle)))
}

// —— ① 纯函数 ——
const wedPeak = Math.floor(Date.UTC(2026, 8, 2, 2, 0, 0) / 1000)  // 北京周三 10:00 -> 高峰
const wedOff = Math.floor(Date.UTC(2026, 8, 2, 5, 0, 0) / 1000)   // 北京周三 13:00 -> 低谷
const satNoon = Math.floor(Date.UTC(2026, 8, 5, 2, 0, 0) / 1000)  // 北京周六 10:00 -> 周末全天谷价

eq('工作日高峰(秒)', isPeakTime(wedPeak), true)
eq('工作日 13:00 非高峰', isPeakTime(wedOff), false)
eq('周末全天谷价', isPeakTime(satNoon), false)
eq('高峰(毫秒)', isPeakTime(wedPeak * 1000), true)
eq('高峰(ISO 字符串)', isPeakTime(new Date(wedPeak * 1000).toISOString()), true)
eq('高峰(数字字符串)', isPeakTime(String(wedPeak)), true)
eq('无法解析的时间按谷价', isPeakTime('not-a-time'), false)
eq('null 按谷价', isPeakTime(null), false)
eq('toEpochSeconds 空串', toEpochSeconds(''), null)

eq('scale 上限', clampScale(1000000), 2.5)
eq('scale 下限', clampScale(0), 0.6)
eq('scale 正常值', clampScale(1.4), 1.4)
eq('scale 非数字', clampScale('x'), 1)
eq('vol 上限', clampVol(5), 1)
eq('vol 下限', clampVol(-1), 0)
eq('vol 缺省', clampVol(undefined), 0.9)

eq('pro 价表', priceFor('deepseek-v4-pro').out[1], 27.0)
eq('未知模型回落基础价', priceFor('unknown-model').out[0], 4)

// —— ② fork 不变量：内置角色（顶碗 / 拿碗）——
has('内置角色 bowl', src, "{ id: 'bowl', name: '顶碗鲸鱼娘'")
has('内置角色 hold', src, "{ id: 'hold', name: '拿碗鲸鱼娘'")
has('内置角色图 DSniang-bowl.png', src, "'DSniang-bowl.png'")
has('内置角色图 DSniang-hold.png', src, "'DSniang-hold.png'")
has('内置角色进入默认索引', src, '...BUILTIN_ROLES.map((r) =>')
has('旧 roles.json 兜底补回内置角色', src, 'const missing = defaultRolesIndex().roles.filter')
has('内置角色带 builtin 标记下发', src, 'builtin: isBuiltinRole(r.id)')
has('内置角色不可删（宿主）', src, "'cannot delete builtin role'")
has('内置角色隐藏删除按钮（前端）', widget, "r.id !== 'default' && !r.builtin")
has('内置角色只读展示（前端）', widget, "r.builtin ? '内置角色' : '自定义角色'")

// —— ② fork 不变量：钢管音效组 ——
has('PRESET_GROUPS.pipe', src, "pipe: { id: 'pipe', name: '钢管'")
has('PRESET_FRAGMENTS.p1', src, "p1: { id: 'p1', name: '钢管·按下'")
has('PRESET_FRAGMENTS.p2', src, "p2: { id: 'p2', name: '钢管·松开'")
has('BUILTIN_FRAGMENT_FILES.p1', src, "path.join(PACKAGE_ROOT, 'assets', 'P1.mp3')")
has('BUILTIN_FRAGMENT_FILES.p2', src, "path.join(PACKAGE_ROOT, 'assets', 'P2.mp3')")
has('SOUND_SETS.pipe', src, "pipe: { press: [path.join(PACKAGE_ROOT, 'assets', 'P1.mp3')]")
has('预设片段→音效映射 p1/p2', src, "p1: ['pipe', 'press'], p2: ['pipe', 'release']")
has('前端钢管预设单音', widget, "['preset:pipe:press', '钢管·按下']")
has('前端钢管显示名', widget, "id === 'pipe' ? '钢管'")
has('前端按显示名去重时排除 p1/p2', widget, "f.id === 'p1' || f.id === 'p2'")

// —— ② fork 不变量：加固 ——
hasNot('JSON_HEADERS 不再带 CORS 通配', src, "'Access-Control-Allow-Origin'")
has('size.json 读取夹紧', src, 'scale: clampScale(parsed.scale)')
has('size.json 写入夹紧', src, 'const sc = clampScale(scale)')
has('size.json 原子写', src, 'fs.renameSync(tmp, p)')
has('roleFilePath 正向白名单', src, 'const m = typeof id === \'string\' ? /^[A-Za-z0-9_-]{1,64}$/.exec(id) : null')
has('audioFragmentPath 正向白名单', src, 'if (PRESET_FRAGMENTS[m[0]]) return null')
has('bubble-img id 白名单', src, "if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) throw new Error('bad image id')")
eq('分桶时间兼容毫秒', typeof toEpochSeconds, 'function')

// —— ② 桌面端（Electron）注入链路：本次同步的核心 ——
has('订阅 webserver/index-inject', src, "root.on('webserver/index-inject'")
has('推内联 script 行（不是 script-src）', src, "table.push({ kind: 'script', placement: 'body', text: DESKTOP_WIDGET_ROW_TEXT })")
has('内联行吞掉 onerror（路由不在也不阻断启动）', src, 's.onerror=function(){}')
has('旧版本 script-src 行去重', src, "row.kind === 'script-src'")
// issue #152/#153 的竞态：注入行必须在 apply() 首步注册，不能被 root.inject 推迟
eq(
  '注入行注册早于 root.inject（不被服务就绪推迟）',
  src.indexOf("rowDisposers.push(root.on('webserver/index-inject'") <
    src.indexOf("root.inject(['webServer', 'credentials', 'connection']"),
  true,
)

// —— ② 打包身份：包名 / patch id / 版本三处一致 ——
eq('包名', pkg.name, 'dsh-whale-widget-bowl')
has('cordis.patch.yml 的 id 与包名一致', patch, 'id: dsh-whale-widget-bowl')
has('cordis.patch.yml 的 name 与包名一致', patch, 'name: dsh-whale-widget-bowl')
has('lib/index.js 内嵌版本与 package.json 一致', src, "version: '" + pkg.version + "'")
hasNot('lib/index.js 内嵌版本没有残留上游版本号', src, "version: '0.3.")
eq('npm test 脚本存在', typeof pkg.scripts?.test, 'string')

// —— ② 随包资源齐不齐（缺了会静默降级成没图/没声）——
for (const f of [
  'assets/DSniang1.png', 'assets/DSniang-bowl.png', 'assets/DSniang-hold.png',
  'assets/P1.mp3', 'assets/P2.mp3', 'assets/Ya1.mp3', 'assets/Ya2.mp3', 'assets/D1.mp3', 'assets/D2.mp3',
  'assets/whale-widget.js', 'assets/minecraft-exp-orb.wav', 'assets/task-end-a.wav',
  'lib/index.js', 'lib/accounting.mjs', 'cordis.patch.yml',
]) {
  eq('随包文件存在 ' + f, exists(f), true)
}

console.log(fail === 0 ? 'ALL OK' : fail + ' FAILURES')
process.exit(fail === 0 ? 0 : 1)
