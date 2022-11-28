import { NextPage } from "next"
import { getUserProps } from "ui/api/apiSession"
import { User } from "ui/api/profileManagementApi"
import { redirect } from "../utils/redirect"

const Index: NextPage = () => {
  return <div />
}

Index.getInitialProps = async (context) => {
  const { user } = (await getUserProps({}, context)) as { user: User }
  // redirect user to profile page if logged in, otherwise route back to login
  redirect(user ? "/profile" : "/login", context)
  return {}
}

export default Index
