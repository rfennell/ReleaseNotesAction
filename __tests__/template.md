Workflow: {{actionDetails.name}}
Head Branch: {{actionDetails.head_branch}}
Head SHA: {{actionDetails.head_sha}}

### Pull Requests
{{#each actionsDetails.pull_requests}}
- **{{this.number}}** {{this.title}}
{{/each}}