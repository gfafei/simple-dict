module.exports = {
  apps: [
    {
      name: 'simple-dict',
      cwd: './server',
      script: 'npm',
      args: 'run start',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
