/// <reference path="../../../src/d.ts/DefinitelyTyped/angularjs/angular.d.ts" />
/// <reference path="JSONMocker.d.ts" />
/**
* Header for Showdown: https://github.com/coreyti/showdown
*/
interface Showdown {
    converter(): void;
    makeHtml(html: string): string;
}
declare class MainController {
    private $scope;
    private $element;
    private $http;
    private $route;
    private $routeParams;
    private $location;
    private $timeout;
    private $sce;
    private static MODE_ADD;
    private static MODE_EDIT;
    private config;
    private listVisible;
    private currentRoute;
    private currentRouteParams;
    private currentRouteId;
    private currentRouteSwitch;
    private editMode;
    private editor;
    private reloadNeeded;
    private noValidJSONMockupCode;
    private hasJsErrors;
    private previewVisible;
    private previewDescription;
    private previewOutput;
    private showdown;
    private markDownPreview;
    private loading;
    private showDescription;
    private linkPreview;
    private currentRoutePreview;
    constructor($scope, $element, $http, $route, $routeParams, $location, $timeout, $sce);
    public loadConfig(): void;
    public toggleDescriptionPreview(): void;
    public updateParams(): void;
    public updateDescription(): void;
    public radd(): void;
    public add(): void;
    public redit(id): void;
    public edit(id): void;
    public delete(id): void;
    public toggleActive(idx): void;
    public createEditObject(source);
    public previewRoute(route): void;
    public preview(): void;
    public updatePreview(): void;
    public uploadFile(files): void;
    public setType(type): void;
    public cancel(): void;
    public save(): void;
    public showList(): void;
    public setCurrentVerb(verb: string): void;
    public saveToDisk(): void;
    public reload(): void;
    public browseForFile(): void;
    static clone(obj);
}
declare function utf8_encode(argString): string;
declare function utf8_decode(str_data): string;
