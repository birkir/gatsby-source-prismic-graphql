export function parseQueryString(qs: string, delimiter: string = '&'): Map<string, string> {
  if (!qs || qs.length == 0) return new Map();

  return new Map(
    qs.split(delimiter).map(item => {
      const [key, ...value] = item.split('=').map(part => decodeURIComponent(part.trim()));
      return [key, value.join('=')] as [string, string];
    })
  );
}

export function parseQueryStringAsJson(
  qs: string = '',
  delimiter: string = '&'
): Map<string, string> {
  const qsMap = parseQueryString(qs, delimiter);
  return Object.fromEntries(qsMap);
}
