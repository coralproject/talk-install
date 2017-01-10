# talk-install

A web app that a hopeful Coral Project installation administrator can use to install the latest release of Talk on a Heroku Dyno in their Heroku Account.

## Prerequisites

You need a Heroku Account, and you need to [create a new Heroku Application](https://dashboard.heroku.com/account/clients/new) (OAuth Client) for talk-install to use. This way, users of talk-install can log in with their Heroku Account. The "OAuth Callback URL" of your Heroku Application MUST end in '/auth/heroku/callback'. If you're not sure what full URL to use, and you're going to run talk-install locally, try 'http://localhost:3000/auth/heroku/callback'.

Once you've created the Heroku Application, take note of its ID and Secret, as you will need to provide them when running talk-install.

## Usage

```
npm start
```

Ensure that you provide environment variables as listed below.

There is no stdout on successful start, but there will be logs once HTTP traffic starts. Remember to use DEBUG if you want more runtime info.

In your web browser, open http://localhost:3000 (or other PORT, if you configured it).

## Environment Variables

| variable            | required                | description                                                                                                                                                                                                                   |
|---------------------|-------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| DEBUG               | no                      | See [debug](http://npm.im/debug). Set to 'talk-install' for debug logs from this project. Set to '*' for very verbose debug logs from all dependencies too.                                                                   |
| HEROKU_OAUTH_ID     | yes                     | Heroku Application ID (which is an OAuth Client ID). See [your existing applications in the Heroku Dashboard](https://dashboard.heroku.com/account/applications).                                                             |
| HEROKU_OAUTH_SECRET | yes                     | Heroku Application Secret                                                                                                                                                                                                     |
| PORT                | no                      | Which TCP port this app should listen on for HTTP requests. Defaults to 3000.                                                                                                                                                 |
| REDIS_URL           | no                     | Where to find Redis, which is used for user sessions. Defaults to `redis://localhost:6379` |
| REPO                | no                    | What GitHub repo the installer should install. Defaults to `coralproject/talk` |
| REPO_PRERELEASE     | no | Allow the most recent release to be a pre-release. Defaults to `FALSE` |
| SESSION_SECRET      | yes                     | Key used to encrypt user information before storing sessions in Redis. Must be at least 16 characters long |


## License

    Copyright 2016 Mozilla Foundation

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.

    See the License for the specific language governing permissions and limitations under the License.
