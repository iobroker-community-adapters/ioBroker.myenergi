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
var Types_exports = {};
__export(Types_exports, {
  EddiBoost: () => EddiBoost,
  EddiHeaterStatus: () => EddiHeaterStatus,
  EddiMode: () => EddiMode,
  ZappiBoostMode: () => ZappiBoostMode,
  ZappiChargeMode: () => ZappiChargeMode,
  ZappiStatus: () => ZappiStatus
});
module.exports = __toCommonJS(Types_exports);
var EddiBoost = /* @__PURE__ */ ((EddiBoost2) => {
  EddiBoost2["CancelHeater1"] = "1-1";
  EddiBoost2["CancelHeater2"] = "1-1";
  EddiBoost2["CancelRelay1"] = "1-11";
  EddiBoost2["CancelRelay2"] = "1-12";
  EddiBoost2["ManualHeater1"] = "10-1";
  EddiBoost2["ManualHeater2"] = "10-1";
  EddiBoost2["ManualRelay1"] = "10-11";
  EddiBoost2["ManualRelay2"] = "10-12";
  return EddiBoost2;
})(EddiBoost || {});
var EddiHeaterStatus = /* @__PURE__ */ ((EddiHeaterStatus2) => {
  EddiHeaterStatus2[EddiHeaterStatus2["Starting"] = 0] = "Starting";
  EddiHeaterStatus2[EddiHeaterStatus2["Paused"] = 1] = "Paused";
  EddiHeaterStatus2[EddiHeaterStatus2["DSR"] = 2] = "DSR";
  EddiHeaterStatus2[EddiHeaterStatus2["Diverting"] = 3] = "Diverting";
  EddiHeaterStatus2[EddiHeaterStatus2["Boost"] = 4] = "Boost";
  EddiHeaterStatus2[EddiHeaterStatus2["Hot"] = 5] = "Hot";
  EddiHeaterStatus2[EddiHeaterStatus2["Stopped"] = 6] = "Stopped";
  return EddiHeaterStatus2;
})(EddiHeaterStatus || {});
var EddiMode = /* @__PURE__ */ ((EddiMode2) => {
  EddiMode2[EddiMode2["Off"] = 0] = "Off";
  EddiMode2[EddiMode2["On"] = 1] = "On";
  return EddiMode2;
})(EddiMode || {});
var ZappiBoostMode = /* @__PURE__ */ ((ZappiBoostMode2) => {
  ZappiBoostMode2[ZappiBoostMode2["Manual"] = 10] = "Manual";
  ZappiBoostMode2[ZappiBoostMode2["Smart"] = 11] = "Smart";
  ZappiBoostMode2[ZappiBoostMode2["Stop"] = 2] = "Stop";
  return ZappiBoostMode2;
})(ZappiBoostMode || {});
var ZappiChargeMode = /* @__PURE__ */ ((ZappiChargeMode2) => {
  ZappiChargeMode2[ZappiChargeMode2["Off"] = 4] = "Off";
  ZappiChargeMode2[ZappiChargeMode2["Fast"] = 1] = "Fast";
  ZappiChargeMode2[ZappiChargeMode2["Eco"] = 2] = "Eco";
  ZappiChargeMode2[ZappiChargeMode2["EcoPlus"] = 3] = "EcoPlus";
  return ZappiChargeMode2;
})(ZappiChargeMode || {});
var ZappiStatus = /* @__PURE__ */ ((ZappiStatus2) => {
  ZappiStatus2["EvDisconnected"] = "A";
  ZappiStatus2["EvConnected"] = "B1";
  ZappiStatus2["WaitingForEv"] = "B2";
  ZappiStatus2["EvReadyToCharge"] = "C1";
  ZappiStatus2["Charging"] = "C2";
  ZappiStatus2["Fault"] = "F";
  return ZappiStatus2;
})(ZappiStatus || {});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EddiBoost,
  EddiHeaterStatus,
  EddiMode,
  ZappiBoostMode,
  ZappiChargeMode,
  ZappiStatus
});
//# sourceMappingURL=Types.js.map
