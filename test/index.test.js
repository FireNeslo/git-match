const git = require('simple-git/promise')
const { execSync: exec } = require('child_process')

const match = require('../index.js')

process.chdir(__dirname)

const each = (repos, cb) => Promise.all(repos.map(cb))

beforeAll(async function setup() {
  exec('rm -r tmp && mkdir -p tmp/a tmp/b tmp/c')

  const ALL = ['a', 'b', 'c']

  process.chdir('tmp')

  await each(ALL, r => git(r).init())

  await each(ALL, r => git(r).checkout(['-b', 'master']))
  await each(ALL, r => exec(`echo "${r}" > ${r}/${r}.txt`))
  await each(ALL, r => git(r).add([ '-A' ]))
  await each(ALL, r => git(r).commit([ '-m', r + ' first' ]))

  await each(ALL, r => git(r).checkout([ '-b', 'exists' ]))
  await each(ALL, r => exec(`echo "${r} existed" > ${r}/${r}.txt`))
  await each(ALL, r => git(r).add([ '-A' ]))
  await each(ALL, r => git(r).commit([ '-am', r + ' exists' ]))

  // create new branch
  await git('a').checkout([ '-b', 'does-not-exist' ])
  await exec(`echo "a has no repo friends" > a/a.txt`)
  await git('a').add([ '-A' ])
  await git('a').commit([ '-am', 'peerless' ])


  // later change master
  await new Promise(resolve => setTimeout(resolve, 1000))

  await git('b').checkout(['master'])
  await exec(`echo "b updated" > b/b.txt`)
  await git('b').add([ '-A' ])
  await git('b').commit([ '-am', 'newer' ])
})

describe('match(source, { ...targets })', () => {
  test('finds matching branches', () => {
    const { b, c } = match('a', { b: 'b', c: 'c' })

    expect(b).toBe(c)
  })

  test('find the latest commit before you started the branch', async () => {
    const { all: [ commit ] } = await git('b').log([ 'master', '--reverse' ])

    const { b } = await match('a', { b: 'b' })

    expect(b).toBe(commit.hash.trim())
  })
})
