///<reference path="typings/angularjs/angular.d.ts"/>
///<reference path="typings/angularjs/angular-route.d.ts"/>


declare function jsmin( input:string, level:number ):string;
/**
 * Header for Showdown: https://github.com/coreyti/showdown
 */
interface IShowdownStatic
{
    converter():/*IShowdown*/void; // TS2084: Call signatures used in a 'new' expression must have a 'void' return type.
}
interface IShowdown
{
	makeHtml(html:string): string;
}

declare var Showdown: IShowdownStatic;


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
	description?:string;
	hidden?:boolean;
	basicAuth?:IExpressMockerBasicAuth;
	routeParams?:{ [name:string]:IExpressMockerRouteParams };
}

export
interface IExpressMockerResponse
{
	source:string;
	headers?:IExpressMockerResponseHeaders
}
export
interface IExpressMockerRouteParams {
	name?: string;
	value?: string;
	description?: string;
}
export
interface IExpressMockerResponseHeaders
{
	[index: string]: any;
}




export
interface ISortableRoute
{
	column:string;
	descending:boolean;
}



class MainController
{
    private static MODE_ADD:number = 0;
    private static MODE_EDIT:number = 1;

	private showdown:IShowdown = new Showdown.converter();
	private editMode:number;

	// UI SWITCHS
	public listVisible:boolean = true;
	public previewRouteVisible:boolean = false;
	public previewDescription:boolean = false;
	public showDescription:boolean = false;

	// BASE
	public loading:boolean = true;
	public config:IExpressMockerConfig;
	public reloadNeeded:boolean = false;
	public docsFile:string = "docs.html";

	// LIST
	public currentListPage:number = 0;
	public currentListPageSize:number = 6;
	public searchFilter:string;
	public filteredRoutes:IExpressMockerRoute[] =[];

	// EDITOR
	public currentRoutePreviewCode:string ="";
	public currentRoutePreviewMode:number = 0;
	public currentResponseType:number;
	public currentRouteId:string;
	public currentRoute:IExpressMockerRoute = { verb:'get', active:true, route:'', response:{ source:''}, id:'new' ,description:'' };
	public currentRoutePreview:string = "";
	public markDownPreview:string;

    constructor(private $scope, private $http:ng.IHttpService , private $route:ng.route.IRouteService, private $routeParams:ng.route.IRouteParamsService, private $location:ng.ILocationService, private $timeout:ng.ITimeoutService, private $sce:ng.ISCEService, private $filter )
    {

        var timer:ng.IPromise<any>;
        var timerDescription:ng.IPromise<any>;
        var timerJSON:ng.IPromise<any>;
		var timerSearch:ng.IPromise<any>;

		// watch current route to detect route param changes
        $scope.$watch('mc.currentRoute.route', ()=>{
            if(timer){
                $timeout.cancel(timer)
            }
            this.currentRoute && this.currentRoute.route!='' && ( timer= $timeout(()=>{ this.updateParams() },1000) );
        });

		// watch current description to detect changes in the description editor
        /*$scope.$watch('mc.currentRoute.description', ()=>{
            if(timerDescription){
                $timeout.cancel(timerDescription)
            }
            if( this.previewDescription)
            {
                timerDescription= $timeout(()=>{ this.updateDescription() },500);
            }
        });*/

		$scope.$watch('mc.searchFilter', ()=>{
			if(timerSearch){
				$timeout.cancel(timerSearch)
			}

			timerSearch= $timeout(()=>{ this.updateSearchFilter() },300);

		});


		// watch admin side route changes
		// this is the actual app router
        this.$scope.$on
		(
            "$routeChangeSuccess",
            ( $currentRoute, $previousRoute )=>
			{

                var action:string = this.$route.current['action'];

                switch( action )
                {
                    case "list":
                        this.listVisible = true;
						this.currentListPage = parseInt( this.$routeParams['page'], 10);
                        break;
                    case "edit":
                        var id = this.$routeParams['id'];
                        this.edit(id);
                        break;
                    case "add":
                        this.add();
                        break;
                }

            }
        );

		// list sorting
		$scope.sort =<ISortableRoute>
		{
			column: '',
			descending: false
		};

		// TODO check what is causing the problem
		// inititalize to avoid init errors
		this.config = { port:7878, quiet:false, defaultRoutes:[]};
        this.loadConfig();
    }


	// BASE

	public loadConfig():void
	{
		this.loading = true;
		this.$http.get('/express-mocker/config.json').success((data, status, headers, config)=>
		{
			this.config = data;
			this.loading = false;

			// Fix old routes
			this.config.defaultRoutes.map( ( route:IExpressMockerRoute )=>{
				if (!route.id )
				{
					route.id = this.shash( route.route );
				}
			});
			this.showList();
		});
	}

	private showList()
	{
		this.$location.path('/list');
		this.listVisible = true;
	}



	// LIST

	public updateSearchFilter()
	{
		this.filteredRoutes = this.$filter('filter')(this.config.defaultRoutes, this.searchFilter );
	}

	// returns the total number of pagination pages
	public numberOfPages( ):number
	{
		return Math.ceil(this.filteredRoutes.length/this.currentListPageSize);
	}

	// angular helper that creates an array to iterate in the pages div
	public numberOfPagesIterable( ):number[]
	{
		var count:number = 0, total = this.numberOfPages( );
		console.log( this.currentListPage , total)
		if( this.currentListPage > total ) this.currentListPage = 0;
		return new Array(total+1).join('0').split('').map((e)=>{ return count++ });
	}

	// helper to change the route columns ordering
	public changeListSorting(column:string):void
	{
		var sort:ISortableRoute = this.$scope.sort;

		if (sort.column == column)
		{
			sort.descending = !sort.descending;
		}
		else
		{
			sort.column = column;
			sort.descending = false;
		}
	}

	public toggleRouteActive( id:string ):void
	{
		var index:number = this.getRouteIndex(id);
		this.config.defaultRoutes[index].active = !this.config.defaultRoutes[index].active;
		this.saveToDisk();
	}

	public add():void
	{
		this.showDescription = false;
		this.previewDescription = false;
		this.editMode = MainController.MODE_ADD;
		this.currentResponseType = 0;
		this.currentRoute = { verb:'get', active:true, route:'', response:{ source:''}, id:'new' }
		this.listVisible = false;
		this.setType( 0 );
	}

	public gotoEdit(id:number):void
	{
		this.$location.path('/edit/'+id)
	}

	public edit(id:string):void
	{
		this.showDescription = false;
		this.previewDescription = false;
		this.editMode = MainController.MODE_EDIT;
		this.currentRoute = this.createEditObject( this.getRouteById( id ) );
		this.currentRouteId = id;
		this.listVisible = false;
	}

	public delete(id:string):void
	{
		var itemToDelete:IExpressMockerRoute = this.config.defaultRoutes[ this.getRouteIndex(id) ];
		var itemPos:number = this.config.defaultRoutes.indexOf( itemToDelete );
		this.config.defaultRoutes.splice( itemPos,1 );
		this.saveToDisk();
		this.showList();
	}

	// EDITOR

	///
	public onDescriptionEditor( editor )
	{
		console.log( editor )
		//editor.setReadOnly(true);
	}

	public toggleDescriptionPreview():void
	{
		this.previewDescription=!this.previewDescription;
		if( this.previewDescription && !this.showDescription ) { this.showDescription=true; }
		this.updateDescription();
	}
	public toggleDescriptionEdit():void
	{
		this.previewDescription ? (this.showDescription=true,this.previewDescription = false):( this.showDescription=!this.showDescription,this.previewDescription = false);
	}

	public updateParams():void
	{
		if( this.currentRoute && this.currentRoute.route )
		{
			if( !this.currentRoute.routeParams ) this.currentRoute.routeParams = {};
			var paramsRegExp:RegExp = /(:.[^\/]*)/g;
			var cloneParams:string[] = this.currentRoute.route.match( paramsRegExp );
			if( cloneParams )
			{
				cloneParams = cloneParams.map( (e)=>{ return e.substr(1); })
				cloneParams.map( (e)=>{
					this.currentRoute.routeParams[ e ] = this.currentRoute.routeParams[ e ] || {name:e,value:'',description:''};
				})

				var outputObject:IExpressMockerRouteParams = MainController.clone( this.currentRoute.routeParams );
				Object.keys( outputObject ).map((e)=>{

					if( cloneParams.indexOf(e )==-1 ) delete outputObject[e];

				});

				console.log( outputObject,'000' )
				this.currentRoute.routeParams = outputObject;
			}
			else
			{
				this.currentRoute.routeParams = {};
			}

		}
	}


	///
	public updateDescription():void
	{
		console.log('paso')
		var paramPredocs:string = "#### Route\n\t"+this.currentRoute.route+'\n\n';
		var paramsDocs:string ="";

		paramsDocs+="\n\n#### Parameters\n";
		var keys:boolean = false;
		Object.keys(this.currentRoute.routeParams).map( (e:string)=>{
			var elm = this.currentRoute.routeParams[e];
			keys = true;
			paramsDocs+= '* **'+elm.name+'** '+ elm.description+'\n'
		})

		console.log( paramsDocs )
		paramsDocs = !keys ? "": paramsDocs+'\n\n';

		if( this.currentRoute.description == undefined )
		{
			this.currentRoute.description = "";
		}
		this.currentRoute && ( this.markDownPreview = this.showdown.makeHtml( paramPredocs+this.currentRoute.description+paramsDocs ) );
	}

	public previewRoute( current:IExpressMockerRoute ):void
	{
		this.previewRouteVisible = !this.previewRouteVisible;

		var url:string = current.route;

		var paramsRegExp:RegExp = /(:.[^\/]*)/g;
		var cloneParams:string[] = this.currentRoute.route.match( paramsRegExp );
		cloneParams && cloneParams.map((e)=>{ url = url.replace( e, current.routeParams[e.substr(1)].value) });

		this.$http.head(url).success((data, status, headers, config)=>
		{

			if( headers('Content-Type').indexOf("application/json")!=-1 )
			{
				this.$http.get(url).success((data, status, headers, config)=>
				{
					this.currentRoutePreviewMode = 0;
					this.currentRoutePreviewCode = JSON.stringify( data,null,'	' );
				});
			}
			else
			{
				this.currentRoutePreviewCode = "";
				this.currentRoutePreviewMode = 1;
				this.currentRoutePreview = url;
			}

		});

	}


	public browseForFile():void
	{
		(<HTMLInputElement>document.querySelector('#uploadFile')).click();
	}

	public fileSelected(files:FileList):void
	{
		var reader:FileReader = new FileReader();
		reader.onload =(e)=>
		{
			this.currentRoute.response.source = e.target.result;
			this.$scope.$apply();
		}
		// Read in the image file as a data URL.
		reader.readAsDataURL(files[0]);
	}

	public setType( type:number ):void
	{
		switch( type )
		{
			case 0:
				this.currentRoute.response.source = "var jsonmocker = {\n\n}";
				break;
			case 1:
			case 2:
				this.currentRoute.response.source = "";
				this.previewRouteVisible = false;
				break;

		}
		this.currentResponseType = type;
	}

	public cancel():void
	{
		this.showList();
	}

	public save():void
	{
		if( this.currentResponseType == 0 )
		{
			var source:string = this.currentRoute.response.source;
			source = source.substring( source.indexOf('{')-1,source.lastIndexOf('}')+1);
			source=MainController.utf8_encode(source);
			this.currentRoute.response.source = "data:application/json-mock;base64,"+window.btoa( source );
		}

		if( this.editMode == MainController.MODE_ADD )
		{
			this.config.defaultRoutes.push( this.currentRoute );
		}
		else
		{
			this.config.defaultRoutes[this.getRouteIndex( this.currentRouteId ) ] = this.currentRoute;
		}
		this.saveToDisk();
		this.showList()
	}


	public setCurrentVerb( verb:string ):void
	{
		//TODO
		// Find if a same route currently exists
		this.currentRoute.verb = verb;
	}


	// HELPERS

	public isUndefined( obj:any ):boolean
	{
		return  JSON.stringify(obj) === "{}" || obj === undefined;
	}

	// ported from https://github.com/NothingAgency/tetragon/tree/master/src/engine/tetragon/util/hash
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

	private getRouteById( id:string ):IExpressMockerRoute
	{
		var routes:IExpressMockerRoute[] = this.config.defaultRoutes;
		var found:IExpressMockerRoute = null;
		for( var i:number= 0, total:number = routes.length; i<total; i++ )
		{
			if( routes[i].id == id )
			{
				found = routes[i];
				break;
			}
		}
		return found;
	}

	private getRouteIndex( id:string ):number
	{
		var routes:IExpressMockerRoute[] = this.config.defaultRoutes;
		var index:number = null;
		for( var i:number= 0, total:number = routes.length; i<total; i++ )
		{
			if( routes[i].id == id )
			{
				index = i;
				break;
			}
		}
		return index;
	}


    private createEditObject( route:IExpressMockerRoute ):IExpressMockerRoute
    {
        var clone:IExpressMockerRoute = MainController.clone<IExpressMockerRoute>( route )
        	,isDataUrlRegExp:RegExp = /^data:(.+\/(.+));base64,(.*)$/
            ,source = clone.response.source
            ,isFileDataUrlEncoded:boolean = isDataUrlRegExp.test( source );

        if( isFileDataUrlEncoded )
        {
            var dataUrlInfo:RegExpExecArray = isDataUrlRegExp.exec( source )
                ,mime:string = dataUrlInfo[1];

            if( mime == "application/json-mock" )
            {
                this.currentResponseType = 0;
                clone.response.source = 'var jsonmocker = '+ MainController.utf8_decode( window.atob( dataUrlInfo[3]  ) );
            }
            else
            {
                this.currentResponseType = 1;
            }
        }
        else
        {
            this.currentResponseType = 2;
        }

        return clone;

    }

	private saveToDisk():void
	{
		this.reloadNeeded = true;
		this.loading = true;
		this.$http.post('/express-mocker/update',{config:JSON.parse( angular.toJson(this.config ,true) )}).then(()=>{ this.loading = false;});
	}

	private reload():void
	{
		this.loading = true;
		this.$http.get('/express-mocker/reload').then(()=>{ this.$location.path('/list');this.reloadNeeded= this.loading = false;  this.loadConfig(); })
	}

	static clone<T>(obj:T):T
	{
		return JSON.parse( JSON.stringify( obj ) );
	}

	static utf8_encode(argString:string):string
	{
		// From: http://phpjs.org/functions
		// +   original by: Webtoolkit.info (http://www.webtoolkit.info/)
		// +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
		// +   improved by: sowberry
		// +    tweaked by: Jack
		// +   bugfixed by: Onno Marsman
		// +   improved by: Yves Sucaet
		// +   bugfixed by: Onno Marsman
		// +   bugfixed by: Ulrich
		// +   bugfixed by: Rafal Kukawski
		// +   improved by: kirilloid
		// +   bugfixed by: kirilloid
		// *     example 1: utf8_encode('Kevin van Zonneveld');
		// *     returns 1: 'Kevin van Zonneveld'

		if (argString === null || typeof argString === "undefined") {
			return "";
		}

		var string:string = (argString + ''); // .replace(/\r\n/g, "\n").replace(/\r/g, "\n");
		var utftext:string = '',
			start:number, end:number, stringl:number = 0;

		start = end = 0;
		stringl = string.length;
		for (var n:number = 0; n < stringl; n++) {
			var c1:number = string.charCodeAt(n);
			var enc:string = null;

			if (c1 < 128) {
				end++;
			} else if (( c1 > 127) && (c1 < 2048)) {
				enc = String.fromCharCode(
					(c1 >> 6)        | 192,
					( c1        & 63) | 128
				);
			} else if ((c1 & 0xF800) != 0xD800) {
				enc = String.fromCharCode(
					(c1 >> 12)       | 224,
					((c1 >> 6)  & 63) | 128,
					( c1        & 63) | 128
				);
			} else { // surrogate pairs
				if ((c1 & 0xFC00) != 0xD800) { throw new RangeError("Unmatched trail surrogate at " + n); }
				var c2:any = string.charCodeAt(++n);
				if ( (c2 & 0xFC00) != 0xDC00) { throw new RangeError("Unmatched lead surrogate at " + (n-1)); }
				c1 = ((c1 & 0x3FF) << 10) + (c2 & 0x3FF) + 0x10000;
				enc = String.fromCharCode(
					(c1 >> 18)       | 240,
					((c1 >> 12) & 63) | 128,
					((c1 >> 6)  & 63) | 128,
					( c1        & 63) | 128
				);
			}
			if (enc !== null) {
				if (end > start) {
					utftext += string.slice(start, end);
				}
				utftext += enc;
				start = end = n + 1;
			}
		}

		if (end > start) {
			utftext += string.slice(start, stringl);
		}

		return utftext;
	}

	static utf8_decode(str_data:string):string
	{
		//  discuss at: http://phpjs.org/functions/utf8_decode/
		// original by: Webtoolkit.info (http://www.webtoolkit.info/)
		//    input by: Aman Gupta
		//    input by: Brett Zamir (http://brett-zamir.me)
		// improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
		// improved by: Norman "zEh" Fuchs
		// bugfixed by: hitwork
		// bugfixed by: Onno Marsman
		// bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
		// bugfixed by: kirilloid
		//   example 1: utf8_decode('Kevin van Zonneveld');
		//   returns 1: 'Kevin van Zonneveld'

		var tmp_arr:string[] = [],
			i:number = 0,
			ac:number = 0,
			c1:number = 0,
			c2:number = 0,
			c3:number = 0,
			c4:number = 0;

		str_data += '';

		while (i < str_data.length) {
			c1 = str_data.charCodeAt(i);
			if (c1 <= 191) {
				tmp_arr[ac++] = String.fromCharCode(c1);
				i++;
			} else if (c1 <= 223) {
				c2 = str_data.charCodeAt(i + 1);
				tmp_arr[ac++] = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
				i += 2;
			} else if (c1 <= 239) {
				// http://en.wikipedia.org/wiki/UTF-8#Codepage_layout
				c2 = str_data.charCodeAt(i + 1);
				c3 = str_data.charCodeAt(i + 2);
				tmp_arr[ac++] = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			} else {
				c2 = str_data.charCodeAt(i + 1);
				c3 = str_data.charCodeAt(i + 2);
				c4 = str_data.charCodeAt(i + 3);
				c1 = ((c1 & 7) << 18) | ((c2 & 63) << 12) | ((c3 & 63) << 6) | (c4 & 63);
				c1 -= 0x10000;
				tmp_arr[ac++] = String.fromCharCode(0xD800 | ((c1 >> 10) & 0x3FF));
				tmp_arr[ac++] = String.fromCharCode(0xDC00 | (c1 & 0x3FF));
				i += 4;
			}
		}

		return tmp_arr.join('');
	}

}

