interface Page {
  type: string;
  match: string;
  path: string;
  component: string;
}

export interface PluginOptions {
  repositoryName: string;
  accessToken?: null | string;
  linkResolver?: Function;
  previewPath?: string;
  previews?: boolean;
  pages?: Page[];
}
