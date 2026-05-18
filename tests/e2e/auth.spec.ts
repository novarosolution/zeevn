import { test, expect } from "@playwright/test";
import {
  E2E_PASSWORD,
  issueVerificationToken,
  uniqueEmail,
} from "./helpers/api";

test.describe("Auth E2E", () => {
  test("register → verify → sign in → sign out roundtrip", async ({ page }) => {
    const email = uniqueEmail("auth");
    const password = E2E_PASSWORD;

    await page.goto("/register", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/create your account/i)).toBeVisible({ timeout: 30_000 });

    await page.getByTestId("register-name").fill("E2E Auth User");
    await page.getByTestId("register-email").fill(email);
    await page.getByTestId("register-password").fill(password);
    await page.getByRole("button", { name: /create account/i }).click();

    await expect(page).toHaveURL(/\/(home)?$|\/$/, { timeout: 20_000 });

    const { verifyUrl } = await issueVerificationToken(email);
    await page.goto(verifyUrl);
    await expect(page.getByRole("button", { name: /go to profile/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole("button", { name: /go to profile/i }).click();
    await expect(page).toHaveURL(/profile/i, { timeout: 15_000 });

    await page.getByRole("button", { name: /^sign out$/i }).first().click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: /^sign out$/i }).click();

    await page.goto("/login");
    await page.getByTestId("login-email").fill(email);
    await page.getByTestId("login-password").fill(password);
    await page.getByRole("button", { name: /^sign in$/i }).click();

    await expect(page).not.toHaveURL(/login/, { timeout: 20_000 });

    await page.reload();
    await expect(page).not.toHaveURL(/login/);
  });
});
