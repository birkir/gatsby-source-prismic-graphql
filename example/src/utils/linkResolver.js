exports.linkResolver = function linkResolver(doc) {
  console.log(doc);
  let pathname = '/';

  if (doc.type === 'article') {
    pathname = ` /article/${doc.uid}`;
  }

  return pathname;
}

exports.componentResolver = function componentResolver(doc) {
  if (doc.type === 'article') {
    return require('../pages/article');
  }
  return () => null;
}
