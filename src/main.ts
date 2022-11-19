/*
 * Created with @iobroker/create-adapter v2.3.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from "@iobroker/adapter-core";
import Json2iob from "./lib/json2iob";
import { MyEnergi } from "./lib/myenergi-api";

class Myenergi extends utils.Adapter {
  private devices: { [key: string]: any };
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

    this.log.info("Login myenergi");
    this.hub = new MyEnergi(this.config.username, this.config.password);
    await this.login();
    if (this.session.token) {
      await this.getDeviceList();

      await this.updateDevices();
      this.updateInterval = setInterval(async () => {
        await this.updateDevices();
      }, this.config.interval * 1000);
    }
  }

  async getDeviceList(): Promise<void> {
    await this.requestClient({}).then(async (res) => {
      this.log.debug(JSON.stringify(res.data));
      if (res.data.error_code) {
        this.log.error(JSON.stringify(res.data));
        return;
      }
      this.log.info(`Found ${res.data.result?.totalNum} devices`);

      for (const device of res.data.result?.deviceList) {
        const id = device.deviceId;
        this.devices[id] = device;
        let name = device.alias;
        if (this.isBase64(device.alias)) {
          name = Buffer.from(device.alias, "base64").toString("utf8");
        }

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
            def: 5,
          },
          {
            command: "setColorTemp",
            name: "Set Color Temp for Light devices",
            type: "number",
            role: "level.color.temperature",
            def: 3000,
          },
          {
            command: "setColor",
            name: "Set Color for Light devices (hue, saturation)",
            def: "30, 100",
            type: "string",
          },
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
              read: true,
            },
            native: {},
          });
        });
        this.json2iob.parse(id, device);
      }
    });
  }

  async updateDevices(): Promise<void> {
    try {
      for (const deviceId in this.deviceObjects) {
        if (!this.deviceObjects[deviceId]._connected) {
          continue;
        }
        this.deviceObjects[deviceId]
          .getDeviceInfo()
          .then(async (sysInfo: any) => {
            this.log.debug(JSON.stringify(sysInfo));
            if (!sysInfo || sysInfo.name === "Error" || sysInfo.request) {
              this.log.debug("Malformed response sysinfo");
              // this.log.error(JSON.stringify(sysInfo));
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
          })
          .catch((error) => {
            this.log.error(`Get Device Info failed for ${deviceId} - ${error}`);
          });
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
