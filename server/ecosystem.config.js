module.exports = {
  apps: [{
    name: 'server',
    script: './server.js',
    env: {
      MONGO_URI: 'mongodb+srv://brainbric:balaji@cluster0.7x8pu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
      JWT_SECRET: '01711e2614f0979e3ecb18618953e9fc187a8d5de1a5172010a8326ddf52e227',
      ADMIN_SRO: 'SRO2525125',
      ADMIN_PASSWORD: 'Admin@123',
      PORT: 5000,
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
}
