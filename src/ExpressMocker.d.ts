/// <reference path="d.ts/DefinitelyTyped/node/node.d.ts" />
/// <reference path="d.ts/DefinitelyTyped/express/express.d.ts" />
/// <reference path="JSONMocker.d.ts" />
export interface IExpressMockerStatic {
    route: string;
    directory: string;
}
export interface IExpressMockerConfig {
    port: number;
    quiet: boolean;
    allowedDomains?: string[];
    statics?: IExpressMockerStatic[];
    adminAuth?: IExpressMockerBasicAuth;
    defaultRoutes: IExpressMockerRoute[];
}
export interface IExpressMockerBasicAuth {
    login: string;
    password: string;
}
export interface IExpressMockerResponseHeaders {
    [index: string]: any;
}
export interface IExpressMockerResponse {
    source: string;
    headers?: IExpressMockerResponseHeaders;
}
export interface IExpressMockerRoute {
    hidden?: boolean;
    active: boolean;
    verb: string;
    route: string;
    basicAuth?: IExpressMockerBasicAuth;
    response: IExpressMockerResponse;
}
export interface IJSONGenResult {
    result: string;
    directResponse: boolean;
    mime?: string;
}
export declare enum ExpressMockerResponseType {
    DATA_URL,
    FILE,
    JSON_GEN,
}
export declare class ExpressMocker {
    private npmDir;
    private rootDir;
    private express;
    private expressListener;
    private config;
    private configPath;
    constructor(npmDir: string, rootDir: string);
    public loadConfig(path: string): ExpressMocker;
    public setPort(port: number): ExpressMocker;
    public getPort(): number;
    public setQuiet(mode: boolean): ExpressMocker;
    public createServer(): ExpressMocker;
    private configureStatics();
    private configureAdmin();
    private configureRoutes();
    private addRoute(route);
    private sendResponse(req, res, route);
    private parseJSONGen(data, route, req, res);
    private sendContentLength(res, contentType, len, charset?);
    private corsMiddleware(req, res, next);
}
