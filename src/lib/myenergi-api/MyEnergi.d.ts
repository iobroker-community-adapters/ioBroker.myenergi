import { AppKeyValues } from './models/AppKeyValues';
import { Eddi } from "./models/Eddi";
import { Harvi } from "./models/Harvi";
import { KeyValue } from './models/KeyValue';
import { EddiBoost, EddiMode, ZappiBoostMode, ZappiChargeMode } from "./models/Types";
import { Zappi } from "./models/Zappi";
export declare class MyEnergi {
    private _config;
    private _digest;
    constructor(username: string, password: string, apiBaseUrl?: string);
    getStatusAll(): Promise<any>;
    getStatusZappiAll(): Promise<Zappi[]>;
    getStatusZappi(serialNumber: string): Promise<Zappi | null>;
    setZappiChargeMode(serialNo: string, chargeMode: ZappiChargeMode): Promise<any>;
    setZappiBoostMode(serialNo: string, boostMode: ZappiBoostMode, kwh?: number, completeTime?: string): Promise<any>;
    setZappiGreenLevel(serialNo: string, percentage: number): Promise<any>;
    getStatusEddiAll(): Promise<Eddi[]>;
    getStatusEddi(serialNumber: string): Promise<Eddi | null>;
    setEddiMode(serialNo: string, mode: EddiMode): Promise<any>;
    setEddiBoost(serialNo: string, boost: EddiBoost, minutes?: number): Promise<any>;
    getStatusHarviAll(): Promise<Harvi[]>;
    getStatusHarvi(serialNumber: string): Promise<Harvi | null>;
    getAppKeyFull(key: string): Promise<AppKeyValues | null>;
    getAppKey(key: string): Promise<KeyValue[] | null>;
    setAppKey(key: string, val: string): Promise<KeyValue[] | null>;
}
