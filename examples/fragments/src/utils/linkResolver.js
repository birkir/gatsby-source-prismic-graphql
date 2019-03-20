module.exports = {
  linkResolver(doc) {
    if (doc.type === 'article') {
      return `/article/${doc.uid}`;
    }

    return '/';
  },
};
