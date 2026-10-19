const config = {
  "*.{ts,tsx,js,mjs}": ["eslint --fix --no-warn-ignored", "prettier --write --ignore-unknown"],
  "*.{css,md,json,yml,yaml}": "prettier --write --ignore-unknown",
};

export default config;
