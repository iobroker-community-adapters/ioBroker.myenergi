export declare class Digest {
    private _authDigest?;
    private _baseUrl;
    private _maxRedirectCount;
    private _maxRetryCount;
    constructor(baseUrl: string, username: string, password: string);
    private request;
    get(requestUrl: URL, data?: unknown): Promise<string>;
}
