/**
 * @type {import("release-it").Config}
 */
const config = {
  git: {
    commitMessage: "release: v${version}",
    tagName: "v${version}",
    requireCleanWorkingDir: true,
    requireUpstream: true,
    requireBranch: "main",
    tag: true,
    commit: true,
  },
  github: {
    release: true,
  },
  npm: {
    publish: false,
  },
  hooks: {
    "before:init": [
      "yarn prettier . --check",
      "yarn tsc",
      "yarn eslint .",
      "yarn vite build",
    ],
  },
};

export default config;
