import supertest from "supertest"
import { app } from "../../src/app"
import { attributeController } from "../../src/controllers/attribute/attribute"
import { announcementController } from "../../src/controllers/announcement/announcementService"
import { UUID } from "io-ts-types"
import { AUTHORIZATION_HEADERS } from "../helpers"

const request = supertest(app)

const testAnnouncementRecord = {
  announcementTitle: {
    fi: "Huoltokatko AuroraAI:ssa",
    en: "Maintenance break in AuroraAI",
    sv: "Underhållspaus i AuroraAI",
  },
  announcementDescription: {
    fi: "Huoltokatko AuroraAI:ssa 15.08.2022 kello 08:00 - 10:00. Kirjautuminen ei ole mahdollista huoltokatkon aikana.",
    en: "Maintenance work is being performed in AuroraAI services on 15th Aug 2022 between 08:00 and 10:00. Logging in is not possible during the break",
    sv: "Underhållsarbeten utförs i AuroraAI-tjänster den 15 augusti 2022 mellan 08:00 och 10:00. Det går inte att logga in under pausen",
  },
  announcementStart: "2022-08-15T08:00:00.693Z",
  announcementEnd: "2022-08-15T10:00:00.693Z",
}

describe("internal router tests", () => {
  it("should successfully execute retry attribute deletions endpoint", async () => {
    const controllerSpy = jest
      .spyOn(attributeController, "retryPendingAttributeDeletions")
      .mockImplementationOnce(() => Promise.resolve())
    const { status } = await request
      .post("/internal/cron/attribute-deletion-trigger")
      .send()
    expect(status).toBe(204)
    expect(controllerSpy).toBeCalledTimes(1)
    controllerSpy.mockClear()
  })

  it("should insert new announcement record", async () => {
    const addAnnouncementSpy = jest
      .spyOn(announcementController, "addAnnouncement")
      .mockImplementationOnce(() => Promise.resolve())
    const getAnnouncementSpy = jest
      .spyOn(announcementController, "getAnnouncementsBetweenDates")
      .mockImplementationOnce(() => Promise.resolve([]))

    const { status } = await request
      .post("/internal/announcement")
      .set(AUTHORIZATION_HEADERS)
      .send(testAnnouncementRecord)
    expect(status).toBe(200)
    expect(addAnnouncementSpy).toBeCalledTimes(1)
    expect(getAnnouncementSpy).toBeCalledTimes(1)
    addAnnouncementSpy.mockClear()
    getAnnouncementSpy.mockClear()
  })

  it("should get all announcement records", async () => {
    const getAnnouncementSpy = jest
      .spyOn(announcementController, "getAnnouncements")
      .mockImplementationOnce(() => Promise.resolve([]))
    const { status, body } = await request
      .get("/internal/announcement")
      .set(AUTHORIZATION_HEADERS)
      .send()
    expect(getAnnouncementSpy).toBeCalledTimes(1)
    expect(status).toBe(200)
    expect(body).toEqual([])
    getAnnouncementSpy.mockClear()
  })

  it("should get active announcement records", async () => {
    const getAnnouncementSpy = jest.spyOn(
      announcementController,
      "getAnnouncements"
    )
    const getActiveAnnouncementsSpy = jest
      .spyOn(announcementController, "getActiveAnnouncements")
      .mockImplementationOnce(() => Promise.resolve([]))
    const { status, body } = await request
      .get("/internal/announcement?active")
      .set(AUTHORIZATION_HEADERS)
      .send()
    expect(getAnnouncementSpy).toBeCalledTimes(0)
    expect(getActiveAnnouncementsSpy).toBeCalledTimes(1)
    expect(status).toBe(200)
    expect(body).toEqual([])
    getAnnouncementSpy.mockClear()
    getActiveAnnouncementsSpy.mockClear()
  })

  it("should delete announcement record", async () => {
    const getAnnouncementSpy = jest
      .spyOn(announcementController, "getAnnouncement")
      .mockImplementationOnce(() =>
        Promise.resolve({
          id: "abcd" as UUID,
          announcementTitle: { fi: "", sv: "", en: "" },
          announcementDescription: { fi: "", sv: "", en: "" },
          announcementStart: new Date(),
          announcementEnd: new Date(),
        })
      )
    const removeAnnouncementSpy = jest
      .spyOn(announcementController, "removeAnnouncement")
      .mockImplementationOnce(() => Promise.resolve())
    const { status, body } = await request
      .delete("/internal/announcement/1234")
      .set(AUTHORIZATION_HEADERS)
      .send()
    expect(removeAnnouncementSpy).toBeCalledTimes(1)
    expect(status).toBe(200)
    expect(body).toEqual({ success: true })
    getAnnouncementSpy.mockClear()
    removeAnnouncementSpy.mockClear()
  })

  it("should update announcement record", async () => {
    const testItem = {
      id: "abcd" as UUID,
      announcementTitle: { fi: "", sv: "", en: "" },
      announcementDescription: { fi: "", sv: "", en: "" },
      announcementStart: new Date(),
      announcementEnd: new Date(),
    }
    const getAnnouncementSpy = jest
      .spyOn(announcementController, "getAnnouncement")
      .mockImplementationOnce(() => Promise.resolve(testItem))
    const modifyAnnouncementSpy = jest
      .spyOn(announcementController, "modifyAnnouncement")
      .mockImplementationOnce(() => Promise.resolve())
    const { status, body } = await request
      .patch("/internal/announcement/1234")
      .set(AUTHORIZATION_HEADERS)
      .send(testItem)
    expect(modifyAnnouncementSpy).toBeCalledTimes(1)
    expect(status).toBe(200)
    expect(body).toEqual({ success: true })
    getAnnouncementSpy.mockClear()
    modifyAnnouncementSpy.mockClear()
  })
})
