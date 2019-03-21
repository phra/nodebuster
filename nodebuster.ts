#!/usr/bin/env node
import caporal = require('caporal')

// tslint:disable-next-line:no-console
console.log = console.error.bind(console)
import animation = require('chalk-animation')

import { dir, printResults, selectExtensions, wappalyzerScan } from './lib'
import { IOptions } from './models'

// tslint:disable-next-line:no-var-requires
const version = require('./package.json').version

const BANNER = `[!] nodebuster v.${version}`
const WAPPALAZYER_BANNER = `[!] Scanning with Wappalyzer...`

caporal
  .version(version)
  .command('dir', 'Directory bruteforce mode')
  // tslint:disable-next-line:max-line-length
  .argument('<url>', '<url> to attack', /^https?:\/\//)
  .option('-w, --workers <workers>', 'Use n <workers>', caporal.INT, 10)
  .option('-W, --wordlist <wordlist>', '<wordlist> to use', caporal.STRING, '/usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt')
  .option('-U, --user-agent <user-agent>', '<user-agent> to use', caporal.STRING, 'nodebuster')
  .option('-e, --extensions <extensions>', '<extensions> to use', caporal.LIST, [])
  .option('-C, --cookies <cookies>', 'Set <cookies>', caporal.REPEATABLE, [])
  .option('-H, --headers <headers>', '<headers> to use', caporal.REPEATABLE, [])
  .option('-f, --consecutive-fails', 'Stop after <consecutive-fails>', caporal.INT, 15)
  .action((args, options, logger) => {
    const _ = animation.rainbow(BANNER)
    setTimeout(() => {
      _.stop()
      if (!options.extensions.length) {
        const __ = animation.rainbow(WAPPALAZYER_BANNER)
        wappalyzerScan(args.url).then((results) => {
          __.stop()
          printResults(results)
          options.extensions = selectExtensions(results)
          process.stdout.write(`[?] Using extensions: ${options.extensions.join()}\n`)
          dir(logger, args.url, options as IOptions)
        // tslint:disable-next-line:no-console
        }).catch((err) => console.error(err))
      } else {
        process.stdout.write(`[?] Using extensions: ${options.extensions.join()}\n`)
        dir(logger, args.url, options as IOptions)
      }
    }, 2000)
  })

caporal.parse(process.argv)
