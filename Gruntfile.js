module.exports = function (grunt)
{
	grunt.loadNpmTasks("grunt-ts");

	grunt.initConfig(
	{
		ts:
		{
			node: {
				src: [
					"./src/**/*.ts"	// The source typescript files, http://gruntjs.com/configuring-tasks#files
				],
				reference: "./src/reference.ts",  // If specified, generate this file that you can use for your reference management
				watch: './src',                     // If specified, watches this directory for changes, and re-runs the current target
				outDir:'./lib',
				options: {                         // use to override the default options, http://gruntjs.com/configuring-tasks#options
					target: 'es3',                 // 'es3' (default) | 'es5'
						module: 'commonjs',            // 'amd' (default) | 'commonjs'
						sourceMap: false,               // true (default) | false
						declaration: false,            // true | false (default)
						removeComments: true           // true (default) | false
				}
			},
			www:{
				src: [
					"./bin/www/ts/**/*.ts" // The source typescript files, http://gruntjs.com/configuring-tasks#files
				],
				reference: "./bin/www/ts/reference.ts",  // If specified, generate this file that you can use for your reference management
				watch: './bin/www/ts',                     // If specified, watches this directory for changes, and re-runs the current target
				outDir:'./bin/www/js',
				options: {                         // use to override the default options, http://gruntjs.com/configuring-tasks#options
					target: 'es3',                 // 'es3' (default) | 'es5'
					module: 'commonjs',            // 'amd' (default) | 'commonjs'
					sourceMap: false,               // true (default) | false
					declaration: false,            // true | false (default)
					removeComments: true           // true (default) | false
				}
			}
		}
	});

	grunt.registerTask("default", ["ts:node"]);
	grunt.registerTask("www", ["ts:www"]);
}