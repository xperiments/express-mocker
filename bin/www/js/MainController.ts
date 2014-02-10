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

	private markDownTemplate:string='<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width, initial-scale=1.0, user-scalable=yes"><style>body{font-family:Helvetica,arial,sans-serif;font-size:14px;line-height:1.6;padding-top:10px;padding-bottom:10px;background-color:white;padding:30px}body>*:first-child{margin-top:0!important}body>*:last-child{margin-bottom:0!important}a{color:#4183c4}a.absent{color:#c00}a.anchor{display:block;padding-left:30px;margin-left:-30px;cursor:pointer;position:absolute;top:0;left:0;bottom:0}h1,h2,h3,h4,h5,h6{margin:20px 0 10px;padding:0;font-weight:bold;-webkit-font-smoothing:antialiased;cursor:text;position:relative}h1:hover a.anchor,h2:hover a.anchor,h3:hover a.anchor,h4:hover a.anchor,h5:hover a.anchor,h6:hover a.anchor{background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA09pVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoMTMuMCAyMDEyMDMwNS5tLjQxNSAyMDEyLzAzLzA1OjIxOjAwOjAwKSAgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6OUM2NjlDQjI4ODBGMTFFMTg1ODlEODNERDJBRjUwQTQiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OUM2NjlDQjM4ODBGMTFFMTg1ODlEODNERDJBRjUwQTQiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo5QzY2OUNCMDg4MEYxMUUxODU4OUQ4M0REMkFGNTBBNCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo5QzY2OUNCMTg4MEYxMUUxODU4OUQ4M0REMkFGNTBBNCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PsQhXeAAAABfSURBVHjaYvz//z8DJYCRUgMYQAbAMBQIAvEqkBQWXI6sHqwHiwG70TTBxGaiWwjCTGgOUgJiF1J8wMRAIUA34B4Q76HUBelAfJYSA0CuMIEaRP8wGIkGMA54bgQIMACAmkXJi0hKJQAAAABJRU5ErkJggg==) no-repeat 10px center;text-decoration:none}h1 tt,h1 code{font-size:inherit}h2 tt,h2 code{font-size:inherit}h3 tt,h3 code{font-size:inherit}h4 tt,h4 code{font-size:inherit}h5 tt,h5 code{font-size:inherit}h6 tt,h6 code{font-size:inherit}h1{font-size:28px;color:black}h2{font-size:24px;border-bottom:1px solid #ccc;color:black}h3{font-size:18px}h4{font-size:16px}h5{font-size:14px}h6{color:#777;font-size:14px}p,blockquote,ul,ol,dl,li,table,pre{margin:15px 0}hr{background:transparent url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAECAYAAACtBE5DAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBNYWNpbnRvc2giIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6OENDRjNBN0E2NTZBMTFFMEI3QjRBODM4NzJDMjlGNDgiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OENDRjNBN0I2NTZBMTFFMEI3QjRBODM4NzJDMjlGNDgiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo4Q0NGM0E3ODY1NkExMUUwQjdCNEE4Mzg3MkMyOUY0OCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo4Q0NGM0E3OTY1NkExMUUwQjdCNEE4Mzg3MkMyOUY0OCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PqqezsUAAAAfSURBVHjaYmRABcYwBiM2QSA4y4hNEKYDQxAEAAIMAHNGAzhkPOlYAAAAAElFTkSuQmCC) repeat-x 0 0;border:0 none;color:#ccc;height:4px;padding:0}body>h2:first-child{margin-top:0;padding-top:0}body>h1:first-child{margin-top:0;padding-top:0}body>h1:first-child+h2{margin-top:0;padding-top:0}body>h3:first-child,body>h4:first-child,body>h5:first-child,body>h6:first-child{margin-top:0;padding-top:0}a:first-child h1,a:first-child h2,a:first-child h3,a:first-child h4,a:first-child h5,a:first-child h6{margin-top:0;padding-top:0}h1 p,h2 p,h3 p,h4 p,h5 p,h6 p{margin-top:0}li p.first{display:inline-block}li{margin:0}ul,ol{padding-left:30px}ul :first-child,ol :first-child{margin-top:0}dl{padding:0}dl dt{font-size:14px;font-weight:bold;font-style:italic;padding:0;margin:15px 0 5px}dl dt:first-child{padding:0}dl dt>:first-child{margin-top:0}dl dt>:last-child{margin-bottom:0}dl dd{margin:0 0 15px;padding:0 15px}dl dd>:first-child{margin-top:0}dl dd>:last-child{margin-bottom:0}blockquote{border-left:4px solid #ddd;padding:0 15px;color:#777}blockquote>:first-child{margin-top:0}blockquote>:last-child{margin-bottom:0}table{padding:0;border-collapse:collapse}table tr{border-top:1px solid #ccc;background-color:white;margin:0;padding:0}table tr:nth-child(2n){background-color:#f8f8f8}table tr th{font-weight:bold;border:1px solid #ccc;margin:0;padding:6px 13px}table tr td{border:1px solid #ccc;margin:0;padding:6px 13px}table tr th :first-child,table tr td :first-child{margin-top:0}table tr th :last-child,table tr td :last-child{margin-bottom:0}img{max-width:100%}span.frame{display:block;overflow:hidden}span.frame>span{border:1px solid #ddd;display:block;float:left;overflow:hidden;margin:13px 0 0;padding:7px;width:auto}span.frame span img{display:block;float:left}span.frame span span{clear:both;color:#333;display:block;padding:5px 0 0}span.align-center{display:block;overflow:hidden;clear:both}span.align-center>span{display:block;overflow:hidden;margin:13px auto 0;text-align:center}span.align-center span img{margin:0 auto;text-align:center}span.align-right{display:block;overflow:hidden;clear:both}span.align-right>span{display:block;overflow:hidden;margin:13px 0 0;text-align:right}span.align-right span img{margin:0;text-align:right}span.float-left{display:block;margin-right:13px;overflow:hidden;float:left}span.float-left span{margin:13px 0 0}span.float-right{display:block;margin-left:13px;overflow:hidden;float:right}span.float-right>span{display:block;overflow:hidden;margin:13px auto 0;text-align:right}code,tt{margin:0 2px;padding:0 5px;white-space:nowrap;border:1px solid #eaeaea;background-color:#f8f8f8;border-radius:3px}pre code{margin:0;padding:0;white-space:pre;border:0;background:transparent}.highlight pre{background-color:#f8f8f8;border:1px solid #ccc;font-size:13px;line-height:19px;overflow:auto;padding:6px 10px;border-radius:3px}pre{background-color:#f8f8f8;border:1px solid #ccc;font-size:13px;line-height:19px;overflow:auto;padding:6px 10px;border-radius:3px}pre code,pre tt{background-color:transparent;border:0}sup{font-size:.83em;vertical-align:super;line-height:0}*{-webkit-print-color-adjust:exact}@media screen and (min-width:914px){body{width:854px;margin:0 auto}}@media print{table,pre{page-break-inside:avoid}pre{word-wrap:break-word}}</style><title>ExpressMocker</title></head><body>{{code}}</body></html>';
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

			/*
			// Fix old routes
			this.config.defaultRoutes.map( ( route:IExpressMockerRoute )=>{
				if (!route.id )
				{
					route.id = this.shash( route.route );
				}
			});
			*/
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

	public getRouteDocumentation( route:IExpressMockerRoute )
	{

		var paramPredocs:string = "#### Route\n\t"+route.route+'\n\n';
		var paramsDocs:string ="";

		paramsDocs+="\n\n#### Parameters\n";
		var keys:boolean = false;
		Object.keys(route.routeParams).map( (e:string)=>{
			var elm = route.routeParams[e];
			keys = true;
			paramsDocs+= '* **'+elm.name+'** '+ elm.description+'\n'
		})

		paramsDocs = !keys ? "": paramsDocs+'\n\n';

		if( route.description == undefined )
		{
			route.description = "";
		}
		return paramPredocs+route.description+paramsDocs+'\n\n';

	}

	public generateDocumentation(html:boolean)
	{
		var documentation:string = "#Documentation\n\n";
		this.config.defaultRoutes.map((e)=>{ documentation+= this.getRouteDocumentation( e ); })
		if( html ) documentation = this.markDownTemplate.replace('{{code}}',this.showdown.makeHtml( documentation ));
		this.download( "ExpressMockerDocs"+( html ?".html":".md"), documentation );
	}

	private download(filename:string, text:string)
	{
		var pom = document.createElement('a');
		pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
		pom.setAttribute('download', filename);
		pom.click();
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
		// ensure route has a valid id
		this.currentRoute.id = this.shash( this.currentRoute.route );
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

