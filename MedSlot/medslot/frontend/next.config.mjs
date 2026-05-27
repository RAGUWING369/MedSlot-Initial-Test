/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for the multi-stage Docker build: emits a self-contained
  // standalone bundle (server.js + node_modules trace) into .next/standalone.
  // See: medslot/frontend/Dockerfile — runner stage.
  output: 'standalone',
};

export default nextConfig;
