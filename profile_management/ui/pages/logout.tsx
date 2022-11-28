import {
  GetServerSideProps,
  GetServerSidePropsContext,
  NextPage,
  Redirect,
} from "next"
import { logout } from "../api/apiSession"
import { getLocalisedPath } from "../utils/redirect"

const Logout: NextPage = () => {
  return <div />
}

export const getServerSideProps: GetServerSideProps = async (
  context
): Promise<{ redirect: Redirect }> => {
  const { callbackUrl } = context.query

  const destination =
    callbackUrl && typeof callbackUrl === "string"
      ? callbackUrl
      : getLoginPath(context)

  logout(context)

  return {
    redirect: {
      destination,
      permanent: false,
    },
  }
}

const getLoginPath = (context: GetServerSidePropsContext) => {
  const returnPath = context.query["return"]
  const localisedLoginPath = getLocalisedPath("/login", context)

  const queryString =
    typeof returnPath === "string" && returnPath.trim() !== ""
      ? `?${new URLSearchParams({ return: returnPath }).toString()}`
      : ""

  return `${localisedLoginPath}${queryString}`
}

export default Logout
