import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    '192.168.84.1',
    '192.168.84.1:3000',
    'localhost:3000',
    'delivery-extradite-applaud.ngrok-free.dev',
    '*.ngrok-free.dev',
    '*.ngrok-free.app'
  ],
};

export default nextConfig;
allowedDevOrigins: [
  '192.168.84.1',
  '192.168.84.1:3000',
  'localhost:3000',
  'delivery-extradite-applaud.ngrok-free.dev' // Add your ngrok URL
]