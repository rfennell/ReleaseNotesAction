import * as core from '@actions/core'
import * as github from '@actions/github'
import * as fs from 'fs'

export async function run(): Promise<void> {
  try {
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

    core.info(__dirname)

    core.info(
      `Getting the details of the workflow run ${GITHUB_RUN_ID} from repo ${repository.owner.login}/${repository.name}`
    )
    core.info(`Template File: ${templateFile}`)
    core.info(`Output File: ${outputFile}`)

    
    if (fs.existsSync(templateFile)) {
      const actionDetails = await GetRunDetails(
        octokit,
        repository.owner.login,
        repository.name,
        GITHUB_RUN_ID
      )

      
      core.debug(`---THE API OBJECT START---`)
      core.debug(JSON.stringify(actionDetails))
      core.debug(`---THE API OBJECT END---`)

      const template = fs.readFileSync(templateFile, 'utf8').toString()

      const output = ProcessTemplate(template, actionDetails)

      core.debug(`---THE OUTPUT OBJECT START---`)
      core.debug(JSON.stringify(output))
      core.debug(`---THE OUTPUT OBJECT END---`)

      fs.writeFileSync(outputFile, output)

    } else {
      core.setFailed(`Cannot find template file ${templateFile}`)
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

function ProcessTemplate(template: string, actionDetails: any): string {
  let output = ''
  if (template.length > 0) {
    core.info('Processing template')

    const handlebars = require('handlebars')

    core.info('0')
    const helpers = require('handlebars-helpers')()

    core.info('1')
    // add a custom helper to expand json
    handlebars.registerHelper('json', function (context: any) {
      return JSON.stringify(context)
    })

    core.info('2')
    const handlebarsTemplate = handlebars.compile(template)

    core.info('3')
    output = handlebarsTemplate({
      'actionDetails': actionDetails
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
      const response = await octokit.actions.getWorkflowRun({
        owner: owner,
        repo: repo,
        run_id: run_id
      })

      // we only need the data not the full response
      const actionDetails = response.data

      // Loop to get the PR details
      if (actionDetails.pull_requests) {
        core.info(
          `There are ${actionDetails.pull_requests.length} associated PRs with run`
        )

        // replace the url PR links with the details
        actionDetails.pull_requests = await GetPullRequest(
          octokit,
          owner,
          repo,
          actionDetails.pull_requests
        )
      } else {
        core.info(`No associated PRs with run`)
      }

      resolve(actionDetails)
    } catch (error) {
      core.setFailed(error.message)
    }
  })
}

async function GetPullRequest(
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
        const response = await octokit.pulls.get({
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
      const response = await octokit.pulls.listCommits({
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
      const response = await octokit.pulls.listReviewComments({
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

async function GetLinkedIssues(
  octokit: any,
  owner: any,
  repo: any,
  pr: any
): Promise<any[]> {
  return new Promise<any[]>(async (resolve, reject) => {
    try {
      core.info(`Getting issues linked to PR ${pr.number}`)

      // based on https://stackoverflow.com/questions/60717142/getting-linked-issues-and-projects-associated-with-a-pull-request-form-github-ap
      // as there is no API direct call
      const response = await octokit.graphql(
        `{resource(url: "https://github.com/rfennell/ActionPlayground/pull/${pr.number}") {
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
            core.debug(`Getting the linked issues ${issue}`)
            linkedIssues.push(
              await octokit.issues.get({
                owner: owner,
                repo: repo,
                issue_number: issue
              }).data
            )
          }
        }
      }
      resolve(linkedIssues)
    } catch (err) {
      reject(err)
    }
  })
}
