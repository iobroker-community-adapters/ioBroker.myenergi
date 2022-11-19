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
  private deviceObjects: { [key: string]: any };
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

    this.deviceObjects = {};
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
        const id = device.sno;
        this.deviceObjects[id] = device;
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
      this.devices = await this.hub.getStatusAll().catch((error) => {
        this.log.error("Error getting device list: " + error);
        return;
      });
      this.log.debug(JSON.stringify(this.devices));

      for (const deviceObjects of this.devices) {
        const type = Object.keys(deviceObjects)[0];
        const deviceArray = deviceObjects[type];
        if (typeof deviceArray !== "object") {
          continue;
        }

        for (const device of deviceArray) {
          device.type = type;
          const id = device.sno;

          this.json2iob.parse(id, device);
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
          this.deviceObjects[deviceId]
            .getDeviceInfo()
            .then((sysInfo: any) => {
              this.log.debug(JSON.stringify(sysInfo));
              this.json2iob.parse(deviceId, sysInfo);
            })
            .catch((error) => {
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
            }, 2 * 1000);
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
  // Export the constructor in compact mode
  module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Myenergi(options);
} else {
  // otherwise start the instance directly
  (() => new Myenergi())();
}
