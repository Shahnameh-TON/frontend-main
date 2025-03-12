module.exports = {
  apps : [{
    name   : "khabat",
    script : "app.js",
    instances: 1,
    autorestart: true,
    watch: true,
    log_file: "logs/combined.outerr.log",
    ignore_watch : ["logs/*", "public/chartdata/*"],
    env: {
      NODE_ENV: 'development',
      PORT: 45721
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 45721
    }
  }]
}