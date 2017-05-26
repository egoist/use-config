# use-config

[![NPM version](https://img.shields.io/npm/v/use-config.svg?style=flat)](https://npmjs.com/package/use-config) [![NPM downloads](https://img.shields.io/npm/dm/use-config.svg?style=flat)](https://npmjs.com/package/use-config) [![CircleCI](https://circleci.com/gh/egoist/use-config/tree/master.svg?style=shield)](https://circleci.com/gh/egoist/use-config/tree/master) [![codecov](https://codecov.io/gh/egoist/use-config/branch/master/graph/badge.svg)](https://codecov.io/gh/egoist/use-config)  [![donate](https://img.shields.io/badge/$-donate-ff69b4.svg?maxAge=2592000&style=flat)](https://github.com/egoist/donate)

## Install

```bash
yarn add use-config
```

## Usage

```js
const UseConfig = require('use-config')

// Find config in order:
// poi.config.js
// package.json's poi property
const useConfig = new UseConfig({ name: 'poi' })

useConfig.load().then(res => {
  res.path // path to found config
  res.config // content of config

  if (!res.path) {
    // config file is not found
  }
}).catch(err => {
  // maybe a parse error
})
```

You can also specific the files we need to look for:

```js
// To make it use poi.config.js and .poirc and poi.config.yml only
const useConfig = new UseConfig({
  name: 'poi',
  files: ['{name}.config.js', '.{name}rc', '{name}.config.yml']
})

// By default all non-js file will be treated as JSON
// But you can use custom loader for specific extension
useConfig.addLoader(/\.yml$/, filepath => parseYamlFile(filepath))

useConfig.load().then(res => {/* ... */})
```

> **NOTE:** 
>
> when config value is falsy, we will ignore it. For example, you have a `package.json` but `pkg.configName` does not exist.

## API

### new UseConfig([options])

#### options

##### options.name

Type: `string`<br>
Required: `true`

The config name, for `name: 'poi'` and `files: ['{name}.config.js', 'package.json']`, it will search `poi.config.js` and `poi` property in `package.json`.

##### options.files

Default: `['{name}.config.js', 'package.json']`

The files to search in order, when it's `package.json`, we return the `name` property of it.

##### options.cwd

Default: `process.cwd()`

The path to search files.

### useConfig.load()

Return a Promise.

By default all `.js` files will be loaded via `require` and all other files will be treated as JSON format which is load using `fs` and `JSON.parse`.

### useConfig.addLoader(test, loader)

#### test

Type: `RegExp`<br>
Required: `true`

The regular expression to match filepath.

#### loader

Type: `function`<br>
Required: `true`

The function to get file content. Either synchronus or returns a Promise.

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D


## Author

**use-config** © [egoist](https://github.com/egoist), Released under the [MIT](./LICENSE) License.<br>
Authored and maintained by egoist with help from contributors ([list](https://github.com/egoist/use-config/contributors)).

> [egoistian.com](https://egoistian.com) · GitHub [@egoist](https://github.com/egoist) · Twitter [@rem_rin_rin](https://twitter.com/rem_rin_rin)
