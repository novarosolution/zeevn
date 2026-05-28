# CI Notes

## Lighthouse CI (LHCI)

The workflow `/.github/workflows/lighthouse-ci.yml` runs LHCI against the exported web bundle.

### Required CI setup

- Add GitHub Actions secret: `LHCI_GITHUB_APP_TOKEN`
  - Install the Lighthouse CI GitHub App: <https://github.com/apps/lighthouse-ci>
  - Copy the app token into repository secrets:
    - Settings -> Secrets and variables -> Actions -> New repository secret
    - Name: `LHCI_GITHUB_APP_TOKEN`

### Chrome in CI

The workflow uses `browser-actions/setup-chrome@v1` and passes `CHROME_PATH` to LHCI.
This avoids runner-specific Chrome discovery failures (`Chrome installation not found`).

### Artifacts

The workflow uploads `.lighthouseci/` as `lighthouse-report` on every run.
Download the artifact from the Actions run page to inspect HTML/JSON reports.

### Stability mode

The LHCI step currently uses `continue-on-error: true` so perf score fluctuations do not block PRs.
Once scores are stable, remove this and make assertions fully blocking.
