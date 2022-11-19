"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyEnergi = void 0;
const Digest_1 = require("./Digest");
const Types_1 = require("./models/Types");
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
            zappi_mode_url: "/cgi-zappi-mode-Z",
            zappi_min_green_url: "/cgi-set-min-green-Z",
            eddi_mode_url: "/cgi-eddi-mode-E",
            eddi_boost_url: "/cgi-eddi-boost-E",
            get_app_key_url: "/cgi-get-app-key",
            set_app_key_url: "/cgi-set-app-key",
        };
        this._config.username = username;
        this._config.password = password;
        if (apiBaseUrl)
            this._config.base_url = apiBaseUrl;
        this._digest = new Digest_1.Digest(this._config.base_url, this._config.username, this._config.password);
    }
    getStatusAll() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this._digest.get(new URL(this._config.status_url, this._config.base_url));
                const jsonData = JSON.parse(data);
                return jsonData;
            }
            catch (error) {
                return [];
            }
        });
    }
    getStatusZappiAll() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this._digest.get(new URL(this._config.zappi_url, this._config.base_url));
                const jsonData = JSON.parse(data);
                if (jsonData.zappi)
                    return Object.assign([], jsonData.zappi);
                else
                    return [];
            }
            catch (error) {
                return [];
            }
        });
    }
    getStatusZappi(serialNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this._digest.get(new URL(this._config.zappi_url, this._config.base_url));
                const jsonData = JSON.parse(data);
                if (jsonData.zappi) {
                    const zappi = Object.assign([], jsonData.zappi).find((zappi) => {
                        return zappi.sno == serialNumber;
                    });
                    if (zappi)
                        return Object.assign({}, zappi);
                    else
                        return null;
                }
                else
                    return null;
            }
            catch (error) {
                return null;
            }
        });
    }
    setZappiChargeMode(serialNo, chargeMode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const url = new URL(`${this._config.zappi_mode_url}${serialNo}-${chargeMode}-0-0-0000`, this._config.base_url);
                const data = yield this._digest.get(url);
                const jsonData = JSON.parse(data);
                return jsonData;
            }
            catch (error) {
                return {};
            }
        });
    }
    setZappiBoostMode(serialNo, boostMode, kwh = 0, completeTime = "0000") {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (boostMode === Types_1.ZappiBoostMode.Stop) {
                    kwh = 0;
                    completeTime = "0000";
                }
                const url = new URL(`${this._config.zappi_mode_url}${serialNo}-0-${boostMode}-${kwh}-${completeTime}`, this._config.base_url);
                const data = yield this._digest.get(url);
                const jsonData = JSON.parse(data);
                return jsonData;
            }
            catch (error) {
                return {};
            }
        });
    }
    setZappiGreenLevel(serialNo, percentage) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const url = new URL(`${this._config.zappi_min_green_url}${serialNo}-${percentage}`, this._config.base_url);
                const data = yield this._digest.get(url);
                const jsonData = JSON.parse(data);
                return jsonData;
            }
            catch (error) {
                return {};
            }
        });
    }
    getStatusEddiAll() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this._digest.get(new URL(this._config.eddi_url, this._config.base_url));
                const jsonData = JSON.parse(data);
                if (jsonData.eddi)
                    return Object.assign([], jsonData.eddi);
                else
                    return [];
            }
            catch (error) {
                return [];
            }
        });
    }
    getStatusEddi(serialNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this._digest.get(new URL(this._config.eddi_url, this._config.base_url));
                const jsonData = JSON.parse(data);
                if (jsonData.eddi) {
                    const eddi = Object.assign([], jsonData.eddi).find((eddi) => {
                        return eddi.sno == serialNumber;
                    });
                    if (eddi)
                        return Object.assign({}, eddi);
                    else
                        return null;
                }
                else
                    return null;
            }
            catch (error) {
                return null;
            }
        });
    }
    setEddiMode(serialNo, mode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const url = new URL(`${this._config.eddi_mode_url}${serialNo}-${mode}`, this._config.base_url);
                const data = yield this._digest.get(url);
                const jsonData = JSON.parse(data);
                return jsonData;
            }
            catch (error) {
                return {};
            }
        });
    }
    setEddiBoost(serialNo, boost, minutes = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const url = new URL(`${this._config.eddi_boost_url}${serialNo}-${boost}-${minutes}`, this._config.base_url);
                const data = yield this._digest.get(url);
                const jsonData = JSON.parse(data);
                return jsonData;
            }
            catch (error) {
                return {};
            }
        });
    }
    getStatusHarviAll() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this._digest.get(new URL(this._config.harvi_url, this._config.base_url));
                const jsonData = JSON.parse(data);
                if (jsonData.harvi)
                    return Object.assign([], jsonData.harvi);
                else
                    return [];
            }
            catch (error) {
                return [];
            }
        });
    }
    getStatusHarvi(serialNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this._digest.get(new URL(this._config.harvi_url, this._config.base_url));
                const jsonData = JSON.parse(data);
                if (jsonData.harvi) {
                    const harvi = Object.assign([], jsonData.harvi).find((harvi) => {
                        return harvi.sno == serialNumber;
                    });
                    if (harvi)
                        return Object.assign({}, harvi);
                    else
                        return null;
                }
                else
                    return null;
            }
            catch (error) {
                return null;
            }
        });
    }
    getAppKeyFull(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this._digest.get(new URL(`${this._config.get_app_key_url}-${key}`, this._config.base_url));
                const jsonData = JSON.parse(data);
                if (jsonData) {
                    const result = Object.assign({}, jsonData);
                    return result;
                }
            }
            catch (error) {
                return null;
            }
            return null;
        });
    }
    getAppKey(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this._digest.get(new URL(`${this._config.get_app_key_url}-${key}`, this._config.base_url));
                const jsonData = JSON.parse(data);
                if (jsonData) {
                    const result = Object.assign({}, jsonData);
                    if (result[Object.keys(result)[0]])
                        return result[Object.keys(result)[0]];
                }
            }
            catch (error) {
                return null;
            }
            return null;
        });
    }
    setAppKey(key, val) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this._digest.get(new URL(`${this._config.set_app_key_url}-${key}=${val}`, this._config.base_url));
                const jsonData = JSON.parse(data);
                if (jsonData) {
                    const result = Object.assign({}, jsonData);
                    if (result[Object.keys(result)[0]])
                        return result[Object.keys(result)[0]];
                }
            }
            catch (error) {
                return null;
            }
            return null;
        });
    }
}
exports.MyEnergi = MyEnergi;
