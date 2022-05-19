import * as core from '@actions/core'
import * as github from '@actions/github'
import * as fs from 'fs'

export async function generate(
  octokit: any,
  owner: string,
  repo: string,
  run_id: number,
  templateFile: string,
  outputFile: string,
  extensionsFile: string,
  writeToJobSummary: boolean
): Promise<void> {
  try {
    core.info(
      `Getting the details of the workflow run ${run_id} from repo ${owner}/${repo}`
    )
    core.info(`Template File: ${templateFile}`)
    core.info(`Output File: ${outputFile}`)
    core.info(`WriteToJobSummary: ${writeToJobSummary}`)
    core.info(`Owner: ${owner}`)
    core.info(`Repo: ${repo}`)

    if (fs.existsSync(templateFile)) {
      core.info(`Loaded template file: ${templateFile}`)
      const runDetails = await GetRunDetails(octokit, owner, repo, run_id)

      core.debug(`---THE API OBJECT START---`)
      core.debug(JSON.stringify(runDetails))
      core.debug(`---THE API OBJECT END---`)

      const template = fs.readFileSync(templateFile, 'utf8').toString()

      const output = ProcessTemplate(template, extensionsFile, runDetails)

      core.debug(`---THE OUTPUT OBJECT START---`)
      core.debug(JSON.stringify(output))
      core.debug(`---THE OUTPUT OBJECT END---`)

      fs.writeFileSync(outputFile, output)

      if (writeToJobSummary) {
        core.info(`Adding output to the Job Summary`)
        await core.summary.addRaw(output).write()
      }
    } else {
      core.setFailed(`Cannot find template file ${templateFile}`)
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

function ProcessTemplate(
  template: string,
  extensionsFile: string,
  runDetails: any
): string {
  let output = ''
  if (template.length > 0) {
    core.info('Processing template')

    const handlebars = require('handlebars')

    const helpers = require('handlebars-helpers')({
      handlebars: handlebars
    })

    // add a custom helper to expand json
    handlebars.registerHelper('json', function (context: any) {
      return JSON.stringify(context)
    })

    if (extensionsFile) {
      if (fs.existsSync(extensionsFile)) {
        core.info(`Registering extensions in ${extensionsFile}`)
        var customFunctions = require(extensionsFile)
        handlebars.registerHelper(customFunctions)
      } else {
        core.setFailed(
          `Cannot find the expected extensions file ${extensionsFile}`
        )
      }
    }

    const handlebarsTemplate = handlebars.compile(template)

    output = handlebarsTemplate({
      runDetails: runDetails
    })

    core.info('Completed processing template')
  } else {
    core.setFailed(`Template file is empty`)
  }
  return output
}

async function GetRunDetails(
  octokit: any,
  owner: any,
  repo: any,
  run_id: any
): Promise<any[]> {
  return new Promise<any[]>(async (resolve, reject) => {
    try {
      const response = await octokit.rest.actions.getWorkflowRun({
        owner: owner,
        repo: repo,
        run_id: run_id
      })

      // we only need the data not the full response
      const runDetails = response.data

      // Loop to get the PR details
      if (runDetails.pull_requests) {
        core.info(
          `There are ${runDetails.pull_requests.length} associated PRs with run`
        )

        // replace the url PR links with the details
        runDetails.pull_requests = await GetPullRequests(
          octokit,
          owner,
          repo,
          runDetails.pull_requests
        )
      } else {
        core.info(`No associated PRs with run`)
      }

      resolve(runDetails)
    } catch (error) {
      core.setFailed(error.message)
    }
  })
}

async function GetPullRequests(
  octokit: any,
  owner: any,
  repo: any,
  prList: any
): Promise<any[]> {
  return new Promise<any[]>(async (resolve, reject) => {
    try {
      const pullRequests = []
      for (let index = 0; index < prList.length; index++) {
        const pr = prList[index]
        core.info(`Getting the details of associated PR ${pr.number}`)
        const response = await octokit.rest.pulls.get({
          owner: owner,
          repo: repo,
          pull_number: pr.number
        })

        // add the details of the commits
        response.data.commits = await GetPullRequestCommits(
          octokit,
          owner,
          repo,
          pr
        )
        response.data.comments = await GetPullRequestComments(
          octokit,
          owner,
          repo,
          pr
        )

        response.data.linkedIssues = await GetLinkedIssues(
          octokit,
          owner,
          repo,
          pr
        )
        pullRequests.push(response.data)
      }

      resolve(pullRequests)
    } catch (err) {
      reject(err)
    }
  })
}

async function GetPullRequestCommits(
  octokit: any,
  owner: any,
  repo: any,
  pr: any
): Promise<any[]> {
  return new Promise<any[]>(async (resolve, reject) => {
    try {
      core.info(`Getting the commits associated with PR ${pr.number}`)
      const response = await octokit.rest.pulls.listCommits({
        owner: owner,
        repo: repo,
        pull_number: pr.number
      })

      resolve(response.data)
    } catch (err) {
      reject(err)
    }
  })
}

async function GetPullRequestComments(
  octokit: any,
  owner: any,
  repo: any,
  pr: any
): Promise<any[]> {
  return new Promise<any[]>(async (resolve, reject) => {
    try {
      core.info(`Getting the comments associated with PR ${pr.number}`)
      const response = await octokit.rest.issues.listComments({
        owner: owner,
        repo: repo,
        issue_number: pr.number
      })
      resolve(response.data)
    } catch (err) {
      reject(err)
    }
  })
}

async function GetLinkedIssues(
  octokit: any,
  owner: any,
  repo: any,
  pr: any
): Promise<any[]> {
  return new Promise<any[]>(async (resolve, reject) => {
    try {
      core.info(`Getting issues linked to PR ${pr.number}`)

      // based on https://github.community/t/get-all-issues-linked-to-a-pull-request/14653/6
      // as there is no API direct call
      const response = await octokit.graphql(
        `{resource(url: "https://github.com/${owner}/${repo}/pull/${pr.number}") {
        ... on PullRequest {
          timelineItems(itemTypes: [CONNECTED_EVENT, DISCONNECTED_EVENT], first: 250) {
            nodes {
              ... on ConnectedEvent {
                id
                subject {
                  ... on Issue {
                    number
                  }
                }
              }
              ... on DisconnectedEvent {
                id
                subject {
                  ... on Issue {
                    number
                  }
                }
              }
            }
          }
        }
      }}`
      )
      const linkedIssues = []
      const issues: {[key: string]: number} = {}

      if (response.resource && response.resource.timelineItems) {
        response.resource.timelineItems.nodes.map((node: any) => {
          if (issues.hasOwnProperty(node.subject.number)) {
            issues[node.subject.number]++
          } else {
            issues[node.subject.number] = 1
          }
        })

        for (const [issue, count] of Object.entries(issues)) {
          if (count % 2 !== 0) {
            core.debug(`Getting the linked issue ${issue}`)
            const issueDetails = await octokit.rest.issues.get({
              owner: owner,
              repo: repo,
              issue_number: issue
            })
            linkedIssues.push(issueDetails.data)
          }
        }
      }

      resolve(linkedIssues)
    } catch (err) {
      reject(err)
    }
  })
}
