/// <reference path="d.ts/DefinitelyTyped/node/node.d.ts" />
/// <reference path="d.ts/DefinitelyTyped/express/express.d.ts" />
/// <reference path="../node_modules/dom-storage/lib/index.d.ts" />
/// <reference path="JSONMocker.d.ts" />
export declare module es.xperiments.nodejs {
    interface IExpressMockerStatic {
        route: string;
        directory: string;
    }
    interface IExpressMockerConfig {
        port: number;
        quiet: boolean;
        allowedDomains?: string[];
        statics?: IExpressMockerStatic[];
        adminAuth?: IExpressMockerBasicAuth;
        defaultRoutes: IExpressMockerRoute[];
    }
    interface IExpressMockerBasicAuth {
        login: string;
        password: string;
    }
    interface IExpressMockerResponseHeaders {
        [index: string]: any;
    }
    interface IExpressMockerResponse {
        source: string;
        headers?: IExpressMockerResponseHeaders;
    }
    interface IExpressMockerRoute {
        hidden?: boolean;
        active: boolean;
        verb: string;
        route: string;
        basicAuth?: IExpressMockerBasicAuth;
        response: IExpressMockerResponse;
    }
    interface IJSONGenResult {
        result: string;
        directResponse: boolean;
        mime?: string;
    }
    enum ExpressMockerResponseType {
        DATA_URL,
        FILE,
        JSON_GEN,
    }
    function mix(...rest): Object;
    class ExpressMocker {
        private npmDir;
        private rootDir;
        static quiet: boolean;
        private express;
        private config;
        private configPath;
        private adminAuth;
        private storage;
        constructor(npmDir: string, rootDir: string);
        public loadConfig(path: string): ExpressMocker;
        public setPort(port: number): ExpressMocker;
        public setQuiet(mode: boolean): ExpressMocker;
        public createServer(): void;
        private getInjector();
        private configureStatics();
        private configureAdmin();
        private configureRoutes();
        private addRoute(route);
        private sendResponse(req, res, route);
        private parseJSONGen(data, route, req, res);
        private sendContentLength(res, contentType, len, charset?);
        private corsMiddleware(req, res, next);
        static log(...rest): void;
    }
    class Injector {
        static FN_ARGS: RegExp;
        static FN_ARG_SPLIT: RegExp;
        static FN_ARG: RegExp;
        static STRIP_COMMENTS: RegExp;
        static getArgs(target);
        public dependencies: {
            [name: string]: Function;
        };
        public hasDependencies(target: Function): boolean;
        public processCall(target: Function, argv);
        public process(target: Function);
        public getDependencies(arr);
        public register(name: string, dependency: any): void;
        public dispose(): void;
    }
}
