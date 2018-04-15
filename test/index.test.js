import path from 'path'
import UseConfig from '../src'

function fixtures(...args) {
  return path.join(__dirname, 'fixtures', ...args)
}

describe('no config file', () => {
  const useConfig = new UseConfig({ name: 'hi' })

  test('async', () => {
    return useConfig.load().then(res => {
      expect(res).toEqual({})
    })
  })

  test('sync', () => {
    const res = useConfig.loadSync()
    expect(res).toEqual({})
  })
})

describe('return once config file is found', () => {
  // It has hi.config and package.json
  // But it won't read the latter
  const cwd = fixtures('default-config-files')
  const useConfig = new UseConfig({ cwd, name: 'hi' })

  test('async', () => {
    return useConfig.load().then(res => {
      expect(res).toEqual({
        path: path.join(cwd, 'hi.config.js'),
        config: { foo: true }
      })
    })
  })

  test('sync', () => {
    const res = useConfig.loadSync()
    expect(res).toEqual({
      path: path.join(cwd, 'hi.config.js'),
      config: { foo: true }
    })
  })
})

describe('package.json property', () => {
  // It only contains a package.json which has `hi` property
  const cwd = fixtures('package-json')
  const useConfig = new UseConfig({ cwd, name: 'hi' })

  test('async', () => {
    return useConfig.load().then(res => {
      expect(res).toEqual({
        path: path.join(cwd, 'package.json'),
        config: { foo: true }
      })
    })
  })

  test('sync', () => {
    const res = useConfig.loadSync()
    expect(res).toEqual({
      path: path.join(cwd, 'package.json'),
      config: { foo: true }
    })
  })
})

describe('custom files', () => {
  const cwd = fixtures('custom-files')
  const useConfig = new UseConfig({
    cwd,
    name: 'hi',
    files: ['[name].config.js', '.[name]rc']
  })

  test('async', () => {
    return useConfig.load().then(res => {
      expect(res).toEqual({
        path: path.join(cwd, '.hirc'),
        config: { foo: true }
      })
    })
  })

  test('sync', () => {
    const res = useConfig.loadSync()
    expect(res).toEqual({
      path: path.join(cwd, '.hirc'),
      config: { foo: true }
    })
  })
})

test('no name', () => {
  expect.assertions(1)
  try {
    new UseConfig() // eslint-disable-line no-new
  } catch (err) {
    expect(err.message).toMatch('Expect "name" to be a string')
  }
})

// While package.json is found but does not have `hi` property
// It still searches next file
// This only works with package.json
describe('continue when name does not exist in package.json', () => {
  describe('has next file', () => {
    const cwd = fixtures('package-json-no-property')
    const useConfig = new UseConfig({
      cwd,
      name: 'hi',
      files: ['[name].config.js', 'package.json', '.hirc']
    })

    test('async', () => {
      return useConfig.load().then(res => {
        expect(res).toEqual({
          path: path.join(cwd, '.hirc'),
          config: { foo: 'foo' }
        })
      })
    })

    test('sync', () => {
      const res = useConfig.loadSync()
      expect(res).toEqual({
        path: path.join(cwd, '.hirc'),
        config: { foo: 'foo' }
      })
    })
  })

  describe('is last file', () => {
    const cwd = fixtures('package-json-no-property')
    const useConfig = new UseConfig({
      cwd,
      name: 'hi',
      files: ['[name].config.js', 'sss', 'package.json']
    })

    test('async', () => {
      return useConfig.load().then(res => {
        expect(res).toEqual({})
      })
    })

    test('sync', () => {
      const res = useConfig.loadSync()
      expect(res).toEqual({})
    })
  })
})

describe('do not continue when file exists but config is undefined', () => {
  const cwd = fixtures('do-not-continue')
  const useConfig = new UseConfig({
    cwd,
    name: 'foo',
    files: ['[name].config.js', 'sss', 'package.json']
  })
  useConfig.addLoader({
    test: /sss$/,
    loader: () => undefined
  })

  test('async', () => {
    return useConfig.load().then(res => {
      expect(res).toEqual({
        path: path.join(cwd, 'sss'),
        config: undefined
      })
    })
  })

  test('sync', () => {
    const res = useConfig.loadSync()
    expect(res).toEqual({
      path: path.join(cwd, 'sss'),
      config: undefined
    })
  })
})
