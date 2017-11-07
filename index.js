const { resolve } = require('path')
const pupa = require('pupa')
const series = require('promise.series')
const pathExists = require('path-exists')
const loadJsonFile = require('load-json-file')

module.exports = class UseConfig {
  constructor(options = {}) {
    this.options = Object.assign(
      {
        cwd: process.cwd(),
        files: ['{name}.config.js', 'package.json']
      },
      options
    )

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
        loader: filepath =>
          loadJsonFile(filepath).then(json => {
            if (/package\.json$/.test(filepath)) return json[this.options.name]
            return json
          })
      }
    ]
  }

  addLoader(test, loader) {
    this.loaders.push({
      test,
      loader
    })
    return this
  }

  load() {
    if (typeof this.options.name !== 'string') {
      return Promise.reject(
        new TypeError('[use-config] Expect "name" to be a string')
      )
    }

    const fallbackLoader = filepath => loadJsonFile(filepath)

    return series(
      this.options.files.map(_file => {
        return result => {
          // Pass this action when config is already retrived
          if (result.path && result.config) return result

          const file = pupa(_file, { name: this.options.name })
          const filepath = resolve(this.options.cwd, file)
          return pathExists(filepath).then(exists => {
            if (!exists) return result

            const loader = this.findLoader(filepath) || fallbackLoader

            return Promise.resolve(loader(filepath)).then(config => {
              // When config is falsy
              // We think it's an invalid config file
              return config
                ? {
                    path: filepath,
                    config
                  }
                : {}
            })
          })
        }
      }),
      {}
    )
  }

  findLoader(filepath) {
    const matched = this.loaders.filter(loader => {
      return loader.test.test(filepath)
    })[0]
    return matched && matched.loader
  }
}
