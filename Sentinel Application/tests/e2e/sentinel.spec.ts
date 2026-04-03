/**
 * Sentinel — End-to-End Tests (Playwright)
 * Tests critical user flows against the running app.
 *
 * Setup: npx playwright install
 * Run:   npx playwright test
 */

import { test, expect, Page } from "@playwright/test";
import path from "path";
import fs from "fs";

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";
const API_URL = process.env.API_URL || "http://localhost:8000";

// ─── Health Check ─────────────────────────────────────────

test("API health check passes", async ({ request }) => {
  const resp = await request.get(`${API_URL}/health`);
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(body.status).toBe("ok");
});

// ─── Dashboard ────────────────────────────────────────────

test("Dashboard loads with stats", async ({ page }) => {
  await page.goto(BASE_URL);
  await expect(page).toHaveTitle(/Sentinel/);

  // Stats widgets should be visible
  await expect(page.getByTestId("stat-total")).toBeVisible();
  await expect(page.getByTestId("stat-deepfakes")).toBeVisible();
  await expect(page.getByTestId("stat-threat-level")).toBeVisible();
});

test("Dashboard shows recent reports table", async ({ page }) => {
  await page.goto(BASE_URL);
  await expect(page.getByTestId("recent-reports-table")).toBeVisible();
});

// ─── File Upload Flow ─────────────────────────────────────

test("File upload: rejects invalid file type", async ({ page }) => {
  await page.goto(`${BASE_URL}/analyze`);

  // Create a fake .exe file
  const tmpFile = path.join("/tmp", "test.exe");
  fs.writeFileSync(tmpFile, "MZ fake executable");

  const fileInput = page.getByTestId("file-input");
  await fileInput.setInputFiles(tmpFile);

  await expect(page.getByTestId("error-message")).toContainText(
    /unsupported file type/i
  );
});

test("File upload: accepts valid image and shows result", async ({ page }) => {
  await page.goto(`${BASE_URL}/analyze`);

  // Create a minimal valid JPEG (smallest possible JPEG)
  const minJpeg = Buffer.from(
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARC" +
    "AABAAEDASIA...",
    "base64"
  );
  const tmpFile = path.join("/tmp", "test.jpg");
  fs.writeFileSync(tmpFile, minJpeg);

  const fileInput = page.getByTestId("file-input");
  await fileInput.setInputFiles(tmpFile);

  // Wait for analysis result
  await expect(page.getByTestId("verdict-card")).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId("confidence-score")).toBeVisible();
  await expect(page.getByTestId("analyst-narrative")).toBeVisible();
});

// ─── URL Submission Flow ──────────────────────────────────

test("URL submission: shows result card", async ({ page }) => {
  await page.goto(`${BASE_URL}/analyze`);

  await page.getByTestId("url-tab").click();
  await page.getByTestId("url-input").fill("https://example.com/test-media.jpg");
  await page.getByTestId("url-submit-btn").click();

  await expect(page.getByTestId("verdict-card")).toBeVisible({ timeout: 10000 });
});

// ─── Reports Page ─────────────────────────────────────────

test("Reports page: loads and shows filter controls", async ({ page }) => {
  await page.goto(`${BASE_URL}/reports`);

  await expect(page.getByTestId("reports-filter")).toBeVisible();
  await expect(page.getByTestId("reports-table")).toBeVisible();
});

test("Reports page: search filters results", async ({ page }) => {
  await page.goto(`${BASE_URL}/reports`);

  await page.getByTestId("search-input").fill("deepfake");
  await page.keyboard.press("Enter");

  // Results should update
  await page.waitForTimeout(500);
  const rows = page.getByTestId("report-row");
  // Either shows results or "no results" message
  const noResults = page.getByTestId("no-results-message");
  const hasResults = (await rows.count()) > 0;
  const hasNoResultsMsg = await noResults.isVisible();
  expect(hasResults || hasNoResultsMsg).toBeTruthy();
});

// ─── API Direct Tests ─────────────────────────────────────

test("API: analyze/url returns structured result", async ({ request }) => {
  const resp = await request.post(`${API_URL}/api/analyze/url`, {
    data: { url: "https://example.com/image.jpg", context: "e2e test" },
  });

  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(body).toHaveProperty("analysis_id");
  expect(body).toHaveProperty("verdict");
  expect(body).toHaveProperty("confidence");
  expect(body).toHaveProperty("threat_level");
  expect(body).toHaveProperty("narrative");
  expect(["deepfake", "suspected_deepfake", "inconclusive", "authentic"]).toContain(
    body.verdict
  );
});

test("API: reports/stats returns valid structure", async ({ request }) => {
  const resp = await request.get(`${API_URL}/api/reports/stats`);
  expect(resp.status()).toBe(200);
  const body = await resp.json();
  expect(body).toHaveProperty("verdict_counts");
  expect(body).toHaveProperty("threat_level_counts");
});
