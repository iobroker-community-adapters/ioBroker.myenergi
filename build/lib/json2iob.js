"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var json2iob_exports = {};
__export(json2iob_exports, {
  default: () => Json2iob
});
module.exports = __toCommonJS(json2iob_exports);
var import_json_bigint = __toESM(require("json-bigint"));
({ storeAsString: true });
class Json2iob {
  constructor(adapter) {
    this.description = {
      sno: "Harvi serial no",
      dat: "Date",
      tim: "Time",
      ectp1: " Physical CT connection 1 value Watts",
      ectp2: " Physical CT connection 2 value Watts",
      ectp3: " Physical CT connection 3 value Watts",
      ectp4: " Physical CT connection 4 value Watts",
      ectp5: " Physical CT connection 5 value Watts",
      ectp6: " Physical CT connection 6 value Watts",
      ectt1: "CT 1 Name",
      ectt2: "CT 2 Name",
      ectt3: "CT 3 Name",
      ect1p: " CT 1 Phase",
      ect2p: " CT 2 Phase",
      ect3p: " CT 3 Phase",
      fwv: "Firmware version",
      bsm: "Boost Mode Manual",
      che: "Latest charge session. Charge added in kWh",
      cmt: "Command Timer - counts 1 - 10 when command sent, then 254 - success, 253 - failure, 255 - never received any commands",
      div: "Diversion amount Watts",
      dst: "Daylight Savings Time enabled",
      frq: "Supply Frequency",
      gen: "Generated Watts",
      grd: "Current Watts from Grid (negative if sending to grid)",
      hno: "Currently active heater (1/2)",
      ht1: "Heater 1 name",
      ht2: "Heater 2 name",
      pha: "phase number or number of phases?",
      pri: "priority",
      r1a: "Have never seen this ?",
      r2a: "Have never seen this  ?",
      r2b: "Have never seen this  ?",
      rbt: "If boosting, the remaining boost time in of seconds",
      sta: "Status 1=Paused, 3=Diverting, 4=Boost, 5=Max Temp Reached, 6=Stopped",
      tp: "temperature probe 1 (50 C)",
      tp2: "temperature probe 2",
      vol: "Voltage out (divide by 10)",
      zmo: "Zappi Charge Mode",
      bss: "Boost Mode Smart",
      bst: "Boost Mode Timer",
      pst: "Charger Status",
      lck: "Lock Status",
      ts: "Timezone",
      mgl: "Minimum Green Level"
    };
    this.adapter = adapter;
    this.alreadyCreatedObjects = {};
  }
  async parse(path, element, options) {
    try {
      if (element === null || element === void 0) {
        this.adapter.log.debug("Cannot extract empty: " + path);
        return;
      }
      const objectKeys = Object.keys(element);
      if (!options || !options.write) {
        if (!options) {
          options = { write: false };
        } else {
          options["write"] = false;
        }
      }
      if (typeof element === "string" || typeof element === "number") {
        let name = element;
        if (typeof element === "number") {
          name = element.toString();
        }
        if (this.description[path]) {
          name = this.description[path];
        }
        if (!this.alreadyCreatedObjects[path]) {
          await this.adapter.setObjectNotExistsAsync(path, {
            type: "state",
            common: {
              name,
              role: this.getRole(element, options.write),
              type: element !== null ? typeof element : "mixed",
              write: options.write,
              read: true
            },
            native: {}
          }).then(() => {
          }).catch((error) => {
            this.adapter.log.error(error);
          });
        }
        this.adapter.setState(path, element, true);
        return;
      }
      if (!this.alreadyCreatedObjects[path]) {
        await this.adapter.setObjectNotExistsAsync(path, {
          type: "channel",
          common: {
            name: options.channelName || "",
            write: false,
            read: true
          },
          native: {}
        }).then(() => {
          options.channelName = void 0;
        }).catch((error) => {
          this.adapter.log.error(error);
        });
      }
      if (Array.isArray(element)) {
        await this.extractArray(element, "", path, options);
        return;
      }
      for (const key of objectKeys) {
        if (this.isJsonString(element[key]) && options.autoCast) {
          element[key] = (0, import_json_bigint.default)({ storeAsString: true }).parse(element[key]);
        }
        if (Array.isArray(element[key])) {
          await this.extractArray(element, key, path, options);
        } else if (element[key] !== null && typeof element[key] === "object") {
          await this.parse(path + "." + key, element[key], options);
        } else {
          if (!this.alreadyCreatedObjects[path + "." + key]) {
            let objectName = key;
            if (options.descriptions && options.descriptions[key]) {
              objectName = options.descriptions[key];
            }
            if (this.description[objectName]) {
              objectName = this.description[objectName];
            }
            const type = element[key] !== null ? typeof element[key] : "mixed";
            const common = {
              name: objectName,
              role: this.getRole(element[key], options.write),
              type,
              write: options.write,
              read: true
            };
            await this.adapter.setObjectNotExistsAsync(path + "." + key, {
              type: "state",
              common,
              native: {}
            }).then(() => {
            }).catch((error) => {
              this.adapter.log.error(error);
            });
          }
          this.adapter.setState(path + "." + key, element[key], true);
        }
      }
    } catch (error) {
      this.adapter.log.error("Error extract keys: " + path + " " + JSON.stringify(element));
      this.adapter.log.error(error);
    }
  }
  async extractArray(element, key, path, options) {
    try {
      if (key) {
        element = element[key];
      }
      for (let index in element) {
        const arrayElement = element[index];
        index = parseInt(index) + 1;
        if (index < 10) {
          index = "0" + index;
        }
        let arrayPath = key + index;
        if (typeof arrayElement === "string") {
          await this.parse(path + "." + key + "." + arrayElement, arrayElement, options);
          continue;
        }
        if (typeof arrayElement[Object.keys(arrayElement)[0]] === "string") {
          arrayPath = arrayElement[Object.keys(arrayElement)[0]];
        }
        for (const keyName of Object.keys(arrayElement)) {
          if (keyName.endsWith("Id") && arrayElement[keyName] !== null) {
            if (arrayElement[keyName] && arrayElement[keyName].replace) {
              arrayPath = arrayElement[keyName].replace(/\./g, "");
            } else {
              arrayPath = arrayElement[keyName];
            }
          }
        }
        for (const keyName in Object.keys(arrayElement)) {
          if (keyName.endsWith("Name")) {
            if (arrayElement[keyName] && arrayElement[keyName].replace) {
              arrayPath = arrayElement[keyName].replace(/\./g, "");
            } else {
              arrayPath = arrayElement[keyName];
            }
          }
        }
        if (arrayElement.id) {
          if (arrayElement.id.replace) {
            arrayPath = arrayElement.id.replace(/\./g, "");
          } else {
            arrayPath = arrayElement.id;
          }
        }
        if (arrayElement.name) {
          arrayPath = arrayElement.name.replace(/\./g, "");
        }
        if (arrayElement.label) {
          arrayPath = arrayElement.label.replace(/\./g, "");
        }
        if (arrayElement.labelText) {
          arrayPath = arrayElement.labelText.replace(/\./g, "");
        }
        if (arrayElement.start_date_time) {
          arrayPath = arrayElement.start_date_time.replace(/\./g, "");
        }
        if (options.preferedArrayName && options.preferedArrayName.indexOf("+") !== -1) {
          const preferedArrayNameArray = options.preferedArrayName.split("+");
          if (arrayElement[preferedArrayNameArray[0]]) {
            const element0 = arrayElement[preferedArrayNameArray[0]].replace(/\./g, "").replace(/\ /g, "");
            let element1 = "";
            if (preferedArrayNameArray[1].indexOf("/") !== -1) {
              const subArray = preferedArrayNameArray[1].split("/");
              const subElement = arrayElement[subArray[0]];
              if (subElement && subElement[subArray[1]] !== void 0) {
                element1 = subElement[subArray[1]];
              } else if (arrayElement[subArray[1]] !== void 0) {
                element1 = arrayElement[subArray[1]];
              }
            } else {
              element1 = arrayElement[preferedArrayNameArray[1]].replace(/\./g, "").replace(/\ /g, "");
            }
            arrayPath = element0 + "-" + element1;
          }
        } else if (options.preferedArrayName && options.preferedArrayName.indexOf("/") !== -1) {
          const preferedArrayNameArray = options.preferedArrayName.split("/");
          const subElement = arrayElement[preferedArrayNameArray[0]];
          if (subElement) {
            arrayPath = subElement[preferedArrayNameArray[1]].replace(/\./g, "").replace(/\ /g, "");
          }
        } else if (options.preferedArrayName && arrayElement[options.preferedArrayName]) {
          arrayPath = arrayElement[options.preferedArrayName].replace(/\./g, "");
        }
        if (options.forceIndex) {
          arrayPath = key + index;
        }
        if (!options.forceIndex && Object.keys(arrayElement).length === 2 && typeof Object.keys(arrayElement)[0] === "string" && typeof Object.keys(arrayElement)[1] === "string" && typeof arrayElement[Object.keys(arrayElement)[0]] !== "object" && typeof arrayElement[Object.keys(arrayElement)[1]] !== "object" && arrayElement[Object.keys(arrayElement)[0]] !== "null") {
          let subKey = arrayElement[Object.keys(arrayElement)[0]];
          const subValue = arrayElement[Object.keys(arrayElement)[1]];
          const subName = Object.keys(arrayElement)[0] + " " + Object.keys(arrayElement)[1];
          if (key) {
            subKey = key + "." + subKey;
          }
          if (!this.alreadyCreatedObjects[path + "." + subKey]) {
            await this.adapter.setObjectNotExistsAsync(path + "." + subKey, {
              type: "state",
              common: {
                name: subName,
                role: this.getRole(subValue, options.write),
                type: subValue !== null ? typeof subValue : "mixed",
                write: options.write,
                read: true
              },
              native: {}
            }).then(() => {
            });
          }
          this.adapter.setState(path + "." + subKey, subValue, true);
          continue;
        }
        await this.parse(path + "." + arrayPath, arrayElement, options);
      }
    } catch (error) {
      this.adapter.log.error("Cannot extract array " + path);
      this.adapter.log.error(error);
    }
  }
  isJsonString(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }
  getRole(element, write) {
    if (typeof element === "boolean" && !write) {
      return "indicator";
    }
    if (typeof element === "boolean" && write) {
      return "switch";
    }
    if (typeof element === "number" && !write) {
      return "value";
    }
    if (typeof element === "number" && write) {
      return "level";
    }
    if (typeof element === "string") {
      return "text";
    }
    return "state";
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
//# sourceMappingURL=json2iob.js.map
