





// generate a purchase agreement for a given project and upload to s3

app.post('/purchase-agreement-generate', function (req, res, next) {
  models.project.findOne({ _id: req.body.id }).lean().exec(function (err, data_project) {
    var shortcode = data_project.shortcode;
    request.get({
      url: 'https://api.clickbuild.io/purchase-agreement-html/' + req.body.id
    }, function (error, response, body) {

      var source_html = $.__base + "tmp/" + "purchase-agreement-" + shortcode + ".html";
      var source_html_tmp = $.__base + "tmp/" + "purchase-agreement-" + shortcode + "_temp.htm";
      var source_pdf = $.__base + "tmp/" + "purchase-agreement-" + shortcode + ".pdf";

      fs.writeFile(source_html, body, function (err) {

        var exec = require('child_process').exec;
        var nvm_src = '/root/.nvm/nvm.sh';
        var cmd = 'source ' + nvm_src + ' && nvm use 9.11.1 && relaxed ' + source_html + ' --build-once';
        exec(cmd, function (error, stdout, stderr) {
          if (error !== null) {
            console.log('exec error: ' + error);
          }
          s3.putFile(source_pdf, '/files/' + "purchase-agreement-" + shortcode + ".pdf",
            { 'x-amz-acl': 'public-read', 'Content-Type': mime.lookup(source_pdf) },
            function (err, res) {
              if (err) return $.lexxi.handle_error(err);
              fs.unlink(source_pdf);
              fs.unlink(source_html);
              fs.unlink(source_html_tmp);
            });
        });
      });
      res.json({
        success: 'ok',
        file_url: "https://s3.amazonaws.com/clickbuild/files/" + "purchase-agreement-" + shortcode + ".pdf",
        file_name: "purchase-agreement-" + shortcode + ".pdf"
      });
    });
  });
});



















app.get('/purchase-agreement-html/:project_id', function (req, res, next) {
  request.post({
    url: 'https://api.clickbuild.io/api/project/client/purchase-agreement-data',
    form: {
      id: req.params.project_id
    }
  }, function (error, response, body) {
    var data = JSON.parse(body);
    res.render('static/purchase-agreement', {
      layout: false,
      data: data,
    });
  });
});




















// generate data for the purchase agreement
app.post('/api/project/client/purchase-agreement-data', function (req, res) {

  var broker_buyer_name = false;
  var o = {};

  models.project.findOne({ _id: req.body.id }).lean().exec(function (err, data_project) {
    models.client.findOne({ _id: data_project.client_id }).lean().exec(function (err, data_client_primary) {
      models.client.findOne({ project_id: req.body.id, relation: 'spouse' }).lean().exec(function (err, data_client_spouse) {
        models.client.findOne({ project_id: req.body.id, relation: 'realtor' }).lean().exec(function (err, data_client_realtor) {

          if (!$._.isEmpty(data_client_realtor)) {
            broker_buyer_name = data_client_realtor.first_name + ' ' + data_client_realtor.last_name;
          }

          var city = data_project.municipality_postal;
          city = str_replace(', OK', '', city);

          o.seller_entity = data_project.pa_seller_entity;
          o.down_payment = data_project.pa_down_payment ? "$" + $.lexxi.number_format(data_project.pa_down_payment) : 0;

          o.project_shortcode = data_project.shortcode;
          o.buyer_1 = data_client_primary.first_name + ' ' + data_client_primary.last_name;
          o.address = data_project.title;
          o.city = city;
          o.state = data_project.state;
          o.zip = data_project.zip_code;
          o.county = data_project.county;
          o.lot = data_project.lot;
          o.block = data_project.block;
          o.addition = data_project.community;
          o.purchase_price = "$" + $.lexxi.number_format(data_project.price_total) + ".";
          o.closing_1 = 'Stewart Title Gaillardia';
          o.closing_2 = '5101 Gaillardia Corporate Place, Oklahoma City, OK 73142';
          o.closing_date = date('m/d/Y', data_project.date_closing);
          o.closing_time = data_project.time_closing;
          o.print_buyer_1 = data_client_primary.first_name + ' ' + data_client_primary.last_name;

          o.contract_date = data_project.date_contract ? date("m/d/Y", data_project.date_contract) : date("m/d/Y");
          o.acceptance_date = data_project.pa_acceptance_date ? date("m/d/Y", data_project.pa_acceptance_date) : 'N/A';
          o.acceptance_time = data_project.pa_acceptance_time ? data_project.pa_acceptance_time : '9:00 a.m.';

          if (!$._.isEmpty(data_client_spouse)) {
            if (data_client_spouse.first_name) {
              o.buyer_2 = data_client_spouse.first_name + ' ' + data_client_spouse.last_name;
            }
          }
          if (data_project.pa_acceptance_date) {
            o.acceptance = 'On';
          }
          if (!broker_buyer_name && !data_project.pa_broker_builder_name) {
            o.broker_none = 'On';
          }
          if (broker_buyer_name) {
            o.broker_buyer = 'On';
            o.broker_buyer_name = broker_buyer_name;
            o.broker_buyer_commission = data_project.pa_broker_buyer_commission;
          } else {
            o.broker_buyer_name = '';
            o.broker_buyer_commission = '';
          }
          if (data_project.pa_broker_builder_name) {
            o.broker_builder = 'On';
            o.broker_builder_name = data_project.pa_broker_builder_name;
            o.broker_builder_commission = data_project.pa_broker_builder_commission;
          } else {
            o.broker_builder_name = '';
            o.broker_builder_commission = '';
          }
          if (!$._.isEmpty(data_client_spouse)) {
            if (data_client_spouse.first_name) {
              o.print_buyer_2 = data_client_spouse.first_name + ' ' + data_client_spouse.last_name;
            }
          }
          if (data_project.pa_special_provisions) {
            o.special_provisions = data_project.pa_special_provisions;
          } else {
            o.special_provisions = 'N/A';
          }

          res.json(o);

        });
      });
    });
  });
});














// generate data for the purchase agreement
app.post('/api/project/client/purchase-agreement-data-update', function (req, res) {

  var form = [];
  parse_str(req.body.f, form);

  models.project.update({ _id: req.body.id }, {
    pa_seller_entity: form.pa_seller_entity,
    pa_down_payment: form.pa_down_payment,
    pa_broker_buyer_commission: form.pa_broker_buyer_commission,
    pa_broker_builder_name: form.pa_broker_builder_name,
    pa_broker_builder_commission: form.pa_broker_builder_commission,
    pa_special_provisions: form.pa_special_provisions,
    pa_acceptance_date: form.pa_acceptance_date ? datetotime_js(form.pa_acceptance_date) : null,
    pa_acceptance_time: form.pa_acceptance_time,
  }).exec(function (err) {
    if (err) return $.lexxi.handle_error(err);
    res.json({ success: true });
  });

});



























// show client form data
app.post('/api/project/client/screen', function (req, res) {

  function data_fetch_async(callback) {
    var returnObject = {};

    var data_project = models.project.find({ _id: req.body.project_id }).limit(1).lean().exec().then(function (data) {
      returnObject.project = data;
    });

    var data_clients = models.client.find({ project_id: req.body.project_id }).lean().exec().then(function (data) {
      returnObject.clients = data;
    });


    return $.q.all([
      data_project,
      data_clients,
    ])
      .then(function () {
        callback(null, returnObject)
      })
      .catch(function (err) {
        callback(err, null)
      })
      .done();
  }

  data_fetch_async(function (err, data) {
    var data_project = data.project[0];
    var data_clients = data.clients;

    models.client.find({ _id: data_project.client_id }).limit(1).lean().exec(function (err, _data_client_primary) {
      var data_client_primary = _data_client_primary[0];

      if (data_client_primary) {
        if (data_client_primary.date_birth) {
          data_client_primary.date_birth_format = date("n/j/Y", data_client_primary.date_birth);
        }
      }

      var broker_buyer_name = false;
      var buyer_2 = false;

      if (data_clients) {
        var relation = ['relative', 'spouse', 'co-habitant', 'parent', 'lender', 'realtor', 'appraiser'];
        var i = 0;
        var client_list = [];

        $._.forEach(data_clients, function (dd) {
          var client_relations = [];
          $._.forEach(relation, function (cr) {
            client_relations.push({
              title: ucfirst(cr),
              value: cr,
              selected: dd.relation == cr ? 'selected' : false
            });
          });
          if (dd.relation == 'realtor') {
            broker_buyer_name = dd.first_name + ' ' + dd.last_name;
          }
          if (i == 0 && dd.first_name) {
            buyer_2 = dd.first_name + ' ' + dd.last_name;
          }
          client_list.push({
            c_id: dd._id,
            c_first_name: dd.first_name,
            c_last_name: dd.last_name,
            c_email: dd.email,
            c_phone: dd.phone,
            c_work_phone: dd.work_phone,
            c_brokerage_name: dd.brokerage_name,
            c_date_birth: dd.date_birth ? date("n/j/Y", dd.date_birth) : '',
            c_address: dd.address,
            c_city: dd.city,
            c_state: dd.state,
            c_zip: dd.zip,
            c_password: dd.pwr ? base_64_decode(dd.pwr) : '',
            client_relations: client_relations
          });
          i++;
        });

      }

      var pa = {};
      pa.project_shortcode = data_project.shortcode;

      if (data_client_primary) {
        pa.buyer_1 = data_client_primary.first_name + ' ' + data_client_primary.last_name;
      }
      if (buyer_2) {
        pa.buyer_2 = buyer_2;
      }

      if (data_project.pa_down_payment) {
        pa.down_payment = data_project.pa_down_payment;
      } else {
        pa.down_payment = '5,000';
      }

      if (data_project.pa_seller_entity) {
        pa.seller_entity = data_project.pa_seller_entity;
      } else {
        pa.seller_entity = 'Jeff Click Design | Build';
      }

      pa.address = data_project.title;
      pa.zip = data_project.zip_code;
      pa.county = data_project.county;
      pa.state = data_project.state;
      pa.lot = data_project.lot;
      pa.block = data_project.block;
      pa.addition = data_project.community;
      pa.broker_buyer_name = broker_buyer_name;
      pa.broker_buyer_commission = data_project.pa_broker_buyer_commission;
      pa.broker_builder_name = data_project.pa_broker_builder_name;
      pa.broker_builder_commission = data_project.pa_broker_builder_commission;
      pa.special_provisions = data_project.pa_special_provisions;

      var postal = data_project.municipality_postal;
      pa.city = str_replace(", OK", "", postal);

      pa.acceptance_date = data_project.pa_acceptance_date ? date("m/d/Y", data_project.pa_acceptance_date) : '';
      pa.acceptance_time = data_project.pa_acceptance_time ? data_project.pa_acceptance_time : '';
      pa.contract_date = data_project.date_contract ? date("m/d/Y", data_project.date_contract) : ''

      if (data_client_primary) {
        data_client_primary.password = data_client_primary.pwr ? base_64_decode(data_client_primary.pwr) : false;
      }

      res.json({
        portal_link_appraiser: 'https://jeffclick.com/portal/appraisal/' + $.lexxi.url_title(data_project.title),
        link_client_doc: 'https://api.clickbuild.io/client-summary/' + data_project._id,
        can_view: req.body.group_id <= 2 ? true : false,
        project_id: data_project._id,
        title: data_project.title,
        client_data: data_client_primary,
        client_list: client_list,
        add_client: i == 6 ? false : true,
        pa: pa
      });

    });
  });

});


















// save client form data
app.post('/api/project/client/save', function (req, res) {

  var form = [];
  parse_str(req.body.f, form);

  var input = {
    first_name: form.first_name,
    last_name: form.last_name,
    email: form.email,
    phone: form.phone,
    phone_work: form.phone_work,
    address: form.address,
    city: form.city,
    state: form.state,
    zip: form.zip,
  };

  if (form.date_birth) {
    input.date_birth = moment(form.date_birth);
  }

  if (form.password) {
    input.password = bcrypt.hashSync(form.password, 10);
    input.pwr = base_64_encode(form.password);
  } else {
    input.password = null;
    input.pwr = null;
  }


  models.project.findOne({ _id: req.body.id }).lean().exec(function (err, data_project) {

    if (data_project.client_id) {
      models.client.update({ _id: data_project.client_id }, input).lean().exec(function (err) {
        if (err) return $.lexxi.handle_error(err);
      });
      models.project.update({ _id: req.body.id }, {
        client_name: form.first_name + ' ' + form.last_name
      }).exec(function (err) {
        if (err) return $.lexxi.handle_error(err);
      });
    } else {
      var nm = new models.client(input);
      nm.save(function (err) {
        if (err) return $.lexxi.handle_error(err);
      });
      models.project.update({ _id: req.body.id }, {
        client_name: form.first_name + ' ' + form.last_name,
        client_id: '' + nm._id
      }).exec(function (err) {
        if (err) return $.lexxi.handle_error(err);
      });
    }

    res.json({ success: true });

    var i = 0;

    var titles = $._.values(form.title);

    var c_first_name = $._.values(form.c_first_name);
    var c_last_name = $._.values(form.c_last_name);
    var c_email = $._.values(form.c_email);
    var c_date_birth = $._.values(form.c_date_birth);
    var c_phone = $._.values(form.c_phone);
    var c_work_phone = $._.values(form.c_work_phone);
    var c_brokerage_name = $._.values(form.c_brokerage_name);
    var c_address = $._.values(form.c_address);
    var c_city = $._.values(form.c_city);
    var c_state = $._.values(form.c_state);
    var c_zip = $._.values(form.c_zip);
    var c_password = $._.values(form.c_password);
    var c_client_relation = $._.values(form.c_client_relation);
    var c_id = $._.values(form.c_id);

    var client_relations = [];
    $._.forEach(c_first_name, function (dd) {
      var _i = i;
      var input = {
        first_name: c_first_name[_i],
        last_name: c_last_name[_i],
        email: c_email[_i],
        phone: c_phone[_i],
        work_phone: c_work_phone[_i],
        brokerage_name: c_brokerage_name[_i],
        address: c_address[_i],
        city: c_city[_i],
        state: c_state[_i],
        zip: c_zip[_i],
        relation: c_client_relation[_i],
        project_id: req.body.id
      };

      if (c_date_birth[_i]) {
        input.date_birth = moment(c_date_birth[_i]);
      }

      if (c_password[_i]) {
        input.password = bcrypt.hashSync(c_password[_i], 10);
        input.pwr = base_64_encode(c_password[_i]);
      } else {
        input.password = null;
        input.pwr = null;
      }

      if (c_id[_i]) {
        if (c_first_name[_i] != '' && c_last_name[_i] != '') {
          models.client.update({ _id: c_id[_i] }, input).lean().exec(function (err) {
            if (err) return $.lexxi.handle_error(err);
          });
        } else {
          models.client.findOne({ _id: c_id[_i] }).remove(function () {
          });
        }
      } else {
        var nm = new models.client(input);
        nm.save(function (err) {
          if (err) return $.lexxi.handle_error(err);
        });
      }

      i++;
    });

  });
});



























































