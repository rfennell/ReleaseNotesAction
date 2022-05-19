jest.mock('@actions/core')
jest.mock('@actions/github')
jest.mock('../src/generate-releasenotes')

const core = require('@actions/core')
const {getOctokit, context} = require('@actions/github')
const fs = require('fs')
const {generate} = require('../src/generate-releasenotes')

import * as main from '../src/main'

describe('Create Release Notes', () => {
  beforeEach(() => {
    process.env.GITHUB_RUN_ID = '123'
    process.env.GITHUB_TOKEN = '123567'

    context.payload.repository = {
      name: 'repo',
      owner: {
        login: 'owner'
      }
    }

    core.getInput.mockReturnValueOnce('templateFile')
    core.getInput.mockReturnValueOnce('outFile')
    core.getInput.mockReturnValueOnce('extensions')
    core.getBooleanInput.mockReturnValueOnce(false)
  })

  test('Can create release notes', async () => {
    await main.run()

    expect(getOctokit).toBeCalledWith(process.env.GITHUB_TOKEN)
    expect(generate).toBeCalledWith(
      undefined,
      'owner',
      'repo',
      123,
      'templateFile',
      'outFile',
      'extensions',
      false
    )
  })

  afterEach(() => {
    delete process.env.GITHUB_RUN_ID
    delete process.env.GITHUB_TOKEN
  })
})
