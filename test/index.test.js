const path = require('path')
const UseConfig = require('../')

const oldCwd = process.cwd()

beforeAll(() => process.chdir(__dirname))

afterAll(() => process.chdir(oldCwd))

test('no config file', () => {
  const useConfig = new UseConfig({ name: 'hi' })

  return useConfig.load().then(res => {
    expect(res).toEqual({})
  })
})

test('return once config file is found', () => {
  // It has hi.config and package.json
  // But it won't read the latter
  const cwd = path.resolve('fixtures/default-config-files')
  const useConfig = new UseConfig({ cwd, name: 'hi' })

  return useConfig.load().then(res => {
    expect(res).toEqual({
      path: path.join(cwd, 'hi.config.js'),
      config: { foo: true }
    })
  })
})

test('package.json property', () => {
  // It only contains a package.json which has `hi` property
  const cwd = path.resolve('fixtures/package-json')
  const useConfig = new UseConfig({ cwd, name: 'hi' })

  return useConfig.load().then(res => {
    expect(res).toEqual({
      path: path.join(cwd, 'package.json'),
      config: { foo: true }
    })
  })
})

test('custom files', () => {
  // It contains package.json and .hirc
  // But package.json does not have a `hi` property
  // So it will still read .hirc
  const cwd = path.resolve('fixtures/custom-files')
  const useConfig = new UseConfig({
    cwd,
    name: 'hi',
    files: ['{name}.config.js', 'package.json', '.{name}rc']
  })

  return useConfig.load().then(res => {
    expect(res).toEqual({
      path: path.join(cwd, '.hirc'),
      config: { foo: true }
    })
  })
})

test('no name', () => {
  expect.assertions(1)
  const useConfig = new UseConfig()
  return useConfig
    .load()
    .catch(err => expect(err.message).toMatch('Expect "name" to be a string'))
})

test('has package.json but no specific property', () => {
  const cwd = path.resolve('fixtures/package-json-no-property')
  const useConfig = new UseConfig({ cwd, name: 'hi' })

  return useConfig.load().then(res => {
    expect(res).toEqual({})
  })
})
