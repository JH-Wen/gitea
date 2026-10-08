# Hastur frontend development

Work on `dev/wen` in the repository's `.devcontainer`. The container supplies Go,
Node 24, pnpm, Make and Python. `node_modules` and `.venv` use Docker volumes;
do not install build tools or dependencies on the Windows host.

Open the repository with **Dev Containers: Reopen in Container**, then run:

```bash
make help
make build EXTRA_GOFLAGS=-buildvcs=false
bash .devcontainer/start-hastur.sh
```

The development instance is available at <http://127.0.0.1:4319>. Its configuration,
SQLite database and repositories live in `/home/vscode/.local/share/gitea-hastur`
inside the development container. They are separate from the existing Hastur
Gitea service and are lost when this container is removed. Registration is disabled.
Create a local development user in a second container terminal:

```bash
./gitea --work-path /home/vscode/.local/share/gitea-hastur \
  --config /home/vscode/.local/share/gitea-hastur/app.ini \
  admin user create --username wen --email wen@example.test --random-password
```

The CLI prints the generated password. Only use this account for local development.
The build flag avoids Go's additional Git status scan on Windows bind mounts;
Make still records Gitea's version from the current Git revision.

## Themes and upstream updates

`Hastur Dark`, `Hastur Light` and `Hastur Auto` appear in Gitea's theme selector.
The development instance defaults to `hastur-dark`; an existing installation can
set `DEFAULT_THEME = hastur-dark` under `[ui]` in its own configuration.

The themes import upstream palettes and override them under `web_src/css/hastur`.
The sidebar reuses real repository links, counts, localization and permission
checks. `repo/navigation` is shared between the desktop sidebar and the compact
navigation on smaller screens, including custom tabs and external trackers.
Other themes retain the upstream layout.

The Hastur home route sends anonymous visitors to sign-in and signed-in users to
the workspace. An explicitly configured landing page takes precedence. The
upstream marketing template remains available to other themes; no account,
recovery, repository, or administrator routes are deleted.

## Page design

| Page family | Structure and purpose |
| --- | --- |
| Sign-in, registration, recovery, 2FA, account linking | Shared identity panel and focused form; preserve provider, captcha and recovery flows |
| Workspace | Assigned work, requested reviews and inbox shortcuts; searchable repository cards before activity |
| Global issues, pulls, milestones | Horizontal scope filters, readable counts, search and list in one main column |
| Repository | One navigation source; code, files and README with repository context; all enabled units remain reachable |
| Issues and reviews | Title and state above a reading surface, separate metadata; full-width reading on smaller screens |
| Releases, branches, commits, actions, projects, packages | Shared page headings, controls, list and empty-state surfaces; retain their distinct workflows |
| Explore, profiles, organizations | Repository cards, member context, existing visibility boundaries |
| User, repository, organization and admin settings | Local section navigation, bounded form width, separated sections and actions |
| Creation, migration, OAuth consent, dialogs | Focused form surfaces; preserve warnings, permissions and validation |
| Errors and empty states | Clear state, quiet illustration/icon, and useful return or creation actions |

Keep actual data and capability checks in upstream components. Do not invent
agent activity, execution status or counts to fill empty space. Decorative
workflow icons on the sign-in page are not live status indicators.

Keep `main` tracking upstream. Merge upstream changes into `dev/wen` without
rewriting history, then check the template hooks and repository unit permissions.
Design screenshots are in `docs/assets/hastur`. They show a local development
instance with sample repository data.

## Surface and motion language

`web_src/css/hastur/finish.css` is shared by the dark, light and automatic themes.
It adds quiet dot patterns, a hand-drawn branch-routing motif, inset edge highlights
and a narrow active-navigation marker. Reading surfaces remain plain.

Interaction feedback uses 140 ms transitions; menus, disclosures and content
navigation use 220 ms. Hover lifts are limited to 2 px on cards. Dropdown and modal
transitions use native CSS discrete display transitions without changing Gitea's
event handlers. Page transitions use the browser's cross-document view transitions;
unsupported browsers retain normal navigation. All added motion is conditional on
`prefers-reduced-motion: no-preference`. Do not add continuous decorative motion,
pointer tracking, or scroll interception to everyday development pages.

## Verification

Inside the development container:

```bash
make lint-css STYLELINT_FILES='web_src/css/hastur/*.css web_src/css/themes/theme-hastur-*.css'
make lint-templates
make lint-js ESLINT_FILES=web_src/js/features/common-page.ts
make lint-go
make frontend
GOFLAGS=-buildvcs=false go test -run '^TestSettingLandingPage$' ./tests/integration/
```

Check signed-in and anonymous pages, repository code and issues, pull request
diffs, navigation dropdowns, narrow screens, keyboard focus, and all three themes.

The October 8 development check covered real password sign-in, the anonymous
home redirect, workspace shortcuts, issue scope filters, issue detail, repository
code, pull request files, repository and user settings, mobile settings navigation,
creation forms, repository directory, actions/projects/releases empty states, and
404 navigation. Dark and light layouts were inspected in the running container.
The landing-page integration test covers all three Hastur themes and explicit
landing-page configuration precedence.

External authentication providers, configured 2FA/passkeys, administrator-only
operations, and populated workflow/board/release states require their own fixture
coverage; shared template and style checks do not prove those end-to-end flows.
