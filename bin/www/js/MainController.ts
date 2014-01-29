


///<reference path="../../../src/d.ts/DefinitelyTyped/angularjs/angular.d.ts"/>
///<reference path="JSONMocker.d.ts"/>

declare function jsmin( input:string, level:number ):string;
/**
 * Header for Showdown: https://github.com/coreyti/showdown
 */
interface Showdown {
    converter(): void;
    makeHtml(html:string): string;
}

declare var Showdown: Showdown;

class MainController
{
    private static MODE_ADD:number = 0;
    private static MODE_EDIT:number = 1;
    private config;
    private listVisible = true;
    private currentRoute;
    private currentRouteParams;
    private currentRouteId;
    private currentRouteSwitch;
    private editMode:number;
    private editor:any;
    private reloadNeeded:boolean = false;
    private noValidJSONMockupCode:boolean;
    private hasJsErrors:boolean = false;
    private previewVisible:boolean = false;
    private previewDescription:boolean = false;
    private previewOutput:string = "";
    private showdown = new Showdown.converter();
    private markDownPreview:string;
    private loading:boolean = true;
    private showDescription:boolean = true;
    private linkPreview:boolean = false;
    private currentRoutePreview:string = "";
    constructor(private $scope, private $element, private $http , private $route, private $routeParams, private $location, private $timeout, private $sce )
    {

        var timer=false;
        var timerDescription=false;
        var timerJSON=false;
        $scope.$watch('mc.currentRoute.route', ()=>{
            if(timer){
                $timeout.cancel(timer)
            }

            this.currentRoute && this.currentRoute.route!='' && ( timer= $timeout(()=>{ this.updateParams() },500) );
        });


        $scope.$watch('mc.currentRoute.response.source', ()=>{
            if(timerJSON){
                $timeout.cancel(timerJSON)
            }
            if( this.previewVisible && this.currentRouteSwitch.fileType == 0 )
            {
                timerJSON= $timeout(()=>{ this.updatePreview() },500);
            }
        });
        $scope.$watch('mc.currentRoute.description', ()=>{
            if(timerDescription){
                $timeout.cancel(timerDescription)
            }
            if( this.previewDescription)
            {
                timerDescription= $timeout(()=>{ this.updateDescription() },500);
            }
        });

        this.$scope.$on(
            "$routeChangeSuccess",
            ( $currentRoute, $previousRoute )=>{

                var action = this.$route.current.action;

                switch( action )
                {
                    case "list":
                        this.listVisible = true;
                        break;
                    case "edit":
                        var id = this.$routeParams.id;
                        this.edit(id);
                        break;
                    case "add":
                        this.add();
                        break;
                }

            }
        );


        this.loadConfig();


    }

    loadConfig()
    {
        this.loading = true;
        this.$http.get('/express-mocker/config.json').success((data, status, headers, config)=>
        {
            this.config = data;

            this.loading = false;
            this.showList();

        });
    }

    toggleDescriptionPreview()
    {
        this.previewDescription=!this.previewDescription;
        if( this.previewDescription ) this.updateDescription()
    }

    /*
     converter.makeHtml(text);
     var converter = new Showdown.converter({ extensions: 'twitter' });
     */
    updateParams()
    {
        if( this.currentRoute )
        {
            var paramsRegExp = /(:.[^\/]*)/g;
            var route = this.currentRoute.route;
            var foundParams = route.match( paramsRegExp );
            var paramNames;
            if( foundParams ) paramNames = foundParams.map(function(el){ return el.replace(':','') });

            console.log( 'params',paramNames );
        }
    }

    updateDescription()
    {
        if( this.currentRoute)
        {
            console.log('aaa'+this.currentRoute.description, this.markDownPreview, this.showdown.makeHtml );
        }
        this.currentRoute && ( this.markDownPreview = this.showdown.makeHtml( this.currentRoute.description ) );
    }

    radd(){ this.$location.path('/add') }
    add()
    {
        this.showDescription = true;
        this.previewDescription = false;
        this.editMode = MainController.MODE_ADD;
        this.currentRouteSwitch = { filetype:0 };
        this.currentRoute = { verb:'get', active:true, route:'', response:{ source:''} }
        this.listVisible = false;
        this.setType( 0 );
    }
    redit(id){ this.$location.path('/edit/'+id) }
    edit(id)
    {
        this.showDescription = false;
        this.previewDescription = false;
        this.editMode = MainController.MODE_EDIT;
        this.currentRoute = this.createEditObject( this.config.defaultRoutes[ id ] );
        this.currentRouteId = id;
        this.listVisible = false;
    }

    delete(id)
    {
        var itemToDelete = this.config.defaultRoutes[ id ];
        var itemPos = this.config.defaultRoutes.indexOf( itemToDelete );
        this.config.defaultRoutes.splice( itemPos,1 );
        this.saveToDisk();
        this.showList();
    }

    toggleActive( idx )
    {
        this.config.defaultRoutes[idx].active = !this.config.defaultRoutes[idx].active;
        this.saveToDisk();
    }

    createEditObject( source )
    {
        this.currentRouteSwitch = {};
        var clone = MainController.clone( source );
        var cloneParams = clone.route.match( /(:[^\/]*)/g);
        cloneParams && ( clone.routeParams = cloneParams.map(function(el){ return el.replace(':','') } ) );


        var isDataUrlRegExp:RegExp = /^data:(.+\/(.+));base64,(.*)$/
            ,source = clone.response.source
            ,isFileDataUrlEncoded:boolean = isDataUrlRegExp.test( source );

        if( isFileDataUrlEncoded )
        {
            var dataUrlInfo:RegExpExecArray = isDataUrlRegExp.exec( source )
                ,mime:string = dataUrlInfo[1];

            if( mime == "application/json-mock" )
            {
                this.currentRouteSwitch.fileType = 0;
                clone.response.source = 'var jsonmocker = '+ utf8_decode( window.atob( dataUrlInfo[3]  ) );
            }
            else
            {
                this.currentRouteSwitch.fileType = 1;
            }
        }
        else
        {
            this.currentRouteSwitch.fileType = 2;
        }

        return clone;

    }

    previewRoute( route )
    {
        console.log( route )
        this.linkPreview = true;
        this.$sce.trustAsHtml( route );
        this.currentRoutePreview = this.$sce.getTrustedHtml(route);
    }

    preview()
    {
        this.previewVisible = !this.previewVisible;
        this.previewVisible && this.updatePreview();
    }
    updatePreview()
    {
        console.log('updatePreview')
        var jsminCode:string = jsmin( this.currentRoute.response.source, 3 );
        var code:Object;
        try
        {
            code = eval("'use strict';var context = "+ jsminCode.split('var jsonmocker=')[1]+";context");
            this.noValidJSONMockupCode = false;

            this.previewOutput = JSON.stringify( es.xperiments.json.JSONMocker.parseTemplate( code, {} ) ,null,'    ');
        }
        catch(e)
        {
            if (e instanceof SyntaxError)
            {
                this.noValidJSONMockupCode = true;
            }
        }

    }

    uploadFile(files) {


        // Loop through the FileList and render image files as thumbnails.
        var f = files[0];
        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload =(e)=>{
                this.currentRoute.response.source = e.target.result;
                this.$scope.$apply();

        }

        // Read in the image file as a data URL.
        reader.readAsDataURL(f);

    }

    setType( type )
    {


        switch( type )
        {
            case 0:
                this.currentRoute.response.source = "var jsonmocker = {\n\n}";
                break;
            case 1:

                break;
            case 2:
                this.currentRoute.response.source = "";
                this.previewVisible = false;
                break;

        }
        this.currentRouteSwitch.fileType = type;
    }

    // edit


    cancel()
    {
        this.showList();
    }

    save()
    {
        if( this.editMode == MainController.MODE_ADD )
        {
            this.config.defaultRoutes.push( this.currentRoute );
        }
        else
        {
            console.log( this.currentRouteSwitch.fileType )
            if( this.currentRouteSwitch.fileType == 0 )
            {
                var source:string = this.currentRoute.response.source;
                source = source.substring( source.indexOf('{')-1,source.lastIndexOf('}')+1);
                console.log(source);
                //source = JSON.stringify(JSON.parse(source));
                console.log(source);
                source=utf8_encode(source);
                this.currentRoute.response.source = "data:application/json-mock;base64,"+window.btoa( source );
            }

            this.config.defaultRoutes[this.currentRouteId] = this.currentRoute;

        }
        this.saveToDisk();
        this.showList()
    }

    showList()
    {
        this.$location.path('/list');
        this.listVisible = true;
    }

    setCurrentVerb( verb:string )
    {
        //TODO
        // Find if a same route currently exists
        this.currentRoute.verb = verb;
    }
    saveToDisk()
    {
        this.reloadNeeded = true;
        this.loading = true;
        this.$http.post('/express-mocker/update',{config:JSON.parse( angular.toJson(this.config ,true) )}).then(()=>{ this.loading = false;});
    }

    reload()
    {
        this.loading = true;
        this.$http.get('/express-mocker/reload').then(()=>{ this.$location.path('/list');this.reloadNeeded= this.loading = false;  this.loadConfig(); })
    }
    browseForFile()
    {

        (<HTMLInputElement>document.querySelector('#uploadFile')).click();
    }
    static clone(obj)
    {
        return JSON.parse( JSON.stringify( obj ) );
    }


}

function utf8_encode (argString) {
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

    var string = (argString + ''); // .replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    var utftext = '',
        start, end, stringl = 0;

    start = end = 0;
    stringl = string.length;
    for (var n = 0; n < stringl; n++) {
        var c1 = string.charCodeAt(n);
        var enc = null;

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


function utf8_decode(str_data) {
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

	var tmp_arr = [],
		i = 0,
		ac = 0,
		c1 = 0,
		c2 = 0,
		c3 = 0,
		c4 = 0;

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