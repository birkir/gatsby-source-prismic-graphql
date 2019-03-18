import URLPattern from 'url-pattern';

export default {
  parse(pattern: string, urlPathname: string): { [key: string]: string } {
    const urlP = new URLPattern(pattern);
    return urlP.match(urlPathname) || {};
  },

  build(pattern: string, params: { [key: string]: string } = {}): string {
    return Object.keys(params).reduce((acc, key) => {
      return acc.replace(`:${key}`, params[key]);
    }, pattern);
  },

  extractFixURL(urlPattern: string): string | undefined {
    var regex = /^(\/.*)*\/(:uid)/;

    const matched = urlPattern.match(regex);
    if (matched) {
      const [, fixURL] = matched;
      return fixURL;
    }
  },
};
