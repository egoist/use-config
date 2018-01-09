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
    // Config file is not found
  }
}).catch(err => {
  // maybe a parse error
})
```

You can also specify the files we need to look for:

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
> when config value is `undefined`, we will ignore it and find next file. For example, you have a `package.json` but `pkg[name]` does not exist. If it's the last file that we can find, we will return `{ path, config: undefined }`.

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

##### options.fallbackLoader

Type: `function`

A fallback loader for non-js files, by default we load it with `load-json-file`:

```js
function fallbackLoader(filepath) {
  return this.sync ? loadJsonFile.sync(filepath) : loadJsonFile(file)
}
```

### useConfig.load()

Return: A Promise which resolves to `{ path, config }` or `{}` when no config file was found.

By default all `.js` files will be loaded via `require` and all other files will be treated as JSON format which is load using `fs` and `JSON.parse`.

### useConfig.loadSync()

Return: `{ path, config }` or `{}` when no config file was found.

To use `.loadSync()` method you should ensure all custom loaders added via `.addLoader()` supports this.

### useConfig.addLoader({ test, loader })

#### test

Type: `RegExp`<br>
Required: `true`

The regular expression to match filepath.

#### loader

Type: `function`<br>
Required: `true`

The function to get file content. Either synchronus or returns a Promise.

If you're using the `.loadSync()` method please ensure it performs no async operations when `this.sync === true`:

```js
function yamlLoader(filepath) {
  return this.sync ? yaml.loadSync(filepath) : yaml.load(filepath)
}
```

Note that you can't use `arrow function` here since you need access to `this`.

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
