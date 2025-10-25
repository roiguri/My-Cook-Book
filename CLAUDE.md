# Task Master AI - Claude Code Integration Guide

## Essential Commands

### Core Workflow Commands

```bash
# Project Setup
task-master init                                    # Initialize Task Master in current project
task-master parse-prd .taskmaster/docs/prd.txt      # Generate tasks from PRD document
task-master models --setup                        # Configure AI models interactively

# Daily Development Workflow
task-master list                                   # Show all tasks with status
task-master next                                   # Get next available task to work on
task-master show <id>                             # View detailed task information (e.g., task-master show 1.2)
task-master set-status --id=<id> --status=done    # Mark task complete

# Task Management
task-master add-task --prompt="description" --research        # Add new task with AI assistance
task-master expand --id=<id> --research --force              # Break task into subtasks
task-master update-task --id=<id> --prompt="changes"         # Update specific task
task-master update --from=<id> --prompt="changes"            # Update multiple tasks from ID onwards
task-master update-subtask --id=<id> --prompt="notes"        # Add implementation notes to subtask

# Analysis & Planning
task-master analyze-complexity --research          # Analyze task complexity
task-master complexity-report                      # View complexity analysis
task-master expand --all --research               # Expand all eligible tasks

# Dependencies & Organization
task-master add-dependency --id=<id> --depends-on=<id>       # Add task dependency
task-master move --from=<id> --to=<id>                       # Reorganize task hierarchy
task-master validate-dependencies                            # Check for dependency issues
task-master generate                                         # Update task markdown files (usually auto-called)
```

## Key Files & Project Structure

### Core Files

- `.taskmaster/tasks/tasks.json` - Main task data file (auto-managed)
- `.taskmaster/config.json` - AI model configuration (use `task-master models` to modify)
- `.taskmaster/docs/prd.txt` - Product Requirements Document for parsing
- `.taskmaster/tasks/*.txt` - Individual task files (auto-generated from tasks.json)
- `.env` - API keys for CLI usage

### Claude Code Integration Files

- `CLAUDE.md` - Auto-loaded context for Claude Code (this file)
- `.claude/settings.json` - Claude Code tool allowlist and preferences
- `.claude/commands/` - Custom slash commands for repeated workflows
- `.mcp.json` - MCP server configuration (project-specific)

### Directory Structure

```
project/
├── .taskmaster/
│   ├── tasks/              # Task files directory
│   │   ├── tasks.json      # Main task database
│   │   ├── task-1.md      # Individual task files
│   │   └── task-2.md
│   ├── docs/              # Documentation directory
│   │   ├── prd.txt        # Product requirements
│   ├── reports/           # Analysis reports directory
│   │   └── task-complexity-report.json
│   ├── templates/         # Template files
│   │   └── example_prd.txt  # Example PRD template
│   └── config.json        # AI models & settings
├── .claude/
│   ├── settings.json      # Claude Code configuration
│   └── commands/         # Custom slash commands
├── .env                  # API keys
├── .mcp.json            # MCP configuration
└── CLAUDE.md            # This file - auto-loaded by Claude Code
```

## MCP Integration

Task Master provides an MCP server that Claude Code can connect to. Configure in `.mcp.json`:

```json
{
  "mcpServers": {
    "task-master-ai": {
      "command": "npx",
      "args": ["-y", "--package=task-master-ai", "task-master-ai"],
      "env": {
        "ANTHROPIC_API_KEY": "your_key_here",
        "PERPLEXITY_API_KEY": "your_key_here",
        "OPENAI_API_KEY": "OPENAI_API_KEY_HERE",
        "GOOGLE_API_KEY": "GOOGLE_API_KEY_HERE",
        "XAI_API_KEY": "XAI_API_KEY_HERE",
        "OPENROUTER_API_KEY": "OPENROUTER_API_KEY_HERE",
        "MISTRAL_API_KEY": "MISTRAL_API_KEY_HERE",
        "AZURE_OPENAI_API_KEY": "AZURE_OPENAI_API_KEY_HERE",
        "OLLAMA_API_KEY": "OLLAMA_API_KEY_HERE"
      }
    }
  }
}
```

### Essential MCP Tools

```javascript
help; // = shows available taskmaster commands
// Project setup
initialize_project; // = task-master init
parse_prd; // = task-master parse-prd

// Daily workflow
get_tasks; // = task-master list
next_task; // = task-master next
get_task; // = task-master show <id>
set_task_status; // = task-master set-status

// Task management
add_task; // = task-master add-task
expand_task; // = task-master expand
update_task; // = task-master update-task
update_subtask; // = task-master update-subtask
update; // = task-master update

// Analysis
analyze_project_complexity; // = task-master analyze-complexity
complexity_report; // = task-master complexity-report
```

## Claude Code Workflow Integration

### Standard Development Workflow

#### 1. Project Initialization

```bash
# Initialize Task Master
task-master init

# Create or obtain PRD, then parse it
task-master parse-prd .taskmaster/docs/prd.txt

# Analyze complexity and expand tasks
task-master analyze-complexity --research
task-master expand --all --research
```

If tasks already exist, another PRD can be parsed (with new information only!) using parse-prd with --append flag. This will add the generated tasks to the existing list of tasks..

#### 2. Daily Development Loop

```bash
# Start each session
task-master next                           # Find next available task
task-master show <id>                     # Review task details

# During implementation, check in code context into the tasks and subtasks
task-master update-subtask --id=<id> --prompt="implementation notes..."

# Complete tasks
task-master set-status --id=<id> --status=done
```

#### 3. Multi-Claude Workflows

For complex projects, use multiple Claude Code sessions:

```bash
# Terminal 1: Main implementation
cd project && claude

# Terminal 2: Testing and validation
cd project-test-worktree && claude

# Terminal 3: Documentation updates
cd project-docs-worktree && claude
```

### Custom Slash Commands

Create `.claude/commands/taskmaster-next.md`:

```markdown
Find the next available Task Master task and show its details.

Steps:

1. Run `task-master next` to get the next task
2. If a task is available, run `task-master show <id>` for full details
3. Provide a summary of what needs to be implemented
4. Suggest the first implementation step
```

Create `.claude/commands/taskmaster-complete.md`:

```markdown
Complete a Task Master task: $ARGUMENTS

Steps:

1. Review the current task with `task-master show $ARGUMENTS`
2. Verify all implementation is complete
3. Run any tests related to this task
4. Mark as complete: `task-master set-status --id=$ARGUMENTS --status=done`
5. Show the next available task with `task-master next`
```

## Tool Allowlist Recommendations

Add to `.claude/settings.json`:

```json
{
  "allowedTools": [
    "Edit",
    "Bash(task-master *)",
    "Bash(git commit:*)",
    "Bash(git add:*)",
    "Bash(npm run *)",
    "mcp__task_master_ai__*"
  ]
}
```

## Configuration & Setup

### API Keys Required

At least **one** of these API keys must be configured:

- `ANTHROPIC_API_KEY` (Claude models) - **Recommended**
- `PERPLEXITY_API_KEY` (Research features) - **Highly recommended**
- `OPENAI_API_KEY` (GPT models)
- `GOOGLE_API_KEY` (Gemini models)
- `MISTRAL_API_KEY` (Mistral models)
- `OPENROUTER_API_KEY` (Multiple models)
- `XAI_API_KEY` (Grok models)

An API key is required for any provider used across any of the 3 roles defined in the `models` command.

### Model Configuration

```bash
# Interactive setup (recommended)
task-master models --setup

# Set specific models
task-master models --set-main claude-3-5-sonnet-20241022
task-master models --set-research perplexity-llama-3.1-sonar-large-128k-online
task-master models --set-fallback gpt-4o-mini
```

## Task Structure & IDs

### Task ID Format

- Main tasks: `1`, `2`, `3`, etc.
- Subtasks: `1.1`, `1.2`, `2.1`, etc.
- Sub-subtasks: `1.1.1`, `1.1.2`, etc.

### Task Status Values

- `pending` - Ready to work on
- `in-progress` - Currently being worked on
- `done` - Completed and verified
- `deferred` - Postponed
- `cancelled` - No longer needed
- `blocked` - Waiting on external factors

### Task Fields

```json
{
  "id": "1.2",
  "title": "Implement user authentication",
  "description": "Set up JWT-based auth system",
  "status": "pending",
  "priority": "high",
  "dependencies": ["1.1"],
  "details": "Use bcrypt for hashing, JWT for tokens...",
  "testStrategy": "Unit tests for auth functions, integration tests for login flow",
  "subtasks": []
}
```

## Claude Code Best Practices with Task Master

### Context Management

- Use `/clear` between different tasks to maintain focus
- This CLAUDE.md file is automatically loaded for context
- Use `task-master show <id>` to pull specific task context when needed

### Iterative Implementation

1. `task-master show <subtask-id>` - Understand requirements
2. Explore codebase and plan implementation
3. `task-master update-subtask --id=<id> --prompt="detailed plan"` - Log plan
4. `task-master set-status --id=<id> --status=in-progress` - Start work
5. Implement code following logged plan
6. `task-master update-subtask --id=<id> --prompt="what worked/didn't work"` - Log progress
7. `task-master set-status --id=<id> --status=done` - Complete task

### Complex Workflows with Checklists

For large migrations or multi-step processes:

1. Create a markdown PRD file describing the new changes: `touch task-migration-checklist.md` (prds can be .txt or .md)
2. Use Taskmaster to parse the new prd with `task-master parse-prd --append` (also available in MCP)
3. Use Taskmaster to expand the newly generated tasks into subtasks. Consdier using `analyze-complexity` with the correct --to and --from IDs (the new ids) to identify the ideal subtask amounts for each task. Then expand them.
4. Work through items systematically, checking them off as completed
5. Use `task-master update-subtask` to log progress on each task/subtask and/or updating/researching them before/during implementation if getting stuck

### Git Integration

Task Master works well with `gh` CLI:

```bash
# Create PR for completed task
gh pr create --title "Complete task 1.2: User authentication" --body "Implements JWT auth system as specified in task 1.2"

# Reference task in commits
git commit -m "feat: implement JWT auth (task 1.2)"
```

### Parallel Development with Git Worktrees

```bash
# Create worktrees for parallel task development
git worktree add ../project-auth feature/auth-system
git worktree add ../project-api feature/api-refactor

# Run Claude Code in each worktree
cd ../project-auth && claude    # Terminal 1: Auth work
cd ../project-api && claude     # Terminal 2: API work
```

## Troubleshooting

### AI Commands Failing

```bash
# Check API keys are configured
cat .env                           # For CLI usage

# Verify model configuration
task-master models

# Test with different model
task-master models --set-fallback gpt-4o-mini
```

### MCP Connection Issues

- Check `.mcp.json` configuration
- Verify Node.js installation
- Use `--mcp-debug` flag when starting Claude Code
- Use CLI as fallback if MCP unavailable

### Task File Sync Issues

```bash
# Regenerate task files from tasks.json
task-master generate

# Fix dependency issues
task-master fix-dependencies
```

DO NOT RE-INITIALIZE. That will not do anything beyond re-adding the same Taskmaster core files.

## Important Notes

### AI-Powered Operations

These commands make AI calls and may take up to a minute:

- `parse_prd` / `task-master parse-prd`
- `analyze_project_complexity` / `task-master analyze-complexity`
- `expand_task` / `task-master expand`
- `expand_all` / `task-master expand --all`
- `add_task` / `task-master add-task`
- `update` / `task-master update`
- `update_task` / `task-master update-task`
- `update_subtask` / `task-master update-subtask`

### File Management

- Never manually edit `tasks.json` - use commands instead
- Never manually edit `.taskmaster/config.json` - use `task-master models`
- Task markdown files in `tasks/` are auto-generated
- Run `task-master generate` after manual changes to tasks.json

### Claude Code Session Management

- Use `/clear` frequently to maintain focused context
- Create custom slash commands for repeated Task Master workflows
- Configure tool allowlist to streamline permissions
- Use headless mode for automation: `claude -p "task-master next"`

### Multi-Task Updates

- Use `update --from=<id>` to update multiple future tasks
- Use `update-task --id=<id>` for single task updates
- Use `update-subtask --id=<id>` for implementation logging

### Research Mode

- Add `--research` flag for research-based AI enhancement
- Requires a research model API key like Perplexity (`PERPLEXITY_API_KEY`) in environment
- Provides more informed task creation and updates
- Recommended for complex technical tasks

---

_This guide ensures Claude Code has immediate access to Task Master's essential functionality for agentic development workflows._

# gcloud & Firebase Quick Reference

## Setup

```bash
# Install & login
npm install -g firebase-tools
gcloud auth login && firebase login

# Initialize project
firebase init
gcloud config set project PROJECT-ID
```

## Multi-Environment Setup

```bash
# Add project aliases
firebase use --add staging-project-id --alias staging
firebase use --add production-project-id --alias production

# Switch environments
firebase use staging
firebase use production
```

## Core Commands

### Projects

```bash
# List projects
gcloud projects list
firebase projects:list

# Switch project
gcloud config set project PROJECT-ID
firebase use PROJECT-ALIAS
```

### Functions

```bash
# Deploy
firebase deploy --only functions
firebase deploy --only functions:functionName

# Monitor
firebase functions:list
firebase functions:log --only functionName
```

### Pub/Sub

```bash
# Topics
gcloud pubsub topics create TOPIC-NAME
gcloud pubsub topics list
gcloud pubsub topics publish TOPIC-NAME --message="test"

# Subscriptions
gcloud pubsub subscriptions create SUB-NAME --topic=TOPIC-NAME
gcloud pubsub subscriptions list
```

### Service Accounts

```bash
# Create account
gcloud iam service-accounts create ACCOUNT-NAME \
  --display-name="Display Name"

# Grant permissions
gcloud projects add-iam-policy-binding PROJECT-ID \
  --member="serviceAccount:EMAIL" \
  --role="roles/pubsub.publisher"

# Generate key
gcloud iam service-accounts keys create ~/key.json \
  --iam-account=EMAIL
```

## Migration Workflow

```bash
# 1. Document staging
firebase use staging
firebase functions:list
gcloud pubsub topics list

# 2. Deploy to production
firebase use production
firebase deploy --only functions

# 3. Create Pub/Sub infrastructure
gcloud config set project PROD-PROJECT-ID
gcloud pubsub topics create TOPIC-NAME
gcloud pubsub subscriptions create SUB-NAME --topic=TOPIC-NAME

# 4. Test
gcloud pubsub topics publish TOPIC-NAME --message='{"test":true}'
```

## Common Troubleshooting

```bash
# Re-authenticate
gcloud auth login
firebase login

# Fix quota warnings
gcloud auth application-default set-quota-project PROJECT-ID

# Clear cache
firebase use --clear

# Check permissions
gcloud projects get-iam-policy PROJECT-ID
```

## Key File Patterns

### .firebaserc

```json
{
  "projects": {
    "staging": "app-staging-123",
    "production": "app-production-456"
  }
}
```

### Pub/Sub Function

```javascript
exports.handler = functions.pubsub.topic('topic-name').onPublish((message) => {
  const data = JSON.parse(Buffer.from(message.data, 'base64').toString());
  // Process data
});
```

## Essential Roles

- `roles/pubsub.publisher` - Publish messages
- `roles/pubsub.subscriber` - Subscribe to topics
- `roles/storage.objectAdmin` - Storage access
- `roles/firestore.user` - Firestore read/write

---

# Lessons Learned & Best Practices

## Web Components & Shadow DOM

### CSS Loading in Shadow DOM Components

**Problem:** CSS files referenced with hardcoded absolute paths (e.g., `/src/lib/...`) work in development but fail in production builds.

**Root Cause:**

- Vite bundles and hashes CSS files during production builds (e.g., `recipe_form_component-DF2DsqJz.css`)
- Source paths (`/src/...`) don't exist in the `/dist` output
- Shadow DOM components can't access external stylesheets with broken paths
- Netlify returns `index.html` (MIME type `text/html`) for missing files due to SPA routing
- Browser rejects CSS with wrong MIME type: "Refused to apply style... MIME type ('text/html') is not a supported stylesheet MIME type"

**Solution:**

```javascript
// ❌ BAD - Hardcoded source path (breaks in production)
render() {
  this.shadowRoot.innerHTML = `
    <link rel="stylesheet" href="/src/lib/component/styles.css">
    ${this.template()}
  `;
}

// ✅ GOOD - Import CSS as inline string (works everywhere)
import styles from './styles.css?inline';

render() {
  this.shadowRoot.innerHTML = `
    <style>${styles}</style>
    ${this.template()}
  `;
}
```

**Key Takeaways:**

1. **Always use Vite's `?inline` suffix** when importing CSS for Shadow DOM components
2. **Test production builds locally** before deploying (`npm run build && npx serve dist`)
3. **Check browser console** for MIME type errors - they indicate resource loading failures
4. **Shadow DOM isolates styles** - external stylesheets must be explicitly loaded into the shadow root
5. **Development ≠ Production** - `netlify dev` serves source files directly, hiding build issues

**Related Files:**

- All Web Components using Shadow DOM must import CSS this way
- Affected: [recipe_form_component.js](src/lib/recipes/recipe_form_component/recipe_form_component.js), [form-button-group.js](src/lib/recipes/recipe_form_component/parts/form-button-group.js), etc.

**Testing Checklist:**

- [ ] Build locally: `npm run build`
- [ ] Serve production build: `npx serve dist`
- [ ] Open browser DevTools → Console
- [ ] Verify no MIME type errors
- [ ] Verify CSS is applied to components
- [ ] Test in preview deployment before merging

---

## Development Workflow

### Testing & Deployment Pipeline

**Environment Progression:**

```
feature/bug branch → development → staging → main (production)
        ↓                ↓            ↓         ↓
   Preview Deploy   Dev Deploy  Stage Deploy  Production
```

**Best Practices:**

1. **Test locally first** - Run `netlify dev` and `npm run build`
2. **Use preview deployments** - Netlify creates previews for every branch push
3. **Verify in staging** - Always test in staging before promoting to production
4. **Fast-forward merges** - Keep git history linear when possible
5. **Pre-commit hooks** - Let automated checks catch issues early

**Commands:**

```bash
# Local testing
netlify dev              # Test with local Netlify environment
npm run build           # Test production build
npx serve dist          # Serve production build locally

# Deployment flow
git push origin feature/bug    # Creates preview deployment
# Test preview → merge to development → test dev deployment
# Test dev → merge to staging → test staging deployment
# Test staging → merge to main → production deployment
```

---

## Code Quality & Linting

### Pre-Commit Hooks

This project uses automated Git hooks to ensure code quality before commits are allowed. The pre-commit hook runs automatically when you attempt to commit.

**Hook Sequence:**

1. **📝 Code Formatting** - Runs `npm run format` (Prettier)
   - Auto-formats all staged files
   - **Fails if formatting changes are made** - you must stage the formatted files and commit again
2. **🧹 Linting** - Runs `npm run lint` (ESLint)
   - Checks for code quality issues and errors
   - Run `npm run lint:fix` to auto-fix some issues
3. **🧪 Tests** - Runs `npm test` (Jest)
   - All tests must pass before commit is allowed
4. **🏗️ Build Verification** - Runs `npm run build` (Vite)
   - Ensures the production build succeeds
   - Catches build-time issues before they reach CI/CD

**All checks must pass** before a commit is created. This ensures:

- Consistent code formatting across the team
- No linting errors in the codebase
- Tests are always passing
- Production builds will succeed

### ESLint Rules

Key linting rules enforced in this project:

**Firebase Import Restrictions:**

```javascript
// ❌ BAD - Default imports from Firebase are prohibited
import firebase from 'firebase';
import auth from 'firebase/auth';

// ✅ GOOD - Use named imports and firebase-service.js
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirebaseApp, getAuthInstance } from './services/firebase-service.js';
```

**Why:** Prevents import inconsistencies and enforces centralized Firebase configuration through `firebase-service.js`.

### Manual Quality Commands

Run these commands manually when needed:

```bash
# Format all files with Prettier
npm run format

# Run ESLint
npm run lint

# Auto-fix ESLint issues
npm run lint:fix

# Run tests
npm test

# Build for production
npm run build
```

### Bypassing Hooks (Emergency Only)

⚠️ **Not recommended** - Only use in emergencies:

```bash
# Skip pre-commit hooks (use with caution!)
git commit --no-verify -m "emergency fix"
```

**When to bypass:**

- Critical production hotfix that can't wait
- Hooks are broken and need to be fixed
- Working on the hook scripts themselves

**Always:**

- Document why you bypassed hooks
- Fix the underlying issues ASAP
- Never bypass hooks for convenience

---

## Project-Specific Guidelines

### Code Comments Policy

**Philosophy**: Code should be self-documenting. Comments should explain **WHY**, not **WHAT**.

**When to Comment**:

- JSDoc for public APIs and exported functions (required)
- Complex business logic that isn't immediately obvious
- Workarounds for bugs or edge cases
- Performance optimizations that seem counterintuitive
- TODO/FIXME markers for future work

**When NOT to Comment**:

- ❌ Obvious code: `// Create new array` before `const arr = []`
- ❌ Numbered steps: `// 1. Do X`, `// 2. Do Y` (use function names instead)
- ❌ Repeating code: `// Delete file` before `deleteFile()`
- ❌ Unchanged legacy comments after refactoring

**Examples**:

```javascript
// ❌ BAD - Obvious comments
// 1. Fetch original recipe
const recipe = await getRecipe(id);
// 2. Check if category changed
if (recipe.category !== newCategory) {
  // 3. Migrate images
  await migrateImages();
}

// ✅ GOOD - Self-documenting code
const recipe = await getRecipe(id);
const categoryChanged = recipe.category !== newCategory;

if (categoryChanged) {
  await migrateImagesToNewCategory();
}

// ✅ GOOD - Explains WHY, not WHAT
// Migrate images because storage paths include category folder
// (legacy design decision - images are organized by category)
if (categoryChanged) {
  await migrateImagesToNewCategory();
}
```

### Do's

- Work with task-master commands rather than changing configuration files
- Never interact with `tasks.json` directly - always use task-master commands
- Use Vite's `?inline` suffix for CSS imports in Shadow DOM components
- Test production builds before deploying
- Commit meaningful documentation like `CLAUDE.md` to help future developers
- Let pre-commit hooks format and lint your code automatically
- Run `npm run lint:fix` to auto-fix linting issues before committing
- Use `firebase-service.js` for all Firebase imports
- Write JSDoc comments for all exported functions
- Keep comments focused on explaining WHY, not WHAT

### Don'ts

- Do not use `npm run dev` - the dev server already runs in background
- Do not suggest running git commands without user confirmation
- Do not create temporary test files or scripts - use Playwright MCP for UI testing
- Do not assume development behavior matches production - always verify builds
- Do not bypass pre-commit hooks without good reason
- Do not use default imports from Firebase modules
- Do not use Firebase compat API
- Do not add numbered step comments (`// 1. Do X`) - use descriptive function/variable names instead
- Do not add comments that simply repeat what the code does
