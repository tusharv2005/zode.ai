# Zode GitHub Action

A GitHub Action that integrates [Zode AI](https://__PRESERVE_ZODE_AI__) directly into your GitHub workflow.

Mention `/zode` or `/kc` in your comment, and Zode will execute tasks within your GitHub Actions runner.

## Features

#### Explain an issue

Leave the following comment on a GitHub issue. Zode will read the entire thread, including all comments, and reply with a clear explanation.

```
/zode explain this issue
```

#### Fix an issue

Leave the following comment on a GitHub issue. Zode will create a new branch, implement the changes, and open a PR with the changes.

```
/zode fix this
```

#### Review PRs and make changes

Leave the following comment on a GitHub PR. Zode will implement the requested change and commit it to the same PR.

```
Delete the attachment from S3 when the note is removed /kc
```

#### Review specific code lines

Leave a comment directly on code lines in the PR's "Files" tab. Zode will automatically detect the file, line numbers, and diff context to provide precise responses.

```
[Comment on specific lines in Files tab]
/kc add error handling here
```

When commenting on specific lines, Zode receives:

- The exact file being reviewed
- The specific lines of code
- The surrounding diff context
- Line number information

This allows for more targeted requests without needing to specify file paths or line numbers manually.

## Installation

Run the following command in the terminal from your GitHub repo:

```bash
zode github install
```

This will walk you through installing the ZodeConnect GitHub app, creating the workflow, and setting up secrets.

### Manual Setup

1. Install the ZodeConnect GitHub app at https://github.com/apps/zodeconnect. Make sure it is installed on the target repository.

2. Add the following workflow file to `.github/workflows/zode.yml` in your repo. Set the appropriate `model` and required API keys.

   ```yml
   name: zode

   on:
     issue_comment:
       types: [created]
     pull_request_review_comment:
       types: [created]

   jobs:
     zode:
       if: |
         contains(github.event.comment.body, '/kc') ||
         contains(github.event.comment.body, '/zode')
       runs-on: ubuntu-latest
       permissions:
         id-token: write
         contents: write
         pull-requests: write
         issues: write
       steps:
         - name: Checkout repository
           uses: actions/checkout@v6
           with:
             persist-credentials: false

         - name: Run Zode
           uses: Zode-Org/zodecode/github@latest
           with:
             model: zode/claude-sonnet-4-20250514
             zode_api_key: ${{ secrets.ZODE_API_KEY }}
             zode_org_id: ${{ secrets.ZODE_ORG_ID }}
   ```

3. Store the API keys in secrets. In your organization or project **settings**, expand **Secrets and variables** on the left and select **Actions**. Add `ZODE_API_KEY` and `ZODE_ORG_ID`.

## Configuration

### Inputs

- `model` (required) - The AI model to use (e.g., `zode/claude-sonnet-4-20250514`)
- `zode_api_key` (optional) - Zode API key for gateway authentication
- `zode_org_id` (optional) - Zode organization ID
- `agent` (optional) - Agent to use. Must be a primary agent.
- `share` (optional) - Share the Zode session (defaults to true for public repos)
- `prompt` (optional) - Custom prompt to override the default prompt
- `mentions` (optional) - Comma-separated list of trigger phrases (defaults to `/zode,/kc`)
- `use_github_token` (optional) - Use GITHUB_TOKEN directly instead of Zode App token exchange (defaults to `false`)
- `oidc_base_url` (optional) - Base URL for OIDC token exchange API (defaults to `https://__PRESERVE_API_ZODE_AI__`)

### Using Other Providers

You can also use other AI providers by setting their API keys:

```yml
- name: Run Zode
  uses: Zode-Org/zodecode/github@latest
  with:
    model: anthropic/claude-sonnet-4-20250514
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

## Support

If you encounter issues or have feedback, please create an issue at https://github.com/Zode-Org/zodecode/issues.

## Development

This directory contains the composite GitHub Action definition. The actual implementation is in the Zode CLI (`packages/opencode/src/cli/cmd/github.ts`).

To test locally, see the main [AGENTS.md](../AGENTS.md) for development instructions.
