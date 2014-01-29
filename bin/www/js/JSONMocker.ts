///<reference path="../../../src/d.ts/DefinitelyTyped/node/node.d.ts"/>
////<reference path="d.ts/DefinitelyTyped/node/node.d.ts"/>



module es.xperiments.json
{
    /*internal*/
    class MicroMustache
    {
        static fixJsonArguments( json:string ):string
        {
            return [
                '"', json.split(',')
                    .map(function (el)
                    {

                        return (el.replace(/^\'(.*)\'$/, "\"$1\"")
                            .replace(/^\"(.*)\"$/, "$1")
                            .replace(/\"/g, '\\"'));
                    })
                    .join('","'), '"'
            ].join('');

        }

        /**
         * Replaces every {{variable}} inside the template with values provided by view
         * @param template {string} the template containing one or more {{key}}
         * @param view {object} an object containing string (or number) values for every key that is used in the template
         * @return {string} template with its valid variable names replaced with corresponding values
         */
        static render( template:string, view:Object, partials?:Object ):string
        {
            //don't touch the template if it is not a string
            if (typeof template !== 'string')
            {
                return template;
            }
            //if view is not a valid object, assume it is an empty object which effectively removes all variable assignments
            if (typeof view !== 'object' || view === null)
            {
                view = {};
            }
            return template.replace(/\{?\{\{\s*(.*?)\s*\}\}\}?/g, function ( match:string, varName:string )
            {
                var clearArgs:string = varName;
                clearArgs = clearArgs.replace(/\(.*\)/, '');

                //calling a partial?
                if (typeof partials[ clearArgs ] == "function" || typeof JSONMocker.templateObject[ clearArgs ] =="function" )
                {

                    if ( JSONMocker.templateObject[ clearArgs ] )
                    {
                        if( JSONMocker.injector.hasDependencies( JSONMocker.templateObject[ clearArgs ] ) )
                        {
                            console.log( 'ooooooooo', JSONMocker.templateObject[ clearArgs ] )
                            return JSONMocker.injector.process( JSONMocker.templateObject[ clearArgs ] );
                        }
                    }
                    var args:string[] = varName.match(/\(.*\)/);
                    var params:any;
                    args && args[0] && ( params = JSON.parse('[' + MicroMustache.fixJsonArguments( args[0].replace(/[\(\)]/g, '')) + ']'));
                    var partialTarget:Object = typeof partials[clearArgs] == "function" ? partials: JSONMocker.templateObject;
                    return ( clearArgs == varName ? partialTarget[varName]() : partialTarget[clearArgs].apply(null, params) );
                }

                var value = view[varName];
                switch (typeof value)
                {
                    case 'string':
                    case 'number':
                    case 'boolean':
                        return value;
                    default:
                        //anything else will be replaced with an empty string. This includes object, array and null.
                        return '';
                }
            });
        }
    }



    export class JSONMocker
    {
        static context:Object;
        static templateObject:Object;
        static injector:any;

        static render( template:string, view:Object = {} ):string
        {
            return MicroMustache.render( template, view, MicroJSONGenHelper );
        }

        static getObjectLength( object:Object ):number
        {
            return Object.keys( object ).length;
        }

        static parseArray(array:any[], count:number ):any[]
        {
            for (var resultArray:any[] = [], i:number = 1; i <= count; i++)
            {
                resultArray.push(this.parseObject(array));
            }
            return resultArray;
        }

        static parseVars( object:any ):any
        {
            var repeat:RegExp = /\$repeat\:(\d*)/;

            switch( true )
            {
                case object instanceof Array:
                    var repeatFound:boolean;
                    if ( repeatFound = repeat.test( object[0]) )
                    {
                        var repeatCount:number = parseInt( repeat.exec(object[0])[1] );
                        object.shift();
                        object = this.parseArray( object[0], repeatFound ? repeatCount : object.length );
                    }
                    else
                    {
                        for ( var f = 0; f < object.length; f++ )
                        {
                            object[f] = this.parseVars(object[f]);
                        }
                    }
                    break;

                case "object" == typeof object:
                    object = this.parseObject(object);
                    break;

                case "string" == typeof object:
                    object = JSONMocker.render(object, JSONMocker.context )
                    break;



            }
            /*
             if (object instanceof Array )
             {
             var repeatFound:boolean;
             if ( repeatFound = repeat.test( object[0]) )
             {
             var repeatCount:number = parseInt( repeat.exec(object[0])[1] );
             object.shift();
             object = this.parseArray( object[0], repeatFound ? repeatCount : object.length );
             }
             else
             {
             for ( var f = 0; f < object.length; f++ )
             {
             object[f] = this.parseVars(object[f]);
             }
             }
             }
             else
             {

             "object" == typeof object ? object = this.parseObject(object) : object = JSONMocker.render(object, JSONMocker.context );
             }*/
            return object;
        }
        static clone( a:any ):any
        {
            if (!a || "object" !== typeof a) {
                return a;
            }
            var c = "function" === typeof a.pop ? [] : {}, b, d;
            for (b in a) {
                a.hasOwnProperty(b) && (d = a[b], c[b] = d && "object" === typeof d ? JSONMocker.clone(d) : d);
            }
            return c;
        }
        static parseObject( a:any ):any
        {
            var a = JSONMocker.clone(a),
                b;
            for (b in a)
            {
                if( typeof a[b] != "function" )
                {
                    a[b] = this.parseVars(a[b]);
                }
                else
                {
                    //alert('99')
                }
            }
            return a;
        }

        static parseTemplate( templateObject:any, context:Object ):Object
        {

            JSONMocker.injector = Injector;
            JSONMocker.injector.register("$localStorage", window.localStorage );
            JSONMocker.injector.register("$console", console );
            JSONMocker.injector.register("$query", {
                getId:function( id )
                {
                    return id;
                }
            } );
            JSONMocker.context = context;
            JSONMocker.templateObject = templateObject;

            if( templateObject.$processRequest )
            {
                Injector.process( templateObject.$processRequest );
            }

            return JSONMocker.parseObject( templateObject );

        }
    }

    class Injector
    {
        static dependencies:{ [name:string]:Function } = {}

        static process( target:Function, returnCall:boolean = true )
        {
            var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
            var FN_ARG_SPLIT = /,/;
            var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
            var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
            var text = target.toString();
            var args = text.match(FN_ARGS)[1].split(',');

            return target.apply(target, Injector.getDependencies(args));
        }

        static hasDependencies( target:Function ):boolean
        {
            var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
            var FN_ARG_SPLIT = /,/;
            var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
            var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
            var text = target.toString();
            var args = text.match(FN_ARGS)[1].split(',');

            return Injector.getDependencies(args).length>0;
        }
        static getDependencies(arr)
        {
            return arr.map((value)=>{

                return Injector.dependencies[value];
            });
        }

        static register(name:string, dependency:any )
        {
            this.dependencies[name] = dependency;
        }
    }

    class MicroJSONGenPlugin
    {
        static initialize()
        {

        }
    }
    class MicroJSONGenHelper
    {
        private static rndFirst:string[] = "Samson Yadiel Jayvon Reilly Sheldon Abdullah Jagger Thaddeus Case Kyson Lamont Chaz Makhi Jan Marques Oswaldo Donavan Keyon Kyan Simeon Trystan Andreas Dangelo Landin Reagan Turner Arnav Brenton Callum Jayvion Bridger Sammy Deegan Jaylan Lennon Odin Abdiel Jerimiah Eliezer Bronson Cornelius Pierre Cortez Baron Carlo Carsen Fletcher Izayah Kolten Damari Hugh Jensen Yurem Raina Mariela Ariella Bria Kamari Monique Ashleigh Reina Alia Ashanti Lara Lilia Justine Leia Maribel Abigayle Tiara Alannah Princess Sydnee Kamora Paityn Payten Naima Gretchen Heidy Nyasia Livia Marin Shaylee Maryjane Laci Nathalia Azaria Anabel Chasity Emmy Izabelle Denisse Emelia Mireya Shea Amiah Dixie Maren Averi Esperanza Micaela Selina Alyvia Chana Avah Donna Kaylah Ashtyn Karsyn Makaila Shayna Essence Leticia Miya Rory Desirae Kianna Laurel Neveah Amaris Hadassah Dania Hailie Jamiya Kathy Laylah Riya Diya Carleigh Iyana Kenley Sloane Elianna".split(' ');
        private static rndLast:string[] = "Smith Johnson Williams Brown Jones Miller Davis Garcia Rodriguez Wilson Martinez Anderson Taylor Thomas Hernandez Moore Martin Jackson Thompson White Lopez Lee Gonzalez Harris Clark Lewis Robinson Walker Perez Hall Young Allen Sanchez Wright King Scott Green Baker Adams Nelson Hill Ramirez Campbell Mitchell Roberts Carter Phillips Evans Turner Torres Parker Collins Edwards Stewart Flores Morris Nguyen Murphy Rivera Cook Rogers Morgan Peterson Cooper Reed Bailey Bell Gomez Kelly Howard Ward Cox Diaz Richardson Wood Watson Brooks Bennett Gray James Reyes Cruz Hughes Price Myers Long Foster Sanders Ross Morales Powell Sullivan Russell Ortiz Jenkins Gutierrez Perry Butler Barnes Fisher Henderson Coleman Simmons Patterson Jordan Reynolds Hamilton Graham Kim Gonzales Alexander Ramos Wallace Griffin West Cole Hayes Chavez Gibson Bryant Ellis Stevens Murray Ford Marshall Owens Mcdonald Harrison Ruiz Kennedy Wells Alvarez Woods Mendoza Castillo Olson Webb Washington Tucker Freeman Burns Henry Vasquez Snyder Simpson Crawford Jimenez Porter Mason Shaw Gordon Wagner Hunter Romero Hicks Dixon Hunt Palmer Robertson Black Holmes Stone Meyer Boyd Mills Warren Fox Rose Rice Moreno Schmidt Patel Ferguson Nichols Herrera Medina Ryan Fernandez Weaver Daniels Stephens Gardner Payne Kelley Dunn Pierce Arnold Tran Spencer Peters Hawkins Grant Hansen Castro Hoffman Hart Elliott Cunningham Knight Bradley".split(' ');
        private static rndCompanies:string[] = ['Affymax Technologies N.V.', 'Agency Of Industrial Science And Technology ', 'Agricultural Genetics Co., Ltd.', 'Ajinomoto Co. Inc.', 'Akzo Nobel Bv', 'Amano Pharmaceutical Co., Ltd', 'Amersham International Ltd.', 'Basf Ag', 'Bayer Ag', 'Behringwerke Ag ', 'Biotech Australia Pty. Ltd. And Csiro  ', 'Boehringer Mannheim Gmbh ', 'Canada National Research Council', 'Canadian Department Of Agriculture And Agri-food ', 'Canadian National Research Council And Forestry ', 'Canadian Patents And Development Ltd.', 'Canon Kk', 'Centre National De La Recherche Scientifique ', 'Chemo-sero-therapeutic Research Inst.', 'Ciba-geigy Ag', 'Clariant Finance Ltd.', 'Commonwealth Scientific And Industrial Research Org. (Csiro)', 'Daikin Industries Limited', 'Degussa Ag', 'France Commissariat A Lenergie Atomique', 'Gist-brocades N.V.', 'Hayashibara Seibutsu Kagaku Kenkyujo K. K.', 'Henkel & Cie Gmbh', 'Hitachi Chemical Co., Ltd. ', 'Hoechst Japan Ltd.', 'Hoffmann-la Roche Inc. ', 'Imperial Chemical Industries Plc', 'Individual Inventor(S)', 'Inst. Of Physical And Chemical Research (Saitama)', 'Institut Merieux', 'Institut National De La Recherche Agronomique (Inra)', 'Institut National De La Sante Et De La Recherche Medicale', 'Institut Pasteur', 'International Flower Developments Pty., Ltd. ', 'Japan Ministry Of Agriculture, Forestry And Fisheries ', 'Japan Tobacco Inc.', 'Kao Corp. ', 'Kikkoman Corp. ', 'Kirin Brewery Co., Ltd. ', 'Kumiai Chemical Industry Co., Ltd.', 'Kyowa Hakko Kogyo Co., Ltd', 'Max-planck Institut', 'Mcgill University', 'Medical Research Council Ltd. ', 'Meiji Seika Kaisha Ltd.', 'Mitsubishi Chemical Corp.', 'Mitsui Toatsu Chemicals Inc.', 'Mogen International N.V.', 'National Research Development Corp. (Uk)', 'National Science Counsil Of R.O.C. ', 'Nestec, S.A.', 'Nippon Zeon Co., Ltd. ', 'Nissan Chemical Industries, Ltd.', 'Novartis Ag ', 'Novo Nordisk Biotech, Inc. ', 'Novo-nordisk A/S ', 'Pharming B.V.', 'Plant Genetic Systems', 'Public Health Research Inst. Of Nyc', 'Queens University ', 'Quest International Flavors And Food Ingredients Co.', 'Rhone-poulenc Rorer, S.A.', 'Rhone-poulenc S.A.', 'Rijksuniversiteit Leiden ', 'Rikagaku Kenkyusho ', 'Roussel-uclaf', 'Sagami Chemical Research Center ', 'Sandoz Ltd.', 'Sapporo Breweries Ltd.', 'Schering Ag ', 'Seminis Vegetable Seeds, Inc.', 'Shimadzu Corp. ', 'Shin-etsu Bio, Inc. ', 'Shin-etsu Chemical Co., Ltd. ', 'Shionogi And Co., Ltd. ', 'Sumitomo Chemical Co., Ltd.', 'Suntory Ltd.', 'Takara Shuzo Co., Ltd.', 'Takeda Chemical Industries, Ltd. ', 'Toyo Boseki K. K.', 'Transgene S.A.', 'U.S. Department Of Agriculture', 'U.S. Department Of Energy', 'U.S. Health And Human Services', 'U.S. Of America Government', 'Unilever Patent Holdings B.V.', 'Universite De Montreal ', 'University  Of British Columbia', 'University  Of Guelph', 'University  Of Saskatchewan', 'Visible Genetics Inc. ', 'Yeda Research And Development Co., Ltd.', 'Yissum Research Development Co., Hebrew University Of Jerusalem', 'Zenco Ltd.', 'Zeneca Ltd.'];
        private static rndImages:string[] =
            [
                '<path transform="scale(1,1)" d="M512 672c-123.5 0-224-100.5-224-224s100.5-224 224-224 224 100.5 224 224c0 123.5-100.5 224-224 224zM512 288c-88.376 0-160 71.624-160 160s71.624 160 160 160 160-71.624 160-160-71.624-160-160-160zM512 736c17.666 0 32 14.334 32 32v64c0 17.666-14.334 32-32 32s-32-14.334-32-32v-64c0-17.666 14.334-32 32-32zM512 160c-17.666 0-32-14.334-32-32v-64c0-17.666 14.334-32 32-32s32 14.334 32 32v64c0 17.666-14.334 32-32 32zM760.876 651.666l45.25 45.25c12.5 12.5 12.5 32.75 0 45.25s-32.75 12.5-45.25 0l-45.25-45.25c-12.5-12.5-12.5-32.75 0-45.25 12.498-12.5 32.75-12.5 45.25 0zM263.124 244.332l-45.25-45.25c-12.5-12.498-12.5-32.748 0-45.248s32.75-12.5 45.25 0l45.25 45.248c12.5 12.542 12.5 32.752 0 45.25-12.498 12.502-32.75 12.544-45.25 0zM224 448c0 17.666-14.334 32-32 32h-64c-17.666 0-32-14.334-32-32s14.334-32 32-32h64c17.666 0 32 14.334 32 32zM896 480h-64c-17.666 0-32-14.334-32-32s14.334-32 32-32h64c17.666 0 32 14.334 32 32s-14.334 32-32 32zM263.082 651.666c12.502-12.5 32.752-12.5 45.25 0 12.502 12.5 12.502 32.75 0 45.25l-45.25 45.25c-12.5 12.5-32.748 12.5-45.25 0-12.5-12.5-12.5-32.75 0-45.25l45.25-45.25zM760.918 244.376c-12.542 12.5-32.752 12.5-45.25 0-12.502-12.5-12.542-32.75 0-45.25l45.25-45.25c12.498-12.5 32.748-12.5 45.248 0s12.5 32.748 0 45.25l-45.248 45.25z" />',
                '<path transform="scale(1,1)" d="M699.704 273.7c-99.752-99.832-262.166-99.832-362 0-99.832 99.834-99.832 262.25 0 362.042 26.418 26.374 58.624 46.5 95.664 59.624 11.668 4.084 24.586 1.124 33.25-7.584 8.752-8.75 11.71-21.666 7.586-33.25-25.084-70.75-8-147.332 44.498-199.834 52.418-52.456 129.002-69.5 199.834-44.5 11.584 4.124 24.542 1.166 33.25-7.584 8.752-8.666 11.668-21.624 7.542-33.25-13.042-37.040-33.208-69.246-59.624-95.664zM382.954 590.492c-74.876-74.876-74.876-196.708 0-271.542 80-80.042 216.25-72.834 286 16.334-71.918-4.5-142.75 21.458-195.5 74.168-52.75 52.708-78.666 123.542-74.168 195.458-5.748-4.502-11.208-9.294-16.332-14.418z" />',
                '<path transform="scale(1,1)" d="M765.744 375.5l-65.25 37.668c2.084 11.332 3.5 22.916 3.5 34.832 0 11.958-1.416 23.584-3.584 34.916l65.25 37.708c30.666 17.75 41.084 56.876 23.458 87.376-17.708 30.624-56.75 41.124-87.376 23.5l-65.876-38.042c-17.624 15-37.708 26.834-59.876 34.708v75.834c0 35.334-28.624 64-64 64-35.332 0-64-28.666-64-64v-75.792c-22.166-7.876-42.25-19.71-59.874-34.708l-65.752 37.958c-30.624 17.666-69.792 7.208-87.498-23.416-17.626-30.584-7.124-69.708 23.498-87.376l65.126-37.626c-2.124-11.376-3.502-23.042-3.502-35.042 0-11.916 1.376-23.542 3.502-34.876l-65.168-37.624c-30.668-17.668-41.168-56.876-23.458-87.5 17.622-30.5 56.79-41 87.458-23.376l65.666 37.958c17.626-15 37.75-26.916 60-34.834v-75.746c0-35.376 28.668-64 64-64 35.376 0 64 28.624 64 64v75.834c22.25 7.916 42.376 19.75 59.916 34.79l65.834-37.998c30.624-17.624 69.752-7.124 87.376 23.376 17.714 30.622 7.256 69.748-23.37 87.498zM447.994 448c0 35.334 28.624 64 64 64 35.334 0 64-28.666 64-64 0-35.332-28.666-64-64-64-35.374 0-64 28.668-64 64z" />',
                '<path transform="scale(1,1)" d="M512 770c17.666 0 32 14.334 32 32v64c0 17.666-14.334 32-32 32s-32-14.334-32-32v-64c0-17.666 14.334-32 32-32zM760.876 685.666l45.25 45.25c12.498 12.5 12.498 32.75 0 45.25-12.5 12.5-32.75 12.5-45.25 0l-45.25-45.25c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0zM128 450h64c17.666 0 32 14.334 32 32s-14.334 32-32 32h-64c-17.666 0-32-14.334-32-32s14.334-32 32-32zM800 482c0-17.666 14.334-32 32-32h64c17.666 0 32 14.334 32 32s-14.334 32-32 32h-64c-17.666 0-32-14.334-32-32zM263.082 685.666c12.502-12.5 32.752-12.5 45.25 0 12.502 12.5 12.502 32.75 0 45.25l-45.25 45.25c-12.5 12.5-32.748 12.5-45.25 0-12.5-12.5-12.5-32.75 0-45.25l45.25-45.25zM291.25 450h64c-2.124 10.334-3.25 21.042-3.25 32 0 88.376 71.624 160 160 160 88.376 0 160-71.624 160-160 0-10.958-1.124-21.666-3.25-32h64c1.584 10.542 3.25 21.042 3.25 32 0 123.5-100.5 224-224 224s-224-100.5-224-224c0-10.958 1.75-21.458 3.25-32zM896 386h-768c-17.666 0-32-14.334-32-32s14.334-32 32-32h768c17.666 0 32 14.334 32 32s-14.334 32-32 32zM896 258h-768c-17.666 0-32-14.334-32-32s14.334-32 32-32h768c17.666 0 32 14.334 32 32s-14.334 32-32 32zM896 130h-768c-17.666 0-32-14.334-32-32s14.334-32 32-32h768c17.666 0 32 14.334 32 32s-14.334 32-32 32z" />',
                '<path transform="scale(1,1)" d="M800 640c-10.624 0-21.124-0.75-31.584-2.25-59.748 81.416-154.040 130.25-256.416 130.25s-196.624-48.834-256.416-130.25c-10.46 1.5-20.96 2.25-31.584 2.25-123.5 0-224-100.5-224-224 0-123.5 100.5-224 224-224 27.376 0 54.168 5 79.418 14.666 57.914-50.5 131.582-78.666 208.582-78.666 77.084 0 150.666 28.166 208.582 78.666 25.25-9.666 52.042-14.666 79.418-14.666 123.5 0 224 100.5 224 224 0 123.5-100.5 224-224 224zM800 256c-34.25 0-65.832 11-91.876 29.334-46.956-56.582-116.876-93.334-196.124-93.334-79.25 0-149.168 36.752-196.124 93.334-26-18.334-57.626-29.334-91.876-29.334-88.376 0-160 71.624-160 160s71.624 160 160 160c21.624 0 42.124-4.416 60.876-12.166 42.458 82.832 127.706 140.166 227.124 140.166s184.668-57.334 227.082-140.166c18.794 7.75 39.336 12.166 60.918 12.166 88.376 0 160-71.624 160-160s-71.624-160-160-160z" />',
                '<path transform="scale(1,1)" d="M800 832c-10.624 0-21.124-0.75-31.584-2.25-59.748 81.416-154.040 130.25-256.416 130.25-102.376 0-196.624-48.834-256.416-130.25-10.46 1.5-20.96 2.25-31.584 2.25-123.5 0-224-100.5-224-224s100.5-224 224-224c27.376 0 54.168 5 79.418 14.666 24.582-21.416 52.5-37.916 81.832-50.832l49.832 49.748c-46.916 15.252-88.332 42.542-119.208 79.752-25.998-18.334-57.624-29.334-91.874-29.334-88.376 0-160 71.624-160 160s71.624 160 160 160c21.624 0 42.124-4.416 60.876-12.166 42.458 82.832 127.706 140.166 227.124 140.166s184.668-57.334 227.082-140.166c18.794 7.75 39.336 12.166 60.918 12.166 88.376 0 160-71.624 160-160s-71.624-160-160-160c-34.25 0-65.832 11-91.876 29.334-20.75-25.042-46.624-45.334-75.25-61.168l-26.874-80.666c41.75 13.124 81 33.876 114.582 63.166 25.25-9.666 52.042-14.666 79.418-14.666 123.5 0 224 100.5 224 224s-100.5 224-224 224zM384 256l64-64-64-192 192 192-64 64 64 192-192-192z" />',
                '<path transform="scale(1,1)" d="M834.084 627.834c-47.958 49.084-114.25 77.542-183.46 77.542-69.124 0-135.376-28.458-183.33-77.542-105.626-4.918-190.042-92.376-190.042-199.168 0-109.916 89.418-199.332 199.376-199.332 11.668 0 23.208 1 34.542 2.998 41.458-27.082 89.834-41.708 139.458-41.708 49.708 0 98.126 14.626 139.544 41.708 11.414-1.998 22.916-2.998 34.582-2.998 109.874 0 199.25 89.416 199.25 199.332-0.004 106.792-84.38 194.25-189.92 199.168zM824.75 293.334c-16.624 0-32.75 2.998-48 8.834-35-30.5-79.5-47.544-126.126-47.544-46.498 0-90.998 17.044-125.998 47.544-15.25-5.836-31.5-8.834-48-8.834-74.624 0-135.376 60.75-135.376 135.332 0 74.626 60.75 135.376 135.376 135.376 6.376 0 12.75-0.458 19.042-1.376 36.208 49.166 93.082 78.708 154.956 78.708 61.876 0 118.876-29.542 155.002-78.708 6.25 0.916 12.624 1.376 19.124 1.376 74.624 0 135.25-60.75 135.25-135.376 0-74.582-60.624-135.332-135.25-135.332zM288 256h-256c-17.666 0-32-14.334-32-32s14.334-32 32-32h256c17.666 0 32 14.334 32 32s-14.334 32-32 32zM32 320h128c17.666 0 32 14.334 32 32s-14.334 32-32 32h-128c-17.666 0-32-14.334-32-32s14.334-32 32-32zM96 448h128c17.666 0 32 14.334 32 32s-14.334 32-32 32h-128c-17.666 0-32-14.334-32-32s14.334-32 32-32z" />',
                '<path transform="scale(1,1)" d="M834.084 818.416c-47.96 49.126-114.25 77.584-183.46 77.584-69.124 0-135.376-28.458-183.33-77.584-105.626-4.876-190.042-92.334-190.042-199.084 0-109.956 89.418-199.416 199.376-199.416 11.668 0 23.208 1.002 34.542 3 41.458-27.042 89.834-41.666 139.458-41.666 49.708 0 98.126 14.624 139.544 41.666 11.414-1.998 22.916-3 34.582-3 109.876 0 199.25 89.46 199.25 199.416-0.004 106.752-84.38 194.252-189.92 199.084zM824.75 483.916c-16.624 0-32.75 3-48 8.916-35-30.5-79.5-47.584-126.126-47.584-46.498 0-90.998 17.084-125.998 47.584-15.25-5.918-31.5-8.916-48-8.916-74.624 0-135.376 60.75-135.376 135.416 0 74.584 60.75 135.334 135.376 135.334 6.376 0 12.75-0.5 19.042-1.376 36.208 49.168 93.082 78.71 154.956 78.71 61.876 0 118.876-29.542 155.002-78.708 6.25 0.876 12.624 1.376 19.124 1.376 74.624 0 135.25-60.75 135.25-135.334 0-74.668-60.624-135.418-135.25-135.418zM288 446.624h-256c-17.666 0-32-14.292-32-32 0-17.706 14.334-32 32-32h256c17.666 0 32 14.294 32 32 0 17.708-14.334 32-32 32zM32 510.624h128c17.666 0 32 14.292 32 32s-14.334 32-32 32h-128c-17.666 0-32-14.292-32-32s14.334-32 32-32zM96 638.624h128c17.666 0 32 14.292 32 32s-14.334 32-32 32h-128c-17.666 0-32-14.292-32-32s14.334-32 32-32zM448 192c0-35.376 28.624-64 64-64s64 28.624 64 64-64 128-64 128-64-92.624-64-128zM704 64c0-35.376 28.624-64 64-64s64 28.624 64 64-64 128-64 128-64-92.624-64-128z" />',
                '<path transform="scale(1,1)" d="M800 832c-10.624 0-21.124-0.75-31.584-2.25-59.748 81.416-154.040 130.25-256.416 130.25s-196.624-48.834-256.416-130.25c-10.46 1.5-20.96 2.25-31.584 2.25-123.5 0-224-100.5-224-224s100.5-224 224-224c27.376 0 54.168 5 79.418 14.666 57.914-50.5 131.582-78.666 208.582-78.666 77.084 0 150.666 28.166 208.582 78.666 25.25-9.666 52.042-14.666 79.418-14.666 123.5 0 224 100.5 224 224s-100.5 224-224 224zM800 448c-19.418 0-38.418 3.5-56.5 10.416l-36 13.834-29-25.334c-46.5-40.582-105.624-62.916-166.5-62.916s-120 22.334-166.5 62.916l-29 25.334-36-13.834c-18-6.916-37.082-10.416-56.5-10.416-88.25 0-160 71.792-160 160s71.75 160 160 160c7.584 0 15-0.542 22.5-1.584l37.916-5.5 22.708 30.916c48.626 66.21 123.294 104.168 204.876 104.168 81.624 0 156.25-37.916 204.834-104.126l22.75-30.958 37.998 5.5c7.418 1.042 14.834 1.584 22.418 1.584 88.25 0 160-71.792 160-160s-71.75-160-160-160zM192 320c-35.376 0-64-28.624-64-64s28.624-64 64-64 64 28.624 64 64-28.624 64-64 64zM512 256c-35.376 0-64-28.624-64-64s28.624-64 64-64 64 28.624 64 64-28.624 64-64 64zM832 320c-35.376 0-64-28.624-64-64s28.624-64 64-64 64 28.624 64 64-28.624 64-64 64zM704 64c-35.376 0-64-28.624-64-64s28.624-64 64-64 64 28.624 64 64-28.624 64-64 64zM320 64c-35.376 0-64-28.624-64-64s28.624-64 64-64 64 28.624 64 64-28.624 64-64 64z" />',
                '<path transform="scale(1,1)" d="M814 379q65-64 105.5-144.5t40.5-170.5q0-21-0.5-32t-2-29-5.5-27.5-11-20-18.5-15-26.5-4.5q-38 0-78 20t-75 51-66.5 63-64.5 63.5-57 44.5q-21-242-43-242t-43 242q-24-13-57-44.5t-64.5-63.5-66.5-63-75-51-78-20q-16 0-27 4.5t-18 15-11 20-5.5 27.5-2 29-0.5 32q0 90 40 170.5t106 144.5q-92 84-151 185.5t-59 203.5q0 79 56 135.5t136 56.5q39 0 93-44.5t99.5-106 72.5-120.5q9 57 26 86-35 18-35 57 0 7 2 15l-57 56q-9 10-9 24t9.5 23.5 23.5 9.5 23-10l57-56q8 2 15 2t15-2l57 56q9 10 23 10t23.5-9.5 9.5-23.5-9-24l-57-56q2-8 2-15 0-39-35-57 17-29 26-86 27 59 72.5 120.5t99.5 106 93 44.5q80 0 136-56.5t56-135.5q0-102-59.5-203.5t-150.5-185.5z" />',
                '<path transform="scale(1,1)" d="M960 640q-56 0-125 32 61-104 61-224 0-91-35.5-174t-95.5-143-143-95.5-174-35.5-174 35.5-143 95.5-95.5 143-35.5 174 35.5 174 95.5 143 143 95.5 174 35.5q152 0 274-94 29 26 64 53.5t46 34.5q16 9 32.5 4.5t25-20.5 4-34-19.5-27q-30-19-107-50 0-1 0.5-1.5t1.5-0.5q54-10 122-27.5t101-29.5q32-11 32-32 0-13-19.5-22.5t-44.5-9.5zM192 640q-64-86-64-192 0-32 6-64h64q-6 17-6 32 0 40 28 68t68 28 68-28 28-68q0-15-6-32h140q-6 17-6 32 0 40 28 68t68 28 68-28 28-68q0-15-6-32h63q7 32 7 64 0 106-65 192h-511z" />',
                '<path transform="scale(1,1)" d="M512 192q-139 0-257 21.5t-186.5 58.5-68.5 80.5 69.5 80 186.5 57.5v86q0 106 75 181t181 75 181-75 75-181v-86q117-21 186.5-57.5t69.5-80-68.5-80.5-186.5-58.5-257-21.5zM704 559q0 86-56 147.5t-136 61.5-136-61.5-56-147.5v-68q90-43 192-43t192 43v68zM958 210q-15-62-143-104t-303-42-303 42-143 104q67-38 186-60t260-22 260 22 186 60z" />',
                '<path transform="scale(1,1)" d="M809.5 52.5q-73.5-76.5-172.5-103.5t-198 0-172.5 103.5-100 179 0 204.5 99.5 179l272 345 272-345q73-77 99.5-179t0-204.5-100-179zM357 126q8-9 11.5-13.5t15.5-10.5 26-6q31 0 46.5 17.5t15.5 40.5q0 28-23 80.5t-46.5 112.5-23.5 106q0 28 24 74.5t47 79.5l24 33h-32l-85-97q-75-93-75-208.5t75-208.5z" />',
                '<path transform="scale(1,1)" d="M828 195q-14-20-28-35l-289-224-287 224q-14 15-28 35-62 62-97 144t-35 173 35.5 174 95.5 143 143 95.5 174 35.5 174-35.5 143-95.5 95.5-143 35.5-174-35-173-97-144zM512 832q-87 0-160.5-43t-116.5-116.5-43-160.5 43-160.5 116.5-116 160.5-42.5 160.5 42.5 116.5 116 43 160.5-43 160.5-116.5 116.5-160.5 43z" />',
                '<path transform="scale(1,1)" d="M828 195q-14-21-28-35l-289-224-287 224q-14 14-28 35-62 62-97 144t-35 173 35.5 174 95.5 143 143 95.5 174 35.5 174-35.5 143-95.5 95.5-143 35.5-174-35-173-97-144zM512 832q-87 0-160.5-43t-116-116.5-42.5-160.5 42.5-160.5 116-116 160.5-42.5 160.5 42.5 116.5 116 43 160.5-43 160.5-116.5 116.5-160.5 43zM704 448h-128v-128q0-26-19-45t-45.5-19-45 19-18.5 45v128h-128q-27 0-45.5 19t-18.5 45.5 18.5 45 45.5 18.5h128v128q0 27 18.5 45.5t45 18.5 45.5-18.5 19-45.5v-128h128q26 0 45-18.5t19-45-19-45.5-45-19z" />',
                '<path transform="scale(1,1)" d="M896 448v-352q0-13-9.5-22.5t-22.5-9.5h-64l-144 144-272-272-384 1024 1024-384zM832 448l-704 384 704-704v320z" />',
                '<path transform="scale(1,1)" d="M800 640h-576q-13 0-22.5 9.5t-9.5 22.5q0 34 15 53.5t49 42.5q3 78 59.5 135t132.5 57q73 0 127-49t63-121q23 10 50 10 61 0 102.5-35t41.5-93q0-13-9.5-22.5t-22.5-9.5zM256 576h512q26 0 45-19t19-45l-256-512q0-26-19-45t-45.5-19-45 19-18.5 45l-256 512q0 26 19 45t45 19z" />',
                '<path transform="scale(1,1)" d="M512-64q-104 0-199 40.5t-163.5 109-109 163.5-40.5 199 40.5 199 109 163.5 163.5 109 199 40.5 199-40.5 163.5-109 109-163.5 40.5-199-40.5-199-109-163.5-163.5-109-199-40.5zM866 721q-69 90-175 137l-179-90-179 90q-106-47-176-137l35-17v-192l-126-95q8-123 79-225h175l64-160v-13q63-19 128-19t128 19v13l64 160h175q71 102 79 225l-126 95v192zM413 321l-61 177 160 110 160-110-61-177h-198z" />'
            ];

        static firstName():string{ return MicroJSONGenHelper.rndFirst[MicroJSONGenHelper.random( MicroJSONGenHelper.rndFirst.length-1)]; }
        static lastName():string{ return MicroJSONGenHelper.rndLast[MicroJSONGenHelper.random( MicroJSONGenHelper.rndLast.length-1)]; }
        static company():string{ return MicroJSONGenHelper.rndCompanies[MicroJSONGenHelper.random( MicroJSONGenHelper.rndCompanies.length-1)]; }
        static phone():string{ return "+7095" + Math.random().toFixed(7).split(".")[1]; }
        static email():string{ return ( MicroJSONGenHelper.firstName() + "@" + MicroJSONGenHelper.company().replace(/[^a-zA-Z0-9]+/g, '') + ".com").toLowerCase() }
        static bool():boolean{ return Math.random() > .5 ? true : false; }
        static random(random):number { return Math.floor(Math.random() * random); }
        static query(id):string{ return JSONMocker.context[id]; }
        static image( width:number, height:number ):string
        {

            var rndImage = MicroJSONGenHelper.rndImages[ Math.floor(Math.random() * MicroJSONGenHelper.rndImages.length - 2) ] + '';
            var sc;
            var aspect = width / height;
            var resizedWidth;
            var resizedHeight;

            if (height < width)
            {
                resizedHeight = height;
                resizedWidth = resizedHeight * aspect;
                sc = resizedWidth * 100 / 100000;
            }

            else
            { // screen width is smaller than height (mobile, etc)
                resizedWidth = width;
                resizedHeight = resizedWidth * aspect;
                sc = resizedHeight * 100 / 100000;
            }


            rndImage = '<g transform="scale(-1 -1) translate(-' + width + ' -' + height + ')">' + rndImage.replace('scale(1,1)', 'scale(' + sc + ' -' + sc + ') translate(' + width / 2 + ' ' + height / 2 + ')') + '</g>';
            var b64 = Base64.encode('<svg width="' + width + '" height="' + height + '" xmlns="http://www.w3.org/2000/svg"><g><rect id="svg_2" height="' + height + '" width="' + width + '" y="0" x="0" fill="#AAA"/><text fill="#444" x="' + Math.floor(width / 2) + '" y="' + Math.floor(height / 2) + '" id="svg_1" font-size="20" font-family="Helvetica" text-anchor="middle" xml:space="preserve">' + width + 'x' + height + '</text></g>' + rndImage + '</svg>');
            return 'data:image/svg+xml;base64,' + b64;
        }
        static guid():string
        {
            var e:string = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
            return e.replace(/[xy]/g, function (e)
            {
                var t = Math.random() * 16 | 0,
                    n = e === "x" ? t : t & 3 | 8;
                return n.toString(16)
            })
        }

        static numeric(e, n, r):number
        {
            var i = 0,
                s = (e + "").split(".").pop().length;
            return e = +e, n = +n, e % 1 === 0 ? i = Math.round(e - .5 + Math.random() * (n - e + 1)) : i = parseFloat(Math.min(e + Math.random() * (n - e), n).toFixed(s)), +i;
        }

        static lorem(paragraphs:number = 1, wordsPerParagraph:number = 100):string
        {
            function shuffle(o)
            { //v1.0
                for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x){;}
                return o;
            };
            var lorem = "ad adipisicing aliqua aliquip amet anim aute cillum commodo consectetur consequat culpa cupidatat deserunt do dolor dolore duis ea eiusmod elit enim esse est et eu ex excepteur exercitation fugiat id in incididunt ipsum irure labore laboris laborum Lorem magna minim mollit nisi non nostrud nulla occaecat officia pariatur proident qui quis reprehenderit sint sit sunt tempor ullamco ut velit veniam voluptate".split(' ');

            var loremShuffle = lorem.slice(0);
            shuffle(loremShuffle);
            loremShuffle.length = 25 + Math.floor(Math.random() * (wordsPerParagraph - 25));
            return "Lorem ipsum dolor sit amet " + loremShuffle.join(' ') + '.';

        }


    }


    class Base64
    {
        static isNode:boolean = typeof global !== "undefined" && {}.toString.call(global) == '[object global]';
        static encode( stringToEncode:string ):string
        {
            return Base64.isNode ? new Buffer( stringToEncode, 'utf8' ).toString('base64') : window.btoa( stringToEncode );
        }

        static decode( buffer:string ):NodeBuffer
        {
            return new Buffer(buffer, 'base64');
        }
    }

}
