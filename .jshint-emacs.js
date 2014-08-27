/*jshint node: true */
var reporter_name = "jhlint";

module.exports = {
	reporter: function (data) {
		"use strict";

		var str = '',
		errors = [];

		data.forEach(function (data) {
			var file = data.file;

			if (data.error) {
				data.error.file = file;
				errors.push( data.error );
			}
		});

		errors.forEach(function (error) {
			var file = error.file,
			error_id;
			if (error.id === '(error)') {
				error_id = 'ERROR';
			} else {
				error_id = 'WARNING';
			}
			str += file + ':' + error.line + ':' + error.character + ': error ( ' + error.code + ' ) ' + error.reason + '\n' + error.evidence + '\n';

		});

		if (str) {
			process.stdout.write(str + "\n");
		}
	}
};
