# Release Notes 
## Run Details
- Workflow: [{{runDetails.name}}]({{runDetails.html_url}}) 
- Head Branch: {{runDetails.head_branch}} 
- Head SHA: {{runDetails.head_sha}} 

## Pull Requests
{{#forEach runDetails.pull_requests}}
[PR #{{this.number}}]({{this.html_url}}) {{this.title}}
### Commits associated with PR #{{this.number}}
| SHA | Message |
| - | - |
  {{#forEach this.commits}}
  | [{{truncate this.sha 7}}]({{this.html_url}}) | {{this.commit.message}} |
  {{/forEach}}
### Comments associated with PR #{{this.number}}
{{#isEmpty this.comments}}
 - None
{{else}} 
 {{#forEach this.comments}}
 - {{this.body}}
 {{/forEach}}
 {{/isEmpty}}
### Issues associated with PR #{{this.number}}
{{#isEmpty this.linkedIssues}}
 - None
{{else}} 
| ID | Title |
| - | - |
 {{#forEach this.linkedIssues}}
| [{{this.number}}]({{this.html_url}}) | {{this.title}} |
 {{/forEach}}
 {{/isEmpty}}
    
{{/forEach}}

# A custom extension
{{foo}}
