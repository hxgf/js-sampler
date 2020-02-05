
var config = {
	pk: 'DEMO',
	site_id: 'NRHA'
};



Handlebars.registerHelper('is', function(left, operator, right, options) {

  var operators, result;
  if (arguments.length < 3) {
    throw new Error("'is' needs 2 parameters");
  }
  if (options === undefined) {
    options = right;
    right = operator;
    operator = "===";
  }
  operators = {
    '==': function (l, r) { return l == r; },
    '===': function (l, r) { return l === r; },
    'not': function (l, r) { return l != r; },
    '!=': function (l, r) { return l != r; },
    '!==': function (l, r) { return l !== r; },
    '<': function (l, r) { return l < r; },
    '>': function (l, r) { return l > r; },
    '<=': function (l, r) { return l <= r; },
    '>=': function (l, r) { return l >= r; },
    'typeof': function (l, r) { return typeof l == r; },
    'in': function (l, r) { if ( ! module.exports.is_array(r)) { r = r.split(','); } return r.indexOf(l) > -1; }
  };
  if (!operators[operator]) {
    throw new Error("Unknown operator " + operator);
  }
  result = operators[operator](left, right);
  if (result) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }

});



Handlebars.registerHelper('if_contains', function(haystack, needle, options) {
	var answer = options.inverse(this);
	if (haystack){
		if (haystack.indexOf(needle) !== -1){
			answer = options.fn(this);
		}		
	}
	return answer;
});








var utility = {
	query_string: function(){
		var qs = document.location.search;
    qs = qs.split('+').join(' ');
    var params = {},
        tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;
    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    }
    return params;
	},
  api_request: function(cfg){
    var data = cfg.data ? cfg.data : {};


    data.pk = config.pk;
    data.site_id = config.site_id;

		var url = "http://profiles.nrha1.com/api/" + cfg.endpoint;
    if (cfg.url){
      url = cfg.url;
    }

    return $.ajax({
      type: "POST",
      url: url,
      dataType: 'json',
      data: data
    }).fail(function(jqXHr, textStatus, errorThrown){
      var error_label = 'Can\'t connect to data server.';
      if (errorThrown != ''){
        error_label = 'Data server error:<br /><small>'+errorThrown+'</small>';
      }
      alert(error_label);
      console.log(errorThrown);
    }).done(function(data) {
      if (cfg.callback){
        cfg.callback(data);
      }else{
        if (cfg.debug){
          console.log(data);
        }
        return data;
      }
    });
  },
  render_template: function(template, data){
		var template = Handlebars.compile($(template).html());
		$("#profiles-content").html(template(data));		
	},
  show_map: function(coords, center, zoom, static_map){
	  $('#gmap').gmap3({
	    defaults: { 
	      classes:{
	        Marker: MarkerWithLabel
	      }
	    },
	    map: {
	      options:{
	        center: center,
	        zoom: zoom,
		      mapTypeControl: false,
			    scrollwheel: false,
				  zoomControl: true,
				  panControl: false,
			    streetViewControl: false,
	      }
	    },
	    marker:{
	      values: coords,
	      events: {
					click: function(marker, event, data) { 
						var url = data.data;
						var id = data.id;

						if (url){
							window.top.location = url;
						}							
					},
					mouseover: function(marker, event, context){
							marker.set('labelVisible',false);	
							marker.set('labelVisible',true);							
		      },
		      mouseout: function(marker, event, context){
							marker.set('labelVisible',false);	
		      }	
	      }
	    },
	  });	
		$("#gmap").removeClass('loading');
		return true;
	}
};
