# talk-install

A web app that a hopeful Coral Project installation administrator can use to install the latest release of Talk on a Heroku Dyno in their Heroku Account.

## Prerequisites

You need a Heroku Account, and you need to [create a new Heroku Application](https://dashboard.heroku.com/account/clients/new) (OAuth Client) for talk-install to use. This way, users of talk-install can log in with their Heroku Account. The "OAuth Callback URL" of your Heroku Application MUST end in '/auth/heroku/callback'. If you're not sure what full URL to use, and you're going to run talk-install locally, try 'http://localhost:3000/auth/heroku/callback'.

Once you've created the Heroku Application, take note of its ID and Secret, as you will need to provide them when running talk-install.

## Usage

`npm start`

But you also need to provide a few environment variables. So your real usage will be like

`HEROKU_OAUTH_ID=x HEROKU_OAUTH_SECRET=y REDIS_URL=z REPO=coralproject/talk REPO_PRERELEASE=true SESSION_SECRET=$(date |md5 | head -c16) npm start`

There is no stdout on successful start, but there will be logs once HTTP traffic starts. Remember to use DEBUG if you want more runtime info.

In your web browser, open http://localhost:3000 (or other PORT, if you configured it).

## Environment Variables

| variable            | required                | description                                                                                                                                                                                                                   |
|---------------------|-------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| DEBUG               | no                      | See [debug](http://npm.im/debug). Set to 'talk-install' for debug logs from this project. Set to '*' for very verbose debug logs from all dependencies too.                                                                   |
| HEROKU_OAUTH_ID     | yes                     | Heroku Application ID (which is an OAuth Client ID). See [your existing applications in the Heroku Dashboard](https://dashboard.heroku.com/account/applications).                                                             |
| HEROKU_OAUTH_SECRET | yes                     | Heroku Application Secret                                                                                                                                                                                                     |
| PORT                | no                      | Which TCP port this app should listen on for HTTP requests. Defaults to 3000.                                                                                                                                                 |
| REDIS_URL           | no                     | Where to find redis, which is used for user sessions. Defaults to redis://localhost:6379. If you don't have redis, but do have docker, you can run it with `docker run -p 6379:6379 redis`                                           |
| REPO                | yes                     | What GitHub repo the installer should install. You probably want to set this to 'coralproject/talk'                                                                                                                           |
| REPO_PRERELEASE     | no, but see description | Use prereleases. If 'true', the installer will install the most recent release at REPO, even if it's not tagged as 'latest'. Currently you must set this to 'true', presumably because coralproject/talk isn't full released. |
| SESSION_SECRET      | yes                     | Key used to encrypt user information before storing sessions in Redis. Must be at least 16 characters long. For something random, use output of `date |md5 | head -c16; echo`                                                 |
