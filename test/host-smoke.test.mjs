// 宿主侧冒烟测试：用一个极小的假 DSH 宿主把 lib/index.js 真跑起来，
// 逐条打本仓库增量相关的路由 —— 不需要 dsh 在跑，也不会碰真实 $DSH_HOME。
//
// 覆盖：
//   · 官方桌面端注入链路（webserver/index-inject 推内联 script 行 + 去重 + 不推 script-src）
//   · 内置角色：roles.json 带 builtin / 内置图走随包 assets / 拒绝删除 / 越界 id 404
//   · 钢管音效：audio.json 的组与片段 / sound/*.mp3?set=pipe / audio-fragment.wav?id=p1
//   · 加固：size.json 写入夹紧、响应不带 CORS 通配、非回环 Host 403
//
// 运行：npm test（helpers.test.mjs 之后）
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { EventEmitter } from 'node:events'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// 关键：必须在 import 插件**之前**把 DSH_HOME 指到临时目录，
// 否则 size.json / roles.json 的写入会落到真实 ~/.dsh。
const TMP_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'dshw-smoke-'))
process.env.DSH_HOME = TMP_HOME

const plugin = (await import(pathToFileURL(path.join(ROOT, 'lib', 'index.js')).href)).default

let fail = 0
function check(name, ok, detail) {
  if (!ok) fail++
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' —— ' + detail))
}
function eq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  check(name, ok, ok ? '' : '得到 ' + JSON.stringify(got) + '，期望 ' + JSON.stringify(want))
}

// —— 假宿主 ——
const routes = []
const handlers = {}
const taps = []
function makeRes() {
  const res = {
    statusCode: 200,
    headers: null,
    chunks: [],
    writeHead(code, headers) { res.statusCode = code; res.headers = headers || {} },
    end(chunk) {
      if (chunk !== undefined && chunk !== null) res.chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)))
      res.body = Buffer.concat(res.chunks)
    },
  }
  return res
}
const ctx = {
  webServer: {
    register(route) { routes.push(route); return () => {} },
    tapIndex(fn) { taps.push(fn); return () => {} },
  },
  credentials: { get: async () => undefined, set: async () => {}, delete: async () => {} },
  get: () => null,
  connection: null,
  on: () => () => {},
  effect: (cb) => { const d = cb(); return () => { if (typeof d === 'function') d() } },
}
const root = {
  effect: (cb) => { const d = cb(); return () => { if (typeof d === 'function') d() } },
  on(event, cb) { (handlers[event] = handlers[event] || []).push(cb); return () => {} },
  inject: (deps, cb) => cb(ctx),
}
plugin.apply(root)

function invoke(method, url, body, hostHeader) {
  const pathname = url.split('?')[0]
  const route = routes.find((r) => r.kind === 'exact' && r.path === pathname)
    || routes.find((r) => r.kind !== 'exact' && r.path && pathname.startsWith(r.path))
  if (!route) throw new Error('没有注册这条路由：' + pathname)
  const req = new EventEmitter()
  req.method = method
  req.url = url
  req.headers = { host: hostHeader || '127.0.0.1:3080' }
  req.destroy = () => {}
  const res = makeRes()
  const done = route.handler(req, res)
  setImmediate(() => {
    if (body !== undefined && body !== null) req.emit('data', Buffer.from(body))
    req.emit('end')
  })
  return Promise.resolve(done).then(() => res)
}
const readAsset = (f) => fs.readFileSync(path.join(ROOT, 'assets', f))

// —— ① 官方桌面端注入链路 ——
function emitInject(table) {
  for (const cb of handlers['webserver/index-inject'] || []) cb(table)
}
check('注册了 webserver/index-inject 订阅', (handlers['webserver/index-inject'] || []).length === 1)
{
  const table = []
  emitInject(table)
  eq('注入表恰好推 1 行', table.length, 1)
  eq('推的是内联 script 行（不是 script-src）', table[0].kind, 'script')
  eq('放置在 body', table[0].placement, 'body')
  check('行内脚本自建 widget.js 并吞掉 onerror',
    typeof table[0].text === 'string' && table[0].text.includes('/dsh-whale/widget.js') && table[0].text.includes('onerror=function(){}'),
    JSON.stringify(table[0].text))
  emitInject(table)
  eq('重复收集不重复推（宿主每次收集都是新表时才该推）', table.length, 1)
}
{
  const legacy = [{ kind: 'script-src', placement: 'body', src: '/dsh-whale/widget.js' }]
  emitInject(legacy)
  eq('旧版 script-src 行在场时不重复推', legacy.length, 1)
}
{
  const other = [{ kind: 'script', placement: 'body', text: '/* 别的插件 */' }]
  emitInject(other)
  eq('别人的行不影响我们追加', other.length, 2)
}

// —— ② 内置角色 ——
const rolesJson = await invoke('GET', '/dsh-whale/roles.json')
const rolesPayload = JSON.parse(rolesJson.body.toString('utf8'))
eq('roles.json 返回成功', rolesPayload.ok, true)
const roleOf = (id) => rolesPayload.roles.find((r) => r.id === id)
check('内置角色 bowl 存在', !!roleOf('bowl'), JSON.stringify(rolesPayload.roles.map((r) => r.id)))
check('内置角色 hold 存在', !!roleOf('hold'))
eq('bowl 名字', roleOf('bowl') && roleOf('bowl').name, '顶碗鲸鱼娘')
eq('hold 名字', roleOf('hold') && roleOf('hold').name, '拿碗鲸鱼娘')
eq('bowl 带 builtin 标记', roleOf('bowl') && roleOf('bowl').builtin, true)
eq('默认角色不带 builtin', roleOf('default') && roleOf('default').builtin, false)

{
  const r = await invoke('GET', '/dsh-whale/role-image.png?id=bowl')
  eq('内置角色图 bowl 200', r.statusCode, 200)
  eq('内置角色图 bowl 是 image/png', r.headers && r.headers['Content-Type'], 'image/png')
  check('内置角色图 bowl 字节 = assets/DSniang-bowl.png', Buffer.compare(r.body, readAsset('DSniang-bowl.png')) === 0)
}
{
  const r = await invoke('GET', '/dsh-whale/role-image.png?id=hold')
  check('内置角色图 hold 字节 = assets/DSniang-hold.png', r.statusCode === 200 && Buffer.compare(r.body, readAsset('DSniang-hold.png')) === 0)
}
{
  const r = await invoke('GET', '/dsh-whale/role-image.png?id=' + encodeURIComponent('../lib/index.js'))
  eq('越界 id 取不到图（白名单）', r.statusCode, 404)
}
{
  const r = await invoke('POST', '/dsh-whale/role-delete.json', JSON.stringify({ id: 'bowl' }))
  eq('拒绝删除内置角色', r.statusCode, 400)
  check('拒绝理由写明 builtin', r.body.toString('utf8').includes('cannot delete builtin role'), r.body.toString('utf8'))
}
{
  const r = await invoke('POST', '/dsh-whale/role-delete.json', JSON.stringify({ id: 'default' }))
  eq('仍然拒绝删除默认角色', r.statusCode, 400)
}
{
  // 内置角色可以置顶（写入 roles.json 索引，落在临时 DSH_HOME）
  const r = await invoke('POST', '/dsh-whale/role-pin.json', JSON.stringify({ id: 'bowl', pinned: true }))
  eq('内置角色可以置顶', r.statusCode, 200)
  const after = JSON.parse((await invoke('GET', '/dsh-whale/roles.json')).body.toString('utf8'))
  eq('置顶状态已持久化', after.roles.find((x) => x.id === 'bowl').pinned, true)
}

// —— ③ 钢管音效 ——
{
  const r = await invoke('GET', '/dsh-whale/audio.json')
  const audio = JSON.parse(r.body.toString('utf8'))
  const pipe = (audio.groups || []).find((g) => g.id === 'pipe')
  check('audio.json 里有 pipe 组', !!pipe, JSON.stringify((audio.groups || []).map((g) => g.id)))
  eq('pipe 组显示名', pipe && pipe.name, '钢管')
  const ids = (audio.fragments || []).map((f) => f.id)
  check('有 p1 片段', ids.includes('p1'), JSON.stringify(ids))
  check('有 p2 片段', ids.includes('p2'))
}
{
  const r = await invoke('GET', '/dsh-whale/sound/press.mp3?set=pipe')
  eq('set=pipe 按下 200', r.statusCode, 200)
  eq('set=pipe 按下 Content-Type', r.headers && r.headers['Content-Type'], 'audio/mpeg')
  check('set=pipe 按下字节 = assets/P1.mp3', Buffer.compare(r.body, readAsset('P1.mp3')) === 0)
}
{
  const r = await invoke('GET', '/dsh-whale/sound/release.mp3?set=pipe')
  check('set=pipe 松开字节 = assets/P2.mp3', r.statusCode === 200 && Buffer.compare(r.body, readAsset('P2.mp3')) === 0)
}
{
  const r = await invoke('GET', '/dsh-whale/audio-fragment.wav?id=p1')
  eq('片段 p1 200', r.statusCode, 200)
  eq('片段 p1 Content-Type', r.headers && r.headers['Content-Type'], 'audio/mpeg')
  check('片段 p1 字节 = assets/P1.mp3（预设片段映射到 pipe）', Buffer.compare(r.body, readAsset('P1.mp3')) === 0)
}

// —— ④ 加固 ——
{
  const r = await invoke('PUT', '/dsh-whale/size.json', JSON.stringify({ scale: 999, vol: 5 }))
  const body = JSON.parse(r.body.toString('utf8'))
  eq('size.json 写入被夹紧：scale', body.scale, 2.5)
  eq('size.json 写入被夹紧：vol', body.vol, 1)
  const onDisk = JSON.parse(fs.readFileSync(path.join(TMP_HOME, '.dshw-size.json'), 'utf8'))
  eq('落盘的 scale 同样被夹紧', onDisk.scale, 2.5)
  const back = JSON.parse((await invoke('GET', '/dsh-whale/size.json')).body.toString('utf8'))
  eq('读回时也被夹紧', back.scale, 2.5)
  check('size.json 响应不带 CORS 通配', !(r.headers && 'Access-Control-Allow-Origin' in r.headers), JSON.stringify(r.headers))
}
{
  const r = await invoke('GET', '/dsh-whale/roles.json', null, 'evil.example.com')
  eq('非回环 Host 的读请求被拒', r.statusCode, 403)
}
{
  const r = await invoke('POST', '/dsh-whale/role-pin.json', JSON.stringify({ id: 'default', pinned: true }), '192.168.1.9:3080')
  eq('非回环 Host 的写请求被拒', r.statusCode, 403)
}

try { fs.rmSync(TMP_HOME, { recursive: true, force: true }) } catch (err) {}

console.log(fail === 0 ? 'ALL OK' : fail + ' FAILURES')
process.exit(fail === 0 ? 0 : 1)
