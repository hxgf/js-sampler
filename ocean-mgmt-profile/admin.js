Dropzone.autoDiscover = false;

$(function () {


  $(document).on("click touch", ".upload-delete img", function (e) {
    var id = $(this).parent().data('id');
    var ths = this;
    smoke.confirm("Are you sure you want to delete this photo?", function (e) {
      if (e) {
        if ($(ths).parent().data('new')) {
          dz[id].removeAllFiles(true);
          $(".dz-" + id + " .dz-default").show();
          $(".dz-" + id + " .dropzone").fadeIn();
          $(".dz-" + id + " .upload-success").css('display', 'none');
          $(".dz-" + id + " .dropzone").show();
          $(".dz-" + id + " .preview-image").html('');
          $(".dz-" + id + " .dz-complete").remove();
          $("input[name='file_" + id + "']").remove();
          darkwave.api_request({
            url: "/utility/delete-upload",
            data: {
              filename: $(ths).parent().data('filename')
            }
          });
        } else {
          $(".dz-" + id + " .preview-image").html('');
          $(".dz-" + id).append('<div class="dropzone" id="upload_' + id + '" data-id="' + id + '"></div>');
          upload_initialize(id, {});
          if ($('input[name="file_' + id + '"]').length > 0) {
            $('input[name="file_' + id + '"]').val('DELETE')
          } else {
            $('<input>').attr({
              type: 'hidden',
              name: 'file_' + id,
              value: 'DELETE'
            }).appendTo('form');
          }
        }
      }
    }, {
      ok: "Yes",
      reverseButtons: true,
    });
  });




  var upload_initialize = function (id, params) {
    var dz_options = {
      uploadMultiple: false,
      acceptedFiles: "image/jpeg,image/png,image/gif",
      maxFilesize: 2, // MB (php default)
      url: "/utility/upload-file",
      clickable: ".dz-" + id + " .dropzone",
      previewTemplate:
        '<div class="dz-preview dz-file-preview"><img data-dz-thumbnail /><div class="dz-progress-container">' +
        '<div class="dz-progress"><span class="dz-upload" data-dz-uploadprogress></span></div></div>' +
        '</div>'
    };
    if (params.uploadMultiple) {
      dz_options.uploadMultiple = params.uploadMultiple;
    }
    if (params.acceptedFiles) {
      dz_options.acceptedFiles = params.acceptedFiles;
    }
    if (params.maxFilesize) {
      dz_options.maxFilesize = params.maxFilesize;
    }
    if (params.previewTemplate) {
      dz_options.previewTemplate = params.previewTemplate;
    }
    if (params.clickable) {
      dz_options.clickable = params.clickable;
    }

    dz[id] = new Dropzone("#upload_" + id, dz_options);

    dz[id].on('error', function (file, errorMessage) {
      smoke.alert(errorMessage, function (e) {
        dz[id].removeAllFiles(true);
        $(".dz-" + id + " .dz-default").show();
      });
    });

    dz[id].on('thumbnail', function (file, dataUrl) {
      $(".dz-" + id + " .dz-default").hide();
    });

    dz[id].on('uploadprogress', function (file, progress) {
      if (progress == 100) {
        $("body").addClass('working');
      }
    });

    dz[id].on('success', function (file) {
      var response = JSON.parse(file['xhr']['responseText']);
      if (response.error) {
        smoke.alert(response.error_message, function (e) {
          dz[id].removeAllFiles(true);
          $("body").removeClass('working');
          $(".dz-" + id + " .dz-default").fadeIn();
        });
      } else {
        $(".dz-" + id + " .preview-image").html('<img class="new-upload" src="' + response.preview_url + '" ><div class="upload-delete" data-new="true" data-filename="' + response.filename + '" data-id="' + id + '"><img src="/images/lib/uploader/delete.svg" /></div>');
        $(".dz-" + id + " .preview-image .new-upload").on('load', function () {
          $(".dz-" + id + " .dropzone").fadeOut();
          $(this).fadeIn();
          $("body").removeClass('working');
          $(".dz-" + id + " .upload-success").css('display', 'flex');
        });
        $(".dz-" + id + "").removeClass('error');
        if ($('input[name="file_' + id + '"]').length > 0) {
          $('input[name="file_' + id + '"]').val(response.filename)
        } else {
          $('<input>').attr({
            type: 'hidden',
            name: 'file_' + id,
            value: response.filename
          }).appendTo('form');
        }
      }
    });
  }






  $("[rel='save']").on('click', function (_e) {
    _e.preventDefault();
    $("body").addClass('working');
    var ths = this;
    var valid = true;
    $(".required input").each(function () {
      if (!$(this).val()) {
        $(this).parents('.required').addClass('error');
        valid = false;
      }
    }).promise().done(function () {
      if (valid) {
        if ($(".error").length == 0) {
          $(".dz-filename span").each(function () {
            $(this).siblings("input.filename").val(
              $(this).text()
            );
          }).promise().done(function () {
            $(".textarea").each(function () {
              $('input[name="' + $(this).data('target') + '"]').val(
                $(this).children('.ql-editor').html()
              );
            }).promise().done(function () {
              darkwave.api_request({
                url: $(ths).data('url'),
                data: {
                  user_id: Cookies.get('user_id'),
                  form: $("form.admin-edit").serialize()
                },
                callback: function (r) {
                  window.location.href = $(ths).data('redirect');
                }
              });
            });
          });
        } else {
          $("body").removeClass('working');
        }
      } else {
        $("body").removeClass('working');
      }
    });
  });










  

  $("a[rel='delete']").on('click', function (_e) {
    _e.preventDefault();
    var ths = this;
    smoke.confirm("Are you sure you want to delete this " + $(ths).data('type') + "?", function (e) {
      if (e) {
        $("body").addClass('working');
        darkwave.api_request({
          url: $(ths).data('url'),
          data: {
            _id: $(ths).data('id')
          },
          callback: function (r) {
            window.location.href = $(ths).data('redirect');
          }
        });
      }
    }, {
      ok: "Delete",
      reverseButtons: true,
    });
  });











  var dz = [];


  if ($("#upload_1").length > 0) {
    upload_initialize('1', {});
  }
  if ($("#upload_2").length > 0) {
    upload_initialize('2', {});
  }
  if ($("#upload_3").length > 0) {
    upload_initialize('3', {});
  }
  if ($("#upload_4").length > 0) {
    upload_initialize('4', {});
  }
  if ($("#upload_5").length > 0) {
    upload_initialize('5', {});
  }
  if ($("#upload_6").length > 0) {
    upload_initialize('6', {});
  }
  if ($("#upload_7").length > 0) {
    upload_initialize('7', {});
  }
  if ($("#upload_8").length > 0) {
    upload_initialize('8', {});
  }
  if ($("#upload_9").length > 0) {
    upload_initialize('9', {});
  }
  if ($("#upload_10").length > 0) {
    upload_initialize('10', {});
  }

  if ($("#upload_11").length > 0) {
    upload_initialize('11', {});
  }
  if ($("#upload_12").length > 0) {
    upload_initialize('12', {});
  }
  if ($("#upload_13").length > 0) {
    upload_initialize('13', {});
  }
  if ($("#upload_14").length > 0) {
    upload_initialize('14', {});
  }
  if ($("#upload_15").length > 0) {
    upload_initialize('15', {});
  }
  if ($("#upload_16").length > 0) {
    upload_initialize('16', {});
  }
  if ($("#upload_17").length > 0) {
    upload_initialize('17', {});
  }
  if ($("#upload_18").length > 0) {
    upload_initialize('18', {});
  }
  if ($("#upload_19").length > 0) {
    upload_initialize('19', {});
  }
  if ($("#upload_20").length > 0) {
    upload_initialize('20', {});
  }



});
