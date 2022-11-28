import type { AppProps } from "next/app"
import { UserContext } from "../contexts/user"
import { useState } from "react"
import { User } from "../api/profileManagementApi"

const App = ({ Component, pageProps }: AppProps): JSX.Element => {
  const [user, setUser] = useState<User>()

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Component {...pageProps} />
    </UserContext.Provider>
  )
}

export default App
