#!/usr/bin/env node
// tools/check-dead-settings.mjs —— 「控件有值、没有消费方」初筛（随仓库发出，挂进 ci.yml）
//
// 背景：0.3.16 出过一次「②区『提示音量』滑块看着能调、实际完全无效」（用户报告 + 第三方分析复现）；
//   同一批还查出「②区『冒泡提示』勾选框也没人读」。这类 bug 的共同形态是：
//   **设置键被面板写入并持久化、也在界面上回显，但运行时代码从不读它。**
//   本脚本把"每个设置键至少要在运行时被读到一次"这条不变量做成初筛。
//
// 判据（刻意保守，宁少报不误报地挡 CI）：
//   1) 从宿主 `soundEventsDefaults()` / `usageSettingsDefaults()` 抽出全部设置键（含 events.<kind>.<key>）；
//   2) 把「只写/只显示」的区域从两个文件里剔除 —— 声明默认值、载荷组装、面板与编辑器、宿主读写函数；
//   3) 剩下的「运行时代码」里必须能查到该键的**属性访问**（`.<key>` / `['<key>']`）；
//   4) 查不到 ⇒ 判为可疑死键（未在 ALLOW 里登记就让 CI 失败）。
//
// ⚠️ 已知能力边界（别当成完备性证明）：
//   · 它按**键名**判断，不区分 kind —— 若同一个键名在 A 事件里有读取方、B 事件里没有（例如
//     `bubbleOn` 对提问/授权被读、对 turnCost 原本没被读），本脚本**查不出来**；
//   · 这类"同名字段分事件"的漏洞要靠子系统自己的探针（如 `_v778` 钉音量、`_v779` 钉 bubbleOn）。
//   · 因此本脚本是"初筛 + 防回归护栏"，不是审计结论。
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// 允许"有键无运行时读取方"的白名单（每条都要写清理由；新增必须同时更新这里与注释）
const ALLOW = {
  'events.press.vol': '宿主注释已声明是**占位**（"音量与音效组仍在 .dshw-size.json，这里只占位，便于面板把四个事件写成同一结构"）',
  'events.question.autoClose': '遗留死键（v764 已移除面板行；键未清）—— 见 BUG-BACKLOG B11，清理前先登记在此',
  'events.question.ttlSec': '遗留死键（同上）',
  'events.approval.autoClose': '遗留死键（同上）',
  'events.approval.ttlSec': '遗留死键（同上）',
}
// 只写/只显示的区域：这些函数里的出现**不算**"运行时读取方"
const WRITE_ONLY_FUNCS = [
  'soundEventsDefaults', 'usageSettingsDefaults', 'soundEventDefaults', 'soundEventCfg', 'soundEventOut',
  'readUsageSettings', 'writeUsageSettings', 'eventsPayload', 'mergeEventsLocal',
  'openSoundSettingsPanel', 'usageAlertBudgetEditor', 'applyTaskEndLocal', 'refreshSummaries',
]

// 找函数体：⚠️ 宿主文件里的函数是**缩进**的（在插件闭包内），不能要求行首无空格；
//   结束条件是"缩进 <= 声明缩进 且 trim 后为 `}`"，与两个文件的既有风格一致。
const funcSpan = (text, name) => {
  const W = text.split('\n')
  const i = W.findIndex((l) => new RegExp('^\\s*function ' + name + '\\s*\\(').test(l))
  if (i < 0) return null
  const indent = W[i].match(/^\s*/)[0].length
  for (let k = i + 1; k < W.length; k++) {
    const t = W[k].trim()
    if (t === '}' && W[k].match(/^\s*/)[0].length <= indent) return { start: i, end: k }
  }
  return { start: i, end: W.length - 1 }
}
const stripFunc = (text, name) => {
  const s = funcSpan(text, name)
  if (!s) return text
  const W = text.split('\n')
  return W.map((l, k) => (k >= s.start && k <= s.end ? '' : l)).join('\n')
}
// 抽键前先把字符串字面量内容抹掉，否则 `sel: 'frag:end_a'` 里的 `frag:` 会被当成键
const blankStrings = (s) => s.replace(/'[^'\n]*'/g, "''").replace(/"[^"\n]*"/g, '""')
// 从对象字面量里抽键（brace-aware）：返回 { kind: [keys] }
const keysOfObjectLiteral = (text, funcName, nested = true) => {
  const s = funcSpan(text, funcName)
  if (!s) return {}
  const W = text.split('\n')
  const body = blankStrings(W.slice(s.start, s.end + 1).join('\n'))
  const at = body.indexOf('return {')
  if (at < 0) return {}
  let depth = 0, out = {}, cur = null
  for (let k = at + 7; k < body.length; k++) {
    const ch = body[k]
    if (ch === '{') { depth++; continue }
    if (ch === '}') { depth--; if (depth === 0) break; cur = null; continue }
    if (ch !== ':') continue
    const before = body.slice(Math.max(0, k - 60), k)
    // 键名必须是"对象成员"位置：前面紧跟 { , 或换行（允许缩进），否则可能是三元/字符串里的冒号
    if (!/(^|[{,\n])\s*[A-Za-z_$][\w$]*\s*$/.test(before)) continue
    const m = before.match(/([A-Za-z_$][\w$]*)\s*$/)
    if (!m) continue
    if (depth === 1) { cur = m[1]; if (!(cur in out)) out[cur] = nested ? [] : null }
    else if (depth === 2 && nested && cur && Array.isArray(out[cur])) out[cur].push(m[1])
  }
  return out
}
export function audit({ clientPath, hostPath }) {
  const client = fs.readFileSync(clientPath, 'utf8')
  const host = fs.readFileSync(hostPath, 'utf8')
  // —— 抽键 ——
  const events = keysOfObjectLiteral(host, 'soundEventsDefaults')  // { press: [...], turnCost: [...] }
  const top = keysOfObjectLiteral(host, 'usageSettingsDefaults', false) // { taskEnd: null, events: null, wait: null, ... }
  const keys = []
  for (const [kind, ks] of Object.entries(events)) {
    for (const k of ks) keys.push({ key: k, id: 'events.' + kind + '.' + k })
    if (!ks.length) keys.push({ key: kind, id: 'events.' + kind })
  }
  // taskEnd / wait 这类顶层对象：把内层键也展开（先抹掉字符串，避免把 `'frag:end_a'` 里的东西当键）
  for (const name of ['taskEnd', 'wait']) {
    const m = blankStrings(host).match(new RegExp(name + ':\\s*\\{([^}]*)\\}'))
    if (!m) continue
    for (const km of m[1].trim().matchAll(/(?:^|[{,]\s*)([A-Za-z_$][\w$]*)\s*:/g)) keys.push({ key: km[1], id: name + '.' + km[1] })
  }
  // —— 剔除只写/只显示区域（并剥掉注释/字符串：注释里提一句键名不算"有人读"）——
  let runtime = client
  let runtimeHost = host
  for (const f of WRITE_ONLY_FUNCS) { runtime = stripFunc(runtime, f); runtimeHost = stripFunc(runtimeHost, f) }
  const both = stripCommentsAndStrings(runtime + '\n' + runtimeHost)
  // —— 判定（读点数按**键名**统计；行按 (kind,key) 逐条列出，便于白名单精确到路径）——
  const rows = []
  const dead = []
  const byName = new Map()
  for (const { key, id } of keys) {
    if (!byName.has(key)) {
      const re = new RegExp('\\.' + key + '\\b|\\[\\s*[\'"]' + key + '[\'"]\\s*\\]')
      byName.set(key, (both.match(re) || []).length)
    }
    const n = byName.get(key)
    const allow = ALLOW[id] || null
    rows.push({ key, id, hits: n, allow })
    if (n === 0 && !allow) dead.push({ key, id })
  }
  return { rows, dead, keys }
}
// ── 第二层：kind 级「消费方契约表」 ────────────────────────────────────────────────
// 第一层按**键名**审计，抓不到"同名键在 A 事件被读、在 B 事件没人读"（0.3.16 的②区音量和②区冒泡
//   开关都属于这一类 —— 实测第一层跑原版照样通过）。所以这一层把"每个键**必须**由哪个函数消费"
//   显式写成契约：函数必须存在，且函数体内必须出现该键的属性访问。
// 新增设置键时：① 先接消费方；② 到这张表登记验收点（否则 CI 会因"没登记"而失败，见末尾断言）。
const EXPECT_CONSUMERS = {
  'events.turnCost.vol': ['soundVolumeOf'],
  'events.turnCost.volSet': ['soundVolumeOf'],
  'events.turnCost.bubbleOn': ['showCostBubble'],
  'events.question.on': ['pollWaitState'],
  'events.question.sel': ['pollWaitState'],
  'events.question.soundOn': ['pollWaitState'],
  'events.question.vol': ['playBindingSound'],
  'events.question.bubbleOn': ['showWaitBubble'],
  'events.question.lines': ['usageWaitLinesOf'],
  'events.approval.on': ['pollWaitState'],
  'events.approval.sel': ['pollWaitState'],
  'events.approval.soundOn': ['pollWaitState'],
  'events.approval.vol': ['playBindingSound'],
  'events.approval.bubbleOn': ['showWaitBubble'],
  'events.approval.lines': ['usageWaitLinesOf'],
  'wait.charClose': ['waitCharCloseOn'],
  'taskEnd.on': ['playTaskEndSound'],
  'taskEnd.sel': ['playTaskEndSound'],
  // 占位 / 遗留（第一层已白名单，这里显式声明"没有消费方是已知的"）
  'events.press.vol': [],
  'events.question.autoClose': [],
  'events.question.ttlSec': [],
  'events.approval.autoClose': [],
  'events.approval.ttlSec': [],
}
const contractCheck = ({ clientPath, hostPath, keys }) => {
  const files = [fs.readFileSync(clientPath, 'utf8'), fs.readFileSync(hostPath, 'utf8')]
  const problems = []
  for (const { id } of keys) {
    const want = EXPECT_CONSUMERS[id]
    if (!want) { problems.push(id + '：**没有在 EXPECT_CONSUMERS 里登记消费方**（新增设置键必须登记验收点）'); continue }
    for (const fn of want) {
      let span = null
      for (const f of files) { span = funcSpan(f, fn); if (span) break }
      if (!span) { problems.push(id + ' → 消费方函数 ' + fn + '() 不存在（改名/删除后请同步契约表）'); continue }
      const src = stripCommentsAndStrings(files.find((f) => funcSpan(f, fn)).split('\n').slice(span.start, span.end + 1).join('\n'))
      const re = new RegExp('\\.' + id.split('.').pop() + '\\b|\\[\\s*[\'"]' + id.split('.').pop() + '[\'"]\\s*\\]')
      if (!re.test(src)) problems.push(id + ' → 消费方 ' + fn + '() 里没有读到这个键（**这正是"控件没人读"的 bug 形态**）')
    }
  }
  return problems
}

// 判定前必须剥掉注释与字符串字面量：否则"注释里提到键名"会被当成读取方
//   （实测踩过：给 showCostBubble 写了一句含 `events.turnCost.bubbleOn` 的说明，契约层立刻被骗过）
const stripCommentsAndStrings = (s) => s
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/\/\/[^\n]*/g, ' ')
  .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
  .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
  .replace(/`(?:[^`\\]|\\.)*`/g, '``')

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
if (isMain) {
  const here = path.dirname(fileURLToPath(import.meta.url))
  const root = path.resolve(here, '..')
  const clientPath = process.env.WHALE_CLIENT || path.join(root, 'assets', 'whale-widget.js')
  const hostPath = process.env.WHALE_HOST || path.join(root, 'lib', 'index.js')
  console.log('死键初筛（控件有值 / 没有消费方）\n  前端: ' + clientPath + '\n  宿主: ' + hostPath + '\n')
  const { rows, dead, keys } = audit({ clientPath, hostPath })
  console.log('  键'.padEnd(34) + '运行时属性读点   备注')
  for (const r of rows.sort((a, b) => a.id.localeCompare(b.id))) {
    console.log('  ' + r.id.padEnd(32) + String(r.hits).padStart(8) + '   ' + (r.allow ? '白名单: ' + r.allow.slice(0, 60) : (r.hits ? 'ok' : '**可疑死键**')))
  }
  const problems = contractCheck({ clientPath, hostPath, keys })
  console.log('\n  契约表（kind 级：每个键必须由指定函数消费）: ' + (problems.length ? '✘ ' + problems.length + ' 项不合格' : '✔ 全部合格（' + keys.filter((k) => EXPECT_CONSUMERS[k.id]).length + ' 条）'))
  for (const p of problems) console.log('   · ' + p)
  if (dead.length) {
    console.log('\n✘ 第一层：发现 ' + dead.length + ' 个可疑死键（只被写入/显示、运行时不读取）：')
    for (const d of dead) console.log('   · ' + d.id)
  }
  if (dead.length || problems.length) {
    console.log('\n  处理方式：① 接上消费方（首选）；② 确认是占位/遗留 ⇒ 在 ALLOW 里登记并写清理由（同时进 BUG-BACKLOG）；③ 新增键 ⇒ 到 EXPECT_CONSUMERS 登记。')
    process.exit(1)
  }
  console.log('\n✔ 两层都通过：① 所有设置键在运行时都有属性读点；② 每个键的指定消费方确实读到了它')
}
