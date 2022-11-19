"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Digest = void 0;
const https = __importStar(require("https"));
const AuthDigest_1 = require("./AuthDigest");
class Digest {
    constructor(baseUrl, username, password) {
        this._maxRedirectCount = 3;
        this._maxRetryCount = 2;
        this._baseUrl = new URL(baseUrl);
        this._authDigest = new AuthDigest_1.AuthDigest(username, password, (err) => {
            console.error(err);
        });
    }
    request(options, data, retryCount = 0, redirectCount = 0) {
        return new Promise((resolve, reject) => {
            var _a;
            let resData = "";
            if (!options.headers)
                options.headers = {};
            options.headers.Authorization = (_a = this._authDigest) === null || _a === void 0 ? void 0 : _a.getAuthorization(options.method, options.path);
            const req = https.request(options, (res) => {
                var _a, _b;
                if (res.statusCode == 401) {
                    const myenergiAsn = res.headers["x_myenergi-asn"];
                    if (myenergiAsn && myenergiAsn !== "undefined" && myenergiAsn !== this._baseUrl.host) {
                        if (redirectCount > this._maxRedirectCount) {
                            reject(`Too many redirects: ${myenergiAsn}`);
                            return;
                        }
                        this._baseUrl.host = myenergiAsn;
                        this._baseUrl.hostname = myenergiAsn;
                        options.host = myenergiAsn;
                        options.hostname = myenergiAsn;
                        redirectCount++;
                        return this.request(options, data, retryCount, redirectCount)
                            .then((value) => {
                            resolve(value);
                        })
                            .catch((resaon) => {
                            reject(resaon);
                        });
                    }
                    if (retryCount > this._maxRetryCount) {
                        reject("Authentication failed");
                        return;
                    }
                    retryCount++;
                    const wwwAuth = res.headers["www-authenticate"];
                    if (!wwwAuth.startsWith("Digest")) {
                        reject("Unsupported authentication method. Supported authentication schemes: Digest");
                        return;
                    }
                    (_a = this._authDigest) === null || _a === void 0 ? void 0 : _a.init(wwwAuth);
                    if (!options.headers)
                        options.headers = {};
                    options.headers.Authorization = (_b = this._authDigest) === null || _b === void 0 ? void 0 : _b.getAuthorization(options.method, options.path);
                    return this.request(options, data, retryCount)
                        .then((value) => {
                        resolve(value);
                    })
                        .catch((resaon) => {
                        reject(resaon);
                    });
                }
                else if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    const myenergiAsn = res.headers["x_myenergi-asn"];
                    if (myenergiAsn && myenergiAsn !== "undefined" && myenergiAsn !== this._baseUrl.host) {
                        if (redirectCount > this._maxRedirectCount) {
                            reject(`Too many redirects: ${myenergiAsn}`);
                            return;
                        }
                        this._baseUrl.host = myenergiAsn;
                        this._baseUrl.hostname = myenergiAsn;
                        options.host = myenergiAsn;
                        options.hostname = myenergiAsn;
                        redirectCount++;
                        return this.request(options, data, retryCount, redirectCount)
                            .then((value) => {
                            resolve(value);
                        })
                            .catch((resaon) => {
                            reject(resaon);
                        });
                    }
                    res.setEncoding("utf8");
                    res.on("data", (chunk) => {
                        resData += chunk;
                    });
                    res.on("end", () => {
                        resolve(resData);
                    });
                }
                else if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400) {
                    if (redirectCount > this._maxRedirectCount) {
                        reject(`Too many redirects: ${res.headers["location"]}`);
                        return;
                    }
                    const location = res.headers["location"];
                    const uri = new URL(location);
                    if (uri.host !== this._baseUrl.host) {
                        this._baseUrl.host = uri.host;
                    }
                    redirectCount++;
                    return this.request(options, data, retryCount, redirectCount)
                        .then((value) => {
                        resolve(value);
                    })
                        .catch((resaon) => {
                        reject(resaon);
                    });
                }
                else {
                    console.error("status code failed!!");
                    reject("status code failed!!");
                    return;
                }
            });
            req.on("error", (e) => {
                console.error(`problem with request: ${e.message}`);
                reject(e);
            });
            if (data) {
                req.write(data);
            }
            req.end();
        });
    }
    get(requestUrl, data) {
        const options = {
            hostname: this._baseUrl.hostname,
            host: this._baseUrl.host,
            port: this._baseUrl.port,
            path: requestUrl.pathname,
            method: "GET",
            headers: {
                Connection: "Keep-Alive",
                "Content-Type": "application/json",
                Accept: "application/json",
                Host: requestUrl.hostname,
            },
        };
        return this.request(options, data);
    }
}
exports.Digest = Digest;
