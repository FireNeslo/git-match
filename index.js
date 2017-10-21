const git = require('simple-git/promise')

function props(object) {
  const keys = Object.keys(object)
  const values = keys.map(key => object[key])

  function valueMap(target, value, index) {
    return Object.assign(target, { [keys[index]]: value })
  }

  return Promise.all(values).then(values => values.reduce(valueMap, {}))
}

async function lookup({ current, history }, target) {
  let revision = null

  if(current !== 'master') {
    revision = git(target).silent(true).revparse([current]).catch(e => {})
  }

  const [ { all: [ from ] }, match ] = await Promise.all([ history, revision ])

  if(match) return current

  const { all: [ commit ] } = await git(target)
    .log([`--before=${from.date}`, '--max-count=1'])

  if(commit) return commit.hash.trim()

  return 'master'
}

async function match(source, targets) {
  const { current } = await git(source).status()
  const results = {}
  const history = git(source).log({ from: current, '--max-count=1': 1 })

  for(const [name, target] of Object.entries(targets)) {
    results[name] = lookup({ current, history }, target)
  }

  return props(results)
}

module.exports = match
