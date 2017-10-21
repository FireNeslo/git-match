const path = require('path')
const match = require('../index')
const git = require('simple-git/promise')

process.on('unhandledRejection', error => console.error(error))

const repositories = {
  browserify: 'https://github.com/browserify/browserify.git',
  babelify: 'https://github.com/babel/babelify.git',
  babel: 'https://github.com/babel/babel.git'
}

void async function demo() {
  process.chdir(__dirname)

  const done = await Promise.all([
    ...Object.values(repositories).map(remote => {
      return git().silent(true).clone(remote).catch(e => e)
    })
  ])

  // using relative directories as values
  const result = await match('babelify', {
    browserify: 'browserify',
    babel: 'babel'
  })

  console.log(result)
}()
