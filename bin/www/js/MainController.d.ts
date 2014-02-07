/// <reference path="typings/angularjs/angular.d.ts" />
/// <reference path="typings/angularjs/angular-route.d.ts" />
export interface IExpressMockerConfig {
    port: number;
    quiet: boolean;
    statics?: IExpressMockerStatic[];
    adminAuth?: IExpressMockerBasicAuth;
    defaultRoutes: IExpressMockerRoute[];
}
export interface IExpressMockerStatic {
    route: string;
    directory: string;
}
export interface IExpressMockerBasicAuth {
    login: string;
    password: string;
}
export interface IExpressMockerRoute {
    active: boolean;
    id: string;
    verb: string;
    route: string;
    response: IExpressMockerResponse;
    description?: string;
    hidden?: boolean;
    basicAuth?: IExpressMockerBasicAuth;
    routeParams?: {
        [name: string]: IExpressMockerRouteParams;
    };
}
export interface IExpressMockerResponse {
    source: string;
    headers?: IExpressMockerResponseHeaders;
}
export interface IExpressMockerRouteParams {
    name?: string;
    value?: string;
    description?: string;
}
export interface IExpressMockerResponseHeaders {
    [index: string]: any;
}
export interface ISortableRoute {
    column: string;
    descending: boolean;
}
