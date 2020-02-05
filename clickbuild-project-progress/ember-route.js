import Ember from 'ember';

export default Ember.Route.extend({

  model: function (params) {
    return utility.api_request({
      endpoint: 'project/progress/screen',
      data: {
        project_id: this.controllerFor('application').current_project
      }
    });
  },

  activate: function () {
    window.scrollTo(0, 0);
  },

  actions: {

    search: function () {
      window.location.href = '/project/' + this.controllerFor('application').current_project + '/search-communication/' + encodeURIComponent($("input[name='k']").val());
    },

    save_execute: function (project_id, date_modify) {
      $(".global-loader").addClass('active');
      this.controllerFor('application').send('api_request', {
        endpoint: 'project/progress/save',
        data: {
          id: project_id,
          date_contract: $("input[name='date_contract']").val(),
          date_start: $("input[name='date_start']").val(),
          date_permit: $("input[name='date_permit']").val(),
          date_co: $("input[name='date_co']").val(),
          date_walk: $("input[name='date_walk']").val(),
          time_walk: $("input[name='time_walk']").val(),
          date_closing: $("input[name='date_closing']").val(),
          time_closing: $("input[name='time_closing']").val(),
          closing_notes: $("textarea[name='closing_notes']").val(),
          supervisor_id: $("select[name='supervisor_id']").val(),
          date_modify: date_modify
        },
        callback: function (data) {
          window.location.reload();
        }
      });
    },

    save: function (project_id) {
      var project_start = $('input[name="date_permit"]').val();
      var project_start_init = $('input[name="date_permit"]').data('init');
      var ths = this;
      if (project_start_init !== project_start) {
        smoke.quiz('Would you like to modify all of the subsequent deadlines as well?', function (e) {
          if (e === 'Modify') {
            ths.send('save_execute', project_id, 'subsequent');
          }
          if (e === 'Use Current') {
            ths.send('save_execute', project_id, 'current');
          }
        }, {
          button_1: "Modify",
          button_2: "Use Current",
          button_cancel: "Cancel"
        });
      } else {
        ths.send('save_execute', project_id, false);
      }
    },

    tasks_view: function (phase_id) {
      if ($(".phase[data-phase-id='" + phase_id + "']").hasClass('focused')) {
        $(".phase-tasks[data-phase-id='" + phase_id + "']").slideUp(function () {
          $(".phase[data-phase-id='" + phase_id + "']").removeClass('focused');
        });
      } else {
        $(".phase[data-phase-id='" + phase_id + "']").addClass('focused');
        $(".phase-tasks[data-phase-id='" + phase_id + "']").slideDown();
      }
    },

    task_complete: function (id) {
      $("li[data-task-id='" + id + "'] input[type='checkbox']").trigger('click');
      if ($("li[data-task-id='" + id + "'] .c5").hasClass('checked')) {
        $("li[data-task-id='" + id + "'] .c5").removeClass('checked');
        var complete = false;
      } else {
        $("li[data-task-id='" + id + "'] .c5").addClass('checked');
        var complete = true;
      }
      this.controllerFor('application').send('api_request', {
        endpoint: 'project/progress/task-complete',
        data: {
          task_id: id,
          complete: complete
        }
      });
    },

    edit_toggle: function () {
      $(".progress-table").toggleClass('can-edit');
      $("#admin-edit-progress").toggleClass('active');
    },

    deadline_update: function (title, phase_id, date, project_id) { 
      var ths = this;
      var col = 'deadline_start';
      if (title === 'Finish Date') {
        col = 'deadline_finish';
      }
      smoke.prompt('New ' + title, function (new_date) {
        if (new_date) {
          ths.controllerFor('application').send('api_request', {
            endpoint: 'project/progress/deadline-update',
            data: {
              project_id: project_id,
              phase_id: phase_id,
              date: new_date,
              col: col,
              deadlines: false
            },
            callback: function (data) {
              window.location.reload();
            }
          });
        } else { }
      }, {
        value: date,
        ok: "Update",
        classname: "smoke-datepicker"
      });
    },
    
    delete_task: function (id) {
      var ths = this;
      smoke.confirm('You are about to delete this<br /> task and all of its discussion. <small>Are you sure you want to do this?</small>', function (e) {
        if (e) {
          ths.controllerFor('application').send('api_request', {
            endpoint: 'task/delete',
            data: {
              id: id,
            },
            callback: function (data) {
              $("li[data-task-id='" + id + "']").slideUp();
            }
          });
        }
      }, {
        reverseButtons: true,
      });
    }
  }
});
