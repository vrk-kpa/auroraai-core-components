import { Heading } from 'suomifi-ui-components'
import { FC } from 'react'
import { Helmet } from 'react-helmet-async'
import { useRecoilState } from 'recoil'
import { localeState } from '../state/global'

type Props = {
  title: string
}

export const Page: FC<Props> = ({ title, children }) => {
  const [locale] = useRecoilState(localeState)
  return (
    <>
      <Helmet htmlAttributes={{ lang: locale }}>
        <title>{title}</title>
      </Helmet>
      <Heading variant='h1'>{title}</Heading>
      {children}
    </>
  )
}
