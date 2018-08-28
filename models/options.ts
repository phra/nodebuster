export interface IOptions {
  wordlist: string
  extensions: string[]
  workers: number
  ignoreSSL: boolean
  cookies: string[]
  userAgent: string
  consecutiveFails: number
  headers: string[]
}
