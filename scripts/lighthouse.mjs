import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { arch, platform, release } from 'node:os'
import { setTimeout as sleep } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { launch } from 'chrome-launcher'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'

const base = process.env.LIGHTHOUSE_URL || 'http://127.0.0.1:4174'
const runs = Number(process.env.LIGHTHOUSE_RUNS || '3')
if (!Number.isSafeInteger(runs) || runs < 1 || runs % 2 === 0) throw new Error('LIGHTHOUSE_RUNS deve ser um inteiro positivo ímpar.')
const targets = { performance: 90, accessibility: 95, 'best-practices': 95, seo: 90 }
const categories = Object.keys(targets)
const summary = {
  base,
  runs,
  environment: { node: process.version, os: platform(), release: release(), architecture: arch() },
  targets,
  pages: {},
}

async function waitForPreview() {
  for (let attempt = 0; attempt < 70; attempt++) {
    if (await fetch(base).then((result) => result.ok, () => false)) return
    await sleep(350)
  }
  throw new Error('O build de demonstração não ficou disponível.')
}

function median(values) {
  return [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
}

await mkdir('audits', { recursive: true })
const preview = process.env.LIGHTHOUSE_URL ? undefined
  : spawn(process.execPath, [fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)), 'preview', '--host', '127.0.0.1', '--port', '4174', '--strictPort'], { stdio: 'inherit' })
let chrome
try {
  await waitForPreview()
  chrome = await launch({ chromePath: process.env.CHROME_PATH || undefined, chromeFlags: ['--headless=new', '--disable-dev-shm-usage'] })
  for (const [page, path] of Object.entries({ inicio: '/', detalhe: '/nft/emerald-ape' })) {
    for (const profile of ['desktop', 'mobile']) {
      const measurements = []
      for (let run = 1; run <= runs; run++) {
        const result = await lighthouse(new URL(path, base).href, {
          port: chrome.port,
          output: ['html', 'json'],
          logLevel: 'error',
          onlyCategories: categories,
        }, profile === 'desktop' ? desktopConfig : undefined)
        if (!result || result.lhr.runtimeError) throw new Error(result?.lhr.runtimeError?.message || 'A auditoria não gerou um relatório.')
        const id = `${page}-${profile}-${run}`
        const [html, json] = result.report
        await writeFile(`audits/${id}.html`, html)
        await writeFile(`audits/${id}.json`, json)
        summary.environment.lighthouse = result.lhr.lighthouseVersion
        summary.environment.chromium = result.lhr.environment.hostUserAgent
        summary.environment.benchmarkIndex = result.lhr.environment.benchmarkIndex
        const values = Object.fromEntries(categories.map((category) => [category, Math.round((result.lhr.categories[category].score ?? 0) * 100)]))
        for (const [metric, audit] of Object.entries({ lcpMs: 'largest-contentful-paint', cls: 'cumulative-layout-shift', tbtMs: 'total-blocking-time' })) {
          values[metric] = result.lhr.audits[audit].numericValue
        }
        measurements.push(values)
        console.log(id, values)
      }
      const medians = Object.fromEntries(Object.keys(measurements[0]).map((metric) => [metric, median(measurements.map((measurement) => measurement[metric]))]))
      summary.pages[`${page}-${profile}`] = { medians, measurements }
      await writeFile('audits/summary.json', JSON.stringify(summary, null, 2) + '\n')
    }
  }
} finally {
  await chrome?.kill()
  preview?.kill()
}
