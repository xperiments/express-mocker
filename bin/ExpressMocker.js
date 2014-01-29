#!/usr/bin/env node
var pkg = require("../package.json"),
	commander = require("commander"),
	fs = require("fs"),
	path = require("path"),
	ExpressMocker = require("../src/ExpressMocker.js").es.xperiments.nodejs.ExpressMocker;

var defaultConfigFile =
{
	port:7878
	,quiet:false
	,statics:[
		{ route:'/src', directory:'/src' }
	]
	,defaultRoutes:
	[
		/*{
			 verb:"get"
			,route:"/admin"
			,basicAuth:{ login:'xperiments', password:'viernes13' }
			,response:
			{
				 source:"file.json"
				,headers:
				[
					{"Access-Control-Allow-Origin":"*"},
					{"Content-Length":348}
				]
			}
		}

		 {
		 "verb": "get",
		 "route": "/admin",
		 "basicAuth": {
		 "login": "xperiments",
		 "password": "viernes13"
		 },
		 "response": {
		 "source": "data:application/json-mock;base64,ew0KCWI6Ww0KCQkgIiRyZXBlYXQ6MzAiDQoJCSx7DQoJCQkibmFtZSI6Int7Y2xlYXJ9fSINCgkJCSwic3VybmFtZSI6Int7JGZpcnN0TmFtZX19Ig0KCQkJLCJpZCI6Int7JHF1ZXJ5KCdpZCcpfX0iDQoJCX0NCgldDQoJLCJjbGVhciI6ZnVuY3Rpb24oKXtyZXR1cm4gJzc3Nzc3J30NCn07"
		 }
		 },



		*/
		{
			verb:"get"
			,route:"/admin"
			,basicAuth:{ login:'xperiments', password:'viernes13' }
			,response:
			{
				source:"data:application/json-mock;base64,ew0KCWI6Ww0KCQkgIiRyZXBlYXQ6MzAiDQoJCSx7DQoJCQkibmFtZSI6Int7Y2xlYXJ9fSINCgkJCSwic3VybmFtZSI6Int7JGZpcnN0TmFtZX19Ig0KCQkJLCJpZCI6Int7JHF1ZXJ5KCdpZCcpfX0iDQoJCX0NCgldDQoJLCJjbGVhciI6ZnVuY3Rpb24oKXtyZXR1cm4gJzc3Nzc3J30NCn07"
			}
		}
		,{
			verb:"get"
			,route:"/gif"
			,response:
			{
				source:"data:image/gif;base64,R0lGODlhEAAQAMQAAORHHOVSKudfOulrSOp3WOyDZu6QdvCchPGolfO0o/XBs/fNwfjZ0frl3/zy7////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAkAABAALAAAAAAQABAAAAVVICSOZGlCQAosJ6mu7fiyZeKqNKToQGDsM8hBADgUXoGAiqhSvp5QAnQKGIgUhwFUYLCVDFCrKUE1lBavAViFIDlTImbKC5Gm2hB0SlBCBMQiB0UjIQA7"
			}
		}
		,{
			verb:"get"
			,route:"/file"
			,response:
			{
				source:"file.json-mk"
			}
		}
	]

}




var expressMockerConfigDir = "./express-mocker"
var expressMockerConfigPath = expressMockerConfigDir + "/config.json"

commander
	.version(pkg.version)
	.option("-i, --install", "Install ExpressMocker into the current project.")
	.option("-f, --forceInstall", "[ SURE? ] Changes to the config files will be lost!!")
	.option("-q, --quiet", "Disable console logging")
	.option("-p, --port <port>", "Port that the http mock server will use. Default is 7878.", 0)
	.parse(process.argv);

if( commander.install || commander.forceInstall )
{
	if( !fs.existsSync(expressMockerConfigPath) || commander.forceInstall )
	{

		if( !fs.existsSync( expressMockerConfigDir ) )
		{
			fs.mkdir( expressMockerConfigDir )
		}
		fs.writeFile( expressMockerConfigPath, JSON.stringify(defaultConfigFile, null, "	"));
		console.log('ExpressMocker is configured for the current project.');
		console.log('Edit the express-mocker.m.json file to change params');
		console.log('Navigate to 127.0.0.1:7878/admin to configure the routes');
	}
	else
	{
		console.log('[ATTENTION] Current dir allready has ExpressMocker installed');
		console.log('[ATTENTION] Use --foceIntall to override it');
	}
}
else
{
	if( !fs.existsSync(expressMockerConfigPath))
	{
		console.log('Error: ExpressMocker is not configured for the current dir.  Use "express-mocker --install" to init it in the current dir');
	}
	else
	{

		new ExpressMocker( __dirname, process.cwd())
			.loadConfig( expressMockerConfigPath )
			.setQuiet( commander.quiet )
			.setPort( commander.port )
			.createServer();

	}
}
