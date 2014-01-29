export interface NodeStorage {

    constructor( db:string );
    getItem(key):any
    setItem(key, value):void;
    removeItem(key):void;
    clear():void;
    key(n):any;
    length:number;

}