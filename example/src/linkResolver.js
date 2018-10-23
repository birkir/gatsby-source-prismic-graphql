module.exports = function linkResolver(doc) {
  if (doc) {
    switch (doc.type) {
      case 'home':
        return '/';
      case 'about_us':
        return '/about';
      case 'page':
        return `/${doc.uid}`;

      default:
        if (doc.uid) {
          return `/${doc.uid}`;
        }

        return `/${doc.type}`;
    }
  }

  return '/';
}
