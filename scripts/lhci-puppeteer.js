/**
 * Wait for SPA hydration + home hero before Lighthouse scores LCP.
 */
module.exports = async (page) => {
  await page.setViewport({ width: 1350, height: 940 });
  try {
    await page.waitForFunction(
      () => {
        const hero = document.querySelector('[nativeid="home-hero"], #home-hero, [data-nativeid="home-hero"]');
        const root = document.querySelector("#root");
        return Boolean(hero || (root && root.innerText && root.innerText.length > 80));
      },
      { timeout: 45000 }
    );
  } catch {
    await new Promise((r) => setTimeout(r, 3000));
  }
  await new Promise((r) => setTimeout(r, 1500));
};
