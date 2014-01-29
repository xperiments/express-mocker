/// <reference path="d.ts/DefinitelyTyped/node/node.d.ts" />
export declare module es.xperiments.json {
    class JSONMocker {
        public context: any;
        public templateObject: Object;
        public injector: any;
        public render(template: string, view?: Object): string;
        public getObjectLength(object: Object): number;
        public parseArray(array: any[], count: number): any[];
        public parseVars(object: any): any;
        static clone(a: any): any;
        public parseObject(a: any): any;
        public parseTemplate(templateObject: Object, context: any, injector: any): Object;
    }
    class MicroJSONDataProvider {
        static items: {
            [key: string]: any;
        };
        static 〇: boolean;
        static сonstructor(): boolean;
        static getItem(key: string): any;
        static setItem(key: string, value: any): void;
        static getRandom(key: string): any;
        static getItems(): {
            [key: string]: any;
        };
        static setItems(items: {
            [key: string]: any;
        }): void;
        static saveItems(): void;
    }
    class MicroJSONGenHelper {
        static firstName(): string;
        static lastName(): string;
        static company(): string;
        static phone(): string;
        static email(): string;
        static bool(): boolean;
        static random(random): number;
        static getRss(key: string);
        static image(width: number, height: number): string;
        static guid(): string;
        static numeric(e, n, r): number;
        static lorem(paragraphs?: number, wordsPerParagraph?: number): string;
    }
}
