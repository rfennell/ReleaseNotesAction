Workflow: {{actionDetails.name}}
Head Branch: {{actionDetails.head_branch}}
Head SHA: {{actionDetails.head_sha}}

### Pull Requests
{{#forEach actionsDetails.pull_requests}}
- **{{this.number}}** {{this.title}}
{{/forEach}}