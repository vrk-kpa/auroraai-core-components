const mockConfig = {
  profile_management_secure_cookies: "true",
  profile_management_api_url: "http://test.url",
}

const getConfig: unknown = () => ({
  serverRuntimeConfig: {
    config: mockConfig,
  },
  publicRuntimeConfig: {
    config: mockConfig,
  },
})

export default getConfig
