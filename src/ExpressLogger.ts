export class ExpressLogger
{
	public static colors:{ [key:string]:string } =
	{
		'black':            '\033[30m',
		'red':              '\033[31m',
		'green':            '\033[32m',
		'yellow':           '\033[33m',
		'blue':             '\033[34m',
		'magenta':          '\033[35m',
		'cyan':             '\033[36m',
		'white':            '\033[37m'
	};
	public static quiet:boolean = false;

	private static print( color, rest )
	{
		if( !ExpressLogger.quiet ) console.log.apply( console, ['[Express Mocker]'].concat( rest).map((e)=>{ return ExpressLogger.color( color , e) })  );
	}
	public static log(...rest):		void { ExpressLogger.print('black', rest ); }
	public static info(...rest):		void { ExpressLogger.print('cyan', rest ); }
	public static error(...rest):	void { ExpressLogger.print('red', rest ); }
	public static success(...rest):	void { ExpressLogger.print('green', rest ); }

	private static color( color, text )
	{
		if( !Object.keys( ExpressLogger.colors ).indexOf( color ) ) return text;
		return [ ExpressLogger.colors[ color ], text , ExpressLogger.colors['black'] ].join('');
	}
}