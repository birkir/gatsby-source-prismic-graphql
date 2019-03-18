export interface Dictionary {
  [urlPattern: string]: {
    componentPath: string;
    previewQuery: string;
    customType?: string;
  };
}
