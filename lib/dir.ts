import _progress = require('cli-progress')
import colorette = require('colorette')
import events = require('events')
import fs = require('fs')
import http = require('http')
import https = require('https')
import _url = require('url')

import { IOptions, IResult } from '../models'

const results = new Array(512)
const workersEmitters: events.EventEmitter[] = []

const DEFAULT_OPTIONS: IOptions = {
  wordlist: '/usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt',
  extensions: [],
  workers: 10,
  ignoreSsl: false,
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
  options = { ...DEFAULT_OPTIONS, ...options }
  const WORDLIST = fs.readFileSync(options.wordlist, 'utf8')
    .trim()
    .split('\n')
    .filter((line) => line && !line.startsWith('#') && !line.startsWith(' '))
    .reduce((acc, current, index) => {
      acc.push(current)
      acc.push(...options.extensions.map((ext) => current + '.' + ext))
      return acc
    }, [''] as string[])

  const progress = new _progress.Bar({
    format: '[{bar}] {percentage}% | ETA: {eta_formatted} | Elapsed: {elapsed}s | Current: {value}/{total} | Speed: {speed} reqs/s',
    etaBuffer: 2500,
    stopOnComplete: true,
    fps: 3,
  }, _progress.Presets.shades_classic)

  const WORKERS = Math.min(options.workers, WORDLIST.length)
  const httpOptions = _url.parse(url)
  const startTime = new Date().getTime()
  let totalReqs = 0
  let totalReqsCompleted = 0
  let speed = 0
  let elapsed = 0
  let consecutiveFails = 0

  function printError(error: string, path?: string) {
    logger.error(`[${colorette.red('+')}] ${colorette.gray(error || '')}${path ? ' - ' + path : ''}`)
  }

  function print100(statusCode: string, path: string) {
    logger.info(`[${colorette.gray('+')}] ${colorette.gray(statusCode)} - ${path}`)
  }

  function print200(statusCode: string, path: string, length?: number) {
    logger.info(`[${colorette.green('+')}] ${colorette.green(statusCode)} ${path}${length ? ' = ' + length : ''}`)
  }

  function print300(statusCode: string, path: string, location: string) {
    logger.info(`[${colorette.yellow('+')}] ${colorette.yellow(statusCode)} ${path}${location ? ' => ' + location : ''}`)
  }

  function print400(statusCode: string, path: string, length?: number) {
    logger.info(`[${colorette.magenta('+')}] ${colorette.magenta(statusCode)} ${path}${length ? ' = ' + length : ''}`)
  }

  function print500(statusCode: string, path: string, length?: number) {
    logger.info(`[${colorette.red('+')}] ${colorette.red(statusCode)} - ${path}${length ? ' = ' + length : ''}`)
  }

  function _handleResult(workerIndex: number, msg: IResult) {
    if (msg.statusCode !== 404) {
      const { statusCode, path, length, location } = msg
      process.stderr.write('\x1b[2K\r')
      totalReqsCompleted++
      switch (true) {
        case statusCode === -1:
          consecutiveFails++
          printError(msg.error!, path)
          if (totalReqsCompleted === 1) {
            printError('target seems down')
            process.exit(-1)
          } else if (consecutiveFails === options.consecutiveFails) {
            printError('exiting after ' + consecutiveFails + ' fails')
            process.exit(-1)
          }
          break
        case statusCode >= 100 && statusCode <= 199:
          consecutiveFails = 0
          print100(path, statusCode.toString())
          break
        case statusCode >= 200 && statusCode <= 299:
          consecutiveFails = 0
          print200(statusCode.toString(), path, length)
          break
        case statusCode >= 300 && statusCode <= 399:
          consecutiveFails = 0
          print300(statusCode.toString(), path, location)
          break
        case statusCode >= 400 && statusCode <= 499:
          consecutiveFails = 0
          print400(statusCode.toString(), path, length)
          break
        case statusCode >= 500 && statusCode <= 599:
          consecutiveFails = 0
          print500(statusCode.toString(), path, length)
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

  progress.start(WORDLIST.length, 0)

  setInterval(() => {
    elapsed = ((new Date().getTime() - startTime) / 1000)
    speed = totalReqs / elapsed
  }, 1000).unref()

  for (let index = 0; index < WORKERS; index++) {
    const emitter = new events.EventEmitter()
    const keepAliveAgentHTTP = new http.Agent({
      keepAlive: true,
      keepAliveMsecs: 1000,
    })

    const keepAliveAgentHTTPS = new https.Agent({
      keepAlive: true,
      keepAliveMsecs: 1000,
      rejectUnauthorized: true,
    })

    const keepAliveAgent = httpOptions.protocol === 'http:' ? keepAliveAgentHTTP : keepAliveAgentHTTPS
    emitter.on('messageFromWorker', _handleResult.bind(emitter, index))
    emitter.on('messageFromMaster', _worker.bind(emitter, keepAliveAgent, emitter))
    emitter.emit('messageFromMaster', httpOptions.pathname + encodeURIComponent(WORDLIST[index]))
    workersEmitters.push(emitter)
  }
}
