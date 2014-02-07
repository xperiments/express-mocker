#!/usr/bin/env node
var pkg = require("../package.json"),
	commander = require("commander"),
	Logger = require("../src/ExpressLogger.js").ExpressLogger,
	fs = require("fs"),
	path = require("path"),
	expressMockerConfigDir = "./express-mocker",
	expressMockerConfigPath = expressMockerConfigDir + "/config.json",
	defaultConfigFile =
	{
		port:7878
		,quiet:false
		,defaultRoutes:
		[
			{
				verb:"get"
				,active:true
				,route:"/example"
				,response:
				{
					source:"data:application/json-mock;base64,IHsKICAgICJoZWxsbyI6Int7Zmlyc3ROYW1lfX0iCn0="
				}
			}
		]

	}

function runServer()
{
	var ExpressMocker = require("../src/ExpressMocker.js").ExpressMocker;
	new ExpressMocker( __dirname, process.cwd())
		.loadConfig( expressMockerConfigPath )
		.setQuiet( commander.quiet )
		.setPort( commander.port )
		.createServer();
}

//https://gist.github.com/timoxley/1689041
function isPortTaken( port, fn ) {

	var net = require('net');
	var tester = net.createServer()
		.once('error', function (err) {
			if (err.code != 'EADDRINUSE') return fn(err)
			fn(null, true)
		})
		.once('listening', function() {
			tester.once('close', function() { fn(null, false) })
				.close()
		})
		.listen(port)
}

commander
	.version(pkg.version)
	.option("-i, --install", "Install ExpressMocker into the current project.")
	.option("-f, --forceInstall", "[ SURE? ] Changes to the config files will be lost!!")
	.option("-q, --quiet", "Disable console logging")
	.option("-p, --port <port>", "Port that the http mock server will use. Default is 7878.", 0)
	.option("-d, --die <dieport>", "Force shutdown of the server at the specified port", 0 )
	.parse(process.argv);


if( commander.die!=0 )
{
	isPortTaken( commander.die , function( error, inUse )
	{
		if( inUse )
		{
			var http = require('http');
			http.get({host: '127.0.0.1', port: commander.die, path: '/express-mocker/stop-server'}, function(res) {
				res.setEncoding('utf8');
				res.on('data',function(chunk){
					if( chunk=='{"code":100}' )
					{
						Logger.log('Closed ExpressMocker instance at port', commander.die );
					}
					else
					{
						Logger.error('Something has gone wrong while closing port', commander.die );
					}
					process.exit(0);

				})
			});

		}
		else
		{
			Logger.error(["Can't close port ", commander.die, ". Port is not in use."].join('') );
		}

	});
	return;
}


if( commander.install || commander.forceInstall )
{
	if( !fs.existsSync(expressMockerConfigPath) || commander.forceInstall )
	{
		if( !fs.existsSync( expressMockerConfigDir ) )
		{
			fs.mkdir( expressMockerConfigDir )
		}
		fs.writeFileSync( expressMockerConfigPath, JSON.stringify(defaultConfigFile, null, "	"));
		Logger.log('ExpressMocker is now configured for the current project.');
		Logger.log('Navigate to 127.0.0.1:7878/express-mocker to access the Dashboard');
		runServer();
	}
	else
	{
		Logger.error('[ATTENTION] Current dir allready has ExpressMocker installed');
		Logger.error('[ATTENTION] Use --forceIntall to override it');
	}
}
else
{
	if( !fs.existsSync(expressMockerConfigPath))
	{
		Logger.error('[ATTENTION] Error: ExpressMocker is not configured for the current dir.');
		Logger.log('[ATTENTION] Use "express-mocker --install" to init it in the current dir.');
	}
	else
	{
		runServer();
	}
}
