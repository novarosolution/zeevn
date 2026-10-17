module.exports = {
  apps: [
    {
      name: "zeevan-api",
      cwd: __dirname,
      script: "server.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "350M",
    },
  ],
};
