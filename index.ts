#!/usr/bin/env node
import caporal = require('caporal')
import { dir } from './lib'

const HOST = 'localhost'
const PORT = 8000
const WORKERS = 10

caporal
  .version('1.0.0')
  .command('dir', 'Directory bruteforce mode')
  // tslint:disable-next-line:max-line-length
  .argument('<host>', 'Host to attack', /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/)
  .option('--port <port>', 'Use TCP <port>', caporal.INT, 80)
  .option('--workers <workers>', 'Use n <workers>', caporal.INT, 10)
  .option('--wordlist <wordlist>', 'Wordlist to use', caporal.STRING, '/usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt')
  .option('--extensions <extensions>', 'Extensions to use', caporal.LIST, [])
  .option('--https', 'Use HTTPS', caporal.BOOL, false)
  .option('--verbose', 'Set verbose mode', caporal.BOOL, false)
  .action((args, options, logger) => {
    dir(logger, args.host, options.port, options.wordlist, options.extensions, options.workers)
  })

caporal.parse(process.argv)
