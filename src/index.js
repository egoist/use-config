const { resolve } = require('path')
const fs = require('fs')
const pupa = require('pupa')
const pathExists = require('path-exists')
const loadJsonFile = require('load-json-file')

module.exports = class UseConfig {
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
            if (/package\.json$/.test(filepath))
              return content[this.options.name]
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
      const loader = this.findLoader(filepath)
      const config = await loader.call(loaderContext, filepath)

      if (typeof config === 'undefined') {
        if (isLast) {
          return {
            path: filepath,
            config
          }
        }
        continue
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
        if (isLast) {
          return {
            path: filepath,
            config
          }
        }
        continue
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
