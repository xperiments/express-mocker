/// <reference path="../../../src/d.ts/DefinitelyTyped/node/node.d.ts" />
declare module es.xperiments.json {
    class JSONMocker {
        static context: Object;
        static templateObject: Object;
        static injector: any;
        static render(template: string, view?: Object): string;
        static getObjectLength(object: Object): number;
        static parseArray(array: any[], count: number): any[];
        static parseVars(object: any): any;
        static clone(a: any): any;
        static parseObject(a: any): any;
        static parseTemplate(templateObject: any, context: Object): Object;
    }
}
