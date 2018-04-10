import chalk from 'chalk'
import _progress = require('cli-progress')
import events = require('events')
import fs = require('fs')
import http = require('http')

import { IResult } from '../models'

const results = new Array(512)
const workersEmitters: events.EventEmitter[] = []

export function dir(
  logger: Logger,
  host: string,
  port: number,
  wordlist = '/usr/share/wordlists/dirbuster/directory-list-2.3-small.txt',
  extensions = [],
  workers = 10,
  entryPath = '/',
) {
  const WORDLIST = fs.readFileSync(wordlist, 'utf8')
    .split('\n')
    .filter((line) => line && !line.startsWith('#') && !line.startsWith(' '))
    .reduce((acc, current) => {
      acc.push(current, ...extensions.map((ext) => current + '.' + ext))
      return acc
    }, [] as string[])

  const progress = new _progress.Bar({
    format: '[{bar}] {percentage}% | ETA: {eta_formatted} | Elapsed: {elapsed}s | Current: {value}/{total} | Speed: {speed} reqs/s',
    etaBuffer: 2500,
    stopOnComplete: true,
    fps: 3,
  }, _progress.Presets.shades_classic)

  const startTime = new Date().getTime()
  let totalReqs = 0
  let speed = 0
  let elapsed = 0

  progress.start(WORDLIST.length, 0)

  setInterval(() => {
    elapsed = ((new Date().getTime() - startTime) / 1000)
    speed = totalReqs / elapsed
  }, 1000).unref()

  function _handleResult(workerIndex: number, msg: IResult) {
    if (msg.statusCode !== 404) {
      const { statusCode, path, length, location } = msg
      process.stderr.write('\x1b[2K\r')
      switch (true) {
        case statusCode >= 100 && statusCode <= 199:
          logger.info(`[${chalk.gray('+')}] ${chalk.gray(statusCode.toString())} - ${path}`)
          break
        case statusCode >= 200 && statusCode <= 299:
          logger.info(`[${chalk.green('+')}] ${chalk.green(statusCode.toString())} - ${path} = ${length || 0}`)
          break
        case statusCode >= 300 && statusCode <= 399:
          logger.info(`[${chalk.yellow('+')}] ${chalk.yellow(statusCode.toString())} - ${path} -> ${location}`)
          break
        case statusCode >= 400 && statusCode <= 499:
          logger.info(`[${chalk.magenta('+')}] ${chalk.magenta(statusCode.toString())} - ${path} = ${length || 0}`)
          break
        case statusCode >= 500 && statusCode <= 599:
          logger.info(`[${chalk.red('+')}] ${chalk.red(statusCode.toString())} - ${path} = ${length || 0}`)
          break
      }

      results[msg.statusCode] = results[msg.statusCode] || []
      results[msg.statusCode].push(msg.path)
    }

    totalReqs++
    workersEmitters[workerIndex].emit('messageFromMaster', entryPath + encodeURIComponent(WORDLIST.shift() || ''))
    progress.increment(1, {
      speed: Math.round(speed),
      elapsed: Math.round(elapsed),
    })
  }

  function _worker(agent: http.Agent, emitter: events.EventEmitter, path: string) {
    if (path) {
      http.get({
        host,
        port,
        agent,
        path,
      }, (res) => {
        emitter.emit('messageFromWorker', {
          statusCode: res.statusCode,
          path,
          length: res.headers['content-length'],
          location: res.headers.location,
        })

        res.resume()
      })
    }
  }

  for (let index = 0; index < Math.min(workers, WORDLIST.length); index++) {
    const emitter = new events.EventEmitter()
    const keepAliveAgent = new http.Agent({
      keepAlive: true,
      keepAliveMsecs: 1000,
    })

    emitter.on('messageFromWorker', _handleResult.bind(emitter, index))
    emitter.on('messageFromMaster', _worker.bind(emitter, keepAliveAgent, emitter))
    emitter.emit('messageFromMaster', WORDLIST.shift())
    workersEmitters.push(emitter)
  }
}
