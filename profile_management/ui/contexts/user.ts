import { createContext, useContext, useEffect } from "react"
import { User } from "../api/profileManagementApi"

export const UserContext = createContext<{
  user?: User
  setUser: (user?: User) => void
}>({
  setUser: () => {
    // stub
  },
})

/**
 * Helper hook for updating the user in theuser context
 * with props that may contain the current user.
 */
export function useUpdateUserContextWithProps(props: unknown): void {
  const { user, setUser } = useContext(UserContext)

  useEffect(() => {
    if (typeof props === "object" && props && "user" in props) {
      const propsWithUser = props as { user: User }

      if (
        !user ||
        JSON.stringify(user) !== JSON.stringify(propsWithUser.user)
      ) {
        setUser(propsWithUser.user)
      }
    }
  }, [props, setUser, user])
}
