#ExpressMocker



##Features

* Small
* Uses ExpressJS
* Define an endpoint and return JSON data based on a template object
* FakeData generator to use in templates
* Simple NodeJS implented **localStorage** instance to store things
* Custom methods can be defined in templates
* Custom methods can use "Injected" arguments

	* $request // $request object conatining GET/POST data
	* $localStorage // localStorage "one file" node implementation
	* $console // debug to node console from the template
	* $helper // access FakeData generator methods



##Installation

You need nodejs installed and runing in your system.

Clone locally the repository.

Go to your local source folder an type:

		sudo npm install -g

This will install "express-mocker" globally.

##Command Line Usage

###Installing
First we need to initialize our express-mocker instance in some dir.
To initialize it in any wanted directory type:

	express-mocker	--install
	
This will create a subdir named "express-mocker" with some config files.

###Running

In a dir containing the express-mocker dir type:

	express-mocker
	
This will run express-mocker with the default config.json port and vervose options.

You can also use this command line flags:	

	express-mocker -p 8081 // sets the port
	express-mocker -q // force run in quiet mode
	
##Template system

### Basic Templating

Express mocker uses a simple template system defined by a javascript object:

	var jsonmocker = {
		"static": "value", // static value
		"fakeName": "{{firstName}}", // run firstName helper
		"staticArray": [10, 20], // static array
		"dynamicArray": [
			"$repeat:2", // next item in array will be repeated 2 times
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
	
### Custom template methods

You can define custom methods for use in your templates. 

	var jsonmocker = 
	{
		"hello": "{{customMethod}}",
		"hello25": "{{customMethodWithParams(25)}}",
		"customMethod": function(){ return "World!!"},
		"customMethodWithParams": function(numberOfWorlds){ return "World "+numberOfWorlds+" !!"}

	}
		
Output

	{
		"hello":"World!!",
		"hello25":"World 25 !!"
	}		