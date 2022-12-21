import express, { Express, NextFunction, Request, Response } from 'express'
import axios, { AxiosRequestConfig } from 'axios'
import helmet from 'helmet'

import { constructAuthorizationHeader } from './utils/auth'
import { config, environment } from './utils/config'
import { errorHandler } from './utils/error'

const port = config.ui_server_port || 3000
const API_BASE_URL = '/ui/api'

const app: Express = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(helmet.hidePoweredBy())
app.use(helmet.hsts())
app.use(helmet.noSniff())
app.use(
  helmet.frameguard({
    action: 'deny',
  }),
)

app.get('/ui/config', (req: Request, res: Response) => {
  res.send({ featureFlags: config.feature_flags, environment: environment })
})

app.get('/ui/healthcheck', (req: Request, res: Response) => {
  res.send('OK')
})

app.all(`${API_BASE_URL}/service-recommender/v1(/*)?`, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // "proxy" all requests to recommender API
    const path = req.path.replace(API_BASE_URL, '')
    const url = `${config.ui_proxy_scheme}://${config.ui_proxy_host}${path}`
    const reqConfig: AxiosRequestConfig = {
      method: req.method,
      url,
      data: req.body,
      headers: {
        Authorization: await constructAuthorizationHeader(),
      },
      validateStatus: () => true,
    }
    const response = await axios(reqConfig)
    res.status(response?.status || 500).json(response?.data)
  } catch (err) {
    next(err)
  }
})

app.use('/ui', express.static('../build'))

app.use(errorHandler)

const server = app.listen(port, () => console.log(`[Demo UI server]: Running on port ${port}`))
server.keepAliveTimeout = 95 * 1000 // 95 seconds. This must be bigger than the ALB idle_timeout
