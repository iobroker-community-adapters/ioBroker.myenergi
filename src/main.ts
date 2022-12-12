/*
 * Created with @iobroker/create-adapter v2.3.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from "@iobroker/adapter-core";
import Json2iob from "./lib/json2iob";
import { MyEnergi } from "./lib/myenergi-api";

class Myenergi extends utils.Adapter {
  private devices: [];
  private json2iob: Json2iob;
  private hub: MyEnergi;
  updateInterval: any = null;
  reLoginTimeout: any = null;
  refreshTokenTimeout: any = null;
  session: any = {};
  refreshTimeout: any;
  refreshTokenInterval: any;
  termId: any;
  public constructor(options: Partial<utils.AdapterOptions> = {}) {
    super({
      ...options,
      name: "myenergi",
    });
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("unload", this.onUnload.bind(this));
    this.devices = {};

    this.json2iob = new Json2iob(this);
  }

  /**
   * Is called when databases are connected and adapter received configuration.
   */
  private async onReady(): Promise<void> {
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

    await this.getDeviceList();
    await this.updateDevices();
    this.updateInterval = setInterval(async () => {
      await this.updateDevices();
    }, this.config.interval * 1000);
  }

  async getDeviceList(): Promise<void> {
    this.hub = new MyEnergi(this.config.username, this.config.password);
    this.devices = await this.hub.getStatusAll().catch((error) => {
      this.log.error("Error getting device list: " + error);
      return;
    });

    this.setState("info.connection", true, true);
    this.log.debug(JSON.stringify(this.devices));

    for (const deviceObjects of this.devices) {
      const type = Object.keys(deviceObjects)[0];
      const deviceArray = deviceObjects[type];
      if (typeof deviceArray !== "object") {
        this.log.info(`skipping ${type}`);
        continue;
      }
      this.log.info(`Found device: ${type} - ${deviceArray.length}`);

      for (const device of deviceArray) {
        device.type = type;
        const id = device.sno.toString();
        let name = type + " " + id;

        await this.setObjectNotExistsAsync(id, {
          type: "device",
          common: {
            name: name,
          },
          native: {},
        });
        await this.setObjectNotExistsAsync(id + ".remote", {
          type: "channel",
          common: {
            name: "Remote Controls",
          },
          native: {},
        });

        const remoteArray = [{ command: "refresh", name: "True = Refresh" }];
        if (type === "zappi") {
          remoteArray.push({
            command: "setZappiChargeMode",
            name: "Set the current charge mode",
            type: "number",
            role: "value",
            def: 4,
            states: {
              1: "Fast",
              2: "Eco",
              3: "EcoPlus",
              4: "Off",
            },
          });
          remoteArray.push({
            command: "setZappiGreenLevel",
            name: "Set minimum green level to decide how much grid power zappi uses to keep the 1.4kW minimum charge rate going.",
            type: "number",
            role: "value",
            def: 75,
          });
          remoteArray.push({
            command: "setZappiBoostMode",
            name: 'Boost battery [Mode, kwh, completeTime] Mode Manual 10, Mode Smart 11, Mode off 2 [10,22,"0615"]',
            type: "string",
            role: "value",
            def: '[10,22,"0615"]',
          });
        }
        if (type === "eddi") {
          remoteArray.push({
            command: "setEddiMode",
            name: "Set the current charge mode",
            type: "number",
            role: "value",
            def: 0,
            states: {
              1: "On",
              0: "Off",
            },
          });
          remoteArray.push({
            command: "boostMinutes",
            name: "Set the minutes for setEddiBoost",
            type: "number",
            role: "value",
            def: 0,
          });
          remoteArray.push({
            command: "setEddiBoost",
            name: "Boost",
            type: "string",
            role: "value",
            states: {
              "1-1": "CancelHeater1",
              "1-11": "CancelRelay1",
              "1-12": "CancelRelay2",
              "10-1": "ManualHeater1",
              "10-11": "ManualRelay1",
              "10-12": "ManualRelay2",
            },
          });
        }
        remoteArray.forEach((remote) => {
          this.setObjectNotExists(id + ".remote." + remote.command, {
            type: "state",
            common: {
              name: remote.name || "",
              type: remote.type || "boolean",
              role: remote.role || "boolean",
              def: remote.def || false,
              states: remote.states || undefined,
              write: true,
              read: true,
            },
            native: {},
          });
        });
        this.json2iob.parse(id, device);
      }
    }
  }

  async updateDevices(): Promise<void> {
    try {
      const devices = await this.hub.getStatusAll().catch((error) => {
        this.log.error("Error getting device list: " + error);
        return;
      });
      if (!Array.isArray(devices)) {
        return;
      }
      this.log.debug(JSON.stringify(devices));

      for (const deviceObjects of devices) {
        const type = Object.keys(deviceObjects)[0];
        const deviceArray = deviceObjects[type];
        if (typeof deviceArray !== "object") {
          continue;
        }

        for (const device of deviceArray) {
          device.type = type;
          const id = device.sno.toString();
          if (device.ectp1 != null && device.ectp2 != null && device.ectp3 != null) {
            device.ectpSum = device.ectp1 + device.ectp2 + device.ectp3;
          }
          this.json2iob.parse(id, device);
          const currentDate = new Date().toISOString().split("T")[0];
          let day = {};
          let minutes = {};
          if (type === "zappi") {
            day = await this.hub.getGeneric(`/cgi-jdayhour-Z${id}-${currentDate}`).catch((error) => {
              this.log.error("Error getting zappi day: " + error);
              return;
            });
            if (this.config.minuteHistory) {
              minutes = await this.hub.getGeneric(`/cgi-jday-Z${id}-${currentDate}`).catch((error) => {
                this.log.error("Error getting zappi minutes: " + error);
                return;
              });
            }
          }
          if (type === "eddi") {
            day = await this.hub.getGeneric(`/cgi-jdayhour-E${id}-${currentDate}`).catch((error) => {
              this.log.error("Error getting eddi day: " + error);
              return;
            });

            if (this.config.minuteHistory) {
              minutes = await this.hub.getGeneric(`/cgi-jday-E${id}-${currentDate}`).catch((error) => {
                this.log.error("Error getting eddi minutes: " + error);
                return;
              });
            }
          }
          day["U" + id] && this.json2iob.parse(id + ".history", day["U" + id]);
          await this.setObjectNotExistsAsync(id + ".history.hourJson", {
            type: "state",
            common: {
              name: "Raw JSON History hours",
              write: false,
              read: true,
              type: "string",
              role: "json",
            },
            native: {},
          });
          day["U" + id] && this.setState(id + ".history.hourJson", JSON.stringify(day["U" + id]), true);
          if (this.config.minuteHistory) {
            await this.setObjectNotExistsAsync(id + ".history.minutesJson", {
              type: "state",
              common: {
                name: "Raw JSON Minutes",
                write: false,
                read: true,
                type: "string",
                role: "json",
              },
              native: {},
            });
            minutes["U" + id] && this.setState(id + ".history.minutesJson", JSON.stringify(minutes["U" + id]), true);
          }
        }
      }
    } catch (error) {
      this.log.error(error);
    }
  }

  async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  async refreshToken(): Promise<void> {
    this.log.debug("Refresh token");
  }
  /**
   * Is called when adapter shuts down - callback has to be called under any circumstances!
   */
  private onUnload(callback: () => void): void {
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

  /**
   * Is called if a subscribed state changes
   */
  private async onStateChange(id: string, state: ioBroker.State | null | undefined): Promise<void> {
    if (state) {
      if (!state.ack) {
        const deviceId = id.split(".")[2];
        const command = id.split(".")[4];
        if (id.split(".")[3] !== "remote") {
          return;
        }

        if (command === "Refresh") {
          this.updateDevices();
          return;
        }
        try {
          if (command === "setZappiBoostMode") {
            const valueArray = JSON.parse(state.val);
            const result = await this.hub.setZappiBoostMode(deviceId, valueArray[0], valueArray[1], valueArray[2]);
            this.log.info(JSON.stringify(result));
          } else {
            const result = await this.hub[command](deviceId, state.val);
            this.log.info(JSON.stringify(result));
          }
          this.refreshTimeout && clearTimeout(this.refreshTimeout);
          this.refreshTimeout = setTimeout(async () => {
            await this.updateDevices();
          }, 25 * 1000);
        } catch (error) {
          this.log.error(error);
          this.log.error(error.stack);
        }
      } else {
        const resultDict = { zmo: "setZappiChargeMode", mgl: "setZappiGreenLevel" };
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
  // Export the constructor in compact mode
  module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Myenergi(options);
} else {
  // otherwise start the instance directly
  (() => new Myenergi())();
}
