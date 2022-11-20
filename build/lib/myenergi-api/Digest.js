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
var Digest_exports = {};
__export(Digest_exports, {
  Digest: () => Digest
});
module.exports = __toCommonJS(Digest_exports);
var https = __toESM(require("https"));
var import_AuthDigest = require("./AuthDigest");
class Digest {
  constructor(baseUrl, username, password) {
    this._etags = {};
    this._maxRedirectCount = 3;
    this._maxRetryCount = 2;
    this._baseUrl = new URL(baseUrl);
    this._authDigest = new import_AuthDigest.AuthDigest(username, password, (err) => {
      console.error(err);
    });
  }
  request(options, data, retryCount = 0, redirectCount = 0) {
    return new Promise((resolve, reject) => {
      var _a;
      let resData = "";
      if (!options.headers)
        options.headers = {};
      options.headers.Authorization = (_a = this._authDigest) == null ? void 0 : _a.getAuthorization(
        options.method,
        options.path
      );
      const etag = this._etags[options.path];
      if (etag)
        options.headers["If-None-Match"] = etag;
      const req = https.request(options, (res) => {
        var _a2, _b;
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
            return this.request(options, data, retryCount, redirectCount).then((value) => {
              resolve(value);
            }).catch((resaon) => {
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
          (_a2 = this._authDigest) == null ? void 0 : _a2.init(wwwAuth);
          if (!options.headers)
            options.headers = {};
          options.headers.Authorization = (_b = this._authDigest) == null ? void 0 : _b.getAuthorization(
            options.method,
            options.path
          );
          return this.request(options, data, retryCount).then((value) => {
            resolve(value);
          }).catch((resaon) => {
            reject(resaon);
          });
        } else if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          this._etags[options.path] = res.headers.etag;
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
            return this.request(options, data, retryCount, redirectCount).then((value) => {
              resolve(value);
            }).catch((resaon) => {
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
        } else if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400) {
          if (res.statusCode == 304) {
            resolve("{}");
            return;
          }
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
          return this.request(options, data, retryCount, redirectCount).then((value) => {
            resolve(value);
          }).catch((resaon) => {
            reject(resaon);
          });
        } else {
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
  get(requestUrl, data, _etags) {
    const etag = _etags ? _etags[requestUrl.href] : void 0;
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
        Host: requestUrl.hostname
      }
    };
    return this.request(options, data);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Digest
});
//# sourceMappingURL=Digest.js.map
