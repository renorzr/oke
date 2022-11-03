export interface OkeConfig {
  sources: { [key: string]: Source }
}

export interface Source {
  repo: string;
  branch: string;
}