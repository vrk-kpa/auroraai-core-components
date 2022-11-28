import { NextPage } from "next"
import { getUserProps, Refetchable, withRefetchables } from "../api/apiSession"
import { User } from "../api/profileManagementApi"
import { DashboardLayout } from "../components/DashboardLayout"
import { Heading, suomifiDesignTokens } from "suomifi-ui-components"
import { css } from "styled-components"
import { breakpoints } from "../breakpoints"
import { NavigationLinkList } from "../components/NavigationLinkList"
import useTranslation from "next-translate/useTranslation"
import { Head } from "../components/Head"
import { UserContext, useUpdateUserContextWithProps } from "../contexts/user"
import { useContext } from "react"
import { useMemo } from "react"
import { useAsyncProps } from "../hooks/useAsyncProps"
import { ErrorAlert } from "../components/ErrorAlert"
import { MultilineParagraph } from "../components/MultilineParagraph"
import { PasswordExpiringAlert } from "../components/PasswordExpiringAlert"
import { getPasswordExpiresInDays, isExpiringSoon } from "../utils/password"
import { APIError } from "../utils/errors"

const profileGrid = css`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${suomifiDesignTokens.spacing.m};
  margin-top: ${suomifiDesignTokens.spacing.xl};

  @media (max-width: ${breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`

const profileGridHeading = css`
  font-weight: bold;
  margin-bottom: ${suomifiDesignTokens.spacing.xxs};
  font-size: inherit !important;
`

type ProfileProps = { user: User } | APIError

const Profile: NextPage<Refetchable<ProfileProps>> = (initialProps) => {
  const { t } = useTranslation("profile")

  const { user } = useContext(UserContext)

  const { props } = useAsyncProps(
    initialProps,
    getUserProps,
    useMemo(
      () => ({
        user,
      }),
      [user]
    )
  )

  useUpdateUserContextWithProps(props)

  const passwordExpiresInDays = user
    ? getPasswordExpiresInDays(user.passwordExpirationDate)
    : 360
  return (
    <DashboardLayout>
      <Head pageName={t("title")} />

      <Heading
        id="profile-heading"
        variant="h1"
        css={{ marginBottom: suomifiDesignTokens.spacing.m }}
      >
        {t("heading")}
      </Heading>

      <MultilineParagraph text={t("intro")} marginBottomSpacing="m" />
      {isExpiringSoon(passwordExpiresInDays) && (
        <PasswordExpiringAlert
          count={Number.parseInt(`${passwordExpiresInDays}`)}
        />
      )}

      {user ? (
        <div css={profileGrid}>
          <div>
            <Heading variant="h2" css={profileGridHeading}>
              {t("common:email")}
            </Heading>
            <div>{user.email}</div>
          </div>
          <div>
            <Heading variant="h2" css={profileGridHeading}>
              {t("changeDetails")}
            </Heading>
            <NavigationLinkList
              links={[
                {
                  link: "/settings/change-password",
                  name: t("changePassword"),
                  id: "link-change-password",
                },
                {
                  link: "/settings/change-email",
                  name: t("changeEmail"),
                  id: "link-change-email",
                },
                {
                  link: "/settings/delete-account",
                  name: t("deleteAccount"),
                  id: "link-delete-account",
                },
              ]}
            />
          </div>
        </div>
      ) : props && "error" in props ? (
        <ErrorAlert error={props} />
      ) : (
        t("common:loading")
      )}
    </DashboardLayout>
  )
}

Profile.getInitialProps = withRefetchables((ctx) => getUserProps({}, ctx))

export default Profile
