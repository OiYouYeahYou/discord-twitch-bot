const gulp = require( 'gulp' );
const gulp_ts = require( 'gulp-typescript' );
const gulp_sourcemaps = require( 'gulp-sourcemaps' );
const del = require( 'del' );
const { join } = require( 'path' );

const project = gulp_ts.createProject( 'tsconfig.json' );

gulp.task( 'build', () => {
	del.sync( [ 'lib/**/*.*' ] );
	const tsCompile = gulp.src( 'src/**/*.ts' )
		.pipe( gulp_sourcemaps.init( { base: 'src' } ) )
		.pipe( project() );

	tsCompile.pipe( gulp.dest( 'lib/' ) );

	gulp.src( 'src/**/*.js' ).pipe( gulp.dest( 'lib/' ) );
	gulp.src( 'src/**/*.json' ).pipe( gulp.dest( 'lib/' ) );
	gulp.src( 'src/**/*.lang' ).pipe( gulp.dest( 'lib/' ) );

	return tsCompile.js
		.pipe( gulp_sourcemaps.mapSources( p => join( __dirname, 'src', p ) ) )
		.pipe( gulp_sourcemaps.write() )
		.pipe( gulp.dest( 'lib/' ) );
} );

gulp.task( 'default', [ 'build' ] );
