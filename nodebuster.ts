#!/usr/bin/env node
import caporal = require('caporal')

console.log = console.error.bind(console)
import animation = require('chalk-animation')

import { dir } from './lib'
import { IOptions } from './models'

// tslint:disable-next-line:no-var-requires
const version = require('./package.json').version

const BANNER = `[!] nodebuster v.${version}`

const animator = animation.glitch

caporal
  .version(version)
  .command('dir', 'Directory bruteforce mode')
  // tslint:disable-next-line:max-line-length
  .argument('<url>', '<url> to attack', /^https?:\/\//)
  .option('-w, --workers <workers>', 'Use n <workers>', caporal.INT, 10)
  .option('-W, --wordlist <wordlist>', '<wordlist> to use', caporal.STRING, '/usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt')
  .option('-u, --user-agent <user-agent>', '<user-agent> to use', caporal.STRING, 'nodebuster')
  .option('-e, --extensions <extensions>', '<extensions> to use', caporal.LIST, [])
  .option('-c, --cookies <cookies>', 'Set <cookies>', caporal.LIST, [])
  .option('-K, --ignore-ssl', 'Enable <ignore-ssl>', caporal.BOOLEAN, false)
  .option('-f, --consecutive-fails', 'Stop after <consecutive-fails>', caporal.INT, 15)
  .action((args, options, logger) => {
    const _ = animator(BANNER)
    setTimeout(() => {
      _.stop()
      dir(logger, args.url, options as IOptions)
    }, 2000)
  })

caporal.parse(process.argv)
