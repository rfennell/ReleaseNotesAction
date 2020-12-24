import * as releaseNotesModule from './generate-releasenotes'
import * as core from '@actions/core'
import * as github from '@actions/github'

async function run(): Promise<number>  {
        var promise = new Promise<number>(async (resolve, reject) => {

        // Get authenticated GitHub client (Ocktokit): https://github.com/actions/toolkit/tree/master/packages/github#usage
        // Pass in the GITHUB_TOKEN in the same style as used by https://github.com/actions/create-release
        const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''
        const octokit = github.getOctokit(GITHUB_TOKEN)
        // get the context
        const context = (github as any).context
        // the run details
        const repository = context.payload.repository

        const GITHUB_RUN_ID: number = parseInt(process.env.GITHUB_RUN_ID || '-1')

        const templateFile = core.getInput('templateFile')
        const outputFile = core.getInput('outputFile')

        // overrides to allow local testing
        const repo = repository.name
        const owner = repository.owner.login

        await releaseNotesModule.generate(octokit, owner, repo,  GITHUB_RUN_ID, templateFile, outputFile)
        resolve (0);
    });
    return promise;
}

run()
    .then((result) => {
        console.log("Tool exited");
    })
    .catch((err) => {
        console.error(err);
    });