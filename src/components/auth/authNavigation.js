/** Build Login route params (returnUrl, session banner, email prefill). */
export function buildLoginParams({ returnTo, sessionExpired, email } = {}) {
  const params = {};
  if (returnTo?.name) params.returnTo = returnTo;
  if (sessionExpired) params.sessionExpired = true;
  if (email) params.email = email;
  return Object.keys(params).length ? params : undefined;
}

/** Navigate to Login — pass `returnTo: { name, params }` to resume after sign-in. */
export function navigateToLogin(navigation, options = {}) {
  const params = buildLoginParams(options);
  navigation.navigate("Login", params);
}

/** Post-auth navigation — honors `returnTo` param, else goBack, else Home. */
export function navigateAfterAuth(navigation, route) {
  const returnTo = route?.params?.returnTo;
  if (returnTo?.name) {
    navigation.replace(returnTo.name, returnTo.params ?? {});
    return;
  }
  const state = navigation.getState?.();
  if (state && typeof state.index === "number" && state.index > 0) {
    navigation.goBack();
    return;
  }
  navigation.navigate("Home");
}
