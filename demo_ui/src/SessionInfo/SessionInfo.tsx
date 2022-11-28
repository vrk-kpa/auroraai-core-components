import { Text } from 'suomifi-ui-components'
import { useRecoilState } from 'recoil'
import { sessionIDState } from '../state/global'
import { v4 as uuidv4 } from 'uuid'
import { useEffect } from 'react'

export const SessionInfo = () => {
  const [sessionID, setSessionID] = useRecoilState(sessionIDState)

  useEffect(() => {
    if (sessionID === '') {
      setSessionID(uuidv4())
    }
  })

  return (
    <>
      <Text smallScreen>Sessio ID: {sessionID}</Text>
    </>
  )
}
