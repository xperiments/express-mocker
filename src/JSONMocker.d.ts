/// <reference path="d.ts/DefinitelyTyped/node/node.d.ts" />
/// <reference path="ExpressLogger.d.ts" />
export declare class Injector {
    static FN_ARGS: RegExp;
    static FN_ARG_SPLIT: RegExp;
    static FN_ARG: RegExp;
    static STRIP_COMMENTS: RegExp;
    static getArgs(target): string[];
    private dependencies;
    public hasDependencies(target: Function): boolean;
    public processCall(target: Function, argv);
    public process<T>(target: Function): T;
    public register(name: string, dependency: any): void;
    public dispose(): void;
    private getDependencies(arr);
}
export declare class Pool<T> {
    private pool;
    private counter;
    constructor(type: any, len: number);
    public pop(): T;
    public push(s: T): void;
}
export declare class JSONMocker {
    private static LOCAL_STORAGE;
    private static injectorPool;
    private context;
    public templateObject: any;
    public injector: Injector;
    public parseTemplate(template: string, context: any): Object;
    private render(template, view?);
    private getObjectLength(object);
    private parseArray(array, count);
    private parseVars(object);
    private static clone(a);
    private parseObject(a);
}
export interface IBaseDict {
    [key: string]: any;
}
export declare class DataFackerStore {
    static items: IBaseDict;
    static 〇: boolean;
    static сonstructor(): boolean;
    static getItem(key: string): any;
    static setItem(key: string, value: any): void;
    static getRandom(key: string): any;
    static getItems(): IBaseDict;
    static setItems(items: IBaseDict): void;
    static saveItems(): void;
}
export declare class DataFackerHelper {
    static firstName(): string;
    static lastName(): string;
    static company(): string;
    static email(): string;
    static bool(): boolean;
    static random(random): number;
    static randomElement(key: string): number;
    static getRss(key: string);
    static image(width: number, height: number): string;
    static guid(): string;
    static loremWords(words?: number): string;
    static lorem(paragraphs: number, html?: boolean, sentenceWords?: number): string;
}
export declare class DataFackerUtils {
    static replacePattern(pattern: string): string;
    static randomElement(elements: any[]): any;
    static randomNumber(range: number): number;
    static randomNumberRange(start: number, end: number): number;
    static slug(str: string): string;
    static shuffle(a: any[]): any[];
    static titleCase(str: string): string;
}
