export declare class AuthDigest {
    private _password?;
    private _username?;
    private _initialized;
    private _onError?;
    get username(): string | undefined;
    private _realm?;
    get realm(): string | undefined;
    private _nonce?;
    get nonce(): string | undefined;
    private _uri?;
    get uri(): string | undefined;
    private _algorithm;
    get algorithm(): string;
    private _response?;
    get response(): string | undefined;
    private _opaque?;
    get opaque(): string | undefined;
    private _qop?;
    get qop(): string | undefined;
    private _nc;
    get nc(): string | undefined;
    private _cnonce?;
    get cnonce(): string | undefined;
    private md5;
    constructor(username: string, password: string, errorHandler?: (errorMessage: string) => void);
    init(wwwAuthHeader: string): void;
    getAuthorization(httpMethod: string, path: string): string;
}
