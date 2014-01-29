///<reference path="d.ts/DefinitelyTyped/node/node.d.ts"/>
///<reference path="d.ts/DefinitelyTyped/express/express.d.ts"/>

///<reference path="JSONMocker.d.ts"/>

interface Base64
{
    encode(string):string;
    decode(string):string;
}


declare class NodeStorage {
	constructor(db: string);
	public getItem(key): any;
	public setItem(key, value): void;
	public removeItem(key): void;
	public clear(): void;
	public key(n): any;
	public length: number;
}


var $NodeStorage:NodeStorage = require('../node_modules/dom-storage/lib/index');
var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');

import express = require('express');
import vm = require('vm');
import fs = require('fs');


import jsonmocker = require("./JSONMocker");jsonmocker;
import JSONMocker = jsonmocker.es.xperiments.json.JSONMocker;



export
module es.xperiments.nodejs
{

    export
    interface IExpressMockerStatic
    {
        route:string;
        directory:string;
    }
    export
    interface IExpressMockerConfig
    {
        port: number;
        quiet: boolean;
        allowedDomains?:string[];
        statics?:IExpressMockerStatic[];
        adminAuth?:IExpressMockerBasicAuth;
        defaultRoutes:IExpressMockerRoute[];
    }

    export
    interface IExpressMockerBasicAuth
    {
        login:string;
        password:string;
    }

    export
    interface IExpressMockerResponseHeaders
    {
        [index: string]: any;
    }

    export
    interface IExpressMockerResponse
    {
        source:string;
        headers?:IExpressMockerResponseHeaders
    }

    export
    interface IExpressMockerRoute
    {
        hidden?:boolean;
        active:boolean;
        verb:string;
        route:string;
        basicAuth?:IExpressMockerBasicAuth;
        response:IExpressMockerResponse
    }

	export
	interface IJSONGenResult
	{
		result:string;
		directResponse:boolean;
		mime?:string;
	}


    export
    enum ExpressMockerResponseType
    {
        DATA_URL,
        FILE,
        JSON_GEN
    }

    export

    function mix(...rest):Object
    {
        var i:number
            ,total:number
            ,j:string
            ,newObj:Object = {};

        for(i = 0, total = arguments.length; i < total; i++)
        {
            for(j in arguments[i])
            {
                if(arguments[i].hasOwnProperty(j)) { newObj[j] = arguments[i][j]; }
            }
        }
        return newObj;
    }

    export
    class ExpressMocker
    {

        static quiet:boolean;

        private express:express.Application;
        private config:IExpressMockerConfig;
        private configPath:string;
        private adminAuth:any;

        private storage:NodeStorage;



        constructor(private npmDir:string, private rootDir:string ){}

        public loadConfig( path:string ):ExpressMocker
        {
            this.configPath = path;

            this.config = JSON.parse( <string><any>fs.readFileSync(path,'utf8'));

            //admin route
            var adminRoute:IExpressMockerRoute = {

                hidden:true,
                active:true,
                verb: "get",
                route: "/express-mocker/config.json",
                response:
                {
                    source: "config.json"
                }

            }

            if( this.config.adminAuth )
            {
                adminRoute.basicAuth = this.config.adminAuth;
            }
            // add admin routes
            this.config.defaultRoutes.push( adminRoute );
            ExpressMocker.quiet = this.config.quiet;
            return this;
        }

        public setPort( port:number ):ExpressMocker
        {
            if( this.config && port!=0 ) this.config.port = port;
            return this;
        }
        public setQuiet( mode:boolean ):ExpressMocker
        {
            if( ExpressMocker.quiet != mode  )
            {
                ExpressMocker.quiet = mode;
            }
            return this;
        }
        public createServer():void
        {
            this.express = express();
            this.express.use(express.urlencoded());
            this.express.use(express.json());
            this.express.use(this.corsMiddleware.bind(this));
            this.express.use(express.static(__dirname ))

            // error that raises when port is already in use
            process.on('uncaughtException',(err:any) => {
                if(err.errno === 'EADDRINUSE')
                    ExpressMocker.log('Port', this.config.port, 'is alrready in use!!');
                else
                    ExpressMocker.log(err);
                process.exit(1);
            });

			this.storage = new $NodeStorage( this.rootDir+'/express-mocker/express-mocker.db');
            this.configureRoutes();
            this.configureAdmin();
            this.configureStatics();
            this.express.listen( this.config.port );
            ExpressMocker.log('Starting server at port:', this.config.port );
        }

        private getInjector():Injector
        {
			var injector = new Injector();
			injector.register('$localStorage', this.storage );
			injector.register('$console', (function(){ return console })() );
			injector.register('$helper', jsonmocker.es.xperiments.json.MicroJSONGenHelper );
			return injector;
        }
        private configureStatics():void
        {
            if( this.config.statics )
            {
                this.config.statics.map( ( staticDir:IExpressMockerStatic )=>{
                    ExpressMocker.log(staticDir.route,  this.rootDir + staticDir.directory )
                    this.express.use( staticDir.route, express.static( this.rootDir + staticDir.directory) );
                });
            }
        }

        private configureAdmin()
        {


            this.express.post('/express-mocker/update', ( req:express.Request, res:express.Response )=>{

                fs.writeFileSync(this.configPath, JSON.stringify(req.body.config, null, 4),'utf8');
                res.send("ok");
            });

            this.express.all("/express-mocker/reload", ( req:express.Request, res:express.Response )=>{

                // wipe out all the old routes, or express will get confused.
                var verbs = Object.keys(this.express.routes);
                verbs.map((verb)=>{
                    this.express.routes[verb] = [];
                });
                this.loadConfig( this.configPath );
                this.configureRoutes();
                this.configureAdmin();
                this.configureStatics();

                res.writeHead(200, {"Content-Type": "application/json"});
                res.end('{"configPath": "' + this.configPath + '", "reloaded": "true"}');
            });

            this.config.adminAuth && this.express.get
            (
                '/express-mocker/*',
                express.basicAuth((username,password,callback)=>
                {
                    var result = ((username === this.config.adminAuth.login) && (password === this.config.adminAuth.password));
                    callback(null, result);
                }),
                (req, res, next)=>{ next(); }
            );
            // default admin code is located at (installed pkg dir)/bin/www
            this.express.use( '/express-mocker', express.static( this.npmDir+'/www' ) );
        }

        private configureRoutes():void
        {
            //add all active routes
            this.config.defaultRoutes.map( (e:IExpressMockerRoute) =>{ if( e.active || e.hidden ) this.addRoute( e ) } );
        }

        private addRoute( route:IExpressMockerRoute ):void
        {
            // hide logging of internal routes
            if(!route.hidden) ExpressMocker.log('Add route', route.verb.toUpperCase(), route.route )

            // add routing
            this.express[route.verb]( route.route,( req:express.Request, res:express.Response )=>{this.sendResponse(req, res, route)} );
        }

        private sendResponse( req:express.Request, res:express.Response, route:IExpressMockerRoute ):void
        {

            var isDataUrlRegExp:RegExp = /^data:(.+\/(.+));base64,(.*)$/
                ,isJsonGeneratorFileRegExp:RegExp = /\.json-mk$/
                ,source = route.response.source
                ,isFileDataUrlEncoded:boolean = isDataUrlRegExp.test( source )
                ,isJsonGeneratorFile:boolean = isJsonGeneratorFileRegExp.test( source )
                ,isFile:boolean = !isFileDataUrlEncoded;

            switch( true )
            {
                // source response is in dataURL format
                case isFileDataUrlEncoded:
                    var dataUrlInfo:RegExpExecArray = isDataUrlRegExp.exec( source )
                        ,mime:string = dataUrlInfo[1]
                        ,outputBuffer:string = Base64.decode( dataUrlInfo[3]);

                    // if response is a JSONMocker file
                    if( mime != "application/json-mock" )
                    {
                        // send the mine/base64 response from the buffer
						var len = Buffer.byteLength( jsonGenResult.result ,'utf8');
                        this.sendContentLength( res, mime, len,'utf8' );
                        res.send( outputBuffer );
                    }
                    else
                    {
                        // process JSONMock template from the base64 encoded buffer
                        var jsonGenResult:IJSONGenResult = this.parseJSONGen( outputBuffer, route, req, res );
						var len = Buffer.byteLength( jsonGenResult.result ,'utf8');
                        this.sendContentLength( res, jsonGenResult.directResponse? jsonGenResult.mime : "application/json", len,'utf8' );
                        res.send( jsonGenResult.result );
                    }

                break;

                // is a local JSONMocker file
                case  isJsonGeneratorFile:

                    // read the file from disk
                    fs.readFile(this.rootDir+'/express-mocker/'+source, {encoding: "utf8"}, (err: ErrnoException, data: NodeBuffer)=>
                    {
                        if (err){ throw err; }
                        res.header('Content-Type', "application/json");
                        // process JSONMock template from the contents of the file
                        res.send( this.parseJSONGen( data.toString('utf8'), route, req, res).result );
                    });

                    break;

                // default send file
                default:

                    //let express serve the file 4 us ;-)
                    res.sendfile(source, { root: this.rootDir+'/express-mocker' });
                    break;

            }
        }

        private parseJSONGen( data:string, route:IExpressMockerRoute, req:express.Request, res:express.Response ):IJSONGenResult
        {

            var dataUrlRegExp:RegExp = /^data:(.+\/(.+));base64,(.*)$/;

            // create
            var sandbox:{ code:Object } = { code:null };

            try
            {
                vm.runInNewContext('code = ' + data.substring( data.indexOf('{') ), sandbox);
            }
            catch (e)
            {
                ExpressMocker.log('Error executing fjson code ' + e);
            }
			var injector:Injector = this.getInjector();
            var template:{ $content?:string } = new JSONMocker().parseTemplate( sandbox.code, { request:req }, injector );
			injector.dispose();
			injector = null;
            // check if a direct output template is provided
            if (template.$content && dataUrlRegExp.test(template.$content) && ( Object.keys(JSON.parse(JSON.stringify(template))).length == 1))
            {
                var dataUrlInfo:RegExpExecArray = dataUrlRegExp.exec(template.$content);
                var output:string = Base64.decode( dataUrlInfo[3] );
                return {
					result:output,
					directResponse:true,
					mime:dataUrlInfo[1]
				};
            }
            return {
				result:JSON.stringify(template),
				directResponse:false
			}


        }

        private sendContentLength( res:express.Response, contentType:string, len:number ,charset:string='' ):void
        {
			res.header('Cache-Control', 'no-cache');
            res.header('Content-Type', contentType + (charset !="" ? '; charset='+charset:'') );
            res.header('Content-Length', len.toString() );
        }

        private corsMiddleware( req:express.Request, res:express.Response, next:Function ):void
        {
            res.header('Access-Control-Allow-Origin', "*");
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
            res.header('Access-Control-Allow-Headers', 'Content-Type');
            next();
        }

        public static log(...rest)
        {
            if( !ExpressMocker.quiet )
            {
                console.log.apply( console, rest );
            }
        }

    }

    class Base64
    {
        static encode( stringToEncode:string ):string
        {
            return new Buffer( stringToEncode, 'utf8' ).toString('base64');
        }

        static decode( buffer:string ):string
        {
            return new Buffer( buffer, 'base64').toString('utf8');
        }
    }

    export
    class Injector
    {
        static FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
        static FN_ARG_SPLIT = /,/;
        static FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
        static STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
		static getArgs( target ){ return target.toString().match(Injector.FN_ARGS)[1].split(',').map((e)=>{return e.trim()});}

		dependencies:{ [name:string]:Function } = {}
        hasDependencies( target:Function ):boolean
        {
            return this.getDependencies( Injector.getArgs(target) ).length>0;
        }
        /// a,b,c,$firstdependency,secondDep...
        processCall( target:Function, argv )
        {
            var args = Injector.getArgs( target.toString() );
            var params = Array.prototype.slice.call(arguments).slice(1);
            var injections = this.getDependencies(args);
            return target.apply(target, argv.concat( injections ) );
        }
        process( target:Function )
        {
            var args = Injector.getArgs( target.toString() );
            return target.apply(target, this.getDependencies(args));
        }

        getDependencies(arr)
        {
            return arr
				.map((value)=>{ return this.dependencies[value]; })
				.filter( (e)=>{ return e!==undefined } );
        }

        register(name:string, dependency:any )
        {
            this.dependencies[name] = dependency;
        }

		dispose()
		{
			this.dependencies = null;
		}
    }


}

/*****


 class Injector
 {
     static FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
     static FN_ARG_SPLIT = /,/;
     static FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
     static STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
     static dependencies:{ [name:string]:Function } = {}
     static getArgs( text ){ return text.match(Injector.FN_ARGS)[1].split(',').map((e)=>{return e.trim()});}
     static hasDependencies( target:Function ):boolean
     {
         return Injector.getDependencies( target ).length>0;
     }
     /// a,b,c,$firstdependency,secondDep...
     static processCall( target:Function,...rest )
     {
         var args = Injector.getArgs( target.toString() );
         var params = Array.prototype.slice.call(arguments).slice(1);
         var injections = Injector.getDependencies(args);
         console.log( injections,params.concat( injections ) )
         return target.apply(target, params.concat( injections ) );
     }
     static process( target:Function )
     {
         var args = Injector.getArgs( target.toString() );
         return target.apply(target, Injector.getDependencies(args));
     }

     static getDependencies(arr)
     {
         console.log(Injector.dependencies);
         var noFiltered = arr.map((value)=>{
             return Injector.dependencies[value];
         });

         console.log( noFiltered , noFiltered.filter( (e)=>{ return e!==undefined } ))

         return noFiltered.filter( (e)=>{ return e!==undefined } )
     }

     static register(name:string, dependency:any )
     {
         this.dependencies[name] = dependency;
     }
 }

 Injector.register('$a',{ aaa:99 });
 Injector.register('$b',{ aaa:99 });
 function pepe(a,b,$a)
 {
     console.log( a,b,$a.aaa)
 }
 function pepe1(a,b)
 {
     console.log( a,b)
 }
 setTimeout( function(){ Injector.processCall(pepe1,10,20); },0);


 */