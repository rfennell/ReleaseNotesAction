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
        console.log(`  --pat: ${obfuscatePasswordForLog(pat)}`)
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
          extensionsFile,
          false
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

function obfuscatePasswordForLog(
  value: string,
  charToShow = 4,
  charToUse = '*'
): string {
  var returnValue = ''
  if (value && value.length > 0) {
    returnValue = `${new Array(value.length - charToShow + 1).join(
      charToUse
    )}${value.substring(value.length - charToShow)}`
  }
  return returnValue
}

run()
  .then(result => {
    console.log('Tool exited')
  })
  .catch(err => {
    console.error(err)
  })
