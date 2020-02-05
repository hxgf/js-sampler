import Ember from 'ember';
import AfterRender from 'clickbuild/mixins/after-render';

export default Ember.View.extend(AfterRender, {

  afterRenderEvent: function () {


    var uploader = new qq.FineUploader({
      element: document.getElementById('fine-uploader'),
      request: {
        endpoint: 'https://api.clickbuild.io/api/utility/upload-file-fine'
      },
      cors: {
        expected: true,
      },
      retry: {
        enableAuto: true
      },
      callbacks: {
        onComplete: function (event, id, name, responseJSON) {
          var _responseJSON = JSON.parse(responseJSON.response);
          $(".qq-upload-button").hide();
          $(".cb-add-photos-to-gallery").show();
          $("form.upload-temp").append('<input type="hidden" name="filenamefine[' + _responseJSON.uuid + ']" value="' + _responseJSON.filename + '" />');
        }
      }
    });


    
    $(".sortable").sortable({
      update: function (event, ui) {

        var indexes = {};
        $(".sortable").addClass('ajax-loading');

        $(this).find('.item').each(function (index) {
          indexes[index] = $(this).data('id');
        });

        $.ajax({
          type: "POST",
          url: "https://api.clickbuild.io/api/utility/gallery-order",
          dataType: 'json',
          data: {
            indexes: indexes
          }
        }).fail(function () {
          smoke.alert('Error: Can\'t connect to data server');
        }).done(function (data) {
          $(".sortable").removeClass('ajax-loading');
        });
      }
    });


    


    $(".cb-add-photos-to-gallery").on('click', function () {
      $(this).css('opacity', '0.5');
      utility.api_request({
        endpoint: 'utility/cb-add-photos-to-gallery',
        data: {
          gallery_type: 'project',
          project_id: $("#project_id").val(),
          f: $("form.upload-temp").serialize()
        },
        callback: function (data) {
          $("#fine-uploader").hide();
          $("#fine-processing").show();
        }
      });
    });



    $(".gallery-item .delete").on('click', function () {
      var delete_id = $(this).data('delete-id');
      var ths = this;
      smoke.confirm('Are you sure you want to delete this photo', function (e) {
        if (e) {
          utility.api_request({
            endpoint: 'utility/cb-delete-photos-from-gallery',
            data: {
              id: delete_id
            },
            callback: function (data) {
              $(ths).parents('.gallery-item').remove();
            }
          });
        }
      }, { reverseButtons: true });
    });



  }
});


