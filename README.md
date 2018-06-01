# NodeBuster

## Description

NodeBuster, or yet another DirBuster clone, is a Node.js application to bruteforce directories and files on HTTP(S) servers.

[![asciicast](https://asciinema.org/a/rLNfhWqUA0SqFj51INX470U27.png)](https://asciinema.org/a/rLNfhWqUA0SqFj51INX470U27)

## Prerequisites

- Node.js 8+

## Synopsis

- Using npx:

```bash
npx @phra/nodebuster -h
```

- Global install:

```bash
npm i -g @phra/nodebuster # install it globally (onetime and updates)
nodebuster -h
```

- Example

```bash
npx @phra/nodebuster dir --extensions php,txt,old --cookies "asd=lol","lol=asd" --user-agent "nodebuster" http://localhost:8000/
```

## CLI Usage


```
nodebuster.js 1.0.5

USAGE

  nodebuster.js dir <url>

ARGUMENTS

  <url>      <url> to attack      required      

OPTIONS

  -w, --workers <workers>            Use n <workers>                     optional      default: 10                                                            
  -W, --wordlist <wordlist>          <wordlist> to use                   optional      default: "/usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt"
  -u, --user-agent <user-agent>      <user-agent> to use                 optional      default: "nodebuster"                                                  
  -e, --extensions <extensions>      <extensions> to use                 optional      default: []                                                            
  -c, --cookies <cookies>            Set <cookies>                       optional      default: []                                                            
  -K, --ignore-ssl                   Enable <ignore-ssl>                 optional      default: false                                                         
  -f, --consecutive-fails            Stop after <consecutive-fails>      optional      default: 15                                                            

GLOBAL OPTIONS

  -h, --help         Display help                                      
  -V, --version      Display version                                   
  --no-color         Disable colors                                    
  --quiet            Quiet mode - only displays warn and error messages
  -v, --verbose      Verbose mode - will also output debug messages   
```
