#!/usr/bin/env node
import caporal = require('caporal')

import { dir } from './lib'
import { IOptions } from './models'

caporal
  .version('1.0.0')
  .command('dir', 'Directory bruteforce mode')
  // tslint:disable-next-line:max-line-length
  .argument('<url>', '<url> to attack', /^https?:\/\//)
  .option('--workers <workers>', 'Use n <workers>', caporal.INT, 10)
  .option('--wordlist <wordlist>', 'Wordlist to use', caporal.STRING, '/usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt')
  .option('--extensions <extensions>', 'Extensions to use', caporal.LIST, [])
  .option('--cookies', 'Set <cookies>', caporal.LIST, [])
  .action((args, options, logger) => {
    dir(logger, args.url, options as IOptions)
  })

caporal.parse(process.argv)
