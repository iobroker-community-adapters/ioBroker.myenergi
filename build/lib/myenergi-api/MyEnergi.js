"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var MyEnergi_exports = {};
__export(MyEnergi_exports, {
  MyEnergi: () => MyEnergi
});
module.exports = __toCommonJS(MyEnergi_exports);
var import_Digest = require("./Digest");
var import_Types = require("./models/Types");
class MyEnergi {
  constructor(username, password, apiBaseUrl) {
    this._config = {
      username: "",
      password: "",
      base_url: "https://s18.myenergi.net",
      eddi_url: "/cgi-jstatus-E",
      zappi_url: "/cgi-jstatus-Z",
      harvi_url: "/cgi-jstatus-H",
      status_url: "/cgi-jstatus-*",
      dayhour_url: "/cgi-jdayhour-",
      zappi_day_url: "/cgi-jdayhour-Z",
      eddi_day_url: "/cgi-jdayhour-E",
      zappi_mode_url: "/cgi-zappi-mode-Z",
      zappi_min_green_url: "/cgi-set-min-green-Z",
      eddi_mode_url: "/cgi-eddi-mode-E",
      eddi_boost_url: "/cgi-eddi-boost-E",
      get_app_key_url: "/cgi-get-app-key",
      set_app_key_url: "/cgi-set-app-key"
    };
    this._config.username = username;
    this._config.password = password;
    if (apiBaseUrl)
      this._config.base_url = apiBaseUrl;
    this._digest = new import_Digest.Digest(this._config.base_url, this._config.username, this._config.password);
  }
  async getStatusAll() {
    try {
      const data = await this._digest.get(new URL(this._config.status_url, this._config.base_url));
      const jsonData = JSON.parse(data);
      return jsonData;
    } catch (error) {
      return [];
    }
  }
  async getZappiDay(serialNumber, date) {
    try {
      const data = await this._digest.get(
        new URL(`${this._config.zappi_day_url}${serialNumber}-${date}`, this._config.base_url)
      );
      const jsonData = JSON.parse(data);
      return jsonData;
    } catch (error) {
      return [];
    }
  }
  async getEddiDay(serialNumber, date) {
    try {
      const data = await this._digest.get(
        new URL(`${this._config.eddi_day_url}${serialNumber}-${date}`, this._config.base_url)
      );
      const jsonData = JSON.parse(data);
      return jsonData;
    } catch (error) {
      return [];
    }
  }
  async getStatusZappiAll() {
    try {
      const data = await this._digest.get(new URL(this._config.zappi_url, this._config.base_url));
      const jsonData = JSON.parse(data);
      if (jsonData.zappi)
        return Object.assign([], jsonData.zappi);
      else
        return [];
    } catch (error) {
      return [];
    }
  }
  async getStatusZappi(serialNumber) {
    try {
      const data = await this._digest.get(new URL(this._config.zappi_url, this._config.base_url));
      const jsonData = JSON.parse(data);
      if (jsonData.zappi) {
        const zappi = Object.assign([], jsonData.zappi).find((zappi2) => {
          return zappi2.sno == serialNumber;
        });
        if (zappi)
          return Object.assign({}, zappi);
        else
          return null;
      } else
        return null;
    } catch (error) {
      return null;
    }
  }
  async setZappiChargeMode(serialNo, chargeMode) {
    try {
      const url = new URL(`${this._config.zappi_mode_url}${serialNo}-${chargeMode}-0-0-0000`, this._config.base_url);
      const data = await this._digest.get(url);
      const jsonData = JSON.parse(data);
      return jsonData;
    } catch (error) {
      return {};
    }
  }
  async setZappiBoostMode(serialNo, boostMode, kwh = 0, completeTime = "0000") {
    try {
      if (boostMode === import_Types.ZappiBoostMode.Stop) {
        kwh = 0;
        completeTime = "0000";
      }
      const url = new URL(
        `${this._config.zappi_mode_url}${serialNo}-0-${boostMode}-${kwh}-${completeTime}`,
        this._config.base_url
      );
      const data = await this._digest.get(url);
      const jsonData = JSON.parse(data);
      return jsonData;
    } catch (error) {
      return {};
    }
  }
  async setZappiGreenLevel(serialNo, percentage) {
    try {
      const url = new URL(`${this._config.zappi_min_green_url}${serialNo}-${percentage}`, this._config.base_url);
      const data = await this._digest.get(url);
      const jsonData = JSON.parse(data);
      return jsonData;
    } catch (error) {
      return {};
    }
  }
  async getStatusEddiAll() {
    try {
      const data = await this._digest.get(new URL(this._config.eddi_url, this._config.base_url));
      const jsonData = JSON.parse(data);
      if (jsonData.eddi)
        return Object.assign([], jsonData.eddi);
      else
        return [];
    } catch (error) {
      return [];
    }
  }
  async getStatusEddi(serialNumber) {
    try {
      const data = await this._digest.get(new URL(this._config.eddi_url, this._config.base_url));
      const jsonData = JSON.parse(data);
      if (jsonData.eddi) {
        const eddi = Object.assign([], jsonData.eddi).find((eddi2) => {
          return eddi2.sno == serialNumber;
        });
        if (eddi)
          return Object.assign({}, eddi);
        else
          return null;
      } else
        return null;
    } catch (error) {
      return null;
    }
  }
  async setEddiMode(serialNo, mode) {
    try {
      const url = new URL(`${this._config.eddi_mode_url}${serialNo}-${mode}`, this._config.base_url);
      const data = await this._digest.get(url);
      const jsonData = JSON.parse(data);
      return jsonData;
    } catch (error) {
      return {};
    }
  }
  async setEddiBoost(serialNo, boost, minutes = 0) {
    try {
      const url = new URL(`${this._config.eddi_boost_url}${serialNo}-${boost}-${minutes}`, this._config.base_url);
      const data = await this._digest.get(url);
      const jsonData = JSON.parse(data);
      return jsonData;
    } catch (error) {
      return {};
    }
  }
  async getStatusHarviAll() {
    try {
      const data = await this._digest.get(new URL(this._config.harvi_url, this._config.base_url));
      const jsonData = JSON.parse(data);
      if (jsonData.harvi)
        return Object.assign([], jsonData.harvi);
      else
        return [];
    } catch (error) {
      return [];
    }
  }
  async getStatusHarvi(serialNumber) {
    try {
      const data = await this._digest.get(new URL(this._config.harvi_url, this._config.base_url));
      const jsonData = JSON.parse(data);
      if (jsonData.harvi) {
        const harvi = Object.assign([], jsonData.harvi).find((harvi2) => {
          return harvi2.sno == serialNumber;
        });
        if (harvi)
          return Object.assign({}, harvi);
        else
          return null;
      } else
        return null;
    } catch (error) {
      return null;
    }
  }
  async getAppKeyFull(key) {
    try {
      const data = await this._digest.get(new URL(`${this._config.get_app_key_url}-${key}`, this._config.base_url));
      const jsonData = JSON.parse(data);
      if (jsonData) {
        const result = Object.assign({}, jsonData);
        return result;
      }
    } catch (error) {
      return null;
    }
    return null;
  }
  async getAppKey(key) {
    try {
      const data = await this._digest.get(new URL(`${this._config.get_app_key_url}-${key}`, this._config.base_url));
      const jsonData = JSON.parse(data);
      if (jsonData) {
        const result = Object.assign({}, jsonData);
        if (result[Object.keys(result)[0]])
          return result[Object.keys(result)[0]];
      }
    } catch (error) {
      return null;
    }
    return null;
  }
  async setAppKey(key, val) {
    try {
      const data = await this._digest.get(
        new URL(`${this._config.set_app_key_url}-${key}=${val}`, this._config.base_url)
      );
      const jsonData = JSON.parse(data);
      if (jsonData) {
        const result = Object.assign({}, jsonData);
        if (result[Object.keys(result)[0]])
          return result[Object.keys(result)[0]];
      }
    } catch (error) {
      return null;
    }
    return null;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MyEnergi
});
//# sourceMappingURL=MyEnergi.js.map
