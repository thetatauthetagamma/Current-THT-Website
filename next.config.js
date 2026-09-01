/** @type {import('next').NextConfig} */
const nextConfig = {}

if (process.env.NODE_ENV !== 'production') {
  const { initOpenNextCloudflareForDev } = require('@opennextjs/cloudflare')
  initOpenNextCloudflareForDev()
}

module.exports = nextConfig
