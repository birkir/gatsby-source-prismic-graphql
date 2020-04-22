export interface Page {
  type: string;
  match: string;
  previewPath?: string;
  component: string;
  langs?: string[];
  sortBy?: string;
  filter?: Function;
}

export interface PluginOptions {
  repositoryName: string;
  accessToken?: null | string;
  prismicRef?: null | string;
  linkResolver?: Function;
  defaultLang?: string;
  langs?: string[];
  shortenUrlLangs?: boolean;
  passContextKeys?: string[];
  previewPath?: string;
  previews?: boolean;
  pages?: Page[];
  omitPrismicScript?: boolean;
  sharpKeys: RegExp[] | string[];
  extraPageFields: string;
}
