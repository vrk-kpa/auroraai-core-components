import { createRequest, createResponse } from "node-mocks-http"
import { NextPageContext } from "next"
import { profileManagementAPI } from "../api/profileManagementApi"
import { AppTreeType } from "next/dist/shared/lib/utils"
import MockAdapter from "axios-mock-adapter"
import axios from "axios"
import { APIError } from "../utils/errors"
import { StatusCodes } from "http-status-codes"
import { ApiErrorBody } from "shared/schemas/types/Errors"

const getMockContext = (): NextPageContext => ({
  pathname: "",
  query: {},
  res: createResponse(),
  AppTree: {} as AppTreeType,
})

describe("profileManagementApi", () => {
  let mockAxios: MockAdapter

  beforeAll(() => {
    mockAxios = new MockAdapter(axios)
  })

  afterEach(() => {
    mockAxios.reset()
  })

  it("forwards cookies from api response to context response", async () => {
    const mockContext = getMockContext()
    const api = profileManagementAPI(true, mockContext)

    const mockResponse = { foo: "bar" }
    const mockHeaders = {
      "set-cookie": ["foo=bar", "bar=baz"],
    }
    mockAxios
      .onGet("http://test.url/v1/user/me")
      .reply(200, mockResponse, mockHeaders)

    const response = await api.getUser()
    expect(mockAxios.history.get[0].url).toEqual("http://test.url/v1/user/me")
    expect(response).toEqual(mockResponse)
    expect(mockContext.res?.getHeader("set-cookie")).toEqual([
      "foo=bar",
      "bar=baz",
    ])
  })

  it("forwards cookies from context request to api request", async () => {
    const mockContext = getMockContext()
    mockContext.req = createRequest({ headers: { cookie: "bar=baz;foo=bar" } })

    const api = profileManagementAPI(true, mockContext)

    const mockResponse = { message: "test" }
    mockAxios.onGet("http://test.url/v1/user/me").reply(200, mockResponse, {})

    const response = await api.getUser()
    expect(mockAxios.history.get[0].url).toEqual("http://test.url/v1/user/me")
    expect(mockAxios.history.get[0].headers?.cookie).toEqual("bar=baz;foo=bar")
    expect(response).toEqual(mockResponse)
  })

  it("initiates logout when api call returns UNAUTHORIZED error ", async () => {
    const mockContext = getMockContext()
    const api = profileManagementAPI(true, mockContext)

    mockAxios
      .onGet("http://test.url/v1/user/me")
      .reply(
        401,
        { error: "UnauthorizedError", message: "unauthorized" } as ApiErrorBody,
        {}
      )

    const response = await api.getUser()

    expect(mockAxios.history.get[0].url).toEqual("http://test.url/v1/user/me")
    expect((response as APIError)?.httpStatus).toEqual(401)

    expect(mockContext.res?.statusCode).toEqual(StatusCodes.TEMPORARY_REDIRECT)
    expect(mockContext.res?.getHeader("location")).toEqual("/logout?return=")
  })

  it("returns APIError object if api responds with error status other than UNAUTHORIZED", async () => {
    const mockContext = getMockContext()
    const api = profileManagementAPI(true, mockContext)

    mockAxios
      .onGet("http://test.url/v1/user/me")
      .reply(
        404,
        { error: "NotFoundError", message: "nothing here" } as ApiErrorBody,
        {}
      )

    const response = await api.getUser()

    expect(mockAxios.history.get[0].url).toEqual("http://test.url/v1/user/me")
    expect(response).toEqual({
      error: "NotFoundError",
      httpStatus: 404,
      message: "nothing here",
    })

    // Error response from API should not affect context response at this point.
    expect(mockContext.res?.getHeader("set-cookie")).toBeUndefined()
    expect(mockContext.res?.statusCode).toEqual(StatusCodes.OK)
    expect(mockContext.res?.getHeader("location")).toBeUndefined()
  })

  it("can be forced to initiate logout on all error responses", async () => {
    const mockContext = getMockContext()
    const api = profileManagementAPI(true, mockContext, true)

    mockAxios
      .onGet("http://test.url/v1/user/me")
      .reply(
        404,
        { error: "NotFoundError", message: "nothing here" } as ApiErrorBody,
        {}
      )

    const response = await api.getUser()

    expect(mockAxios.history.get[0].url).toEqual("http://test.url/v1/user/me")
    expect((response as APIError)?.httpStatus).toEqual(404)

    expect(mockContext.res?.statusCode).toEqual(StatusCodes.TEMPORARY_REDIRECT)
    expect(mockContext.res?.getHeader("location")).toEqual("/logout?return=")
  })
})

export {}
