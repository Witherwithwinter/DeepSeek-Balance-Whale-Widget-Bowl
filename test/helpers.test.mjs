// 纯函数自检：不需要 DSH 运行时，直接从 lib/index.js 里切出模块级工具函数求值。
// 覆盖峰谷判定（epoch 秒 / 毫秒 / ISO 字符串）与 scale/vol 夹紧。
// 运行：npm test
import fs from 'node:fs'

const src = fs.readFileSync(new URL('../lib/index.js', import.meta.url), 'utf8')
const start = src.indexOf('const PEAK_HOURS')
const end = src.indexOf('const WIDGET_JS')
if (start < 0 || end < 0) throw new Error('lib/index.js 结构已变化：找不到 PEAK_HOURS / WIDGET_JS 分界')
const { isPeakTime, toEpochSeconds, clampScale, clampVol, priceFor } = new Function(
  src.slice(start, end) + '\nreturn { isPeakTime, toEpochSeconds, clampScale, clampVol, priceFor }',
)()

let fail = 0
function eq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (!ok) fail++
  console.log((ok ? 'PASS ' : 'FAIL ') + name + ' -> ' + JSON.stringify(got) + (ok ? '' : ' (期望 ' + JSON.stringify(want) + ')'))
}

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
eq('未知模型回落基础价', priceFor('unknown-model').out[0], 4.5)

console.log(fail === 0 ? 'ALL OK' : fail + ' FAILURES')
process.exit(fail === 0 ? 0 : 1)
