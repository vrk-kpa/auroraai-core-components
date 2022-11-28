import { UUID } from "io-ts-types/lib/UUID"

export const VALID_PTV_ID = "5bf04705-a099-48e6-9f52-dc60132b4ed3" as UUID
export const INVALID_PTV_ID = "e3e5fb42-b832-4686-a625-4615124455d1" as UUID

export const VALID_SERVICE_ID = "7618f65d-9039-46bf-b5ae-f12f8bd2262b" as UUID
export const CLIENT_SECRET = "top-secret"

export const REDIRECT_URI = "http://example.com"

export const ANOTHER_SERVICE_ID = "127F0908-8902-4588-8E6F-E687CB01A146" as UUID
export const ANOTHER_SERVICE_CLIENT_SECRET = "very-secret"
export const ANOTHER_PTV_ID = "2D0D15C1-7B57-429C-869C-3FF8DE8740F9" as UUID

export const VALID_ACCESS_TOKEN =
  "29eacef6ef3ab61e8f570d3285b900b6eb8df4a4610fb79a043ba14da400de24"
export const MISSING_ACCESS_TOKEN =
  "011c760389571a0ff75de81f511fa13878ee1c8a593a7f8c5fdfd83420553c95"
export const EXPIRED_ACCESS_TOKEN =
  "f08a13c3e2297966451cf6ced6f1f4cd1d2f80a75c7d47d7744453949d3d1a03"

export const INVALID_ACCESS_TOKEN = "foobar"

export const VALID_SESSION_ATTRIBUTES_ID =
  "66e57e2a-ebf1-4c87-b76d-daa10514da28"

export const TEST_USER_ID = "663AA182-DFC2-4DA2-BD10-348D49D5B09C"
export const AGE_STORED_USER_ID = "60b9acc4-a722-450d-9796-ce78eff92266"

export const TEST_SCOPES = ["openid", "foo", "bar"]

export const OAUTH_REFRESH_TOKEN_FOR_RENEWAL_TEST = Buffer.from(
  "a0".repeat(128),
  "hex"
)
export const OAUTH_ACCESS_TOKEN_FOR_RENEWAL_TEST = Buffer.from(
  "00".repeat(128),
  "hex"
)

export const VALID_OAUTH_REFRESH_TOKEN = Buffer.from("a1".repeat(128), "hex")
export const VALID_OAUTH_ACCESS_TOKEN = Buffer.from("01".repeat(128), "hex")

export const EXPIRED_OAUTH_REFRESH_TOKEN = Buffer.from("a2".repeat(128), "hex")
export const EXPIRED_OAUTH_ACCESS_TOKEN = Buffer.from("02".repeat(128), "hex")

export const MISSING_OAUTH_ACCESS_TOKEN = Buffer.from("03".repeat(128), "hex")

export const STORE_AGE_OAUTH_REFRESH_TOKEN = Buffer.from(
  "a4".repeat(128),
  "hex"
)
export const STORE_AGE_OAUTH_ACCESS_TOKEN = Buffer.from("04".repeat(128), "hex")

export const VALID_OAUTH_AUTHORIZATION_CODE = Buffer.from(
  "ff".repeat(128),
  "hex"
)

export const USERINFO_SUB_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const AGE_SERVICE_ID = "38f78ed4-4c93-40cf-904f-392bb87c0de8" as UUID
export const AGE_SERVICE_PTV_ID = "30fa99c5-a381-43e4-8619-1d5a86851369" as UUID
export const AGE_SERVICE_ORIGIN = "http://service-with-age"
export const AGE_SERVICE_SECRET = "age-service-secret"

export const INVALID_AGE_SERVICE_ID =
  "ecbb7631-eaad-4b6f-9f47-e8024721fdb1" as UUID
export const INVALID_AGE_SERVICE_PTV_ID =
  "234196f2-313b-4be6-b689-3a632b3ba198" as UUID
export const INVALID_AGE_SERVICE_ORIGIN = "http://service-with-invalid-age"
export const INVALID_AGE_SERVICE_SECRET = "invalid-age-service-secret"

export const MUNICIPALITY_SERVICE_ID =
  "5296bce3-4426-4d19-bd89-689a7b8e1db9" as UUID
export const MUNICIPALITY_SERVICE_PTV_ID =
  "4e0fecbb-fb0d-43e8-a992-39b1c85ef7b5" as UUID
export const MUNICIPALITY_SERVICE_ORIGIN = "http://service-with-municipality"
export const MUNICIPALITY_SERVICE_SECRET = "municipality-service-secret"

export const MULTI_ATTRIBUTE_SERVICE_ID =
  "5dced2be-c42d-4b82-9499-ff48e8abe8d0" as UUID
export const MULTI_ATTRIBUTE_SERVICE_PTV_ID =
  "d4d29e88-3ba8-4f5b-93a9-ead0478a2197" as UUID
export const MULTI_ATTRIBUTE_SERVICE_ORIGIN =
  "http://service-with-age-and-municipality"
export const MULTI_ATTRIBUTE_SERVICE_SECRET =
  "age-and-municipality-service-secret"

export const FAILING_SERVICE_ID = "bc956492-db00-41ec-a7e5-dc9e3a659463" as UUID
export const FAILING_SERVICE_PTV_ID =
  "b2d24fb9-5256-4cdd-bb2f-6a4ba74201aa" as UUID
export const FAILING_SERVICE_ORIGIN = "http://service-that-fails"
export const FAILING_SERVICE_SECRET = "failing-service-secret"

export const AGE_STORING_SERVICE_ID =
  "a9ffb5c3-b77d-4bd3-95d3-dff529176f9a" as UUID
export const USER_TEST_EMAIL = "user@email.com"
export const USER_NEW_TEST_EMAIL = "newuser@email.com"
export const EXPIRED_EMAIL_VERIFY_TOKEN =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InVXTFhOb1N6U2M3aUM2X2xmS2lIQ3c5OWYtRzZOdUFYTjhfZWFUM3lTenM9In0.eyJlbWFpbCI6InVzZXJAZW1haWwuY29tIiwibmV3RW1haWwiOiJuZXd1c2VyQGVtYWlsLmNvbSIsImlhdCI6MTY0MDAwMzEyMywiZXhwIjoxNjQwMDAzMTI0fQ.uvAC0-al5-Byj_WQfwFCVNLx4gWifSgTuxLrAXgCFvYiQHKlFjioyVR9j188khV_WcvZEVm-UivqIsAT1lpDYpdlOzINirbjU8IE0Ysd28AqHOLLe0HvZvE_aJqy5OkHtHTyAtgSD2B51vJ8o6CKOGblqBecD6VaxZuxr7YVagt78AEoc9Ejs-DXNspLtAwCapuSixCCvlvQngsK8d7LJT7stIXpE5Hb-H6oz6rlCjHGptb52-uc4X6hCqgDiobGo8JwPiUtYtQFjs6U5mA4EIsQ2bUhdAkYC0YGzrCFEU8mJ-SWkBCOa0h_SdUE61bo7AZPu6vcZnfocoYGT8bzMbI5243DOAlTOQAIGEsSzk7lp9mFkpEBkoGMnqC_xtPAyt6dKo46qmhzXOSKk8STPA6Fkqld5xUNF_R-AooeFH8Z8u957jzguC_SDhyEpBNpOCp7PO7uyHmdzwamO2zDYO3-cQTKjC4gyGaBwZ4fOfmc2N1djqqWKbYCZxqEKy-ooO4NCOl6V3UqsmkMcQs_Ys0fFkpmk0V1qpa_NInUtMmiwG_UHJ7t689WCaBgMYBurTeWfxkaBeorsrL7wHF-5KVOhF0egK2UgWsIYL9oUWKW1OF2WfJjPJdO_dH-mAlovkZVacReFVg-mfnHiilAGEW3nzbvySsvZS0sn0QnZcc"
