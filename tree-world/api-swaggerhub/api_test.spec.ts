/**
 * home-iot-api
 * The API for the EatBacon IOT project
 *
 * OpenAPI spec version: 1.0.0
 * 
 *
 * NOTE: This file is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the file manually.
 */

import * as api from "./api"
import { Configuration } from "./configuration"

const config: Configuration = {}

describe("DeviceApi", () => {
  let instance: api.DeviceApi
  beforeEach(function() {
    instance = new api.DeviceApi(config)
  });

  test("getDevices", () => {
    const skip: number = 56
    const limit: number = 56
    return expect(instance.getDevices(skip, limit, {})).resolves.toBe(null)
  })
  test("register", () => {
    const body: api.DeviceRegistrationInfo = undefined
    return expect(instance.register(body, {})).resolves.toBe(null)
  })
})

describe("EnvironmentApi", () => {
  let instance: api.EnvironmentApi
  beforeEach(function() {
    instance = new api.EnvironmentApi(config)
  });

  test("getForecast", () => {
    const days: number = 56
    return expect(instance.getForecast(days, {})).resolves.toBe(null)
  })
  test("getHeaterState", () => {
    const zoneId: string = "zoneId_example"
    return expect(instance.getHeaterState(zoneId, {})).resolves.toBe(null)
  })
  test("getZoneTemperature", () => {
    const zoneId: string = "zoneId_example"
    return expect(instance.getZoneTemperature(zoneId, {})).resolves.toBe(null)
  })
  test("setHeaterState", () => {
    const zoneId: string = "zoneId_example"
    const state: string = "state_example"
    return expect(instance.setHeaterState(zoneId, state, {})).resolves.toBe(null)
  })
  test("temperatureSummary", () => {
    return expect(instance.temperatureSummary({})).resolves.toBe(null)
  })
})

describe("ZWaveApi", () => {
  let instance: api.ZWaveApi
  beforeEach(function() {
    instance = new api.ZWaveApi(config)
  });

  test("getLightingSummary", () => {
    return expect(instance.getLightingSummary({})).resolves.toBe(null)
  })
  test("getSwitchState", () => {
    const deviceId: string = "deviceId_example"
    return expect(instance.getSwitchState(deviceId, {})).resolves.toBe(null)
  })
  test("setDimmer", () => {
    const deviceId: string = "deviceId_example"
    const value: number = 56
    return expect(instance.setDimmer(deviceId, value, {})).resolves.toBe(null)
  })
  test("setDimmerTimer", () => {
    const deviceId: string = "deviceId_example"
    const value: number = 56
    const timeunit: number = 56
    const units: string = "units_example"
    return expect(instance.setDimmerTimer(deviceId, value, timeunit, units, {})).resolves.toBe(null)
  })
  test("setSwitch", () => {
    const deviceId: string = "deviceId_example"
    const value: string = "value_example"
    return expect(instance.setSwitch(deviceId, value, {})).resolves.toBe(null)
  })
  test("setSwitchTimer", () => {
    const deviceId: string = "deviceId_example"
    const value: string = "value_example"
    const minutes: number = 56
    return expect(instance.setSwitchTimer(deviceId, value, minutes, {})).resolves.toBe(null)
  })
})

describe("ZonesApi", () => {
  let instance: api.ZonesApi
  beforeEach(function() {
    instance = new api.ZonesApi(config)
  });

  test("getZones", () => {
    return expect(instance.getZones({})).resolves.toBe(null)
  })
  test("quietZone", () => {
    const zoneId: string = "zoneId_example"
    return expect(instance.quietZone(zoneId, {})).resolves.toBe(null)
  })
})

