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
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var AuthDigest_exports = {};
__export(AuthDigest_exports, {
  AuthDigest: () => AuthDigest
});
module.exports = __toCommonJS(AuthDigest_exports);
var crypto = __toESM(require("crypto"));
class AuthDigest {
  get username() {
    return this._username;
  }
  get realm() {
    return this._realm;
  }
  get nonce() {
    return this._nonce;
  }
  get uri() {
    return this._uri;
  }
  get algorithm() {
    return this._algorithm;
  }
  get response() {
    return this._response;
  }
  get opaque() {
    return this._opaque;
  }
  get qop() {
    return this._qop;
  }
  get nc() {
    var _a;
    this._nc++;
    const myHex = ("0000000" + ((_a = this._nc) == null ? void 0 : _a.toString(16))).substr(-8);
    return myHex;
  }
  get cnonce() {
    this._cnonce = this.md5(String((/* @__PURE__ */ new Date()).getTime()));
    return this._cnonce;
  }
  md5(data) {
    const md5 = crypto.createHash("md5");
    const result = md5.update(data).digest("hex");
    return result;
  }
  constructor(username, password, errorHandler) {
    this._username = username;
    this._password = password;
    this._nc = 0;
    this._initialized = false;
    this._algorithm = "MD5";
    if (errorHandler)
      this._onError = errorHandler;
  }
  init(wwwAuthHeader) {
    if (!wwwAuthHeader)
      return;
    const authSplit = wwwAuthHeader.split(",");
    for (const item of authSplit) {
      if (item && item.indexOf("realm=") >= 0) {
        const realmSplit = item.split('="');
        this._realm = realmSplit[realmSplit.length - 1];
        this._realm = this._realm.substring(0, this._realm.length - 1);
      }
      if (item && item.indexOf("nonce=") >= 0) {
        const nonceSplit = item.split('="');
        this._nonce = nonceSplit[nonceSplit.length - 1];
        this._nonce = this._nonce.substring(0, this._nonce.length - 1);
      }
      if (item && item.indexOf("qop=") >= 0) {
        const qopSplit = item.split('="');
        this._qop = qopSplit[qopSplit.length - 1];
        this._qop = this._qop.substring(0, this._qop.length - 1);
      }
      if (item && item.indexOf("opaque=") >= 0) {
        const opaqueSplit = item.split('="');
        this._opaque = opaqueSplit[opaqueSplit.length - 1];
        this._opaque = this._opaque.substring(0, this._opaque.length - 1);
      }
      if (item && item.indexOf("algorithm=") >= 0) {
        const algorithmSplit = item.split("=");
        this._algorithm = algorithmSplit[algorithmSplit.length - 1];
        this._algorithm = this._algorithm.substring(0, this._algorithm.length);
        if (this._onError && this.algorithm !== "MD5") {
          this._onError(`Algorithm ${this.algorithm} is not supported. Only MD5 is supportet`);
        }
      }
    }
    this._initialized = true;
  }
  getAuthorization(httpMethod, path) {
    if (!this._initialized)
      return "";
    const nc = this.nc;
    const cnonce = this.cnonce;
    const HA1 = this.md5(this.username + ":" + this.realm + ":" + this._password);
    const HA2 = this.md5(httpMethod + ":" + path);
    const response = this.md5(HA1 + ":" + this.nonce + ":" + nc + ":" + cnonce + ":" + this.qop + ":" + HA2);
    let res = `Digest username="${this.username}",`;
    res += `realm="${this.realm}",`;
    res += `nonce="${this.nonce}",`;
    res += `uri="${path}",`;
    res += `cnonce="${cnonce}",`;
    res += `nc=${nc},`;
    res += `algorithm=${this.algorithm},`;
    res += `response="${response}",`;
    res += `qop="${this.qop}",`;
    res += `opaque="${this.opaque}"`;
    return res;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AuthDigest
});
//# sourceMappingURL=AuthDigest.js.map
