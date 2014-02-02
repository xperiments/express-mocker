/**
 * Created by pcasaubon on 2/1/14.
 */
console.log('\033[30m this will be red\0') // nego


colorize('black','green');
colorize('red','green');
colorize('green','green');
colorize('yellow','green');
colorize('blue','green');
colorize('magenta','green');
colorize('cyan','green');
colorize('white','green');


function colorize( color, text )
{
	var colors = {
		'black':            ['\033[30m'],
		'red':              ['\033[31m'],
		'green':            ['\033[32m'],
		'yellow':           ['\033[33m'],
		'blue':             ['\033[34m'],
		'magenta':          ['\033[35m'],
		'cyan':             ['\033[36m'],
		'white':            ['\033[37m']
	};

	if( !Object.keys( colors ).indexOf( color ) )
	{
		console.log( text ) ; return;
	}

	console.log(  [ colors[ color ], text , colors['black'] ].join('') )
}