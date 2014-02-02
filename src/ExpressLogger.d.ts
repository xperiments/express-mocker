export declare class ExpressLogger {
    static colors: {
        [key: string]: string;
    };
    static quiet: boolean;
    private static print(color, rest);
    static log(...rest): void;
    static info(...rest): void;
    static error(...rest): void;
    static success(...rest): void;
    private static color(color, text);
}
