const { resolve } = require('path')
const fs = require('fs-extra')
const pupa = require('pupa')
const series = require('promise.series')
const pathExists = require('path-exists')

module.exports = class UseConfig {
  constructor(options) {
    this.options = Object.assign(
      {
        cwd: process.cwd(),
        files: ['{name}.config.js', 'package.json']
      },
      options
    )
    this.loaders = []
  }

  addLoader(test, loader) {
    this.loaders.push({
      test,
      loader
    })
    return this
  }

  load(name) {
    if (typeof name !== 'string') {
      return Promise.reject(
        new TypeError('[use-config] Expect "name" to be a string')
      )
    }

    if (!this.hasJSLoader) {
      this.hasJSLoader = true
      this.addLoader(/\.(js|json)$/, filepath => {
        const content = require(filepath)
        if (/package\.json$/.test(filepath)) {
          return content[name]
        }
        return content
      })
    }

    const defaultLoader = filepath => {
      return fs.readFile(filepath, 'utf8').then(content => JSON.parse(content))
    }

    return series(
      this.options.files.map(_file => {
        return result => {
          // Pass this action when config is already retrived
          if (result.path && result.config) return result

          const file = pupa(_file, { name })
          const filepath = resolve(this.options.cwd, file)
          return pathExists(filepath).then(exists => {
            if (!exists) return result

            const loader = this.findLoader(filepath) || defaultLoader
            return Promise.resolve()
              .then(() => loader(filepath))
              .then(config => ({
                path: filepath,
                config
              }))
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
