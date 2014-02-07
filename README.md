#ExpressMocker

A small FAKE REST web server for your daily development. 

* [Features](#features)
* [Installation](#instalation)
* [Command Line Usage](#commandline)
* [Template system](#templateSystem)
* [Storing data](#storingData)
* [Direct raw base64 Output](#raw64)
* [API Reference](#api)

## <a name="features"></a>Features

* Small
* Uses ExpressJS
* Define an endpoint and return JSON data based on a template object
* FakeData generator to use in templates
* Simple NodeJS implemented **localStorage** instance to store things
* Custom methods can be defined in templates
* Can generate SVG imagen on the fly 
* Custom methods can use "Injected" arguments

	* $request // $request object containing GET/POST data
	* $localStorage // localStorage "one file" node implementation
	* $console // debug to node console from the template
	* $helper // access DataFackerHelper methods
	* $utils // access DataFackerUtils methods	



##<a name="instalation"></a>Installation

You need nodejs installed and running in your system.

Clone locally the repository.

Go to your local source folder an type:

		sudo npm install -g

This will install "express-mocker" globally.

##<a name="commandline"></a>Command Line Usage

###Installing
First we need to initialize our express-mocker instance in some dir.
To initialize it in any wanted directory type:

	express-mocker --install
	express-mocker --forceInstall // Overwrites your files!!!
	
This will create a subdir named "express-mocker" with some config files.

###Running

In a dir containing the express-mocker dir type:

	express-mocker
	
This will run express-mocker with the default config.json port and verbose options.

You can also use this command line flags:	

	express-mocker --port <port> // sets the port
	express-mocker --quiet	   // force run in quiet mode
	
### Force exit ;-)

In the case you need to force close the port you can use this command:

	express-mocker --die <port> // closes the port

	
	
## <a name="templateSystem"></a>Template system

### Basic Templating

ExpressMocker uses a simple template system defined by a javascript object:

	var jsonmocker =
	{
		"static": "value", // static value
		"fakeName": "{{firstName}}", // run firstName helper
		"staticArray": [10, 20], // static array
		"dynamicArray": [
			"$repeat(2)", // next item in array will be repeated 2 times
			{
				"name": "{{firstName}} {{lastName}}",
				"age": "{{random(80)}}"
			}
		]
	}

This will output something like this:

	{
    	"static": "value",
    	"fakeName": "Shea",
    	"staticArray": [ 10,20 ],
    	"dynamicArray": [
        	{
            	"name": "Baron Green",
            	"age": "69"
        	},
        	{
            	"name": "Abdullah Gibson",
        	    "age": "48"
    	    }
	    ]
	}
	
#### Using GET/POST vars

	var jsonmocker = 
	{
		"property":"{{var-name}}"
	}

So for:	
	
	/test/:myVar/:mySecondVar
	
We can the take the values as:

	var jsonmocker = 
	{
		 "request_myVar":"{{myVar}}"
		,"request_mySecondVar":"{{mySecondVar}}"
	}
	
#### Custom template methods

You can define custom methods for use in your templates. 

	var jsonmocker = 
	{
		"hello":"{{customMethod}}",
		"hello25":"{{customMethodWithParams(25)}}",
		"customMethod": function(){
			return "World!!"
		},
		"customMethodWithParams":function(numberOfWorlds){
			return "World "+numberOfWorlds+" !!"
		}
	}
		
Output

	{
		"hello":"World!!",
		"hello25":"World 25 !!"
	}		
	
#### Possible Injections in your functions

ExpressMocker uses a simple Injection system with this injections available:

* $request // $request object containing GET/POST data
* $localStorage // localStorage "one file" node implementation
* $console // debug to node console from the template
* $helper // access DataFackerHelper methods
* $utils // access DataFackerUtils methods	

Using it in your custom methods is simple as:

	var jsonmocker =
	{
		// REMEMBER!! You must put FIRST the non Injected params
		customTelephone:function( prefix, $utils )
		{
			return $utils.replacePattern( prefix+'.4##.##.##.##');
		},
		"phone":"{{customTelephone('+33')}}"
	}	

Output

	{
		"phone":"+33.456.78.90"
	}	
	
## <a name="storingData"></a>Storing data	
	
A special key **$preprocessRequest** is reserved to indicate the template that request preprocesing must be done.

Here is where we can use the $localStorage injection most time.

A simple fake GET user registration can be done via:

	For this route:
	
	/user/register/:user/:password
	
	var jsonmocker =
	{
		"$preprocessRequest":function( $localStorate, $request )
		{
			$localStorate.setItem
			(
				'singleUserStore',
				JSON.stringify
				(
					{
						user:$request.params('user),
						password:$request.params('password)
					}
				)
			);
		},
		"code":100		
	}

Calling:
	
	/user/register/test/1234
	
Will generate a singleUserStore key with a JSON representation of the user object.

## <a name="raw64"></a>Direct raw base64 Output

A special key **$content** key "is reserved to indicate that the value of this key must be processed as a base64 output stream.

	var jsonmocker =
	{
		"$content":"data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
	}
	
This will ouput a 1pix gif image ;-) or call it with the provided image function:


	var jsonmocker =
	{
		"$content":"{{image(320,480)}}"
	}
	
## <a name="api"></a>API Reference


|Injectors|$helper|$utils|
|-----|----|----|
|[$helper](#$helper)					|[firstName](#firstName)				|[slug(str)](#slug)
|[$utils](#$utils)						|[lastName](#lastName)					|[shuffle(array)](#shuffle)
|[$scope](#$scope)						|[company](#company)					|[titleCase(str)](#titleCase)
|[$localStorage](#$localStorage)		|[email](#email)						|[replacePattern(pattern)](#replacePattern)
|[$request](#$request)					|[bool](#bool)							|[randomElement(elements)](#randomElement)
|[$console](#$console)					|[image(width,height)](#image)			|[randomNumber(range)](#randomNumber)
|[$helper](#$helper)					|[guid](#guid)							|[randomNumberRange(start,end)](#randomNumberRange)
|										|[loremWords](#loremWords)				
|										|[lorem](#lorem)		


## <a name="$scope"></a>$scope

The $scope object lets you access your other template methods.

	{
		hello:function(){ return 'Hello' },
		world:function(){ return 'world!!' },
		helloWorld:function($scope){
			return $scope.hello()+$scope.world();
		}
		"output":"{{helloWorld}}"
	}

## <a name="$localStorage"></a>$localStorage

Use it as it was the client localStorage but with disk storage.

See more at the project page:
[https://github.com/coolaj86/node-dom-storage](https://github.com/coolaj86/node-dom-storage)

## <a name="$request"></a>$request

Provides access to the query params and the processed body headers.

#####<a name="requestParams"></a>params( id:string ):string;

	Returns the request query parameter specified by id. 

#####<a name="requestBody"></a>body( id:string ):any;

	Returns the request body object specified by id. 

## <a name="$console"></a>$console

Provides a unified form ( with quiet mode ) to log messages to the console.

Supported methods:

* log(…rest)
* info(…rest)
* error(…rest)
* success(…rest)

## <a name="$helper"></a>$helper


#####<a name="firstName"></a>firstName

	{{firstName}} 
	Returns a random First Name. 

#####<a name="lastName"></a>lastName

	{{lastName} 

	Returns a random Last Name.
	
#####<a name="company"></a>company

	{{company}}
	Returns a random Company name.
	
#####<a name="email"></a>email

	{{email}}
	Returns a random generated email.
	
#####<a name="bool"></a>bool

	{{bool}}
	Returns a random boolean value.
		
#####<a name="image"></a>image(width,height)

	{{image(width,height)}}
	Returns a random base64 encoded svg image.
	
#####<a name="guid"></a>guid

	{{guid}}
	Returns a random Globally unique identifier.
	
#####<a name="loremWords"></a>loremWords(number)

	{{loremWords(number)}}
	Returns a random number of loremipsum words.
	
#####<a name="lorem"></a>lorem( paragraphs,html=false,sentenceWords=(15-45) )

	{{lorem(5)}}
	Returns a loremipsum string composed of n paragraphs.
	
	{{lorem(5,true)}}
	If html is true it will add <p> tags for each paragraph.
	
	{{lorem(5,true,15)}}
	Determine words per sentence. Default is a random value 15-45
	
	
## <a name="$utils"></a>$utils

	
#####<a name="slug"></a>slug(str:string):string

	{{slug('some long texy')}}
	Returns a slugged version of str.
	
#####<a name="shuffle"></a>shuffle(array:any[]):any[]

	{{shuffle(array)}}
	Returns a randomided version of the provided array.
	
#####<a name="titleCase"></a>titleCase(str:string):string

	{{titleCase(str)}}
	Returns a titleCase representation of str.
	
#####<a name="replacePattern"></a>replacePattern(pattern):string

	{{replacePattern('####-UUUU-LLLL')}}
	Processes the provided pattern replacing:
	
	# by a number.
	U by a uppercase letter.
	L by a lowercase letter.
	
#####<a name="randomElement"></a>randomElement(elements:any[]):any

	{{randomElement([10,\"demo\",true])}}
	Returns a random element from the provided array.
	
#####<a name="randomNumber"></a>randomNumber(max)

	{{randomNumber(25)}}
	Returns a random number between 0 and max;
	
#####<a name="randomNumberRange"></a>randomNumberRange(start,end)

	{{randomNumberRange(5,10)}}
	Returns a random number between start and end;		
