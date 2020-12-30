import * as releaseNotesModule from './generate-releasenotes'
import * as github from '@actions/github'

async function run(): Promise<number> {
  var promise = new Promise<number>(async (resolve, reject) => {
    try {
      if (process.argv.length !== 14 && process.argv.length !== 16) {
        console.error(
          'USAGE: node LocalTester.js --pat <GitHub-PAT> --owner <Repo owner> --repo <Repo> --runid <Number> --templatefile <File path> --outputfile <File path> --extensionsFile <Optional Full File path>'
        )
      } else {
        console.log('Starting Local Tester')
        const argv = require('minimist')(process.argv.slice(2))
        const pat = argv['pat']
        const owner = argv['owner']
        const repo = argv['repo']
        const runid = argv['runid']
        const templatefile = argv['templatefile']
        const outputfile = argv['outputfile']
        const extensionsFile = argv['extensionsFile']

        console.log(`Command Line Arguments:`)
        console.log(`  --pat: ${pat}`)
        console.log(`  --owner: ${owner}`)
        console.log(`  --repo: ${repo}`)
        console.log(`  --runid: ${runid}`)
        console.log(`  --templatefile: ${templatefile}`)
        console.log(`  --outputfile: ${outputfile}`)
        console.log(`  --extensionsFile: ${extensionsFile}`)

        const octokit = github.getOctokit(pat)

        await releaseNotesModule.generate(
          octokit,
          owner,
          repo,
          runid,
          templatefile,
          outputfile,
          extensionsFile
        )
      }
    } catch (err) {
      console.error(err)
      reject(err)
    }
    resolve(0)
  })
  return promise
}

run()
  .then(result => {
    console.log('Tool exited')
  })
  .catch(err => {
    console.error(err)
  })
