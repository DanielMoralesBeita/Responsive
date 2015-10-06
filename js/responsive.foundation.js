/*! Foundation integration for DataTables' Responsive
 * ©2015 SpryMedia Ltd - datatables.net/license
 */

(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		// AMD
		define( ['jquery', 'datatables-zf', 'datatables-responsive'], factory );
	}
	else if ( typeof exports === 'object' ) {
		// Node / CommonJS
		module.exports = function ($) {
			if ( ! $ ) { $ = require('jquery'); }
			if ( ! $.fn.dataTable ) { require('datatables-zf')($); }
			if ( ! $.fn.dataTable.AutoFill ) { require('datatables-responsive')($); }

			factory( $ );
		};
	}
	else {
		// Browser
		factory( jQuery );
	}
}(function( $ ) {
'use strict';
var DataTable = $.fn.dataTable;


var _display = DataTable.Responsive.display;
var _original = _display.modal;

_display.modal = function ( options ) {
	return function ( row, update, render ) {
		if ( ! $.fn.foundation ) {
			_original( row, update, render );
		}
		else {
			if ( ! update ) {
				$( '<div class="reveal-modal" data-reveal/>' )
					.append( '<a class="close-reveal-modal" aria-label="Close">&#215;</a>' )
					.append( options && options.header ? '<h4>'+options.header( row )+'</h4>' : null )
					.append( render() )
					.appendTo( 'body' )
					.foundation( 'reveal', 'open' );
			}
		}
	};
};


return DataTable.Responsive;
}));
