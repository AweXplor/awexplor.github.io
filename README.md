# AwesomeExplorer (AweXplor)

Welcome to [AwesomeExplorer (AweXplor)](https://awexplor.github.io/) – the ultimate tool for exploring GitHub's awesome lists with ease and efficiency!

## What is AwesomeExplorer?

AwesomeExplorer is a web application designed to enhance the way you browse GitHub's awesome lists. AweXplor transforms these plain text lists into an interactive, user-friendly interface where you can easily sort, filter, and discover projects based on various criteria.

## Features

**Interactive Browsing**: Navigate through awesome lists with a sleek, intuitive interface that displays repository names, descriptions, star counts, recent update times, tags, and owners.

**Advanced Sorting**: Sort projects by popularity or activity to quickly find the most popular or recently active repositories.

**Filtering**: Narrow down your search by filtering out unmaintained or overly popular repositories.

**Mobile Friendly**: Enjoy a responsive design that ensures seamless browsing on any device, including smartphones and tablets.

## Getting Started

To start using AwesomeExplorer, simply visit our website https://awexplor.github.io/ and begin exploring your favorite awesome lists with newfound ease and efficiency.

## How the data is refreshed

Every figure shown on a card — stars, forks and especially the *last activity*
(`pushed_at`) — is a snapshot taken when the dataset was crawled, stored in a
local `sqlite.db` and frozen into `public/aggregated/<list>.json` at build time.
Nothing is fetched from GitHub at runtime, so the pages are only as fresh as the
last crawl.

```bash
pnpm install
pnpm migrate                 # create/upgrade sqlite.db
GITHUB_TOKEN=… pnpm crawl    # refresh the dataset
pnpm build                   # export the static site to out/
```

`pnpm crawl --help` lists the options (`--only`, `--stale-days`, `--max-repos`,
…). A full refresh covers ~18k repositories with ~360 GraphQL requests, which
fits well inside the hourly quota. `GITHUB_TOKEN` accepts several comma
separated tokens; they only add budget if they belong to *different* accounts,
since the 5000 requests/hour limit is per account.

The `Refresh data` workflow runs this daily and redeploys the `pages` branch. It
keeps `sqlite.db` between runs as a release asset, and works with the built-in
token; set the `CRAWL_GITHUB_TOKEN` secret to use a wider quota.

Star history (`stars_detail`, used for the trending order) is not part of the
crawl: it requires paginating the stargazers of every repository, roughly 50k
requests, so it needs its own token budget.

## Explorerable repositories

Currently, we feature a selection of popular awesome list projects due to GitHub API rate limits and the limited number of API tokens available. If you'd like to see a specific awesome list repository included, please [open an issue](https://github.com/AweXplor/awexplor.github.io/issues/new) and we will consider adding it.
