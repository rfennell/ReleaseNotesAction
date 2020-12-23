jest.mock('@actions/core')
jest.mock('@actions/github')
jest.mock('fs')
import * as core from '@actions/core'
import * as github from '@actions/github'
const fs = require('fs')
import * as releaseNotesModule from '../src/generate-releasenotes'

/* eslint-disable no-undef */
describe('Create Release Notes', () => {
  let mockOctokit: any
  let mockGetWorkflowRun: any

  beforeEach(() => {
    process.env.GITHUB_RUN_ID = '123'
    process.env.GITHUB_TOKEN = '123567'
    mockOctokit = <jest.Mock>github.getOctokit

    mockGetWorkflowRun = jest.fn()

    mockOctokit.actions = {
      GetWorkflowRun: mockGetWorkflowRun
    }
  })

  test('Can create release notes', async () => {
    await releaseNotesModule.run()

    expect(mockOctokit).toBeCalledWith(process.env.GITHUB_TOKEN)
    // expect(mockGetWorkflowRun).toBeCalledTimes(1) //.toBeCalledWith(1, 2, process.env.GITHUB_RUN_ID)
  })

  afterEach(() => {
    delete process.env.GITHUB_RUN_ID
    delete process.env.GITHUB_TOKEN
  })
})
