
let $ = require('jquery');
require('datatables.net')()
require('datatables.net-bs4')()
let Q = require('q');
let Fecha = require('fecha');
let JsonMarkup = require('json-markup');

let internals = {
	format: 'raw',
	period: 500, // 12
	response: []

}

$('select[data-id="period"]').on('change', function(el){

	internals.period = parseInt($(this).val(), 10)
	fetchData();
});

$('form[data-id="display-format"]').on('change', function(el){

	internals.format = $('input[name="display-format"]:checked').val()
	updateDisplay()
});

init();





function init() {

	fetchData();
};

function fetchData() {

	let showLoading = true;
	updateDisplay(showLoading);

	Q.all([Q.delay(750), getReadings()]).then(responses =>{ 

		internals.response = responses[1];
		for (let i = 0; i < internals.response.length; i++) {
			internals.response[i].ts = Fecha.format(new Date(internals.response[i].ts), 'dddd, DD-MMM HH:mm:ss')
		}

		updateDisplay()
	})
}

function getReadings() {

	return Q($.ajax({
		type: 'GET',
		url: '/v1/get-readings',
		data: {
			period: internals.period
		},
	}))
}

function updateDisplay(loading = false) {

	if (loading) {
		$('[data-id="main-content"]').html('fetching data, please wait...');
		return;		
	}

	if (internals.format === 'raw') {
		showRaw();
	}
	else {
		showTable()
	}
}

function showRaw() {

	$('[data-id="main-content"]').html(JsonMarkup(internals.response))
}

function showTable() {

	$('[data-id="main-content"]').html('<table class="display" width="100%"></table>');
	$('table').DataTable( {
	     data: internals.response,
	     pageLength: 500,
	     lengthChange: false,
	     columns: [
	     	//{ data: "id" , title: "id" },
	        { data: "ts" , title: "ts" },
	        { data: "device_id" , title: "device_id" },
	        { data: "sid" , title: "sid" },
	        { data: "type" , title: "type" },
	        { data: "val" , title: "val" },
	        { data: "description", title: "description" }
	     ]
	 } );

}

