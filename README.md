# ReleaseNotesAction

This Action uses the GitHub API and a [Handlebars](https://handlebarsjs.com/) based template to generate a release notes file. This file can be used in a variety of ways, such as being attached to a release, or uploaded to an external store such as a WIKI

## Usage

```
- uses: rfennell/ReleaseNotesAction@v1
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} # This token is provided automatically, you do not need to create your own token
  with:
    templateFile: '${{ github.workspace }}//template.md'
    outputfile: '${{ github.workspace }}//releasenotes.md'
    extensionsFile: '${{ github.workspace }}//customextensions.js'

``` 
## Parameters

The task needs the `GITHUB_TOKEN` environment variable set with a valid GitHub token, either the one auto-generated for each workflow run, or a [personal one](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/creating-a-personal-access-token) created with sufficient permissions to access the API. 

As well as the `GITHUB_TOKEN` the action also takes the following parameters

* templateFile: The path to the Handlebar template file. (Required)
* outputFile: The path for the file that will be created. (Required)
* extensionsFile: The path to the an optional module of custom Handlebars functions. (Optional)

## Template File
The template allows you to create your own document layout using [Handlebars](https://handlebarsjs.com/) syntax. A template written in this format is as follows

```
# Release Notes 
## Run Details
- Workflow: {{runDetails.name}} 
- Head Branch: {{runDetails.head_branch}} 
- Head SHA: {{runDetails.head_sha}} 

## Pull Requests
{{#forEach runDetails.pull_requests}}
**{{this.number}}** {{this.title}}
### Commits
  {{#forEach this.commits}}
  - **{{this.sha}}** {{this.commit.message}}
  {{/forEach}}
### Comments
 {{#forEach this.comments}}
 - {{this.body}}
 {{/forEach}}

### linkedIssues
 {{#forEach this.linkedIssues}}
 - **{{this.number}}** {{this.title}}
 {{/forEach}}
    
{{/forEach}}

```

What is done behind the scenes is that each `{{properties}}` block in the template is expanded by the Handlebars engine. The property object structure available to get data from at runtime are:

* **runDetails** – the details of the current workflow run
  - **pull_requests**  - the array of pull requests associated with the run
    - **commits**  - the array of commits associated with the PR
    - **comments**  - the array of comment associated with the PR
    - **linkedIssues**  - the array of linked issues with the PR

> **Note:** To dump all possible properties of an object there are two options:
> - Via the template, using the custom Handlebars extension `{{json propertyToDump}}`. This will include a dump of the object properties in the generated release notes file.
> - If you [enable the Actions debug log](https://docs.github.com/en/free-pro-team@latest/actions/managing-workflow-runs/enabling-debug-logging) the API returned data and the generated release notes text will be dumped into the action log (note this can make for a very large an unresponsive log file)

> **Note:** If a field contains escaped HTML encoded data this can be returned its original format with the Handlebars triple brackets format `{{{sample.field}}}` 

### Handlebar Extensions
 The [Handlebars Helpers](https://github.com/helpers/handlebars-helpers) extension library is also pre-load, this provides over 120 useful extensions to aid in data manipulation when templating. They are used the form

```
## To confirm the Handlebars-helpers is work
The year is {{year}} 
We can capitalize "foo bar baz" {{capitalizeAll "foo bar baz"}}
```

In addition to the [Handlebars Helpers](https://github.com/helpers/handlebars-helpers) extension library, there is also custom Helpers pre-loaded specific to the needs of this Action

- `json` that will dump the contents of any object. This is useful when working out what can be displayed in a template, though there are other ways to dump objects to files (see above)

```
## The contents of the run object
{{json runDetails}}
```

Finally there is also support for your own custom extension libraries. These are provided via an optional JavaScript file which is loaded into the Handlebars templating engine. The file can contain one or more functions, within the `module.exports` block, in the following format
```
module.exports = {
  foo() {
    return 'Returns foo';
  }
};
```

and can be consumed in a template as shown below
```
## To confirm our custom extension works
We can call our custom extension {{foo}}
```

## Local Test Runner
Within the [repo for this action](https://github.com/rfennell/ReleaseNotesAction) a local runner is provided that can provide an easier means to develop templates and custom extensions. It allows all the parameters usually passed in by a GitHub workflow to be provided via the command line.

To build the action locally, from the root of the repo

```
npm install
npm run build
```

The action can then be run as follows

```
node .\lib\LocalRun.js --pat <GitHub-PAT> --owner <Repo owner> --repo <Repo> --runid <Number> --templatefile <File path> --outputfile <File path> --extensionsfile <Optional Full File path>f
        
```
> Note: The `--extensionsfile` parameter requires a full, and not a relative, file path else a load error will occur. The other file parameters can be relative or full path.

> Note: A sample template and custom extension can be found in the `__tests__` folder.

## Notes on Building the Extension
The extension repo is based on basic pattern that is meant to package all the npm dependencies using `ncc`. 

Unfortunately there is an [issue](https://github.com/helpers/handlebars-helpers/issues/375) with `Handlebars` that stops it being used with `ncc`. Until this is addressed the `node-modules` folder needs to be committed to the repo containing the production dependencies for use at runtime

Hence, to build the product and remove the development dependencies run

```
npm install
npm run build
npm run format 
npm run lint
npm test
npm run package
```

or

```
npm install
npm run all
```