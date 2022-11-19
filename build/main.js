"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var utils = __toESM(require("@iobroker/adapter-core"));
var import_json2iob = __toESM(require("./lib/json2iob"));
var import_myenergi_api = require("./lib/myenergi-api");
class Myenergi extends utils.Adapter {
  constructor(options = {}) {
    super({
      ...options,
      name: "myenergi"
    });
    this.updateInterval = null;
    this.reLoginTimeout = null;
    this.refreshTokenTimeout = null;
    this.session = {};
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("unload", this.onUnload.bind(this));
    this.devices = {};
    this.deviceObjects = {};
    this.json2iob = new import_json2iob.default(this);
  }
  async onReady() {
    this.setState("info.connection", false, true);
    if (this.config.interval < 0.5) {
      this.log.info("Set interval to minimum 0.5");
      this.config.interval = 0.5;
    }
    if (!this.config.username || !this.config.password) {
      this.log.error("Please set username and password in the instance settings");
      return;
    }
    this.updateInterval = null;
    this.reLoginTimeout = null;
    this.refreshTokenTimeout = null;
    this.session = {};
    this.subscribeStates("*");
    this.log.info("Login myenergi");
    this.hub = new import_myenergi_api.MyEnergi(this.config.username, this.config.password);
    await this.login();
    if (this.session.token) {
      await this.getDeviceList();
      await this.updateDevices();
      this.updateInterval = setInterval(async () => {
        await this.updateDevices();
      }, this.config.interval * 1e3);
    }
  }
  async getDeviceList() {
    await this.requestClient({}).then(async (res) => {
      var _a, _b;
      this.log.debug(JSON.stringify(res.data));
      if (res.data.error_code) {
        this.log.error(JSON.stringify(res.data));
        return;
      }
      this.log.info(`Found ${(_a = res.data.result) == null ? void 0 : _a.totalNum} devices`);
      for (const device of (_b = res.data.result) == null ? void 0 : _b.deviceList) {
        const id = device.deviceId;
        this.devices[id] = device;
        let name = device.alias;
        if (this.isBase64(device.alias)) {
          name = Buffer.from(device.alias, "base64").toString("utf8");
        }
        await this.setObjectNotExistsAsync(id, {
          type: "device",
          common: {
            name
          },
          native: {}
        });
        await this.setObjectNotExistsAsync(id + ".remote", {
          type: "channel",
          common: {
            name: "Remote Controls"
          },
          native: {}
        });
        const remoteArray = [
          { command: "refresh", name: "True = Refresh" },
          { command: "setPowerState", name: "True = On, False = Off" },
          { command: "setAlertConfig", name: "True = On, False = Off" },
          { command: "setLensMaskConfig", name: "True = On, False = Off" },
          {
            command: "setBrightness",
            name: "Set Brightness for Light devices",
            type: "number",
            role: "level.brightness",
            def: 5
          },
          {
            command: "setColorTemp",
            name: "Set Color Temp for Light devices",
            type: "number",
            role: "level.color.temperature",
            def: 3e3
          },
          {
            command: "setColor",
            name: "Set Color for Light devices (hue, saturation)",
            def: "30, 100",
            type: "string"
          }
        ];
        remoteArray.forEach((remote) => {
          this.setObjectNotExists(id + ".remote." + remote.command, {
            type: "state",
            common: {
              name: remote.name || "",
              type: remote.type || "boolean",
              role: remote.role || "boolean",
              def: remote.def || false,
              write: true,
              read: true
            },
            native: {}
          });
        });
        this.json2iob.parse(id, device);
      }
    });
  }
  async updateDevices() {
    try {
      for (const deviceId in this.deviceObjects) {
        if (!this.deviceObjects[deviceId]._connected) {
          continue;
        }
        this.deviceObjects[deviceId].getDeviceInfo().then(async (sysInfo) => {
          this.log.debug(JSON.stringify(sysInfo));
          if (!sysInfo || sysInfo.name === "Error" || sysInfo.request) {
            this.log.debug("Malformed response sysinfo");
            return;
          }
          await this.json2iob.parse(deviceId, sysInfo);
          if (this.deviceObjects[deviceId].getEnergyUsage) {
            this.log.debug("Receive energy usage");
            const energyUsage = await this.deviceObjects[deviceId].getEnergyUsage();
            this.log.debug(JSON.stringify(energyUsage));
            if (energyUsage.request) {
              this.log.error("Malformed response getEnergyUsage");
              this.log.error(JSON.stringify(energyUsage));
              return;
            }
            await this.json2iob.parse(deviceId, energyUsage);
            const power_usage = this.deviceObjects[deviceId].getPowerConsumption();
            if (power_usage.request) {
              this.log.error("Malformed response getPowerConsumption");
              this.log.error(JSON.stringify(power_usage));
              return;
            }
            await this.json2iob.parse(deviceId, power_usage);
          }
        }).catch((error) => {
          this.log.error(`Get Device Info failed for ${deviceId} - ${error}`);
        });
      }
    } catch (error) {
      this.log.error(error);
    }
  }
  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  async refreshToken() {
    this.log.debug("Refresh token");
  }
  onUnload(callback) {
    try {
      this.setState("info.connection", false, true);
      this.refreshTimeout && clearTimeout(this.refreshTimeout);
      this.reLoginTimeout && clearTimeout(this.reLoginTimeout);
      this.refreshTokenTimeout && clearTimeout(this.refreshTokenTimeout);
      this.updateInterval && clearInterval(this.updateInterval);
      this.refreshTokenInterval && clearInterval(this.refreshTokenInterval);
      callback();
    } catch (e) {
      callback();
    }
  }
  async onStateChange(id, state) {
    if (state) {
      if (!state.ack) {
        const deviceId = id.split(".")[2];
        const command = id.split(".")[4];
        if (id.split(".")[3] !== "remote") {
          return;
        }
        if (command === "Refresh") {
          this.deviceObjects[deviceId].getDeviceInfo().then((sysInfo) => {
            this.log.debug(JSON.stringify(sysInfo));
            this.json2iob.parse(deviceId, sysInfo);
          }).catch((error) => {
            this.log.error(`Get Device Info failed for ${deviceId} - ${error}`);
          });
          return;
        }
        try {
          if (this.deviceObjects[deviceId] && this.deviceObjects[deviceId][command]) {
            if (command === "setColor") {
              const valueSplit = state.val.split(", ");
              const result = await this.deviceObjects[deviceId][command](valueSplit[0], valueSplit[1]);
              this.log.info(JSON.stringify(result));
            } else {
              const result = await this.deviceObjects[deviceId][command](state.val);
              this.log.info(JSON.stringify(result));
            }
            this.refreshTimeout && clearTimeout(this.refreshTimeout);
            this.refreshTimeout = setTimeout(async () => {
              await this.updateDevices();
            }, 2 * 1e3);
          } else {
            this.log.error(`Device ${deviceId} has no command ${command}`);
          }
        } catch (error) {
          this.log.error(error);
        }
      } else {
        const resultDict = { device_on: "setPowerState" };
        const idArray = id.split(".");
        const stateName = idArray[idArray.length - 1];
        const deviceId = id.split(".")[2];
        if (resultDict[stateName]) {
          await this.setStateAsync(deviceId + ".remote." + resultDict[stateName], state.val, true);
        }
      }
    }
  }
}
if (require.main !== module) {
  module.exports = (options) => new Myenergi(options);
} else {
  (() => new Myenergi())();
}
//# sourceMappingURL=main.js.map
