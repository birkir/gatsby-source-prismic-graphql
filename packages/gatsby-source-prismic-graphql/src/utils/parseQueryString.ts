export function parseQueryString(qs: string = '', delimiter: string = '&'): Map<string, string> {
  return new Map(
    qs.split(delimiter).map(item => {
      const [key, ...value] = item.split('=').map(part => decodeURIComponent(part.trim()));
      return [key, value.join('=')] as [string, string];
    })
  );
}
