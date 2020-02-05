import Ember from 'ember';

export default Ember.Controller.extend({

  jch_staff: $.cookie("group_id") == 4 ? false : true,

  update_title: function () {
    $(document).attr('title', this.get('model.title') + ' - Clickbuild');
  }.observes('model.title'),

  actions: {

    task_complete: function (task_id) {
      var task_complete = $("#task-status").is(':checked') ? 'true' : 'false';
      this.controllerFor('application').send('api_request', {
        endpoint: 'project/progress/task-complete',
        data: {
          task_id: task_id,
          complete: task_complete
        },
        callback: function (data) {
          if (task_complete == 'true') {
            $(".task-status-title").addClass('complete');
            $(".task-status-title").removeClass('incomplete');
            $(".task-status-title label").text(data.label);
          } else {
            $(".task-status-title").addClass('incomplete');
            $(".task-status-title").removeClass('complete');
            $(".task-status-title label").text(data.label);
          }
        }
      });
    },

    branch_task_complete: function (task_id) {
      var task_complete = $("label[data-branch-task-id='" + task_id + "'] input").is(':checked') ? 'true' : 'false';
      this.controllerFor('application').send('api_request', {
        endpoint: 'project/progress/task-complete',
        data: {
          task_id: task_id,
          complete: task_complete
        },
        callback: function (data) {
          if (task_complete == 'true') {
            $("label[data-branch-task-id='" + task_id + "']").addClass('o-50');
          } else {
            $("label[data-branch-task-id='" + task_id + "']").removeClass('o-50');
          }
        }
      });
    },

    save_branch_schedule: function () {
      $(".branch-task-schedule").addClass('o-50');
      var schedule_data = {
        branch_start_id: $("input[name='branch_start_id']").val(),
        schedule_date_branch_start: $("input[name='schedule_date_branch_start']").val(),
        schedule_time_branch_start: $("input[name='schedule_time_branch_start']").val(),
        branch_complete_id: $("input[name='branch_complete_id']").val(),
        schedule_date_branch_complete: $("input[name='schedule_date_branch_complete']").val(),
        schedule_time_branch_complete: $("input[name='schedule_time_branch_complete']").val(),
      };
      this.controllerFor('application').send('api_request', {
        endpoint: 'project/progress/branch-task-schedule',
        data: schedule_data,
        callback: function (data) {
          $(".branch-task-schedule").removeClass('o-50');
          $(".branch-task-schedule-save").addClass('dn');
        }
      });
    }
  }
});
