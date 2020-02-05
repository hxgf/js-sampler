
schemas.house = {
  id: String,
  division: String,
  lot: String,
  lot_multiple: Boolean,
  block: String,
  description: String,
  description_raw: String,
  owner: String,
  real_tax: String,
  real_tax_amount: String,
  additional_tax: String,
  additional_tax_amount: String,
  tax_total: String,
  raw: String,
  url_assessor: String,
  address_full: String,
  address: String,
  city: String,
  state: String,
  zip: String,
  lat: String,
  lon: String,
  url_map: String,
  re_download: String,
  status_unavailable: Boolean,
  status_favorite: Boolean
};
var schema_house = new mongoose.Schema(schemas.house);
models.house = mongoose.model('houses', schema_house);














app.get('/populate-from-scratch', function (req, res) {

  fs.readFile($.__base + "app/okresale-raw.txt", "utf8", function (error, file_data) {

    $._.forEach(file_data.split("--------"), function(property) {

      var newlines = property.split('\n');
      var line_2 = newlines[2];

      var split_block = property.replace(/\n/g, " ").split(' Block ');
      var ___description = split_block[1];

      var property_record = {
        id: newlines[1],
        lot: property.replace(/\n/g, " ").split(' Lot ').pop().split(' Block ').shift(),
        block: property.replace(/\n/g, " ").split(' Block ').pop().split(' ').shift(),
        owner: property.replace(/\n/g, " ").split('Owner: ').pop().split(' , ').shift(),
        raw: property
      };

      if (line_2){
        var _division = line_2.split(' Lot ');
        property_record.division = _division[0];
      }

      if (___description){
        var i = ___description.indexOf(' ');
        var splits = [___description.slice(0,i), ___description.slice(i+1)];
        var _description = splits[1].split('Owner:');
        var description = _description[0].replace(/\n/g, " ");
        property_record.description = $.v.lowerCase(description);
      }

      var house = new models.house(property_record);
      house.save(function (err) {
    		if (err) return $.lexxi.application_error(err);
        console.log(property_record);
      });

    });

    res.json({
      data: file_data
    });

  });

});



































app.get('/scrape/assessor', function (req, res) {

  models.house.find({ id: { $ne: null } }).exec(function (err, data_properties) {
    if (err) return $.lexxi.application_error(err);

    $._.forEach(data_properties, function (property, i) {

      setTimeout(function () {
        console.log('-------------------------------------');
        console.log('-------------------------------------');
        scrape_assessor(property);
      }, 2000 * i);

    });

    res.json({

    });

  });

});







function scrape_assessor(property) {

  if (property.lot == '000') {
    models.house.update({ _id: property._id }, {
      lot_multiple: true
    }).exec(function (err) {
      console.log('multiple lots: ' + property.id);
    });
  } else {

    request.post({
      url: 'http://www.oklahomacounty.org/assessor/Searches/SubdivSearch.asp', form: {
        SubDivision: property.division,
        Block: property.block,
        Lot: property.lot
      }
    }, function (err, httpResponse, body) {

      var $$ = cheerio.load(body);
      var assessor_link = 'http://www.oklahomacounty.org/assessor/Searches/' + $$("body > div:nth-child(5) > table > tbody > tr:nth-child(3) > td:nth-child(2) > table > tbody > tr > td:nth-child(1) > p > a").attr('href');

      var _address = $$("body > div:nth-child(5) > table > tbody > tr:nth-child(3) > td:nth-child(2) > table > tbody > tr > td:nth-child(3) > font").text();
      var address = _address.replace(/\W\s+/g, ' ').trim();

      var input = {
        url_assessor: assessor_link,
        address: address,
      };

      models.house.update({ _id: property._id }, input).exec(function (err) {
        console.log('single lot: ' + address);
      });

    });

  }

}





































app.get('/scrape/google', function (req, res) {


  models.house.find({ address: { $ne: '' }, city: { $ne: '' }, lat: null }).exec(function (err, data_properties) {
    if (err) return $.lexxi.application_error(err);

    $._.forEach(data_properties, function (property, i) {

      setTimeout(function () {
        console.log('-------------------------------------');
        console.log('-------------------------------------');
        scrape_google(property);
      }, 2000 * i);

    });

    res.json({

    });

  });

});









function scrape_google(property) {

  var search_address = encodeURI(property.address + ', ' + property.city + ', OK');

  request.get({ url: 'http://maps.googleapis.com/maps/api/geocode/json?address=' + search_address + '&sensor=true' }, function (err, httpResponse, body) {

    var geocode_data = JSON.parse(body);

    var input = {};

    if (typeof geocode_data.results[0] != 'undefined') {
      if (typeof geocode_data.results[0].geometry != 'undefined') {
        if (typeof geocode_data.results[0].geometry.location != 'undefined') {
          input.lat = geocode_data.results[0].geometry.location.lat;
          input.lon = geocode_data.results[0].geometry.location.lng;
        }
      }
    }

    if (input.lat && input.lon) {
      input.url_map = 'https://www.google.com/maps/search/' + input.lat + ',' + input.lon;
    }

    if (typeof geocode_data.results[0] != 'undefined') {
      input.address_full = geocode_data.results[0].formatted_address;
      if (typeof geocode_data.results[0].address_components[7] != 'undefined') {
        input.zip = geocode_data.results[0].address_components[7].short_name;
      }
    }

    models.house.update({ _id: property._id }, input).exec(function (err) {
      console.log(input);
    });

  });

}






























