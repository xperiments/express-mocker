///<reference path="d.ts/DefinitelyTyped/node/node.d.ts"/>
///<reference path="d.ts/DefinitelyTyped/express/express.d.ts"/>
///<reference path="JSONMocker.d.ts"/>

import express = require('express');
import fs = require('fs');
import jsonmocker = require("./JSONMocker");jsonmocker;
import JSONMocker = jsonmocker.JSONMocker;
import logger = require("./ExpressLogger");logger;
import Logger = logger.ExpressLogger;



export
interface IExpressMockerConfig
{
	port: number;
	quiet: boolean;
	statics?:IExpressMockerStatic[];
	adminAuth?:IExpressMockerBasicAuth;
	defaultRoutes:IExpressMockerRoute[];
}

export
interface IExpressMockerStatic
{
	route:string;
	directory:string;
}

export
interface IExpressMockerBasicAuth
{
	login:string;
	password:string;
}

export
interface IExpressMockerRoute
{
	active:boolean;
	id: string;
	verb:string;
	route:string;
	response:IExpressMockerResponse;
	hidden?:boolean;
	basicAuth?:IExpressMockerBasicAuth;
	routeParams?: IExpressMockerRouteParams;
}

export
interface IExpressMockerResponse
{
	source:string;
	headers?:IExpressMockerResponseHeaders
}
export
interface IExpressMockerRouteParams {
	name: string;
	value: string;
	description: string;
}
export
interface IExpressMockerResponseHeaders
{
	[index: string]: any;
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


import http = require("http");

//TODO Find updated express.d.ts

interface ICloseable
{
	close();
}
export
class ExpressMocker
{
	private express:express.Express;
	private expressListener:ICloseable; // TODO fix express.d.ts to correctly anotate this
	private config:IExpressMockerConfig;
	private configPath:string;

	constructor(private npmDir:string, private rootDir:string ){}

	public loadConfig( path:string ):ExpressMocker
	{
		this.configPath = path;

		this.config = JSON.parse( <string><any>fs.readFileSync(path,'utf8'));

		//config.json file route
		var adminRoute:IExpressMockerRoute = {
			id:this.shash('/express-mocker/config.json'),
			hidden:true,
			active:true,
			verb: "get",
			route: "/express-mocker/config.json",
			response:
			{
				source: "config.json"
			}

		}

		// set same config.json basicAuth access privileges
		if( this.config.adminAuth ){ adminRoute.basicAuth = this.config.adminAuth; }

		// add admin routes
		this.config.defaultRoutes.push( adminRoute );

		// set quiet mode
		Logger.quiet = this.config.quiet;

		return this;
	}

	public setPort( port:number ):ExpressMocker
	{
		if( this.config && port!=0 ) this.config.port = port;
		return this;
	}

	public getPort():number
	{
		return this.config.port;
	}
	public setQuiet( mode:boolean ):ExpressMocker
	{
		if( Logger.quiet != mode  ){ Logger.quiet = mode; }
		return this;
	}

	public createServer():ExpressMocker
	{
		this.express = express();
		this.express.use(express.urlencoded());
		this.express.use(express.json());
		this.express.use(this.corsMiddleware.bind(this));
		this.express.use(express.static(__dirname ))

		// error that raises when port is already in use
		process.on('uncaughtException',(err:any) => {
			if(err.errno === 'EADDRINUSE')
				Logger.error('Port', this.config.port, 'is alrready in use!!');
			else
				Logger.error(err);
			process.exit(1);
		});

		this.configureRoutes();
		this.configureAdmin();
		this.configureStatics();
		this.expressListener = <ICloseable>this.express.listen( this.config.port );
		Logger.success('[Express Mocker] Starting server at port:', this.config.port );
		return this;
	}


	private configureStatics():void
	{
		if( this.config.statics )
		{
			this.config.statics.map( ( staticDir:IExpressMockerStatic )=>{
				if ( fs.existsSync(this.rootDir + staticDir.directory) )
				{
					Logger.success('Mapping route:',staticDir.route, 'to:', this.rootDir + staticDir.directory );
					this.express.use( staticDir.route, express.static( this.rootDir + staticDir.directory) );
				}
				else
				{
					Logger.error('Error Mapping route:',staticDir.route, 'to:', this.rootDir + staticDir.directory );
				}
			});
		}
	}

	private configureAdmin():void
	{

		this.express.get('/express-mocker/stop-server', ( req:express.Request, res:express.Response )=>{
			res.send('{"code":100}');
			Logger.success('Closing..');
			this.expressListener.close();
		});

		this.express.post('/express-mocker/update', ( req:express.Request, res:express.Response )=>{

			fs.writeFileSync(this.configPath, JSON.stringify(req.body.config, null, 4),'utf8');
			res.writeHead(200, {"Content-Type": "application/json"});
			res.end('{"code":100}');
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
		if(!route.hidden) Logger.info('Add route', route.verb.toUpperCase(), route.route )

		// add routing
		this.express[route.verb]( route.route,( req:express.Request, res:express.Response )=>{this.sendResponse(req, res, route)} );
	}

	private sendResponse( req:express.Request, res:express.Response, route:IExpressMockerRoute ):void
	{
		Logger.info('Processing route:', route.route );
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
					,mime:string = dataUrlInfo[1];


				// if response is a JSONMocker file
				if( mime != "application/json-mock" )
				{
					// send the mine/base64 response from the buffer
					var buffer:NodeBuffer = Base64.decodeBuffer( dataUrlInfo[3] );
					var len = Buffer.byteLength( buffer.toString('utf8') ,'utf8');
					this.sendContentLength( res, mime, len );
					res.send( buffer );
				}
				else
				{
					var outputBuffer:string = Base64.decode( dataUrlInfo[3]);
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
		var template:{ $content?:string } = new JSONMocker().parseTemplate( data, mix( req.params, req.body ) );

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


	// HELPERS

	private shash(string:string):string
	{
		var value:number = 0;
		for (var i:number = 0; i < string.length; i++)
		{
			var cc:number = string.charCodeAt(i) + 96;
			value = ((value * 27) + cc) % 9999999999999999;
		}
		return value.toString(16).toUpperCase();
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
	static decodeBuffer( buffer:string ):NodeBuffer
	{
		return new Buffer( buffer, 'base64');
	}
}

