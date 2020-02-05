



app.post('/api/project/marketing/screen', function (req, res) {

  models.project.find({ _id: req.body.project_id }).limit(1).lean().exec(function (err, _data_project) {

    var data_project = _data_project[0];

    models.gallery_photo.find({ project_id: req.body.project_id }).sort({ display_order: 1 }).exec(function (err, gallery_photos) {

      models.plan.findOne({ _id: data_project.plan_id }).exec(function (err, data_plan) {
        models.community.findOne({ _id: data_project.community_id }).exec(function (err, data_community) {
          models.pricing_version.findOne({ project_id: req.body.project_id, title: 'Current Contracted Version' }).exec(function (err, data_version) {
            if (data_version) {
              var version_id = data_version._id;
            }
            else {
              var version_id = null;
            }
            models.math_pricing_versions.find({ version_id: version_id }).exec(function (err, data_versions_math) {
              models.amenities_category.find({}).sort({ display_order: 1 }).exec(function (err, data_amenities_categories) {
                models.amenity.find({}).exec(function (err, data_amenities) {

                  var availability_sold = false;
                  var availability_soon = false;
                  var availability_contract_pending = false;
                  var availability_sale_new = false;
                  var availability_lease_new = false;
                  var lease_init = '';
                  var availability_pre_owned = false;
                  var availability_lease_pre = false;
                  var availability_sale_pre = false;
                  var availability_none = false;


                  if (data_project.availability) {
                    if (data_project.availability == 'sold') {
                      availability_sold = true;
                    }
                    if (data_project.availability == 'coming_soon') {
                      availability_soon = true;
                    }
                    if (data_project.availability == 'pre_owned') {
                      availability_pre_owned = true;
                    }

                    if (data_project.availability == 'contract_pending') {
                      availability_contract_pending = true;
                    }

                    else if (data_project.availability == 'sale_new') {
                      availability_sale_new = true;
                    }

                    else if (data_project.availability == 'lease_new') {
                      availability_lease_new = true;
                      lease_init = "init";
                    }

                    else if (data_project.availability == 'sale_pre') {
                      availability_sale_pre = true;
                    }

                    else if (data_project.availability == 'lease_pre') {
                      availability_lease_pre = true;
                      lease_init = "init";
                    }

                    else {
                      availability_none = true;
                    }
                  } else {
                    availability_none = true;
                  }


                  var o = {
                    project_id: req.body.project_id,
                    marketing_data: data_project,
                    gallery_photos: gallery_photos,
                    title: data_project.title,
                    can_view: req.body.group_id <= 2 ? true : false,
                    uid: req.body.user_id,
                    gid: req.body.group_id,
                    notes: data_project.description ? strip_tags(data_project.description) : null,
                    description: data_project.description ? data_project.description : null,
                    availability_none: availability_none,
                    availability_sold: availability_sold,
                    availability_soon: availability_soon,
                    availability_contract_pending: availability_contract_pending,
                    availability_sale_new: availability_sale_new,
                    availability_lease_new: availability_lease_new,
                    availability_pre_owned: availability_pre_owned,
                    availability_lease_pre: availability_lease_pre,
                    availability_sale_pre: availability_sale_pre,
                    lease_init: lease_init,
                    print_url: 'https://api.clickbuild.io/marketing-flyer/' + req.body.project_id,

                  };

                  if (data_project.offered_by) {
                    o.offeredby_sixteen3 = data_project.offered_by == 'Sixteen3 Holdings, L.L.C.' ? true : false;
                    o.offeredby_jcei = data_project.offered_by == 'JC Equities & Investments' ? true : false;
                  }


                  var custom_amenities = '';

                  custom_amenities +=
                    '<big><b style="font-family: sans-serif"> Custom Amenities</b></big>' +
                    '<ul style="font-family: sans-serif"> ';

                  var amenities = [];

                  $._.forEach(data_amenities, function (dd) {
                    amenities[dd._id] = dd;
                  });

                  $._.forEach(data_versions_math, function (dd) {
                    var _amenity = amenities[dd.amenity_id];
                    if (_amenity.category_id == '55fb76f98c7a75b5394749c5') {
                      var credit = true;
                    } else {
                      var credit = false;
                    }
                    custom_amenities += '<li> ' + _amenity.title + '</li> ';
                  });


                  custom_amenities += '</ul><br />';

                  var municipality = data_project.municipality_permitting;
                  if (data_project.municipality_postal != '') {
                    municipality = data_project.municipality_postal;
                  }

                  var offered_by = 'Jeff Click Design | Build, LLC';
                  if (data_project.offered_by) {
                    offered_by = data_project.offered_by;
                  }


                  var craigslist_html =
                    '<big>' +
                    '<big>' +
                    '<b style="font-family: sans-serif">' + data_project.sf_beds + 'Bd, ' + data_project.sf_baths + 'Bth, ' + data_project.sf_living + ' | ' + data_community.schools + ' Schools</b>' +
                    '</big>' +
                    '</big>' +
                    '<br> ' +
                    '<br> ' +
                    '<b style="font-family: sans-serif"> Property Address</b> ' +
                    '<br> ' +
                    '<span style="font-family: sans-serif">' + data_project.title + ' | ' + municipality + ' ' + data_project.zip_code + '</span> ' +

                    '<br> ' +
                    '<br> ' +
                    '<b style="font-family: sans-serif"> Offered By</b> ' +
                    '<br> ' +
                    '<span style="font-family: sans-serif"> ' + offered_by + '</span> ' +
                    '<br> ' +
                    '<br> ' +

                    '<b style="font-family: sans-serif"> Details</b> ' +
                    '<br> ' +
                    '<span style="font-family: sans-serif"> ' +
                    'Beds / Baths: ' + data_project.sf_beds + 'BD / ' + data_project.sf_baths + 'BA<br />' +
                    'Square Feet: ' + $.lexxi.number_format(data_project.sf_frame) + '<br />' +
                    '</span>' +
                    '<br> ' +

                    '<hr> ' +
                    '<br> ' +

                    '<b style="font-family: sans-serif"> Description</b> ' +
                    '<br> ' +
                    '<br> ' +
                    '<div style="font-family: sans-serif"> ' +
                    nl2br(data_project.description) +
                    '</div> ' +
                    '<br> ' +
                    '<br> ' +

                    '<b style="font-family: sans-serif"> Neighborhood Information</b> ' +
                    '<br> ' +
                    '<br> ' +
                    '<div style="font-family: sans-serif"> ' +
                    nl2br(data_community.description) +
                    '</div> ' +
                    '<br> ' +
                    '<br> ' +

                    '<b style="font-family: sans-serif"> Schools</b> ' +
                    '<br> ' +
                    '<br> ' +
                    '<div style="font-family: sans-serif"> ' +
                    'Elementary - ' + data_community.elementary + ' <br />' +
                    'Middle School - ' + data_community.middleschool + ' <br />' +
                    'High School - ' + data_community.highschool + ' <br />' +
                    '</div> ' +
                    '<br> ' +
                    '<br> ' +

                    custom_amenities +

                    '<big><b style="font-family: sans-serif"> Standard Amenities</b></big><br /><br />' +

                    '<b style="font-family: sans-serif"> Energy Efficiency</b>' +
                    '<ul style="font-family: sans-serif">' +
                    '<li>Lo-E Efficiency Vinyl Windows</li>' +
                    '<li>LED Recessed Can Lighting</li>' +
                    '<li>Digitally-Scheduled HVAC Thermostats</li>' +
                    '</ul>' +

                    '<b style="font-family: sans-serif"> Appliances</b>' +
                    '<ul style="font-family: sans-serif">' +
                    '<li>Frigidaire&reg; Brand Appliance Package</li>' +
                    '<li>Stainless Steel Finish</li>' +
                    '<li>Electric Smooth-Top Range</li>' +
                    '<li>Microwave W/Recirculating Vent</li>' +
                    '<li>Dishwasher</li>' +
                    '<li>Kitchen Disposal</li>' +
                    '</ul>' +

                    '<b style="font-family: sans-serif"> Heating & Air Conditioning</b>' +
                    '<ul style="font-family: sans-serif">' +
                    '<li>Goodman&reg; Brand Equipment</li>' +
                    '<li>14-SEER Air Conditioner(s)</li>' +
                    '<li>82&#37; Efficiency Gas Furnace(s)</li>' +
                    '<li>R-8 Ducting</li>' +
                    '<li>Digitally-Scheduled Thermostats</li>' +
                    '<li>5-Yr Equipment Warranty</li>' +
                    '<li>System Engineered Per Home</li>' +
                    '</ul>' +

                    '<b style="font-family: sans-serif"> Electrical</b>' +
                    '<ul style="font-family: sans-serif">' +
                    '<li>Decora Style Switches & Outlets</li>' +
                    '<li>Proximity-Sensor Light Switches In Bathrooms</li>' +
                    '<li>LED Recessed Can Lights Per Plan</li>' +
                    '<li>LED Can Light In Pantry w/Kitchen Lights</li>' +
                    '<li>Wall & Counter Top Outlets Per Code</li>' +
                    '<li>Bedrooms Braced For Future Ceiling Fans</li>' +
                    '<li>Exterior Weatherproof Outlets Per Code & Plan</li>' +
                    '<li>LED Utility Room, Master Closet, & Garage Lights</li>' +
                    '<li>LED Lighting In Walk-In Closets</li>' +
                    '<li>200-Amp Service & Breaker Panel</li>' +
                    '</ul>' +

                    '<b style="font-family: sans-serif"> Plumbing</b>' +
                    '<ul style="font-family: sans-serif">' +
                    '<li>50-Gallon Gas Water Heater</li>' +
                    '<li>Delta&reg; Brand Fixtures Per Style Package</li>' +
                    '<li>Koehler&reg; Brand Lavs Per Style Package</li>' +
                    '<li>Western&reg; Standard Height & Length Toilets</li>' +
                    '<li>Shower Heads Set At 7\'6"</li>' +
                    '<li>2 Exterior Anti-Siphon Hose Bibs</li>' +
                    '<li>Pex Water Lines</li>' +
                    '<li>5/8" Water Meter & Service</li>' +
                    '</ul>' +

                    '<b style="font-family: sans-serif"> Connectivity</b>' +
                    '<ul style="font-family: sans-serif">' +
                    '<li>TV Outlets Per Plan</li>' +
                    '<li>Optional Voice & Speaker Ports</li>' +
                    '<li>Centralized Media/Communications Hub</li>' +
                    '<li>Powered Communications Port For Service</li>' +
                    '<li>Secure Service Conduit To Garage</li>' +
                    '<li>Cox Services Available</li>' +
                    '<li>AT&T Services Available</li>' +
                    '</ul>' +

                    '<b style="font-family: sans-serif"> Safety & Security</b>' +
                    '<ul style="font-family: sans-serif">' +
                    '<li>Honeywell&reg; Vista 20 Security System</li>' +
                    '<li>Security Contacts On All Functioning Windows</li>' +
                    '<li>Security Contacts On All Exterior Doors</li>' +
                    '<li>Centrally-Located Control Keypad</li>' +
                    '<li>Wired Smoke Detectors In Bedrooms & Hallways</li>' +
                    '<li>Wired Carbon Monoxide Detectors Per Code</li>' +
                    '<li>Secure Communications Conduit To Garage</li>' +
                    '</ul>' +

                    '<b style="font-family: sans-serif"> Cabinetry</b>' +
                    '<ul style="font-family: sans-serif">' +
                    '<li>3/4" Maple Veneer Fronts</li>' +
                    '<li>ALL Adjustable Shelves</li>' +
                    '<li>Concealed, Compact Adjustable Hinges</li>' +
                    '<li>Full-Extension Ball Bearing Drawer Guides</li>' +
                    '<li>All Plywood Construction (No Particle Board)</li>' +
                    '<li>Pull Hardware Per Style Selection</li>' +
                    '</ul>' +

                    '<b style="font-family: sans-serif"> Trim & Doors</b>' +
                    '<ul style="font-family: sans-serif">' +
                    '<li>Masonite&reg; Doors Per Style Package</li>' +
                    '<li>MDF Base & Case Per Style Package</li>' +
                    '<li>Framed Mirrors In Full Baths Per Style Package' +
                    '<li>Stain-grade Maple Accent-Trim Per Plan</li>' +
                    '<li>Paint-Grade Poplar Window Sills</li>' +
                    '</ul>' +

                    '<b style="font-family: sans-serif"> Flooring</b>' +
                    '<ul style="font-family: sans-serif">' +
                    '<li>Stained Concrete Kitchen, Baths, & Halls</li>' +
                    '<li>Builder-Grade+ Carpeted Bedrooms</li>' +
                    '<li>OPTIONS: Tile &/Or Hardwood</li>' +
                    '</ul>' +

                    '<b style="font-family: sans-serif"> Wet-Wall Surfacing</b>' +
                    '<ul style="font-family: sans-serif">' +
                    '<li>Tiled Master Shower w/Mosaic Floor</li>' +
                    '<li>Tiled Master Bath Splash</li>' +
                    '<li>Tiled Hall Bath Surround</li>' +
                    '<li>Mosaic Tiled Kitchen Backsplash</li>' +
                    '</ul>' +

                    '<b style="font-family: sans-serif"> Counter Tops</b>' +
                    '<ul style="font-family: sans-serif">' +
                    '<li>Quartz Island w/Undermount Stainless Sink</li>' +
                    '<li>Designer WilsonArt&reg; Laminate</li>' +
                    '<li>OPTIONS: Add\'l Quartz & /Or Concrete Tops</li > ' +
                    '</ul>' +

                    '<b style="font-family: sans-serif"> Lighting</b>' +
                    '<ul style="font-family: sans-serif">' +
                    '<li>Designer Fixture Allowance Per Plan & Community</li>' +
                    '<li>LED Recessed Can Lights In Kitchen Per Plan</li>' +
                    '<li>LED Can Light In Pantry w/Kitchen Lights</li>' +
                    '<li>LED Utility Room, Master Closet, & Garage Lights</li>' +
                    '<li>LED Lighting In Walk-In Closets</li>' +
                    '<li>Exterior Coach Lighting Per Plan</li>' +
                    '</ul>' +

                    '<b style="font-family: sans-serif"> Fireplace</b>' +
                    '<ul style="font-family: sans-serif">' +
                    '<li>Designer Fireglass Gas-Burning Fireplace</li>' +
                    '<li>Easy Switch-On Functionality ' +
                    '<li>Entertainment Wall Integration Per Plan</li>' +
                    '</ul>' +

                    '<b style="font-family: sans-serif"> Paint Finishes</b>' +
                    '<ul style="font-family: sans-serif">' +
                    '<li>Stained Or Lacquered Cabinetry</li>' +
                    '<li>Accent Trim (Same As Cabinetry)</li>' +
                    '<li>Lacquered Baseboards, Casings, & Interior Doors</li>' +
                    '<li>Main Wall Color + 1 Additional Wall Accent Color</li>' +
                    '</ul>' +

                    '<b style="font-family: sans-serif"> Interior Walls</b>' +
                    '<ul style="font-family: sans-serif">' +
                    '<li>1/2" Drywall Installed W/Screws</li>' +
                    '<li>Fully Taped & Bedded Joints</li>' +
                    '<li>Metal Cornerbead At Vertical Corners</li>' +
                    '<li>Skip-Trowel Texture, Including Closets & Garage</li>' +
                    '</ul>' +

                    '<b style="font-family: sans-serif"> Insulation</b>' +
                    '<ul style="font-family: sans-serif">' +
                    '<li>Bibbed and Blown Fiberglass Exterior Wall Insulation</li>' +
                    '<li>R-38 Fiberglass Attic Insulation</li>' +
                    '<li>Super-Sealer Cavity & Penetration Sealant Package</li>' +
                    '<li>Insulated Garage Door Panels</li>' +
                    '</ul>' +

                    '<b style="font-family: sans-serif"> Weatherization</b>' +
                    '<ul style="font-family: sans-serif">' +
                    '<li>ZIP Sheathing & Tape System on Exterior Walls</li>' +
                    '<li>Fully-Flashed Windows & Exterior Doors</li>' +
                    '<li>Weather Stripping & Adjustable Thresholds</li>' +
                    '<li>Weather-Sealed Garage Door</li>' +
                    '<li>Windows & Exterior Doors Caulk-Sealed</li>' +
                    '</ul>' +

                    '<b style="font-family: sans-serif"> Windows</b>' +
                    '<ul style="font-family: sans-serif">' +
                    '<li>JELD-WEN&reg; V-2500 Series</li>' +
                    '<li>Energy Saver&reg; LoE Glass w/Argon Gas</li>' +
                    '<li>White Vinyl Frame</li>' +
                    '<li>Fully-Flashed Tops & Sides</li>' +
                    '<li>Flex-Sill Flashing At Sill</li>' +
                    '<li>Limited Lifetime Warranty</li>' +
                    '</ul>' +

                    '<b style="font-family: sans-serif"> Foundation</b>' +
                    '<ul style="font-family: sans-serif">' +
                    '<li>Monolithicly-Poured Post-Tension Construction</li>' +
                    '<li>3rd-Party Engineered & Certified</li>' +
                    '<li>Not Externally-visible or Exposed</li>' +
                    '<li>Pre-Engineered Future Storm Shelter Location</li>' +
                    '</ul>' +

                    '<b style="font-family: sans-serif"> Exterior Construction</b>' +
                    '<ul style="font-family: sans-serif">' +
                    '<li>2x4 Framing w/ZIP Board Sheathing</li>' +
                    '<li>Brick Masonry Per Plan</li>' +
                    '<li>Cementuous James Hardie&reg; Accents Per Plan</li>' +
                    '<li>LP Smart Trim&reg; Fascia & Soffit' +
                    '</ul>' +

                    '<b style="font-family: sans-serif"> Roof</b>' +
                    '<ul style="font-family: sans-serif">' +
                    '<li>Certainteed Landmark Max Series</li>' +
                    '<li>Composite Architectural Profile Shingle</li>' +
                    '<li>Weathered Wood Color</li>' +
                    '<li>Limited Lifetime Warranty</li>' +
                    '</ul>' +

                    '<b style="font-family: sans-serif"> Garage</b>' +
                    '<ul style="font-family: sans-serif">' +
                    '<li>Insulated Metal Panel Garage Door</li>' +
                    '<li>Genie&reg; Garage Door Opener</li>' +
                    '<li>Genie&reg; Intellicode Exterior Keypad</li>' +
                    '<li>Pre-Engineered Future Storm Shelter Location</li>' +
                    '<li>30"x54" Attic Access W/Folding Ladder Per Plan' +
                    '<li>Fully Sheetrocked, Trimmed, & Painted</li>' +
                    '</ul>' +

                    '<b style="font-family: sans-serif"> Lawn & Landscape</b>' +
                    '<ul style="font-family: sans-serif">' +
                    '<li>Fully-Sodded Yard - Front, Back, & Sides</li>' +
                    '<li>Beds & Front Yard Top-Dressed W/Sandy Loam</li>' +
                    '<li>Desert-Modern Style Landscape Per Plan & Home</li>' +
                    '<li>Drought-Tolerant Plant Selections</li>' +
                    '<li>Thoughtful Design For Seasonal Color</li>' +
                    '</ul>';

                  o.craigslist_html = craigslist_html;
                  o.gallery_link_url = 'https://api.clickbuild.io/project-gallery/' + data_project._id;
                  o.full_width_display = req.body.full_width_display;
                  res.json(o);


                });
              });
            });
          });
        });
      });
    });


  });
});



















app.post('/api/project/marketing/gallery', function (req, res) {
  models.gallery_photo.find({ project_id: req.body.project_id }).sort({ display_order: 1 }).exec(function (err, gallery_photos) {
    models.project_feed.find({ project_id: req.body.project_id, photo_url: { $ne: null } }).exec(function (err, data_feed) {

      var feed_photos = [];
      $._.forEach(data_feed, function (dd) {
        var photo_url = url_validate(dd.photo_url);
        feed_photos.push({
          path_thumbnail: photo_url,
          path_medium: photo_url,
          path_large: photo_url,
          path_original: photo_url,
          text_headline: dd.headline,
          text_description: dd.caption,
        });
      });

      res.json({
        gallery_photos: $._.merge(gallery_photos, feed_photos)
      });
    });
  });
});

















app.post('/api/project/marketing/save', function (req, res) {

  var form = [];
  parse_str(req.body.f, form);

  var input = {
    tagline: form.tagline,
    tour_url: form.tour_url,
    video_url: form.video_url,
    showcase: form.showcase,
    index_include: form.index_include,
    urbana: form.urbana,
    xv: form.xv,
    homes_default: form.homes_default,
    model: form.model,
    availability: form.availability,
    offered_by: form.offered_by,
    lease_monthly: form.lease_monthly,
    lease_contact: form.lease_contact,
    lease_term: form.lease_term,
    lease_phone: form.lease_phone,
    lease_description: form.lease_description,
    description: form.description,
    description_flier: form.description_flier,


  };





  $._.forEach(form.filename, function (filename, k) {

    var ext = path.extname(filename);
    var filename_new = req.body.id + '-' + k + ext;
    var _filename = filename.replace(/\.[^/.]+$/, "");
    var file_temp = $.__base + 'app/uploads/' + $.lexxi.url_title(_filename) + ext;
    file_temp = file_temp.toLowerCase();
    s3.putFile(
      file_temp,
      '/marketing/' + filename_new,
      { 'x-amz-acl': 'public-read', 'Content-Type': mime.lookup(file_temp) },
      function (err, res) {
        if (err) return $.lexxi.handle_error(err);
        fs.unlink(file_temp);
      });

    // pffsh smd
    if (k == "1") {
      input.highlight_1 = "https://s3.amazonaws.com/clickbuild/marketing/" + filename_new;
    }
    if (k == "2") {
      input.highlight_2 = "https://s3.amazonaws.com/clickbuild/marketing/" + filename_new;
    }
    if (k == "3") {
      input.highlight_3 = "https://s3.amazonaws.com/clickbuild/marketing/" + filename_new;
    }
    if (k == "4") {
      input.highlight_4 = "https://s3.amazonaws.com/clickbuild/marketing/" + filename_new;
    }
    if (k == "5") {
      input.highlight_5 = "https://s3.amazonaws.com/clickbuild/marketing/" + filename_new;
    }
    if (k == "6") {
      input.highlight_6 = "https://s3.amazonaws.com/clickbuild/marketing/" + filename_new;
    }

  });




  models.project.update({ _id: req.body.id }, input).exec(function (err) {
    if (err) return $.lexxi.handle_error(err);

    res.json({
      error: err ? err : false,
      success: err ? false : true
    });

    var status_construction = [];
    $._.forEach(form.status_construction, function (gallery_id) {
      status_construction.push(gallery_id);
    });

    var status_hidden = [];
    $._.forEach(form.status_hidden, function (gallery_id) {
      status_hidden.push(gallery_id);
    });


    var i = 0;
    $._.forEach(form.gallery_id, function (gallery_id) {
      var input = {

      };
      if (in_array(status_construction, gallery_id)) {
        input.status_construction = true;
      } else {
        input.status_construction = false;
      }

      if (in_array(status_hidden, gallery_id)) {
        input.status_hidden = true;
      } else {
        input.status_hidden = false;
      }


      models.gallery_photo.update({ _id: gallery_id }, input).exec(function (err) {
        if (err) return $.lexxi.handle_error(err);
      });

      i++;

    });



    if (form.homes_default) {
      models.project.update({ _id: { $ne: req.body.id }, homes_default: true }, {
        homes_default: false
      }).exec(function (err) {
        if (err) return $.lexxi.handle_error(err);
      });
    }

    if (form.model) {
      models.project.update({ _id: { $ne: req.body.id }, model: true }, {
        model: false
      }).exec(function (err) {
        if (err) return $.lexxi.handle_error(err);
      });
    }


    models.project.findOne({ _id: req.body.id }).exec(function (err, project_data) {
      models.gallery_photo.findOne({ project_id: req.body.id }).sort({ display_order: 1 }).exec(function (err, gallery_primary) {

        if (!$._.isEmpty(gallery_primary)) {
          if (gallery_primary.path_thumbnail != project_data.thumbnail_url) {
            models.project.update({ _id: req.body.id }, {
              thumbnail_url: gallery_primary.path_thumbnail
            }).exec(function (err) {
            });
          }
        } else {
          models.project.update({ _id: req.body.id }, {
            thumbnail_url: 'https://s3.amazonaws.com/clickbuild/tn/default.png',
            thumbnail_path: '/tn/default.png',
          }).exec(function (err) {
          });
        }

      });
    });



    request.post({
      url: 'https://api.clickbuild.io/api/webadmin-sync/homes',
      form: {
        project_id: req.body.id
      }
    }, function (error, response, body) {

      request.post({
        url: 'https://api.clickbuild.io/api/webadmin-sync/web-gallery',
        form: {
          project_id: req.body.id,
          gallery_type: 'home'
        }
      }, function (error, response, body) { });

    });


  });

});

























var uploadedFilesPath = $.__base + 'app/uploads/';



function copyFile(source, target, cb) {
  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on("error", done);

  var wr = fs.createWriteStream(target);
  wr.on("error", done);
  wr.on("close", function (ex) {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }
}











app.post('/api/utility/upload-file', function (req, res) {
  res.header("Access-Control-Allow-Origin", "*");

  if (req.files.file) {
    var path_original = req.files.file.path;

    var original_name = req.files.file.originalname;
    var ext = path.extname(original_name);

    var _filename = original_name.replace(/\.[^/.]+$/, "");

    var path_new = uploadedFilesPath + $.lexxi.url_title(_filename) + ext;
    fs.rename(path_original, path_new.toLowerCase(), function (err) {
      var o = {
        success: false,
        error: false,
        errorMsg: false
      }
      if (err) {
        o.error = true;
        o.errorMsg = err;
      } else {
        o.success = true;
      }
      res.json(o);
    });
  } else {
    res.json({
      success: false,
      error: true,
      errorMsg: 'Error: no source file.'
    });
  }
});




















app.post("/api/utility/cb-add-photos-to-gallery", function (req, res) {

  var form = [];
  parse_str(req.body.f, form);

  var o = {
    success: false
  };

  var sort_order = [];
  var i = 0;
  $._.forEach($._.sortBy(form.filenamefine, 'filename'), function (filename) {
    i++;
    sort_order[filename] = i;
  });

  var total_photos = i;

  o.success = true;
  res.json(o);


  if (req.body.project_id) {
    models.project.update({ _id: req.body.project_id }, {
      gallery_processing: true
    }).exec(function (err) {
      if (err) return $.lexxi.handle_error(err);
    });
  }

  if (req.body.community_id) {
    models.community.update({ _id: req.body.community_id }, {
      gallery_processing: true
    }).exec(function (err) {
      if (err) return $.lexxi.handle_error(err);
    });
  }

  if (req.body.gallery_id) {
    models.web_gallery.update({ _id: req.body.gallery_id }, {
      gallery_processing: true
    }).exec(function (err) {
      if (err) return $.lexxi.handle_error(err);
    });
  }

  if (req.body.plan_id) {
    models.plan.update({ _id: req.body.plan_id }, {
      gallery_processing: true
    }).exec(function (err) {
      if (err) return $.lexxi.handle_error(err);
    });
  }

  if (req.body.punchlist_id) {
    models.punchlist.update({ _id: req.body.punchlist_id }, {
      gallery_processing: true
    }).exec(function (err) {
      if (err) return $.lexxi.handle_error(err);
    });
  }


  $._.forEach(form.filenamefine, function (filename, _uuid) {
    if (filename) {

      setTimeout(function (filename, _uuid) {

        var form_input = {
          filename: filename,
          _uuid: _uuid,
          sort_order: sort_order[filename],
        };

        if (req.body.project_id) {
          form_input.project_id = req.body.project_id;
        }

        if (req.body.punchlist_id) {
          form_input.punchlist_id = req.body.punchlist_id;
        }

        if (req.body.community_id) {
          form_input.community_id = req.body.community_id;
        }

        if (req.body.gallery_id) {
          form_input.gallery_id = req.body.gallery_id;
        }

        if (req.body.plan_id) {
          form_input.plan_id = req.body.plan_id;
        }

        if (sort_order[filename] == total_photos) {
          form_input.last_in_batch = 'true';
        }

        request.post({
          url: 'https://api.clickbuild.io/api/internal/process-gallery-photos',
          form: form_input
        }, function (error, response, body) {

        });


      }, 5000, filename, _uuid);

    }
  });


});










app.post("/api/utility/cb-delete-photos-from-gallery", function (req, res) {


  var o = {
    success: false
  };

  models.gallery_photo.findOne({ _id: req.body.id, keep_file: null }).exec(function (err, data_photo) {

    if (data_photo) {
      fs.unlink(str_replace('https://', '/sites/clickbuild/', data_photo.path_thumbnail));
      fs.unlink(str_replace('https://', '/sites/clickbuild/', data_photo.path_medium));
      fs.unlink(str_replace('https://', '/sites/clickbuild/', data_photo.path_large));
      fs.unlink(str_replace('https://', '/sites/clickbuild/', data_photo.path_original));
    }

    models.gallery_photo.find({ _id: req.body.id }).remove(function () {

    });

  });

  res.json(o);

});

























app.post('/api/utility/gallery-order', function (req, res) {

  var i = 1;
  $._.forEach(req.body.indexes, function (dd) {
    var _i = i;
    models.gallery_photo.update({ _id: dd }, {
      display_order: _i
    }).exec(function (err) {
      if (err) return $.lexxi.handle_error(err);
    });
    i++;
  });

  res.json({
    success: true,
    indexes: req.body.indexes
  });


});





































app.post('/api/internal/process-gallery-photos', function (req, res) {

  var o = {
    success: true
  };

  res.json(o);


  var _uuid = req.body._uuid;
  var filename = req.body.filename;

  var source_file = uploadedFilesPath + _uuid + '/' + filename;
  var ext = path.extname(filename);

  var destination_gallery = '/sites/clickbuild/media.clickbuild.io/gallery/';

  var path_thumbnail = 'https://media.clickbuild.io/gallery/tn/' + _uuid + ext;
  var path_medium = 'https://media.clickbuild.io/gallery/m/' + _uuid + ext;
  var path_large = 'https://media.clickbuild.io/gallery/l/' + _uuid + ext;
  var path_original = 'https://media.clickbuild.io/gallery/o/' + _uuid + ext;


  copyFile(source_file, destination_gallery + 'o/' + _uuid + ext, function () {

    var _source_file = destination_gallery + 'o/' + _uuid + ext;

    gm(_source_file)
      .options({ imageMagick: true })
      .resize(250, "250^")
      .gravity("Center")
      .crop(250, 250)
      .extent(250, 250)
      .quality(90)
      .write(destination_gallery + 'tn/' + _uuid + ext, function (err) {

        gm(_source_file)
          .options({ imageMagick: true })
          .resize(500)
          .quality(90)
          .write(destination_gallery + 'm/' + _uuid + ext, function (err) {

            gm(_source_file)
              .options({ imageMagick: true })
              .resize(1024)
              .quality(90)
              .write(destination_gallery + 'l/' + _uuid + ext, function (err) {

                rimraf(uploadedFilesPath + _uuid, function (error) {

                });

              });

          });
      });



    var input = {
      path_thumbnail: path_thumbnail,
      path_medium: path_medium,
      path_large: path_large,
      path_original: path_original,
      uuid: _uuid,
      original_filename: filename,
      display_order: parseInt('999' + req.body.sort_order)
    };

    if (req.body.project_id) {
      input.project_id = req.body.project_id;
    }

    if (req.body.community_id) {
      input.community_id = req.body.community_id;
    }
    if (req.body.gallery_id) {
      input.gallery_id = req.body.gallery_id;
    }

    if (req.body.plan_id) {
      input.plan_id = req.body.plan_id;
    }

    if (req.body.punchlist_id) {
      input.punchlist_id = req.body.punchlist_id;
    }

    var nm = new models.gallery_photo(input);
    nm.save(function (err) {
      if (err) return $.lexxi.handle_error(err);
    });


    if (req.body.last_in_batch == 'true') {

      if (req.body.project_id) {
        models.project.update({ _id: req.body.project_id }, {
          gallery_processing: null
        }).exec(function (err) {
          if (err) return $.lexxi.handle_error(err);
        });
      }

      if (req.body.community_id) {
        models.community.update({ _id: req.body.community_id }, {
          gallery_processing: null
        }).exec(function (err) {
          if (err) return $.lexxi.handle_error(err);
        });
      }
      if (req.body.gallery_id) {
        models.web_gallery.update({ _id: req.body.gallery_id }, {
          gallery_processing: null
        }).exec(function (err) {
          if (err) return $.lexxi.handle_error(err);
        });
      }

      if (req.body.plan_id) {
        models.plan.update({ _id: req.body.plan_id }, {
          gallery_processing: null
        }).exec(function (err) {
          if (err) return $.lexxi.handle_error(err);
        });
      }

      if (req.body.punchlist_id) {
        models.punchlist.update({ _id: req.body.punchlist_id }, {
          gallery_processing: null
        }).exec(function (err) {
          if (err) return $.lexxi.handle_error(err);
        });
      }
    }

  });

});


