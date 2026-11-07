#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import lighthouse from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'

const PORT = 4173
const BASE_URL = `http://127.0.0.1:${PORT}`
const URLS = [
  { path: '/', name: 'home' },
  { path: '/nft/emerald-ape', name: 'nft-detail' },
]

const DESKTOP_CONFIG = {
  extends: 'lighthouse:default',
  settings: {
    formFactor: 'desktop',
    throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 },
    screenEmulation: { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1, disabled: false },
    emulatedUserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  },
}

const MOBILE_CONFIG = {
  extends: 'lighthouse:default',
  settings: {
    formFactor: 'mobile',
    throttling: { rttMs: 150, throughputKbps: 1638.4, cpuSlowdownMultiplier: 4 },
    screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 2, disabled: false },
  },
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

async function runLighthouse(url, config, name) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--disable-gpu'] })
  try {
    const result = await lighthouse(url, { port: chrome.port, output: ['html', 'json'], ...config })
    await writeFile(`lighthouse-reports/${name}.html`, result.report[0])
    await writeFile(`lighthouse-reports/${name}.json`, result.report[1])
    return {
      performance: Math.round(result.lhr.categories.performance.score * 100),
      accessibility: Math.round(result.lhr.categories.accessibility.score * 100),
      bestPractices: Math.round(result.lhr.categories['best-practices'].score * 100),
      seo: Math.round(result.lhr.categories.seo.score * 100),
      lcp: result.lhr.audits['largest-contentful-paint'].numericValue,
      cls: result.lhr.audits['cumulative-layout-shift'].numericValue,
      tbt: result.lhr.audits['total-blocking-time'].numericValue,
    }
  } finally {
    await chrome.kill()
  }
}

async function runAudits() {
  console.log('🔍 Starting Lighthouse audits...\n')
  console.log('📦 Building application...')
  
  await new Promise((resolve, reject) => {
    const build = spawn('npm', ['run', 'build'], { stdio: 'inherit' })
    build.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`Build failed with code ${code}`))))
  })

  console.log('✅ Build complete\n')
  console.log('🚀 Starting preview server...')
  
  const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], { stdio: 'pipe' })
  
  await new Promise((resolve) => {
    server.stdout.on('data', (data) => {
      if (data.toString().includes('Local:')) resolve()
    })
    setTimeout(resolve, 5000)
  })

  console.log('✅ Server ready\n')
  console.log('Creating reports directory...')
  await import('node:fs/promises').then((fs) => fs.mkdir('lighthouse-reports', { recursive: true }))

  const results = {}

  for (const { path, name } of URLS) {
    const url = BASE_URL + path
    console.log(`\n📊 Auditing ${name} (${url})`)
    
    for (const [profile, config] of Object.entries({ mobile: MOBILE_CONFIG, desktop: DESKTOP_CONFIG })) {
      console.log(`  Running ${profile} audit (3 iterations)...`)
      const runs = []
      
      for (let i = 1; i <= 3; i++) {
        process.stdout.write(`    Run ${i}/3... `)
        const result = await runLighthouse(url, config, `${name}-${profile}-${i}`)
        runs.push(result)
        console.log(`✓ (Performance: ${result.performance}, Accessibility: ${result.accessibility}, Best Practices: ${result.bestPractices}, SEO: ${result.seo})`)
      }

      const key = `${name}-${profile}`
      results[key] = {
        performance: Math.round(median(runs.map((r) => r.performance))),
        accessibility: Math.round(median(runs.map((r) => r.accessibility))),
        bestPractices: Math.round(median(runs.map((r) => r.bestPractices))),
        seo: Math.round(median(runs.map((r) => r.seo))),
        lcp: Math.round(median(runs.map((r) => r.lcp))),
        cls: median(runs.map((r) => r.cls)).toFixed(3),
        tbt: Math.round(median(runs.map((r) => r.tbt))),
      }
      
      console.log(`  ✅ ${profile.toUpperCase()} medians:`, results[key])
    }
  }

  server.kill()

  console.log('\n\n═══════════════════════════════════════')
  console.log('📊 LIGHTHOUSE AUDIT SUMMARY (MEDIANS)')
  console.log('═══════════════════════════════════════\n')

  for (const [key, scores] of Object.entries(results)) {
    const [page, profile] = key.split('-')
    console.log(`${page.toUpperCase()} - ${profile.toUpperCase()}:`)
    console.log(`  Performance:    ${scores.performance >= 90 ? '✅' : '⚠️ '} ${scores.performance} (target: ≥90)`)
    console.log(`  Accessibility:  ${scores.accessibility >= 95 ? '✅' : '⚠️ '} ${scores.accessibility} (target: ≥95)`)
    console.log(`  Best Practices: ${scores.bestPractices >= 95 ? '✅' : '⚠️ '} ${scores.bestPractices} (target: ≥95)`)
    console.log(`  SEO:            ${scores.seo >= 90 ? '✅' : '⚠️ '} ${scores.seo} (target: ≥90)`)
    console.log(`  LCP: ${scores.lcp}ms | CLS: ${scores.cls} | TBT: ${scores.tbt}ms`)
    console.log()
  }

  console.log('Reports saved to lighthouse-reports/\n')

  await writeFile('lighthouse-reports/summary.json', JSON.stringify(results, null, 2))
  console.log('✅ Summary saved to lighthouse-reports/summary.json\n')
}

runAudits().catch((error) => {
  console.error('❌ Lighthouse audit failed:', error)
  process.exit(1)
})
