// apps/mobile/src/config.ts

// GANTI IP INI DENGAN IPV4 LAPTOP KAMU!
// Jangan pakai localhost.
// Gunakan Env Var, fallback ke IP hardcoded jika tidak ada
export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.20:4000";
// Contoh: http://192.168.100.5:3000