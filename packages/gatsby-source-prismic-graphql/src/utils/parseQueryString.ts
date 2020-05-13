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
): { [key: string]: string } {
  const qsMap = parseQueryString(qs, delimiter);
  const qsMapIterator = qsMap[Symbol.iterator]();
  const qsJSON: { [key: string]: string } = {};

  for (let item of qsMapIterator) {
    const keyJSON = item[0];
    const value = item[1];
    qsJSON[keyJSON] = value;
  }
  return qsJSON;
}
