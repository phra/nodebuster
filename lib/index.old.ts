import assert = require('assert')
import cluster = require('cluster')
import http = require('http')
import net = require('net')
import os = require('os')

import { IResult } from '../models'

const HOST = 'localhost'
const PORT = 8000
const WORDLIST = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16']
for (let i = 17; i < 100; i++) {
  WORDLIST.push(`${i}`)
}

assert(WORDLIST.length, 'NO WORDLIST')

const CPUS = Math.min(Math.max(os.cpus().length - 1, 1), WORDLIST.length)
const results = new Array(512).fill([])

if (cluster.isMaster) {
  const workers: cluster.Worker[] = []

  function handleResult(workerIndex: number, msg: IResult) {
    // tslint:disable-next-line:no-console
    console.log('handleResult', JSON.stringify(msg));
    (results[msg.type] as string[]).push(msg.payload)

    if (!WORDLIST[0]) {
      return workers[workerIndex].kill('SIGINT')
    }

    workers[workerIndex].send(WORDLIST.shift())
  }

  // tslint:disable-next-line:no-console
  console.log(`Master ${process.pid} is running`)

  cluster.on('exit', (worker, code, signal) => {
    if (code) {
      // tslint:disable-next-line:no-console
      console.log(`worker ${worker.process.pid} died [${code}]`)
      workers.forEach((w) => !w.isDead && w.kill('SIGKILL'))
      process.nextTick(() => process.exit(-1))
    }
  })

  // Fork workers.
  for (let index = 0; index < Math.max(CPUS, 1); index++) {
    workers.push(cluster.fork())
    workers[index].on('message', handleResult.bind(null, index))
    workers[index].send(WORDLIST.shift())
  }
} else {
  // tslint:disable-next-line:no-console
  console.log(`Worker ${process.pid} started`)
  const keepAliveAgent = new http.Agent({
    keepAlive: true,
    keepAliveMsecs: 1000,
  })

  // process.on('SIGINT', () => {
  //   // process.exit(0)
  // })

  process.on('message', (word: string) => {
    // const step = Math.floor(WORDLIST.length / CPUS)
    // const start = index * step
    // const end = ((index + 1) * step) >= (WORDLIST.length - 1 - step) ? WORDLIST.length : ((index + 1) * step)
    // const wordlist = WORDLIST.slice(start, end)

    http.get({
      host: 'localhost',
      port: 8000,
      path: word,
      agent: keepAliveAgent,
    }, (res) => {
      process.send!({ type: res.statusCode, payload: word })
      res.resume()
    })

    // let current = 0
    // const connection = net.connect({ host: HOST, port: PORT }, () => {
    //   // tslint:disable-next-line:no-console
    //   console.log(`Worker ${process.pid} connected to ${HOST}:${PORT}, [${start}, ${end}]`)
    //   // connection.setKeepAlive(true)
    //   connection.on('data', (data) => {
    //     const type = parseInt(data.slice(('HTTP/1.1').length, ('HTTP/1.1 200').length).toString(), 10)
    //     // tslint:disable-next-line:no-console
    //     console.log('diocane', data.toString())
    //     const payload = wordlist[current]
    //     process.send!({ type, payload })
    //     if (current++ === (end - start)) {
    //       process.disconnect()
    //     }
    //   })

    //   connection.setKeepAlive(true)
    //   connection.unref()

    //   // tslint:disable-next-line:no-console
    //   wordlist.forEach((word) => console.log(word) || connection.write(`GET /${word} HTTP/1.1\r\nKeep-Alive: timeout=1000\r\nConnection: Keep-Alive\r\n\r\n`))
    //   // connection.end(() => {
    //   // process.disconnect()
    //   // process.exit(0)
    //   // })
    // })
  })
}
