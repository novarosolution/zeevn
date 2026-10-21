const cwd = process.env.YOUPI_DIR || "/var/www/youpi-pg";

module.exports = {
  apps: [
    {
      name: "youpi-api",
      cwd,
      script: "apps/payment-api/src/index.js",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "120M",
      env: { NODE_ENV: "production" },
    },
    {
      name: "youpi-checkout",
      cwd,
      script: "apps/checkout-portal/src/index.js",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "80M",
      env: { NODE_ENV: "production" },
    },
    {
      name: "youpi-admin",
      cwd,
      script: "apps/merchant-admin/src/index.js",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "80M",
      env: { NODE_ENV: "production" },
    },
  ],
};
