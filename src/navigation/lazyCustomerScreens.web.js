/**
 * Web uses eager customer screen imports — Metro reserves `/assets/*` for its bundler
 * and React.lazy split chunks are fragile across dev/prod without extra runtime setup.
 * Admin/delivery remain lazy via lazyOpsScreens.web.js.
 */
// Explicit `.js` avoids Metro resolving `./lazyCustomerScreens` back to this `.web.js` file.
export * from "./lazyCustomerScreens.js";
