/*! Responsive 1.0.0-dev
 * 2014 SpryMedia Ltd - datatables.net/license
 */

/**
 * @summary     Responsive
 * @description Responsive tables plug-in for DataTables
 * @version     1.0.0-dev
 * @file        dataTables.responsive.js
 * @author      SpryMedia Ltd (www.sprymedia.co.uk)
 * @contact     www.sprymedia.co.uk/contact
 * @copyright   Copyright 2014 SpryMedia Ltd.
 *
 * This source file is free software, available under the following license:
 *   MIT license - http://datatables.net/license/mit
 *
 * This source file is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the license files for details.
 *
 * For details please refer to: http://www.datatables.net
 */

(function(window, document, undefined) {


var factory = function( $, DataTable ) {
"use strict";

var Responsive = function ( settings ) {
	// Sanity check that we are using DataTables 1.10 or newer
	if ( ! $.fn.dataTable.versionCheck || ! $.fn.dataTable.versionCheck( '1.10' ) ) {
		throw 'DataTables Responsive required DataTables 1.10 or newer';
	}
	else if ( settings.responsive ) {
		return;
	}

	this.s = {
		dt: new $.fn.dataTable.Api( settings ),
		columns: []
	};

	settings.responsive = this;
	this.constructor();
};

Responsive.prototype = {
	constructor: function ()
	{
		var that = this;

		// xxx use DataTables throttle function
		$(window).on( 'resize.dtr', function () {
			that._resize();
		} );

		// Destroy event handler
		this.s.dt.on( 'destroy.dtr', function () {
			$(window).off( 'resize.dtr' );
		} );

		// Do a first pass
		this._classLogic();
		this._resizeAuto();
		this._resize();
	},


	_resize: function ()
	{
		// Which mode are we operating in?
		if ( ! this.s.auto ) {
			this._resizeManual();
		}
		else {
			this._resizeAuto();
		}
	},

	_resizeManual: function ()
	{
		var dt = this.s.dt;
		// Use the classes given by the end user to determine which columns
		// should be shown and hidden
		
		// Which break point are we in?
		var width = $(window).width();
		var breakpoints = Responsive.breakpoints;
		var breakpoint = 'desktop';

		// xxx Should we reorder the breakpoints array here?

		for ( var i=breakpoints.length-1 ; i>=0 ; i-- ) {
			if ( width <= breakpoints[i].width ) {
				breakpoint = breakpoints[i].name;
				break;
			}
		}

		console.log( 'Break point: ', breakpoint );
		$('#breakpoint').html( breakpoint );

		// Decision logic for what columns to show for this break point
		var columns = this._columnsVisiblity( breakpoint );
		console.log( 'Columns: ', columns );

		// Show the columns for that break point
		dt.columns().eq(0).each( function ( colIdx, i ) {
			dt.column( colIdx ).visible( columns[i] );
		} );
	},


	_columnsVisiblity: function ( breakpoint )
	{
		var dt = this.s.dt;
		var columns = this.s.columns;
		var i, ien;

		// Calculate the column visibility from the classes used on the columns
		// by the developer
		var display = $.map( columns, function ( col ) {
			return col.auto && col.minWidth === null ?
				false :
				col.auto === true ?
					'-' :
					col.includeIn.indexOf( breakpoint ) !== -1;
		} );

		// Calculate the column visibility for those which are auto sized
		// 
		// First pass, how much width is taken but the ones that must be
		// included from the non-auto columns
		
		var firstPassWidth = 0;
		for ( i=0, ien=display.length ; i<ien ; i++ ) {
			if ( display[i] === true ) {
				firstPassWidth += columns[i].minWidth;
			}
		}

		console.log( 'first pass width', firstPassWidth );

		// Second pass, use up any remaining width for other columns
		var widthAvailable = $('#'+dt.table().node().id+'_wrapper')[0].offsetWidth;
		console.log( 'width available', widthAvailable );

		var usedWidth = widthAvailable - firstPassWidth;
		for ( i=0, ien=display.length ; i<ien ; i++ ) {
			if ( display[i] === '-' ) {
				if ( usedWidth - columns[i].minWidth < 0 ) {
					display[i] = false;
				}
				else {
					display[i] = true;
				}

				usedWidth -= columns[i].minWidth;
			}
		}

		return display;
	},


	_classLogic: function ()
	{
		var calc = {};
		var breakpoints = Responsive.breakpoints;
		var columns = this.s.dt.columns().eq(0).map( function (i) {
			return {
				className: this.column(i).header().className,
				includeIn: [],
				auto: false
			};
		} );

		var add = function ( colIdx, name ) {
			var includeIn = columns[ colIdx ].includeIn;

			if ( includeIn.indexOf( name ) === -1 ) {
				includeIn.push( name );
			}
		};

		var column = function ( colIdx, name, operator, matched ) {
			var size, i, ien;

			if ( ! operator ) {
				columns[ colIdx ].includeIn.push( name );
			}
			else if ( operator === 'max-' ) {
				// Add this breakpoint and all smaller
				size = Responsive.find( name ).width;

				for ( i=0, ien=breakpoints.length ; i<ien ; i++ ) {
					if ( breakpoints[i].width <= size ) {
						add( colIdx, breakpoints[i].name );
					}
				}
			}
			else if ( operator === 'min-' ) {
				// Add this breakpoint and all larger
				size = Responsive.find( name ).width;

				for ( i=0, ien=breakpoints.length ; i<ien ; i++ ) {
					if ( breakpoints[i].width >= size ) {
						add( colIdx, breakpoints[i].name );
					}
				}
			}
			else if ( operator === 'not-' ) {
				// Add all but this breakpoint (xxx need extra information)

				for ( i=0, ien=breakpoints.length ; i<ien ; i++ ) {
					if ( breakpoints[i].name.indexOf( matched ) === -1 ) {
						add( colIdx, breakpoints[i].name );
					}
				}
			}
		};

		columns.each( function ( col, i ) {
			var hasClass = false;

			$.each( breakpoints, function ( j, breakpoint ) {
				// Does this column have a class that matches this breakpoint?
				var brokenPoint = breakpoint.name.split('-');
				var re = new RegExp( '(min\\-|max\\-|not\\-)?('+brokenPoint[0]+')(\\-[_a-zA-Z0-9])?' );
				var match = col.className.match( re );

				if ( match ) {
					hasClass = true;

					if ( match[2] === brokenPoint[0] && match[3] === '-'+brokenPoint[1] ) {
						// Class name matches breakpoint name fully
						column( i, breakpoint.name, match[1], match[2]+match[3] );
					}
					else if ( match[2] === brokenPoint[0] && ! match[3] ) {
						// Class name matched primary breakpoint name with no qualifier
						column( i, breakpoint.name, match[1], match[2] );
					}
				}
			} );

			// If there was no control class, then automatic sizing is used
			if ( ! hasClass ) {
				col.auto = true;
			}
		} );

		this.s.columns = columns;
		console.log( columns );
	},

	_resizeAuto: function ()
	{
		var dt = this.s.dt;
		var columns = this.s.columns;
		var tableWidth = dt.table().node().offsetWidth;
		var columnWidths = dt.columns;
		var clonedTable = dt.table().node().cloneNode( false );
		var clonedHeader = $( dt.table().header() ).clone( false ).appendTo( clonedTable );
		var cells = dt.settings()[0].oApi._fnGetUniqueThs( dt.settings()[0], clonedHeader );
		var inserted = $('<div/>')
			.css( {
				width: 1,
				height: 1,
				overflow: 'hidden'
			} )
			.append(clonedTable)
			.insertBefore( dt.table().node() );

		// The cloned header now contains the smallest that each column can be
		dt.columns().eq(0).each( function ( idx ) {
			columns[idx].minWidth = dt.column( idx ).visible() ?
				cells[ dt.column( idx ).index('visible') ].offsetWidth :
				null;
		} );

		inserted.remove();
	}
};

Responsive.breakpoints = [
	{ name: 'desktop',  width: Infinity },
	{ name: 'tablet-l', width: 1024 },
	{ name: 'tablet-p', width: 768 },
	{ name: 'phone-l',  width: 480 },
	{ name: 'phone-p',  width: 320 }
];

// add all and none options

Responsive.find = function ( name )
{
	var breakpoints = Responsive.breakpoints;

	for ( var i=0, ien=breakpoints.length ; i<ien ; i++ ) {
		if ( breakpoints[i].name === name ) {
			return breakpoints[i];
		}
	}
};


$.fn.dataTable.Responsive = Responsive;
$.fn.DataTable.Responsive = Responsive;

// Attach a listener to the document which listens for DataTables initialisation
// events so we can automatically initialise
$(document).one( 'init.dt.dtr', function (e, settings, json) {
	if ( $(settings.nTable).hasClass( 'responsive' ) ||
		 $(settings.nTable).hasClass( 'dt-responsive' ) ||
		 settings.oInit.responsive
	) {
		new Responsive( settings );
	}
} );

return Responsive;
}; // /factory


// Define as an AMD module if possible
if ( typeof define === 'function' && define.amd ) {
	define( 'datatables-responsive', ['jquery', 'datatables'], factory );
}
else if ( jQuery && !jQuery.fn.dataTable.Responsive ) {
	// Otherwise simply initialise as normal, stopping multiple evaluation
	factory( jQuery, jQuery.fn.dataTable );
}


})(window, document);
