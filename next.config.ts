import type { NextConfig } from "next";

// GitHub Pages serves a project site from a sub-path
// (https://asen23.github.io/BillBuddy/), so the deploy workflow sets BASE_PATH
// from actions/configure-pages. Local dev and the e2e suite build without it.
const basePath = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // BillBuddy is client-only (ADR-0001), so it ships as a fully static export.
  output: "export",
  basePath,
};

export default nextConfig;
