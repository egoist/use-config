import { basename, resolve } from 'path'
import fs from 'fs'
import pupa from 'pupa'
import pathExists from 'path-exists'
import loadJsonFile from 'load-json-file'

const isPkg = filepath => basename(filepath) === 'package.json'

export default class UseConfig {
  constructor(options = {}) {
    this.options = Object.assign(
      {
        cwd: process.cwd(),
        files: ['{name}.config.js', 'package.json'],
        fallbackLoader(filepath) {
          return this.sync
            ? loadJsonFile.sync(filepath)
            : loadJsonFile(filepath)
        }
      },
      options
    )

    if (typeof this.options.name !== 'string') {
      throw new TypeError('[use-config] Expect "name" to be a string')
    }

    this.loaders = [
      {
        test: /\.js$/,
        loader: filepath => {
          delete require.cache[filepath]
          return require(filepath)
        }
      },
      {
        test: /\.json$/,
        loader: filepath => {
          const parseJson = (filepath, content) => {
            if (isPkg(filepath)) return content[this.options.name]
            return content
          }
          if (this.options.sync) {
            return loadJsonFile(filepath).then(content =>
              parseJson(filepath, content)
            )
          }
          return parseJson(filepath, loadJsonFile.sync(filepath))
        }
      }
    ]
  }

  addLoader(loader) {
    this.loaders.push(loader)
    return this
  }

  async load() {
    const loaderContext = this.getLoaderContext({ sync: false })

    for (const [index, _filename] of this.options.files.entries()) {
      const isLast = index === this.options.files.length - 1
      const filename = pupa(_filename, { name: this.options.name })
      const filepath = resolve(this.options.cwd, filename)

      if (!await pathExists(filepath)) {
        if (isLast) {
          return {}
        }
        continue
      }
      const loader = async (...args) =>
        this.findLoader(filepath).call(loaderContext, ...args)
      const config = await loader(filepath)

      if (typeof config === 'undefined') {
        if (isPkg(filepath)) {
          if (isLast) {
            return {}
          }
          continue
        }
        return {
          path: filepath,
          config
        }
      }

      return {
        config,
        path: filepath
      }
    }
  }

  loadSync() {
    const loaderContext = this.getLoaderContext({ sync: true })
    for (const [index, _filename] of this.options.files.entries()) {
      const isLast = index === this.options.files.length - 1
      const filename = pupa(_filename, { name: this.options.name })
      const filepath = resolve(this.options.cwd, filename)
      if (!fs.existsSync(filepath)) {
        if (isLast) {
          return {}
        }
        continue
      }
      const loader = this.findLoader(filepath)
      const config = loader.call(loaderContext, filepath)

      if (typeof config === 'undefined') {
        // When `config` is undefined
        // We should only continue searching next file
        // If current file is `package.json`
        if (isPkg(filepath)) {
          if (isLast) {
            return {}
          }
          continue
        }
        return {
          path: filepath,
          config
        }
      }

      if (config.then) {
        throw new Error(
          `[use-config] You're using the .loadSync method but the loader returns a Promise!`
        )
      }

      return { config, path: filepath }
    }
  }

  findLoader(filepath) {
    const matched = this.loaders.filter(loader => {
      return loader.test.test(filepath)
    })[0]
    return (matched && matched.loader) || this.options.fallbackLoader
  }

  getLoaderContext({ sync }) {
    return {
      options: this.options,
      sync,
      loadJsonFile,
      pathExists
    }
  }
}
