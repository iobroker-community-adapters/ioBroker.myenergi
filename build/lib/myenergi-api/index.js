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
var myenergi_api_exports = {};
__export(myenergi_api_exports, {
  Eddi: () => import_Eddi.Eddi,
  EddiBoost: () => import_Types.EddiBoost,
  EddiHeaterStatus: () => import_Types.EddiHeaterStatus,
  EddiMode: () => import_Types.EddiMode,
  Harvi: () => import_Harvi.Harvi,
  MyEnergi: () => import_MyEnergi.MyEnergi,
  Zappi: () => import_Zappi.Zappi,
  ZappiBoostMode: () => import_Types.ZappiBoostMode,
  ZappiChargeMode: () => import_Types.ZappiChargeMode,
  ZappiStatus: () => import_Types.ZappiStatus
});
module.exports = __toCommonJS(myenergi_api_exports);
var import_Eddi = require("./models/Eddi");
var import_Harvi = require("./models/Harvi");
var import_Types = require("./models/Types");
var import_Zappi = require("./models/Zappi");
var import_MyEnergi = require("./MyEnergi");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Eddi,
  EddiBoost,
  EddiHeaterStatus,
  EddiMode,
  Harvi,
  MyEnergi,
  Zappi,
  ZappiBoostMode,
  ZappiChargeMode,
  ZappiStatus
});
//# sourceMappingURL=index.js.map
