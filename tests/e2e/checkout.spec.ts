import { test, expect } from "@playwright/test";
import {
  E2E_PASSWORD,
  ensureE2EProductId,
  loginUserApi,
  registerUserApi,
  replaceCartApi,
  uniqueEmail,
  updateProfileApi,
} from "./helpers/api";
import { completeRazorpayTestPayment } from "./helpers/razorpay";

const hasRazorpay =
  Boolean(process.env.RAZORPAY_KEY_ID || process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID) &&
  Boolean(process.env.RAZORPAY_KEY_SECRET);

test.describe("Checkout E2E", () => {
  test("sign in → cart → checkout pay (Razorpay or COD) → order in account", async ({ page }) => {
    const email = uniqueEmail("checkout");
    const password = E2E_PASSWORD;
    const productId = await ensureE2EProductId();

    const session = await registerUserApi(email, password);
    const { token } = session;

    await updateProfileApi(token, {
      defaultAddress: {
        fullName: "E2E Checkout",
        phone: "9876543210",
        line1: "12 Test Lane",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
        country: "India",
      },
    });

    await replaceCartApi(token, [{ product: productId, quantity: 1 }]);

    await page.addInitScript((auth) => {
      window.localStorage.setItem(
        "@zeevan_auth",
        JSON.stringify({
          token: auth.token,
          refreshToken: auth.refreshToken,
          user: auth.user,
        })
      );
    }, { token, refreshToken: session.refreshToken, user: session.user });

    await page.goto("/cart");
    await expect(page.getByRole("button", { name: /^checkout$/i })).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: /^checkout$/i }).click();

    await expect(page.getByText(/secure checkout/i)).toBeVisible({ timeout: 15_000 });

    let usedOnlinePayment = false;
    if (hasRazorpay) {
      const onlinePaymentTab = page.getByRole("button", { name: /online payment/i }).first();
      if ((await onlinePaymentTab.count()) > 0 && (await onlinePaymentTab.isEnabled())) {
        await onlinePaymentTab.click();
        usedOnlinePayment = true;
      }
    }

    const placeOrder = page.getByRole("button", { name: /place order/i });
    await expect(placeOrder).toBeEnabled({ timeout: 15_000 });
    await placeOrder.click();

    if (usedOnlinePayment) {
      await completeRazorpayTestPayment(page);
    }

    await expect(page.getByText(/order placed/i)).toBeVisible({ timeout: 60_000 });

    await page.getByRole("button", { name: /track order/i }).click();
    await expect(page).toHaveURL(/profile|orders/i, { timeout: 15_000 });

    await expect(page.getByText(/E2E Ghee|₹|order/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
