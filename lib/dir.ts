import chalk = require('chalk')
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
) {
  const WORDLIST = fs.readFileSync(wordlist, 'utf8')
    .split('\n')
    .filter((line) => line && !line.startsWith('#') && !line.startsWith(' '))

  const progress = new _progress.Bar({
    format: '[{bar}] {percentage}% | ETA: {eta}s | Elapsed: {elapsed}s | Current: {value}/{total} | Speed: {speed} reqs/s',
    etaBuffer: 500,
    stopOnComplete: true,
    fps: 1,
  }, _progress.Presets.shades_classic)

  progress.start(WORDLIST.length, 0)

  const startTime = new Date().getTime()
  let totalReqs = 0
  let speed = 0
  let elapsed = 0

  setInterval(() => {
    elapsed = (new Date().getTime() - startTime) / 1000
    speed = Math.round(totalReqs / elapsed)
  }, 1000).unref()

  function _handleResult(workerIndex: number, msg: IResult) {
    if (msg.statusCode !== 404) {
      process.stderr.write('\x1b[2K\r')
      switch (true) {
        case msg.statusCode.toString().startsWith('1'):
          logger.info(`[${chalk.default.gray('+')}] ${msg.statusCode} - /${msg.path} ${msg['content-length'] ? '-' : ''} ${msg['content-length'] || ''}`)
          break
        case msg.statusCode.toString().startsWith('2'):
          logger.info(`[${chalk.default.green('+')}] ${msg.statusCode} - /${msg.path} ${msg['content-length'] ? '-' : ''} ${msg['content-length'] || ''}`)
          break
        case msg.statusCode.toString().startsWith('3'):
          logger.info(`[${chalk.default.yellow('+')}] ${msg.statusCode} - /${msg.path} ${msg['content-length'] ? '-' : ''} ${msg['content-length'] || ''}`)
          break
        case msg.statusCode.toString().startsWith('4'):
          logger.info(`[${chalk.default.magenta('+')}] ${msg.statusCode} - /${msg.path} ${msg['content-length'] ? '-' : ''} ${msg['content-length'] || ''}`)
          break
        case msg.statusCode.toString().startsWith('5'):
          logger.info(`[${chalk.default.red('+')}] ${msg.statusCode} - /${msg.path} ${msg['content-length'] ? '-' : ''} ${msg['content-length']}` || '')
          break
      }

      results[msg.statusCode] = results[msg.statusCode] || []
      results[msg.statusCode].push(msg.path)
    }

    totalReqs++
    workersEmitters[workerIndex].emit('messageFromMaster', encodeURIComponent(WORDLIST.shift() || ''))
    progress.increment(1, {
      speed,
      elapsed,
    })
  }

  function _worker(agent: http.Agent, emitter: events.EventEmitter, path: string) {
    if (path) {
      http.get({
        host,
        port,
        path,
        agent,
      }, (res) => {
        emitter.emit('messageFromWorker', { statusCode: res.statusCode, path, length: res.headers.length })
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
