import Ember from 'ember';

export default Ember.Route.extend({

  beforeModel: function (transition) {
    var querystring = transition.queryParams;

    if (querystring.src) {
      this.controllerFor('application').send('api_request', {
        endpoint: 'discussion/confirm-log',
        data: {
          communication_id: querystring.msg_id,
          src: querystring.src,
          user_id: Ember.$.cookie("user_id")
        },
        callback: function (data) {
          // smoke.alert('Message marked as confirmed');
        }
      });
    }
  },

  model: function (params) {
    if (params.p1 == 'confirm') {
      this.controllerFor('application').send('api_request', {
        endpoint: 'discussion/confirm',
        data: {
          discussion_id: params.discussion_id,
          message_id: params.p2
        },
        callback: function (data) {
          smoke.alert('Message marked as confirmed');
        }
      });
    }
    return utility.api_request({
      endpoint: 'discussion/screen',
      data: {
        discussion_id: params.discussion_id
      }
    });
  },

  setupController: function (controller, model) {
    controller.set('params', this.get('params'));
    this._super(controller, model);
  },

  activate: function () {
    var p1 = this.get('container').lookup('router:main').router.state.params.discussion.p1;
    if (typeof (p1) == 'undefined' || p1 == 'confirm') {
      window.scrollTo(0, 0);
    }
  },

  actions: {

    project_wormhole: function () {
      window.location = '/discussion/' + $(".project-wormhole").val();
    },

    phase_move: function () {

      var phase_id = $(".phase-move").val();
      var task_id = $("input[name='task_id']").val();

      this.controllerFor('application').send('api_request', {
        endpoint: 'discussion/move',
        data: {
          task_id: task_id,
          phase_id: phase_id
        },
        callback: function (data) {
          smoke.alert('Task Moved Successfully');
        }
      });

    },

    schedule_toggle: function () {
      $(".task-schedule-title").toggleClass("toggle");
    },

    comments_reverse: function () {
      var list = $('#discussion_comments');
      var listItems = list.children('.task-communication');
      list.append(listItems.get().reverse());
    },

    task_boilerplate: function (trade_id, template_task_id) {
      $("#button-boilerplate").hide();
      this.controllerFor('application').send('api_request', {
        endpoint: 'discussion/task-boilerplate',
        data: {
          template_task_id: template_task_id,
        },
        callback: function (data) {
          $("textarea[name='body']").val(data.message);
          $('html, body').animate({ scrollTop: $("textarea[name='body']").offset().top - 50 });
        }
      });
    },

    upload: function () {
      $(".discussion-upload .modal-upload").show();
      $(".discussion-upload .modal-upload-button").hide();
      var dz = new Dropzone("#filesreplace", {
        url: "https://api.clickbuild.io/api/utility/upload-file",
        addRemoveLinks: true,
        dictCancelUpload: "X",
        dictRemoveFile: "X",
        clickable: ".upload-button, .dropzone",
        previewTemplate:
          '<div class="dz-preview dz-file-preview">' +
          '<div class="dz-details">' +
          '<div class="dz-filename"><span data-dz-name></span><input type="hidden" name="filename[]"></input></div>' +
          '<label>Title</label><input type="text" name="title[]" />' +
          '</div>' +
          '<div class="dz-progress"><span class="dz-upload" data-dz-uploadprogress></span></div>' +
          '<div class="dz-error-message"><span data-dz-errormessage></span></div>' +
          '</div>'
      });
      dz.on("sending", function (file) {
        $(".discussion-upload .upload-button").hide();
        $("#update-button").addClass('inactive');
      });
      dz.on("complete", function (file) {
        var res = $.parseJSON(file.xhr.response);
        if (res.error) {
          smoke.alert(res.errorMsg);
          dz.removeAllFiles();
        } else {
          if (this.getUploadingFiles().length === 0 && this.getQueuedFiles().length === 0) {
            $("#update-button").removeClass('inactive');
          }
        }
      });
    },

    save: function (id, project_id) {

      var ths = this;

      function save_execute(id, project_id) {
        if (!$("#update-button").hasClass('inactive')) {
          $("button#update-button").addClass('active');
          $(".dz-filename span").each(function () {
            $(this).siblings("input[name='filename[]']").val(
              $(this).text()
            );
          }).promise().done(function () {

            ths.controllerFor('application').send('api_request', {
              endpoint: 'discussion/save',
              data: {
                id: id,
                project_id: project_id,
                f: $("#discussion-edit").serialize()
              },
              callback: function (data) {
                window.location.reload();
              }
            });

          });
        }
      }

      // if this user is jeff
      if (ths.controllerFor('application').get('user_id') == '55fb76648c7a75b53946f51b') {
        var recipients = [];
        $('#discussion-edit input[name="recipients[]"]:checked').each(function () {
          if (!recipients.includes(($(this).attr('value')))) {
            recipients.push($(this).attr('value'));
          }
        });
        $('#discussion-edit input[name="recipients_mobile[]"]:checked').each(function () {
          if (!recipients.includes(($(this).attr('value')))) {
            recipients.push($(this).attr('value'));
          }
        });
        // if jeff is the only recipient (or there are no recipients)
        if (recipients.length == 0 || (recipients.length == 1 & recipients[0] == '55fb76648c7a75b53946f51b')) {
          smoke.confirm('You are the only recipient for this message. Is this your intention?', function (e) {
            if (e) {
              save_execute(id, project_id);
            }
          }, { reverseButtons: true });

        } else {
          save_execute(id, project_id);
        }
      } else {
        // everyone other than jeff
        save_execute(id, project_id);
      }

    },

    attach_project_files: function () {
      $(".attach-project-files .modal-upload-button").hide();
      $(".attach-project-files-container").show();
    },

    watch_list: function (id) {
      if ($("input[name='watch_list']").val() === 'false') {
        var message = 'Added to watch list';
        var action = 'add';
        $("input[name='watch_list']").val('true');
        $("#watch-list-link").html('<i class="remove sign icon"></i>Remove from my watch list');
      } else {
        if ($("input[name='watch_list']").val() === 'true') {
          var message = 'Removed from watch list';
          var action = 'remove';
          $("input[name='watch_list']").val('false');
          $("#watch-list-link").html('<i class="add sign icon"></i>Add to my watch list');
        }
      }
      this.controllerFor('application').send('api_request', {
        endpoint: 'discussion/watch-list',
        data: {
          id: id,
          action: action
        },
        callback: function (data) {
          smoke.alert(message);
        }
      });

    }
  }
});
