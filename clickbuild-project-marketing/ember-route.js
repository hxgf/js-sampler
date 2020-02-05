import Ember from 'ember';

export default Ember.Route.extend({

  model: function (params) {
    return utility.api_request({
      endpoint: 'project/marketing/screen',
      data: {
        project_id: this.controllerFor('application').current_project
      }
    });
  },

  activate: function () {
    window.scrollTo(0, 0);
  },

  actions: {

    save: function (project_id) {
      $("button#save").addClass('active');
      var ths = this;
      $("button#save").addClass('active');

      $(".dz-filename span").each(function () {
        $(this).siblings("input.filename").val(
          $(this).text()
        );
      }).promise().done(function () {

        ths.controllerFor('application').send('api_request', {
          endpoint: 'project/marketing/save',
          data: {
            id: project_id,
            f: $("#marketing-edit").serialize()
          },
          callback: function (data) {
            window.location.reload();
          }
        });

      });
    },

    code_snippets: function (snippet_type) {
      var code_snip = '';
      var snippet_title = '';
      if (snippet_type == '4-thumbs') {
        snippet_title = 'Row of 4 Thumbs';
        code_snip = `<div class="cf snippet-4-thumbs"><div class="snippet-4-thumbs-block"><div class="snippet-4-thumbs-image-container"><a data-fancybox="gallery" href="IMAGE_1_URL_HERE"><img class="snippet-4-thumbs-image shadow-4" src="IMAGE_1_URL_HERE"></a></div></div><div class="snippet-4-thumbs-block"><div class="snippet-4-thumbs-image-container"><a data-fancybox="gallery" href="IMAGE_2_URL_HERE"><img class="snippet-4-thumbs-image shadow-4" style="object-fit:cover;" src="IMAGE_2_URL_HERE"></a></div></div><div class="snippet-4-thumbs-block"><div class="snippet-4-thumbs-image-container"><a data-fancybox="gallery" href="IMAGE_3_URL_HERE"><img class="snippet-4-thumbs-image shadow-4" style="object-fit:cover;" src="IMAGE_3_URL_HERE"></a></div></div><div class="snippet-4-thumbs-block"><div class="snippet-4-thumbs-image-container"><a data-fancybox="gallery" href="IMAGE_4_URL_HERE"><img class="snippet-4-thumbs-image shadow-4" style="object-fit:cover;" src="IMAGE_4_URL_HERE"></a></div></div></div>`;
      }
      if (snippet_type == 'half-left') {
        snippet_title = 'Half-width Image (Left)';
        code_snip = `<div class="w-50 fl mr4"><img class="mt2 shadow-4" src="IMAGE_URL_HERE" /></div>`;
      }
      if (snippet_type == 'half-right') {
        snippet_title = 'Half-width Image (Right)';
        code_snip = `<div class="w-50 fr ml4"><img class="mt2 shadow-4" src="IMAGE_URL_HERE" /></div>`;
      }
      if (snippet_type == 'half-half') {
        snippet_title = '2 Half-width Images';
        code_snip = `<div class="cf"><div class="w-50 fl pr2"><img class="shadow-4" src="IMAGE_URL_HERE" /></div><div class="w-50 fr pl2"><img class="shadow-4" src="IMAGE_URL_HERE" /></div></div>`;
      }
      if (snippet_type == 'full-width-caption') {
        snippet_title = 'Full-width Image w/ Caption';
        code_snip = `<div class="w-100 shadow-4"><img class="db mb2" src="IMAGE_URL_HERE" /><div class="pa2 bg-black-10 tc f5 black-60 i">TEXT_HERE</div></div>`;
      }
      if (snippet_type == 'pull-quote') {
        snippet_title = 'Pull Quote';
        code_snip = `<div class="pa3 xx-slate-blue shadow-4 i sweet-sans-bold f2 lh-title">TEXT_HERE</div>`;
      }
      prompt('Code snippet: ' + snippet_title, code_snip);
    },

    edit_photo: function (_id) {
      this.send(
        'modal_open',
        'modal.gallery',
        "modal/gallery/edit/screen",
        { id: _id }
      );
    },

    upload_photo: function (file_handle) {
      $(".mh-" + file_handle + " .thumb-upload").show();
      $(".mh-" + file_handle + " .thumb-upload-button").hide();
      var dz = new Dropzone("#dropzone_photo_" + file_handle, {
        url: "https://api.clickbuild.io/api/utility/upload-file",
        uploadMultiple: false,
        addRemoveLinks: true,
        dictCancelUpload: "",
        dictRemoveFile: "",
        clickable: ".mh-" + file_handle + " .upload-button, .dropzone",
        previewTemplate:
          '<div class="dz-preview dz-file-preview">' +
          '<div class="dz-details">' +
          '<div class="dz-filename"><span data-dz-name></span><input type="hidden" class="filename" name="filename[' + file_handle + ']"></input></div>' +
          '</div>' +
          '<div class="dz-progress"><span class="dz-upload" data-dz-uploadprogress></span></div>' +
          '<div class="dz-error-message"><span data-dz-errormessage></span></div>' +
          '</div>',
      });
      dz.on("sending", function (file) {
        $(".mh-" + file_handle + " .upload-button").hide();
      });
    },
  }
});
