#!/usr/bin/env node
import caporal = require('caporal')

console.log = console.error.bind(console)
import animation = require('chalk-animation')

import { dir } from './lib'
import { IOptions } from './models'

// tslint:disable-next-line:no-var-requires
const version = require('./package.json').version

const BANNER = `[!] nodebuster v.${version}`

const effects = ['rainbow', 'pulse', 'glitch', 'radar', 'neon', 'karaoke']

const animator = animation[effects[(Math.random() * 100 % (effects.length - 1)).toFixed(0)]]

caporal
  .version(version)
  .command('dir', 'Directory bruteforce mode')
  // tslint:disable-next-line:max-line-length
  .argument('<url>', '<url> to attack', /^https?:\/\//)
  .option('--workers <workers>', 'Use n <workers>', caporal.INT, 10)
  .option('--wordlist <wordlist>', 'Wordlist to use', caporal.STRING, '/usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt')
  .option('--user-agent <user-agent>', 'User-agent to use', caporal.STRING, 'nodebuster')
  .option('--extensions <extensions>', 'Extensions to use', caporal.LIST, [])
  .option('--cookies', 'Set <cookies>', caporal.LIST, [])
  .option('--ignore-ssl', 'Skip SSL/TLS certificate check', caporal.LIST, [])
  .action((args, options, logger) => {
    const _ = animator(BANNER)
    setTimeout(() => {
      _.stop()
      dir(logger, args.url, options as IOptions)
    }, 2000)
  })

caporal.parse(process.argv)
