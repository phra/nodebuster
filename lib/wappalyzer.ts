import Wappalyzer = require('wappalyzer')
import Browser = require('wappalyzer/browsers/zombie')
import { IWappalyzerResult } from '../models'

const options = {
  debug: false,
  delay: 500,
  maxDepth: 3,
  maxUrls: 10,
  maxWait: 5000,
  recursive: true,
  userAgent: 'Wappalyzer/nodebuster',
  htmlMaxCols: 2000,
  htmlMaxRows: 2000,
}

const EXTENSIONS = {
  _DEFAULT: ['txt', 'html', 'js', 'md'],
  python: ['py', 'pyc'],
  java: ['jsp', 'do', 'jar', 'java', 'class'],
  php: ['php', 'php5', 'phar'],
  dotnet: ['asp', 'aspx', 'ashx', 'asax', 'axd', 'htm'],
  nodejs: ['js', 'jsx', 'ts', 'tsx'],
  perl: ['pl'],
}

export function wappalyzerScan(url: string): Promise<IWappalyzerResult> {
  return new Wappalyzer(Browser, url, options).analyze()
}

export function printResults(results: IWappalyzerResult): void {
  const str = results.applications.map((res) => {
    return `${res.name} (version: ${res.version}) [confidence: ${res.confidence}]`
  }).join('\n')

  process.stdout.write(str + '\n')
}

export function selectExtensions(results: IWappalyzerResult): string[] {
  const extensions = EXTENSIONS._DEFAULT
  results.applications.forEach((res) => {
    switch (res.name.toLowerCase()) {
      case 'python':
      extensions.push(...EXTENSIONS.python)
      break
      case 'java':
      extensions.push(...EXTENSIONS.java)
      break
      case 'php':
      extensions.push(...EXTENSIONS.php)
      break
      case 'php':
      extensions.push(...EXTENSIONS.php)
      break
      case 'node.js':
      extensions.push(...EXTENSIONS.nodejs)
      break
      case 'microsoft asp.net':
      case 'iis':
      extensions.push(...EXTENSIONS.dotnet)
      break
      case 'perl':
      extensions.push(...EXTENSIONS.perl)
      break
    }
  })

  return [...new Set(extensions)]
}
