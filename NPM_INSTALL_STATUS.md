# NPM Install Status

## What has been done

- Identified `npm install` failures while working in this repository.
- Confirmed the workspace is on a `fuseblk`-mounted drive (`/mnt/3E668F7D668F34A5`) which can cause npm file staging issues.
- Tried installing with local cache and temp directories outside the project:
  - `/tmp/npm-cache`
  - `/tmp/npm-tmp`
- Tried `npm install --no-audit --no-fund --cache /tmp/npm-cache --tmp /tmp/npm-tmp`.
- Tried with `--legacy-peer-deps` and increased network timeout settings.
- Verified `node_modules` is still missing after the install attempts.
- Seen npm create logs in `/tmp/npm-cache/_logs` and a final `ETIMEDOUT` network error while fetching from registry.

## Current status

- `node_modules` has not been created in the project directory.
- The last install attempt exited with `npm ERR! code ETIMEDOUT` while reading dependency packages from the npm registry.
- There is a persistent network/registy access issue preventing a clean install.
- The repository still lacks installed dependencies, so build/dev commands cannot be run successfully yet.

## What needs to be done next

1. Resolve the network/registry timeout issue.
   - Check local network connectivity and any proxy configuration.
   - Verify access to `https://registry.npmjs.org` from this machine.
   - Optionally try a different network or VPN if the registry is blocked.
2. Retry installation from a stable environment.
   - Use `npm install --no-audit --no-fund --legacy-peer-deps --network-timeout=600000 --fetch-retries=5 --fetch-retry-maxtimeout=120000 --cache /tmp/npm-cache`.
   - Keep `TMPDIR` pointed outside the project so temp files are not created on the FUSE mount.
3. If network issues persist, consider copying the project to a local non-FUSE filesystem and installing there.
4. Once dependencies install successfully, run:
   - `npm run build`
   - `npm run dev` or `npm run preview`

## Notes

- The underlying project uses Astro and latest package versions, so `node_modules` is required before further development or build validation.
- This file captures the current troubleshooting state and the next required actions.
