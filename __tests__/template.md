Workflow: {{actionDetails.name}}
Head Branch: {{actionDetails.head_branch}}
Head SHA: {{actionDetails.head_sha}}

## Pull Requests
{{#forEach actionDetails.pull_requests}}
**{{this.number}}** {{this.title}}
### Commits
    {{#forEach this.commits}}
    - **{{this.sha}}** {{this.commit.message}}
    {{/forEach}}


{{/forEach}}

