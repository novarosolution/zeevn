import type { Page } from "@playwright/test";

/**
 * Completes Razorpay Checkout test-mode card payment in the hosted modal iframe.
 */
export async function completeRazorpayTestPayment(page: Page) {
  const frame = page.frameLocator('iframe[src*="razorpay"], iframe.razorpay-checkout-frame, iframe').first();

  const card = frame.locator(
    'input[name="card.number"], input[placeholder*="card" i], input[data-testid="card-number"]'
  );
  await card.waitFor({ state: "visible", timeout: 45_000 });
  await card.fill("4111111111111111");

  const expiry = frame.locator('input[name="card.expiry"], input[placeholder*="MM" i], input[placeholder*="Valid" i]');
  if (await expiry.count()) {
    await expiry.first().fill("12 / 30");
  }

  const cvv = frame.locator('input[name="card.cvv"], input[placeholder*="CVV" i]');
  if (await cvv.count()) {
    await cvv.first().fill("123");
  }

  const pay = frame.getByRole("button", { name: /pay|continue|submit/i });
  await pay.first().click({ timeout: 15_000 });

  await page.waitForTimeout(2000);
}
