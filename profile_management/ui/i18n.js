module.exports = {
  locales: ["fi", "sv"],
  defaultLocale: "fi",
  pages: {
    "*": ["common", "validation", "error", "infoMessages"],
    "/login": ["login"],
    "/register": ["register"],
    "/register/confirmation-sent": ["registerConfirmationSent"],
    "/register/confirm/[code]": ["registerConfirmation"],
    "/register/success": ["registerSuccess"],
    "/forgot": ["forgot"],
    "/forgot/sent": ["forgotSent"],
    "/forgot/reset/[code]": ["forgotReset"],
    "/forgot/success": ["forgotSuccess"],
    "/profile": ["profile"],
    "/connected-services": ["connectedServices", "attributes"],
    "/connected-services/deactivate/[serviceId]": [
      "connectedServices",
      "connectedServicesDeactivation",
      "attributes",
    ],
    "/settings/change-password": ["settingsChangePassword"],
    "/settings/change-password/completed": ["settingsChangePasswordCompleted"],
    "/settings/change-email": ["settingsChangeEmail"],
    "/settings/change-email/sent": ["settingsChangeEmailSent"],
    "/settings/change-email/verify/[verificationToken]": [
      "settingsChangeEmailVerify",
    ],
    "/settings/change-email/success": ["settingsChangeEmailSuccess"],
    "/settings/delete-account": ["settingsDeleteAccount"],
    "/authorize": ["authorize", "attributes"],
    "/read-more": ["about"],
    "/navigation": ["navigation"],
  },
  loadLocaleFrom: (lang, ns) => {
    return import(
      `${__dirname}/../../locale/${lang}/profileManagementUI.json`
    ).then((m) => m.default[ns])
  },
}
