#!/usr/bin/env node
import caporal = require('caporal')

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
  .option('-a, --auto', 'Use Wappalyzer to <auto> detect extensions', caporal.BOOLEAN, false)
  .option('-n, --no-wappalyzer', 'Disable Wappalyzer completely', caporal.BOOLEAN, false)
  .option('-w, --workers <workers>', 'Use n <workers>', caporal.INT, 10)
  .option('-W, --wordlist <wordlist>', '<wordlist> to use', caporal.STRING, '/usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt')
  .option('-u, --user-agent <user-agent>', '<user-agent> to use', caporal.STRING, 'nodebuster')
  .option('-e, --extensions <extensions>', '<extensions> to use', caporal.LIST, [])
  .option('-c, --cookies <cookies>', 'Set <cookies>', caporal.REPEATABLE, [])
  .option('-H, --headers <headers>', '<headers> to use', caporal.REPEATABLE, [])
  .option('-K, --ignore-ssl', 'Enable <ignore-ssl>', caporal.BOOLEAN, false)
  .option('-f, --consecutive-fails', 'Stop after <consecutive-fails>', caporal.INT, 15)
  .action((args, options, logger) => {
    const _ = animation.rainbow(BANNER)
    setTimeout(() => {
      _.stop()
      if (!options.noWappalyzer) {
        const __ = animation.rainbow(WAPPALAZYER_BANNER)
        wappalyzerScan(args.url).then((results) => {
          __.stop()
          printResults(results)
          if (options.auto) {
            options.extensions = selectExtensions(results)
            process.stdout.write(`Using extensions: ${options.extensions.join()}\n`)
          }

          dir(logger, args.url, options as IOptions)
        })
      }
    }, 2000)
  })

caporal.parse(process.argv)
