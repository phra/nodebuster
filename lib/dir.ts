import chalk from 'chalk'
import _progress = require('cli-progress')
import events = require('events')
import fs = require('fs')
import http = require('http')
import https = require('https')
import _url = require('url')

import { IOptions, IResult } from '../models'

const results = new Array(512)
const workersEmitters: events.EventEmitter[] = []

const DEFAULT_OPTIONS: IOptions = {
  wordlist: '/usr/share/wordlists/dirbuster/directory-list-2.3-small.txt',
  extensions: [],
  workers: 10,
  ignoreSSL: false,
  cookies: [],
  userAgent: 'nodebuster',
  consecutiveFails: 15,
  headers: [],
}

export function dir(
  logger: Logger,
  url: string,
  options: IOptions,
) {
  const {
    wordlist,
    extensions,
    workers,
  } = { ...DEFAULT_OPTIONS, ...options }

  const WORDLIST = fs.readFileSync(wordlist, 'utf8')
    .trim()
    .split('\n')
    .filter((line) => line && !line.startsWith('#') && !line.startsWith(' '))
    .reduce((acc, current, index) => {
      acc.push(current)
      acc.push(...extensions.map((ext) => current + '.' + ext))
      return acc
    }, [''] as string[])

  const progress = new _progress.Bar({
    format: '[{bar}] {percentage}% | ETA: {eta_formatted} | Elapsed: {elapsed}s | Current: {value}/{total} | Speed: {speed} reqs/s',
    etaBuffer: 2500,
    stopOnComplete: true,
    fps: 3,
  }, _progress.Presets.shades_classic)

  const WORKERS = Math.min(workers, WORDLIST.length)
  const httpOptions = _url.parse(url)
  const startTime = new Date().getTime()
  let totalReqs = 0
  let totalReqsCompleted = 0
  let speed = 0
  let elapsed = 0
  let totalFails = 0
  let consecutiveFails = 0

  progress.start(WORDLIST.length, 0)

  setInterval(() => {
    elapsed = ((new Date().getTime() - startTime) / 1000)
    speed = totalReqs / elapsed
  }, 1000).unref()

  function _handleResult(workerIndex: number, msg: IResult) {
    if (msg.statusCode !== 404) {
      const { statusCode, path, length, location } = msg
      process.stderr.write('\x1b[2K\r')
      totalReqsCompleted++
      switch (true) {
        case statusCode === -1:
          consecutiveFails++
          totalFails++
          logger.error(`[${chalk.red('+')}] ${chalk.gray(msg.error || '')} - ${path}`)
          if (totalReqsCompleted === 1) {
            logger.error(`[${chalk.red('+')}] ${chalk.gray('target seems down')}`)
            process.exit(-1)
          } else if (consecutiveFails === options.consecutiveFails) {
            logger.error(`[${chalk.red('+')}] ${chalk.gray('exiting after ' + consecutiveFails + ' fails')}`)
            process.exit(-1)
          }
          break
        case statusCode >= 100 && statusCode <= 199:
          consecutiveFails = 0
          logger.info(`[${chalk.gray('+')}] ${chalk.gray(statusCode.toString())} - ${path}`)
          break
        case statusCode >= 200 && statusCode <= 299:
          consecutiveFails = 0
          logger.info(`[${chalk.green('+')}] ${chalk.green(statusCode.toString())} - ${path} = ${length || 0}`)
          break
        case statusCode >= 300 && statusCode <= 399:
          consecutiveFails = 0
          logger.info(`[${chalk.yellow('+')}] ${chalk.yellow(statusCode.toString())} - ${path} -> ${location}`)
          break
        case statusCode >= 400 && statusCode <= 499:
          consecutiveFails = 0
          logger.info(`[${chalk.magenta('+')}] ${chalk.magenta(statusCode.toString())} - ${path} = ${length || 0}`)
          break
        case statusCode >= 500 && statusCode <= 599:
          consecutiveFails = 0
          logger.info(`[${chalk.red('+')}] ${chalk.red(statusCode.toString())} - ${path} = ${length || 0}`)
          break
      }

      results[msg.statusCode] = results[msg.statusCode] || []
      results[msg.statusCode].push(path)
    }

    if (totalReqs + WORKERS < WORDLIST.length) {
      workersEmitters[workerIndex].emit('messageFromMaster', httpOptions.pathname + encodeURIComponent(WORDLIST[totalReqs + WORKERS] || ''))
      totalReqs++
    }

    progress.increment(1, {
      speed: Math.round(speed),
      elapsed: Math.round(elapsed),
    })
  }

  function _worker(agent: http.Agent, emitter: events.EventEmitter, pathname: string) {
    if (pathname) {
      switch (httpOptions.protocol) {
        case 'http:':
        default:
          const reqHTTP = http.request({
            ...httpOptions as http.RequestOptions,
            agent,
            path: pathname,
          }, (res) => {
            emitter.emit('messageFromWorker', {
              statusCode: res.statusCode,
              path: pathname,
              length: res.headers['content-length'],
              location: res.headers.location,
            })

            res.resume()
          })

          reqHTTP.on('error', (err) => {
            emitter.emit('messageFromWorker', {
              statusCode: -1,
              path: pathname,
              error: err.message,
            })
          })

          reqHTTP.setHeader('Cookie', options.cookies.join('; '))
          reqHTTP.setHeader('User-Agent', options.userAgent)
          options.headers.forEach((h) => {
            const key = h.split(': ')[0].trim()
            const value = h.split(': ')[1].trim()
            reqHTTP.setHeader(key, value)
          })

          reqHTTP.end()

          break

        case 'https:':
          const reqHTTPS = https.request({
            ...httpOptions as https.RequestOptions,
            agent,
            path: pathname,
          }, (res) => {
            emitter.emit('messageFromWorker', {
              statusCode: res.statusCode,
              path: pathname,
              length: res.headers['content-length'],
              location: res.headers.location,
            })

            res.resume()
          })

          reqHTTPS.on('error', (err) => {
            emitter.emit('messageFromWorker', {
              statusCode: -1,
              path: pathname,
              error: err.message,
            })
          })

          reqHTTPS.setHeader('Cookie', options.cookies.join('; '))
          reqHTTPS.setHeader('User-Agent', options.userAgent)
          options.headers.forEach((h) => {
            const key = h.split(': ')[0].trim()
            const value = h.split(': ')[1].trim()
            reqHTTPS.setHeader(key, value)
          })

          reqHTTPS.end()

          break
      }
    }
  }

  for (let index = 0; index < WORKERS; index++) {
    const emitter = new events.EventEmitter()
    const keepAliveAgentHTTP = new http.Agent({
      keepAlive: true,
      keepAliveMsecs: 1000,
    })

    const keepAliveAgentHTTPS = new https.Agent({
      keepAlive: true,
      keepAliveMsecs: 1000,
      rejectUnauthorized: options.ignoreSSL,
    })

    const keepAliveAgent = httpOptions.protocol === 'http:' ? keepAliveAgentHTTP : keepAliveAgentHTTPS
    emitter.on('messageFromWorker', _handleResult.bind(emitter, index))
    emitter.on('messageFromMaster', _worker.bind(emitter, keepAliveAgent, emitter))
    emitter.emit('messageFromMaster', httpOptions.pathname + encodeURIComponent(WORDLIST[index]))
    workersEmitters.push(emitter)
  }
}
