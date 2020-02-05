import Ember from 'ember';

export default Ember.Route.extend({

  model: function (params) {
    return utility.api_request({
      endpoint: 'project/client/screen',
      data: {
        project_id: this.controllerFor('application').current_project
      }
    });
  },

  activate: function () {
    window.scrollTo(0, 0);
  },

  actions: {

    welcome_email: function (email) {
      this.controllerFor('application').send('api_request', {
        endpoint: 'project/client/welcome-email',
        data: {
          email: email
        },
        callback: function (data) {
          if (data.error) {
            smoke.alert('Error sending email: ' + data.errorMsg);
          } else {
            smoke.alert('Welcome email sent');
          }
        }
      });
    },

    pa_generate: function (project_id) {
      $("button#save-pa").addClass('active');
      var ths = this;
      ths.controllerFor('application').send('api_request', {
        endpoint: 'project/client/purchase-agreement-data-update',
        data: {
          id: project_id,
          f: $("#client-pa").serialize()
        },
        callback: function (_data) {
          ths.controllerFor('application').send('api_request', {
            url: "https://api.clickbuild.io/purchase-agreement-generate",
            data: {
              id: project_id
            },
            callback: function (data) {
              $("button#save-pa").removeClass('active');
              $("#download_pa").attr('href', data.file_url);
              $("#download_pa span").text(data.file_name);
              $("#download_pa").show();
            }
          });

        }
      });
    },

    save: function (project_id) {
      $("button#save").addClass('active');
      this.controllerFor('application').send('api_request', {
        endpoint: 'project/client/save',
        data: {
          id: project_id,
          f: $("#client-edit").serialize()
        },
        callback: function (data) {
          window.location.reload();
        }
      });
    },

    add_contact: function () {
      if ($(".client-info").length < 7) {
        $(".clients-list").append(
          '<div class="client-info column">' +
          '<div class="ui raised segment">' +
          '<div class="ui two column relaxed grid">' +
          '<div class="column">' +
          '<div class="field">' +
          '<label>First Name</label>' +
          '<input type="text" name="c_first_name[]" />' +
          '<input type="hidden" name="c_id[]" />' +
          '</div>' +
          '<div class="field">' +
          '<label>Email</label>' +
          '<input type="text" name="c_email[]" />' +
          '</div>' +
          '<div class="field client-address">' +
          '<label>Street Address</label>' +
          '<input type="text" name="c_address[]" />' +
          '</div>' +
          '</div>' +
          '<div class="column">' +
          '<div class="field">' +
          '<label>Last Name</label>' +
          '<input type="text" name="c_last_name[]" />' +
          '</div>' +
          '<div class="field">' +
          '<label>Phone</label>' +
          '<input type="text" name="c_phone[]" />' +
          '</div>' +
          '<div class="field">' +
          '<label>Relation to Client</label>' +
          '<select name="c_client_relation[]">' +
          '<option value="relative">Relative</option>' +
          '<option value="spouse">Spouse</option>' +
          '<option value="co-habitant">Co-habitant</option>' +
          '<option value="parent">Parent</option>' +
          '<option value="lender">Lender</option>' +
          '<option value="realtor">Realtor</option>' +
          '<option value="appraiser">Appraiser</option>' +
          '</select>' +
          '</div>' +
          '</div>' +
          '</div>' +
          '<div class="ui three column relaxed grid client-location">' +
          '<div class="column">' +
          '<div class="field">' +
          '<label>City</label>' +
          '<input type="text" name="c_city[]" />' +
          '</div>' +
          '</div>' +
          '<div class="column">' +
          '<div class="field">' +
          '<label>State</label>' +
          '<input type="text" name="c_state[]" />' +
          '</div>' +
          '</div>' +
          '<div class="column">' +
          '<div class="field">' +
          '<label>Zip</label>' +
          '<input type="text" name="c_zip[]" />' +
          '</div>' +
          '</div>' +
          '</div>' +
          '<div class="field">' +
          '<label>Brokerage Name (Realtor/Lender)</label>' +
          '<input type="text" name="c_brokerage_name[]" />' +
          '</div>' +
          '<div class="ui two column relaxed grid">' +
          '<div class="column">' +
          '<div class="field">' +
          '<label>Client Portal Password</label>' +
          '<input type="text" name="c_password[]" />' +
          '</div>' +
          '</div>' +
          '<div class="column">' +
          '<div class="field">' +
          '&nbsp;' +
          '</div>' +
          '</div>' +
          '</div>' +
          '</div>' +
          '</div>'
        );
        if ($(".client-info").length === 6) {
          $(this).remove();
        }
      }
    }
  }

});
