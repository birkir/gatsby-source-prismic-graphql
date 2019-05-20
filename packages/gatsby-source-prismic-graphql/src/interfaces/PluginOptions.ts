interface Page {
  type: string;
  match: string;
  path: string;
  component: string;
  lang?: string;
}

export interface PluginOptions {
  repositoryName: string;
  accessToken?: null | string;
  prismicRef?: null | string;
  linkResolver?: Function;
  defaultLang?: string;
  passContextKeys?: string[];
  previewPath?: string;
  previews?: boolean;
  pages?: Page[];
  omitPrismicScript?: boolean;
}
