# NodeBuster

## Description

NodeBuster, or yet another DirBuster clone, is a Node.js application to bruteforce directories and files on HTTP(S) servers.

[![asciicast](https://asciinema.org/a/VFKMpmV7URVPpjk9odcEaSsW4.png)](https://asciinema.org/a/VFKMpmV7URVPpjk9odcEaSsW4) [![Greenkeeper badge](https://badges.greenkeeper.io/phra/nodebuster.svg)](https://greenkeeper.io/)

## Prerequisites

- Node.js 8+

## Install

- Using npx:

```bash
npx @phra/nodebuster -h
```

- Global install:

```bash
npm i -g @phra/nodebuster # install it globally (onetime and updates)
nodebuster -h
```

## Example

- Using npx:

```bash
npx @phra/nodebuster dir --extensions php,txt,old --cookies "asd=lol","lol=asd" --user-agent "nodebuster" http://localhost:8000/
```

- Global install:

```bash
nodebuster dir --extensions php,txt,old --cookies "asd=lol","lol=asd" --user-agent "nodebuster" http://localhost:8000/
```

## Wappalyzer
[Wappalyzer](https://github.com/AliasIO/Wappalyzer) was integrated to automagically guess the extensions to bruteforce based on the detected technologies. In order to use it the `--extensions` (`-e`) parameters must be omitted.

- Example with Wappalyzer:

```bash
nodebuster dir http://localhost:8000/
```

## Synopsis


```
   nodebuster.js 1.3.0 

   USAGE

     nodebuster.js dir <url>

   ARGUMENTS

     <url>      <url> to attack      required      

   OPTIONS

     -w, --workers <workers>            Use n <workers>                     optional      default: 10                                                            
     -W, --wordlist <wordlist>          <wordlist> to use                   optional      default: "/usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt"
     -U, --user-agent <user-agent>      <user-agent> to use                 optional      default: "nodebuster"                                                  
     -e, --extensions <extensions>      <extensions> to use                 optional      default: []                                                            
     -C, --cookies <cookies>            Set <cookies>                       optional      default: []                                                            
     -H, --headers <headers>            <headers> to use                    optional      default: []                                                            
     -f, --consecutive-fails            Stop after <consecutive-fails>      optional      default: 15                                                            

   GLOBAL OPTIONS

     -h, --help         Display help                                      
     -V, --version      Display version                                   
     --no-color         Disable colors                                    
     --quiet            Quiet mode - only displays warn and error messages
     -v, --verbose      Verbose mode - will also output debug messages  
```
