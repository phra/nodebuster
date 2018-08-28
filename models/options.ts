export interface IOptions {
  wordlist: string
  extensions: string[]
  workers: number
  ignoreSsl: boolean
  cookies: string[]
  userAgent: string
  consecutiveFails: number
  headers: string[]
}
