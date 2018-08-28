interface ICategory {
  [index: number]: string
}

interface IApplication {
  name: string
  confidence: string
  version: string
  icon: string
  website: string
  categories: ICategory[]
}

interface IMeta {
  language?: any
}

export interface IWappalyzerResult {
  applications: IApplication[]
  meta: IMeta
}
