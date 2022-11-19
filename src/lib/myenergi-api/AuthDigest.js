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
exports.AuthDigest = void 0;
const crypto = __importStar(require("crypto"));
class AuthDigest {
    constructor(username, password, errorHandler) {
        this._username = username;
        this._password = password;
        this._nc = 0;
        this._initialized = false;
        this._algorithm = "MD5";
        if (errorHandler)
            this._onError = errorHandler;
    }
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
        const myHex = ("0000000" + ((_a = this._nc) === null || _a === void 0 ? void 0 : _a.toString(16))).substr(-8);
        return myHex;
    }
    get cnonce() {
        this._cnonce = this.md5(String(new Date().getTime()));
        return this._cnonce;
    }
    md5(data) {
        const md5 = crypto.createHash("md5");
        const result = md5.update(data).digest("hex");
        return result;
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
exports.AuthDigest = AuthDigest;
