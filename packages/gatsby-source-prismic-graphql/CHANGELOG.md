# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [3.6.2](https://github.com/birkir/gatsby-source-prismic-graphql/compare/v3.6.1...v3.6.2) (2020-04-28)

**Note:** Version bump only for package gatsby-source-prismic-graphql

## [3.6.1](https://github.com/birkir/gatsby-source-prismic-graphql/compare/v3.6.0...v3.6.1) (2020-04-28)

**Note:** Version bump only for package gatsby-source-prismic-graphql

# [3.6.0](https://github.com/birkir/gatsby-source-prismic-graphql/compare/v3.4.0...v3.6.0) (2020-04-28)

### Bug Fixes

- bump dep version to fix ERROR [#11321](https://github.com/birkir/gatsby-source-prismic-graphql/issues/11321) ([9500260](https://github.com/birkir/gatsby-source-prismic-graphql/commit/9500260c0cc81600e1b013b7e115275293ed0e89))
- fix post review ([9ecc671](https://github.com/birkir/gatsby-source-prismic-graphql/commit/9ecc6711116c05b4002c859ac77beeebe2164e73))
- fixing type & updating path-to-regexp to use new match function ([eff64d8](https://github.com/birkir/gatsby-source-prismic-graphql/commit/eff64d824438690b7c73ced8f923b5c2f661412d))
- handle pages with unicode characters ([fa698d5](https://github.com/birkir/gatsby-source-prismic-graphql/commit/fa698d56de2b539f237b18debad6752a92a3524c))
- multi-lang previews ([e4baba7](https://github.com/birkir/gatsby-source-prismic-graphql/commit/e4baba7bc2c5295bdbb9d20f083891dd127165b1))
- rollback code to older typescript version ([3cbb1f1](https://github.com/birkir/gatsby-source-prismic-graphql/commit/3cbb1f1d62c7fa97ca44d69e1d205423be50d118))
- sanitize accessToken option ([6cb96bf](https://github.com/birkir/gatsby-source-prismic-graphql/commit/6cb96bf37f6b258ebda817c06c6a5ab0c3dbc178))
- test if page exists to display preview real url ([8705eb9](https://github.com/birkir/gatsby-source-prismic-graphql/commit/8705eb99352fda6aab41a684a25d9f16ef86e836))
- unescape createRemoteFileNode url ([018efe2](https://github.com/birkir/gatsby-source-prismic-graphql/commit/018efe287d25c1750cfb1e69564a3ca670e693b1))
- unpublish preview for Multi-language ([9ec4f89](https://github.com/birkir/gatsby-source-prismic-graphql/commit/9ec4f896b64f79bae3415419deb671a6db6dff3e))
- update function doc ([0bb6b35](https://github.com/birkir/gatsby-source-prismic-graphql/commit/0bb6b3550766313624c751fb2369207471301d3c))

### Features

- additional query size optimization ([8fcec72](https://github.com/birkir/gatsby-source-prismic-graphql/commit/8fcec72add1b3d4606ec8be27e51cce4a8f81156))
- extraPageFields option for better filtering ([66ac7ba](https://github.com/birkir/gatsby-source-prismic-graphql/commit/66ac7baa8309eb6a97633aa38a2d44f923ffc2c5))
- optimize query size ([57e2940](https://github.com/birkir/gatsby-source-prismic-graphql/commit/57e2940342f724ef21bc951b987a409fbc2d9d82))

# [3.4.0](https://github.com/birkir/gatsby-source-prismic-graphql/compare/v3.4.0-beta.2...v3.4.0) (2020-01-27)

### Features

- add filter explanation to README ([4ff8a62](https://github.com/birkir/gatsby-source-prismic-graphql/commit/4ff8a62))
- add optional filter to page options ([8bb76aa](https://github.com/birkir/gatsby-source-prismic-graphql/commit/8bb76aa))
- support short language codes in generated paths ([cf559d6](https://github.com/birkir/gatsby-source-prismic-graphql/commit/cf559d6))

# [3.4.0-beta.2](https://github.com/birkir/gatsby-source-prismic-graphql/compare/v3.4.0-beta.1...v3.4.0-beta.2) (2019-08-20)

### Bug Fixes

- remove/delete traverse ([927230d](https://github.com/birkir/gatsby-source-prismic-graphql/commit/927230d))

# [3.4.0-beta.1](https://github.com/birkir/gatsby-source-prismic-graphql/compare/v3.4.0-beta.0...v3.4.0-beta.1) (2019-07-29)

### Bug Fixes

- bump prismic-javascript dep to fix timeout connection issues ([36f04f2](https://github.com/birkir/gatsby-source-prismic-graphql/commit/36f04f2))
- check if proptypes can be added to StaticQuery ([f05a5e6](https://github.com/birkir/gatsby-source-prismic-graphql/commit/f05a5e6))

# [3.4.0-beta.0](https://github.com/birkir/gatsby-source-prismic-graphql/compare/v3.3.1...v3.4.0-beta.0) (2019-07-18)

### Bug Fixes

- improve pagination context var names; pass context for previews ([166321c](https://github.com/birkir/gatsby-source-prismic-graphql/commit/166321c))
- multi-locale path-generation logic, enhanced typing ([bbe2aa5](https://github.com/birkir/gatsby-source-prismic-graphql/commit/bbe2aa5))
- multi-locale support compatible with pagination ([bffeea2](https://github.com/birkir/gatsby-source-prismic-graphql/commit/bffeea2))
- sortBy works for all document types ([d861c9d](https://github.com/birkir/gatsby-source-prismic-graphql/commit/d861c9d))
- support previews in other than defaultLang ([e621a76](https://github.com/birkir/gatsby-source-prismic-graphql/commit/e621a76))

### Features

- add direct support for referencing next and prev pages ([a3c06db](https://github.com/birkir/gatsby-source-prismic-graphql/commit/a3c06db))
- add support for passing sortBy for pages ([aa893b4](https://github.com/birkir/gatsby-source-prismic-graphql/commit/aa893b4))
- create and expose cursor encoding helpers ([a1959ac](https://github.com/birkir/gatsby-source-prismic-graphql/commit/a1959ac))
- enable backwards pagination by providing lastPageEndCursor ([2f0fe1b](https://github.com/birkir/gatsby-source-prismic-graphql/commit/2f0fe1b))

## [3.3.1](https://github.com/birkir/gatsby-source-prismic-graphql/compare/v3.3.0...v3.3.1) (2019-07-18)

### Bug Fixes

- typo in README.md ([f4e5390](https://github.com/birkir/gatsby-source-prismic-graphql/commit/f4e5390))

# [3.3.0](https://github.com/birkir/gatsby-source-prismic-graphql/compare/v3.2.0...v3.3.0) (2019-07-09)

### Bug Fixes

- prettier formatting in unrelated file so tests pass ([a56f66e](https://github.com/birkir/gatsby-source-prismic-graphql/commit/a56f66e))
- work around 20-page limit for Prismic queries ([861aedf](https://github.com/birkir/gatsby-source-prismic-graphql/commit/861aedf))

### Features

- gatsby-image support ([f598dcd](https://github.com/birkir/gatsby-source-prismic-graphql/commit/f598dcd))

# [3.2.0](https://github.com/birkir/gatsby-source-prismic-graphql/compare/v3.0.0-alpha.0...v3.2.0) (2019-06-04)

### Bug Fixes

- add apollo-boost dependency ([c4334c8](https://github.com/birkir/gatsby-source-prismic-graphql/commit/c4334c8))
- dependency and load variables ([e826e5f](https://github.com/birkir/gatsby-source-prismic-graphql/commit/e826e5f))
- ensure location is in props ([82eb8f0](https://github.com/birkir/gatsby-source-prismic-graphql/commit/82eb8f0))
- prettier ([68ce94c](https://github.com/birkir/gatsby-source-prismic-graphql/commit/68ce94c))
- prettier ([fbc4395](https://github.com/birkir/gatsby-source-prismic-graphql/commit/fbc4395))
- preview page with no pages option ([d271ca0](https://github.com/birkir/gatsby-source-prismic-graphql/commit/d271ca0))
- ssr strip whitespace fetch ([3f843c2](https://github.com/birkir/gatsby-source-prismic-graphql/commit/3f843c2))
- test deploy ([11bb7b5](https://github.com/birkir/gatsby-source-prismic-graphql/commit/11bb7b5))
- update graphql source plugin ([3b9bab0](https://github.com/birkir/gatsby-source-prismic-graphql/commit/3b9bab0))

### Features

- fragments ([34f9c78](https://github.com/birkir/gatsby-source-prismic-graphql/commit/34f9c78))
- fragments ([0bc6912](https://github.com/birkir/gatsby-source-prismic-graphql/commit/0bc6912))
- languages ([09a1c47](https://github.com/birkir/gatsby-source-prismic-graphql/commit/09a1c47))
- static query ([6666e34](https://github.com/birkir/gatsby-source-prismic-graphql/commit/6666e34))

# 3.0.0-alpha.0 (2019-03-19)

Initial pre-release
