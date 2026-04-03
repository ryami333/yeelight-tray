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
    push: true,
  },
  github: {
    release: true,
    assets: ["out/make/zip/darwin/arm64/*.zip"],
  },
  npm: {
    publish: false,
  },
  hooks: {
    "before:init": [
      "yarn prettier . --check",
      "yarn tsc",
      "yarn eslint .",
      "yarn make", // No need to do `yarn package` because `make` is a superset of `package`.
    ],
  },
};

export default config;
