




app.post('/api/project/progress/screen', function (req, res) {

  function data_fetch_async(callback) {
    var returnObject = {};

    var data_project = models.project.find({ _id: req.body.project_id }).limit(1).lean().exec().then(function (data) {
      returnObject.project = data;
    });

    var data_users = models.user.find().lean().exec().then(function (data) {
      returnObject.users = data;
    });

    var data_phases = models.phase.find({ project_id: req.body.project_id }).sort({ display_order: 1 }).lean().exec().then(function (data) {
      returnObject.phases = data;
    });

    var data_tasks = models.task.find({ project_id: req.body.project_id }).sort({ display_order: 1 }).lean().exec().then(function (data) {
      returnObject.tasks = data;
    });

    var data_events = models.events.find({ project_id: req.body.project_id }).lean().exec().then(function (data) {
      returnObject.events = data;
    });

    var data_template_tasks = models.template_task.find().sort().lean().exec().then(function (data) {
      returnObject.template_tasks = data;
    });

    var data_discussions = models.discussion.find({ project_id: req.body.project_id }).sort({ display_order: 1 }).lean().exec().then(function (data) {
      returnObject.discussions = data;
    });

    return $.q.all([
      data_project,
      data_users,
      data_phases,
      data_template_tasks,
      data_tasks,
      data_events,
      data_discussions
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
    var data_users = data.users;
    var data_phases = data.phases;
    var data_template_tasks = data.template_tasks;
    var data_tasks = data.tasks;
    var data_events = data.events;
    var data_discussions = data.discussions;

    var _discussion_ids = [];
    var discussion = [];
    $._.forEach(data_discussions, function (dd) {
      _discussion_ids.push(dd._id);
      discussion[dd.task_id] = dd._id;
    });

    var events_label = [];
    $._.forEach(data_events, function (dd) {
      if (dd.date_scheduled) {
        date_scheduled_string = date('l M jS, Y', dd.date_scheduled);
        date_scheduled_format = date("m/d/Y", dd.date_scheduled);
        if (dd.time_scheduled) {
          date_scheduled_string += ' (' + schedule_time_string(dd.time_scheduled, dd.time_specific) + ')';
        }
      }
      events_label[dd._id] = date_scheduled_string;
    });

    models.discussions_communication.find({ discussion_id: { $in: _discussion_ids } }).lean().exec(function (err, data_discussions_communication) {

      var _phase_ids = [];
      $._.forEach(data_phases, function (dd) {
        _phase_ids.push(dd._id);
      });

      var _task_ids = [];
      var _tasks = [];
      $._.forEach(data_tasks, function (dd) {
        _task_ids.push(dd._id);

        if (!$.lexxi.is_array(_tasks[dd.phase_id])) {
          _tasks[dd.phase_id] = [];
        }
        _tasks[dd.phase_id].push(dd);
      });

      var template_tasks = [];
      $._.forEach(data_template_tasks, function (dd) {
        template_tasks[dd._id] = dd;
      });

      var issues_total = [];
      var issues = [];
      $._.forEach(data_discussions_communication, function (dd) {
        if (!in_array(issues, dd.discussion_id)) {
          issues.push(dd.discussion_id);
        }
        if (!issues_total[dd.discussion_id]) {
          issues_total[dd.discussion_id] = 0;
        }
        issues_total[dd.discussion_id] = parseInt(issues_total[dd.discussion_id]) + 1;
      });

      var staff = [];
      var supervisors = [];
      $._.forEach(data_users, function (dd) {
        staff[dd._id] = dd.first_name;
        if (dd.project_supervisor == 1) {
          supervisors.push({
            title: dd.first_name + '  ' + dd.last_name,
            id: dd._id,
            selected: data_project.supervisor_id == dd._id ? true : false
          });
        }
      });

      var phases = [];

      $._.forEach(data_phases, function (phase) {
        var tasks = [];
        var tasks_completed = 0;
        $._.forEach(_tasks[phase._id], function (task) {
          var discussion_id = task.discussion_id;
          var href = false;
          var has_communication,
            comments_total = '';
          if (discussion_id) {
            href = "/discussion/" + discussion_id;
            has_communication = in_array(issues, discussion_id) ? 'has-communication' : '';
            comments_total = issues_total[discussion_id];
          }

          var template_post_trigger = false;
          var post_preview_url = false;

          if (task.template_task_id) {
            if (template_tasks[task.template_task_id]) {
              template_post_trigger = template_tasks[task.template_task_id].feed_post_trigger;
              post_preview_url = 'https://api.clickbuild.io/template-post-preview/' + task.template_task_id;
            }
          }

          tasks.push({
            title: task.title,
            weight: task.weight,
            staff_lead: task.staff_uid == 'super' ? staff[data_project.supervisor_id] : staff[task.staff_uid],
            completed: task.date_completed ? 'checked' : false,
            completed_label: staff[task.completed_uid] + ' - ' + date('M j Y - g:ia', task.date_completed),
            id: task._id,
            can_view_tasks: req.body.group_id ? true : false,
            can_edit: req.body.group_id == '1' ? true : false,
            href: href,
            href_discussion: task.branch_task_role != null && task.branch_task_role != 'master' ? false : "/discussion/" + discussion_id,
            has_communication: has_communication,
            comments_total: comments_total,
            event_id: task.event_id,
            event_label: events_label[task.event_id],
            template_post_trigger: template_post_trigger,
            post_preview_url: post_preview_url
          });
          if (task.date_completed) {
            tasks_completed = tasks_completed + task.weight;
          }
        });
        var deadline_start = false;
        var deadline_start_edit = false;
        var deadline_finish = false;
        var deadline_finish_edit = false;

        if (phase.deadline_finish) {
          deadline_finish = date('M j', phase.deadline_finish);
          deadline_finish_edit = date('m/d/Y', phase.deadline_finish);
        }
        if (phase.deadline_start) {
          deadline_start = date('M j', phase.deadline_start);
          deadline_start_edit = date('m/d/Y', phase.deadline_start);
        }
        var phase_class = phase.deadline_status;
        var deadline_set = deadline_status_set(phase._id, phase);
        if (deadline_set != false) {
          phase_class = deadline_set;
        }
        var days_complete = false;
        if (phase.date_complete) {
          days_complete = convert_days(moment(phase.date_complete).hour(23).minute(59), moment(phase.deadline_start).hour(0).minute(1));
        }

        var day_current = phase_class == 'live' || phase_class == 'late' ? convert_days(moment(), moment(phase.deadline_start)) : days_complete;

        if (!day_current && phase.date_complete) {
          day_current = convert_days(moment(phase.date_complete).hour(23).minute(59), moment(phase.deadline_start).hour(0).minute(1));
        }
        if (phase.deadline_start && phase.deadline_finish) {
          var days_allocated = convert_days(moment(phase.deadline_finish).hour(23).minute(59), moment(phase.deadline_start).hour(0).minute(1));
        } else {
          var days_allocated = phase.deadline_length;
        }
        var days_actual = convert_days(moment(phase.date_complete).hour(23).minute(59), moment(phase.deadline_start).hour(0).minute(1));

        var phase_complete = phase.date_complete ? true : false;
        var ppc_achieved = days_complete <= days_allocated ? true : false;
        var status_icon_class = false;
        var status_label = false;
        if (phase_class == 'live' || phase_class == 'late') {
          status_icon_class = 'in-progress';
          status_label = 'In Progress';
        }
        if (phase_complete && ppc_achieved) {
          status_icon_class = 'achieved';
          status_label = 'Achieved';
        }
        if (phase_complete && !ppc_achieved) {
          status_icon_class = 'not-achieved';
          status_label = 'Not Achieved';
        }

        if (phase_complete && !ppc_achieved) {
          var width_alotted = progress_width(days_actual);
        } else if (phase_class == 'late') {
          var width_alotted = progress_width(day_current);
        } else {
          var width_alotted = progress_width(days_allocated);
        }
        var width_current = phase_complete && !ppc_achieved || phase_class == 'late' ? progress_width(days_allocated) : progress_width(day_current);
        var staff_lead = staff[phase.staff_lead];
        if (phase.staff_lead == 'super') {
          staff_lead = staff[data_project.supervisor_id];
        }
        phases.push({
          due_date: date("m/d", phase.deadline_finish),
          completed_date: date("m/d", phase.date_complete),
          phase_class: phase_class,
          title: phase.title,
          days_complete: days_complete,
          indicator_complete_date: date("m/d/Y", phase.date_complete),
          phase_id: phase._id,
          deadline_start: deadline_start,
          deadline_finish: deadline_finish,
          deadline_start_edit: deadline_start_edit,
          deadline_finish_edit: deadline_finish_edit,
          can_edit: req.body.group_id == '1' ? true : false,
          staff_lead: staff_lead,
          days_allocated: days_allocated,
          completed: phase.date_complete ? true : false,
          tasks: tasks,
          href_new: '/task/new/' + phase.template_phase_id + '/' + phase.project_id,
          can_add_tasks: req.body.group_id <= 3 ? true : false,
          ppc_class: ppc_achieved ? 'ppc-yes' : 'ppc-no',
          width_alotted: width_alotted,
          width_current: width_current,
          style_width_alotted: 'width: ' + width_alotted + '%',
          style_width_current: 'width: ' + width_current + '%',
          days_excess: day_current > 50 ? true : false,
          progress_label: phase_complete ? 'Completed' : 'Currently',
          day_current: day_current,
          day_allocated: days_allocated,
          show_indicators: phase_class == 'live' || phase_class == 'late' || phase_complete ? true : false,
          status_icon_class: status_icon_class,
          status_label: status_label,
        });
      });

      res.json({
        phases: phases,
        supervisors: supervisors,
        project_id: req.body.project_id,
        title: data_project.title,
        locked: data_project.closing_fixed ? true : false,
        time_walk: data_project.time_walk,
        time_closing: data_project.time_closing,
        closing_notes: data_project.closing_notes,
        date_start: data_project.date_start ? date('m/d/Y', data_project.date_start) : false,
        date_contract: data_project.date_contract ? date('m/d/Y', data_project.date_contract) : false,
        date_walk: data_project.date_walk ? date('m/d/Y', data_project.date_walk) : false,
        date_permit: data_project.date_permit ? date('m/d/Y', data_project.date_permit) : false,
        date_closing: data_project.date_closing ? date('m/d/Y', data_project.date_closing) : false,
        date_co: data_project.date_co ? date('m/d/Y', data_project.date_co) : false,
        can_view_save: req.body.group_id <= 2 ? true : false,
        can_view_edit: req.body.group_id == 1 ? true : false
      });

    });
  });

});





















app.post('/api/project/progress/save', function (req, res) {

  var modify_subsequent = false;
  var date_start = false;
  if (req.body.date_modify == 'subsequent') {
    modify_subsequent = true;
  }
  if (req.body.date_start) {
    date_start = req.body.date_start;
  } else {
    if (req.body.date_contract) {
      date_start = req.body.date_contract;
    }
  }

  var input = {
    date_start: date_start ? datetotime_js(date_start) : null,
    date_contract: req.body.date_contract ? datetotime_js(req.body.date_contract) : null,
    date_permit: req.body.date_permit ? datetotime_js(req.body.date_permit) : null,
    date_co: req.body.date_co ? datetotime_js(req.body.date_co) : null,
    date_closing: req.body.date_closing ? datetotime_js(req.body.date_closing) : null,
    date_walk: req.body.date_walk ? datetotime_js(req.body.date_walk) : null,
    closing_notes: req.body.closing_notes,
    supervisor_id: req.body.supervisor_id,
    time_closing: req.body.time_closing,
    time_walk: req.body.time_walk
  };

  models.user.find().lean().exec(function (err, data_users) {
    var staff = [];
    $._.forEach(data_users, function (dd) {
      staff[dd._id] = dd.first_name;
    });

    models.project.findOne({ _id: req.body.id }).lean().exec(function (err, data_project_pre) {
      models.project.update({ _id: req.body.id }, input).lean().exec(function (err) {
        if (err) return $.lexxi.handle_error(err);
        models.project.findOne({ _id: req.body.id }).lean().exec(function (err, data_project_post) {
          models.phase.findOne({ project_id: req.body.id }).lean().exec(function (err, data_phase) {

            var closing_notes = req.body.closing_notes ? '\rClosing notes:\r' + req.body.closing_notes + '\r\r' : '';

            var pre_closing = false;
            if (data_project_pre) {
              pre_closing = data_project_pre.date_closing;
            }
            if (req.body.date_closing && pre_closing && (date('Y-m-d', pre_closing) != date('Y-m-d', datetotime_js(req.body.date_closing)))) {

              modify_subsequent = true;
              var time = data_project_post.time_closing ? data_project_post.time_closing : 'time TBA';
              var message = staff[req.body.user_id] + " has updated the closing date for " + data_project_post.title + " to: " + date("M j, Y", datetotime(req.body.date_closing)) + " (" + time + ")\rThis event is now visible in the Closing Board calendar feed you subscribe to and should appear in your device calendars.\r"
                + closing_notes + "More progress details: https://clickbuild.io/project/" + data_project_post._id + "/progress\r";
              email_send($, {
                to_list: ['jeff@clickbuild.io'],
                from_email: 'cb@notifications.clickbuild.io',
                from_name: 'Clickbuild',
                subject: 'CB | ' + data_project_post.shortcode + ' | Updated Closing Date',
                html: false,
                message: message,
              });
              models.project.update({ _id: data_project_post._id }, {
                closing_updated_uid: req.body.user_id
              }).exec(function (err) {
              });
            }

            var pre_walk = false;
            if (data_project_post) {
              pre_walk = data_project_pre.date_walk;
            }
            if (req.body.date_walk && pre_walk && (date('Y-m-d', pre_walk) != date('Y-m-d', datetotime_js(req.body.date_walk)))) {
              modify_subsequent = true;
              var time = data_project_post.time_walk ? data_project_post.time_walk : 'time TBA';
              var message = "The Pre-walk date for " + data_project_post.title + " has been updated to " + date("M j, Y", datetotime(req.body.date_walk)) + " (" + time + ")\rThis event is now visible in the Closing Board calendar feed you subscribe to and should appear in your device calendars.\r"
                + closing_notes + "More progress details: https://clickbuild.io/project/" + data_project_post._id + "/progress\r";
              email_send($, {
                to_list: ['jeff@clickbuild.io'],
                from_email: 'cb@notifications.clickbuild.io',
                from_name: 'Clickbuild',
                subject: 'CB | ' + data_project_post.shortcode + ' | Updated Pre-Walk Date',
                html: false,
                message: message,
              });
            }
            if (data_phase) {
              if (modify_subsequent) {
                request.post({
                  url: 'https://api.clickbuild.io/api/internal/progress-tracking-update',
                  form: {
                    project_id: req.body.id,
                    date_start: date_start
                  }
                }, function (error, response, body) {
                });
              }
            } else {
              if (date_start) {
                request.post({
                  url: 'https://api.clickbuild.io/api/internal/progress-tracking-enable',
                  form: {
                    project_id: req.body.id,
                    date_start: date_start
                  }
                }, function (error, response, body) {
                });
              }
            }
            res.json({
              success: true
            });


            request.post({
              url: 'https://api.clickbuild.io/api/webadmin-sync/homes',
              form: {
                project_id: req.body.id
              }
            }, function (error, response, body) {
            });

          });
        });
      });
    });
  });
});




















app.post('/api/project/progress/deadline-update', function (req, res) {
  models.phase.findOne({ _id: req.body.phase_id }).lean().exec(function (err, data_phase) {
    if (req.body.date == 'NULL') {
      var new_date = null;
    } else {
      var new_date = datetotime_js(str_replace("-", "/", req.body.date));
    }

    var input = {};

    if (req.body.col == 'deadline_start') {
      input.deadline_start = new_date;
    }
    if (req.body.col == 'deadline_finish') {
      input.deadline_finish = new_date;
    }

    if (req.body.col == 'deadline_start' && req.body.date != 'NULL') {
      input.deadline_finish = moment(new_date).add(data_phase.deadline_length, 'days');
    }
    models.phase.update({ _id: req.body.phase_id }, input).exec(function (err) {
      if (err) return $.lexxi.handle_error(err);
      models.phase.findOne({ _id: req.body.phase_id }).lean().exec(function (err, data_phase_post) {
        if (!data_phase_post.deadline_finish && !data_phase_post.deadline_start) {
          models.phase.update({ _id: req.body.phase_id }, {
            deadline_status: null
          }).exec(function (err) {
            if (err) return $.lexxi.handle_error(err);
          });
        }
      });
    });
    res.json({
      display_date: date("M j", new_date)
    });
  });
});




















app.post('/api/project/progress/branch-task-schedule', function (req, res) {
  var o = {};

  if (req.body.branch_start_id) {
    models.task.update({ _id: req.body.branch_start_id }, {
      schedule_date: req.body.schedule_date_branch_start,
      schedule_time: req.body.schedule_time_branch_start
    }).exec(function (err) {
      if (err) return $.lexxi.handle_error(err);
    });
  }

  if (req.body.branch_complete_id) {
    models.task.update({ _id: req.body.branch_complete_id }, {
      schedule_date: req.body.schedule_date_branch_complete,
      schedule_time: req.body.schedule_time_branch_complete
    }).exec(function (err) {
      if (err) return $.lexxi.handle_error(err);
    });
  }

  res.json(o);

});














app.post('/api/project/progress/task-complete', function (req, res) {
  var o = {};
  models.task.findOne({ _id: req.body.task_id }).lean().exec(function (err, data_task) {
    var phase_id = data_task.phase_id;
    models.task.find({ phase_id: phase_id }).sort({ display_order: 1 }).lean().exec(function (err, data_phase_tasks) {
      models.template_task.findOne({ _id: data_task.template_task_id }).lean().exec(function (err, data_template_task) {
        models.user.find().lean().exec(function (err, data_users) {

          var tasks_total = 0;
          if (data_phase_tasks) {
            tasks_total = data_phase_tasks.length;
          }

          var user_first_names = [];
          var user_full_names = [];
          $._.forEach(data_users, function (dd) {
            user_first_names[dd._id] = dd.first_name;
            user_full_names[dd._id] = dd.first_name + ' ' + dd.last_name;
          });

          var tasks_completed = 0;
          var tasks = [];
          $._.forEach(data_phase_tasks, function (dd) {
            tasks.push({
              title: dd.title,
              completed: dd.date_completed ? true : false,
              due_date: dd.deadline ? date("M j", dd.deadline) : false,
              id: dd._id
            });
            if (dd.date_completed) {
              tasks_completed = tasks_completed + dd.weight;
            }
          });

          o.width = tasks_completed;

          if (req.body.complete == 'true') {
            o.label = 'Marked as completed by ' + user_first_names[req.body.user_id] + ' on ' + date('M j, Y') + ' at ' + date('g:ia') + '.';
          } else {
            o.label = 'This task is not yet complete.';
          }
          res.json(o);
          
          request.post({
            url: 'https://api.clickbuild.io/api/internal/complete-phase',
            form: {
              phase_id: phase_id,
              tasks_total: tasks_total,
              task_complete: req.body.complete
            }
          }, function (error, response, body) {
            if (data_template_task) {
              if (data_template_task.phase_trigger) {
                models.phase.findOne({ template_phase_id: data_template_task.phase_trigger, project_id: data_task.project_id }).lean().exec(function (err, data_phase) {
                  var phase_deadline_start = moment().add(1, 'days').hour(7).minute(0).second(0).millisecond(0);
                  if (!$._.isEmpty(data_phase)) {
                    var phase_id = '' + update_data_phase._id;
                    models.phase.update({ _id: update_phase_id }, {
                      deadline_status: 'live',
                      deadline_start: phase_deadline_start,
                      deadline_finish: moment(phase_deadline_start).add(data_phase.deadline_length, 'days'),
                    }).exec(function (err) {
                      if (err) return $.lexxi.handle_error(err);
                      request.post({
                        url: 'https://api.clickbuild.io/api/internal/phase-start-email',
                        form: {
                          phase_id: phase_id
                        }
                      }, function (error, response, body) {
                      });
                    });
                  }
                });
              }
            }

            var dc = null;
            if (req.body.complete == 'true') {
              dc = Date.now();
            }
            models.task.update({ _id: req.body.task_id }, {
              date_completed: dc,
              completed_uid: req.body.user_id,
            }).exec(function (err) {
              if (err) return $.lexxi.handle_error(err);

              request.post({
                url: 'https://api.clickbuild.io/api/internal/project-feed-add',
                form: {
                  type: 'task-complete',
                  task_id: req.body.task_id,
                  project_id: data_task.project_id,
                }
              }, function (error, response, body) {
              });

              if (data_template_task && req.body.complete == 'true') {
                if (data_template_task.feed_post_trigger) {

                  var input = {
                    project_id: data_task.project_id,
                    date: new Date(),
                    visibility_client: true,
                    visibility_public: true,
                    body: data_template_task.feed_post_body,
                    headline: data_template_task.feed_post_headline,
                    user_id: req.body.user_id,
                    type: 'status',
                  };

                  if (data_template_task.feed_post_photo) {
                    input.photo_url = data_template_task.feed_post_photo;
                    if (data_template_task.feed_post_photo_caption) {
                      input.caption = data_template_task.feed_post_photo_caption;
                    }
                  }

                  var nm = new models.project_feed(input);
                  nm.save(function (err) {
                    if (err) return $.lexxi.handle_error(err);
                  });

                  if (data_template_task.feed_post_email) {

                    var twilio_client = null;
                    twilio_client = new twilio($.config.twilio.sid, $.config.twilio.token);

                    var status_id = nm._id;

                    models.user.findOne({ _id: req.body.user_id }).lean().exec(function (err, data_sender) {
                      models.project.findOne({ _id: data_task.project_id }).lean().exec(function (err, data_project) {
                        models.client.find({
                          $or: [
                            { project_id: data_task.project_id },
                            { _id: data_project.client_id }
                          ],
                        }).lean().exec(function (err, data_client) {

                          var jeff_alerted = false;
                          $._.forEach(data_client, function (dd) {

                            var message_html = '<div style="font-family: sans-serif;">' +
                              '<div style="border-top: 2px solid #ddd; padding: 15px 0;">';
                            if (data_sender.thumbnail_url) {
                              message_html += '<div style="width: 20%; float: left;">' +
                                '<img style="border-radius: 50%; width: 90px; height: 90px; min-width: 40px; min-height: 40px;" src="' + data_sender.thumbnail_url + '" />' +
                                '</div>' +
                                '<div style="float: left; width: 80%;">' +
                                '<span style="margin-bottom: 5px; display: block;">' + dd.first_name + ', more progress at your new home! Drop in to your client feed when you have a moment to learn more about it. -JC</span>' +
                                '<span style="font-size: 120%; line-height: 140%;"><h3><a style="color: #b72b24;" href="https://clients.jeffclick.com/progress#' + status_id + '">' + data_template_task.feed_post_headline + '</a></h3>' +
                                '</span>' +
                                '</div>' +
                                '<div style="clear: both;"></div>';
                            } else {
                              message_html +=
                                '<span style="margin-bottom: 5px; display: block;">' + dd.first_name + ', more progress at your new home! Drop in to your client feed when you have a moment to learn more about it. -JC</span>' +
                                '<span style="font-size: 120%; line-height: 140%;"><h3><a style="color: #b72b24;" href="https://clients.jeffclick.com/progress#' + status_id + '">' + data_template_task.feed_post_headline + '</a></h3>' +
                                '</span>';
                            }
                            message_html += '</div>';

                            message_html += '<div style="background: #eee; padding: 8px 10px; color: #444; font-size: 90%; line-height: 160%;">' +
                              'This message was sent via ClickBuild on ' + date('l M jS, Y') +
                              ' at ' + date('h:ia') +
                              '.</div>' +
                              '<div style="padding-top: 10px;font-size: 70%; color: #ddd;">' + date('m/d/Y -- h:ia') +
                              '</div>';

                            var _email = {
                              to: dd.email,
                              bcc: 'jeff@clickbuild.io',
                              from_email: 'cb@notifications.clickbuild.io',
                              from_name: 'Jeff Click Design | Build',
                              subject: dd.first_name + ', more progress at your new home!',
                              html: true,
                              message: message_html,
                            };

                            email_send($, _email);

                            if (dd.mobile) {
                              twilio_client.messages.create({
                                body: dd.first_name + ', more progress at your new home! Drop in to your client feed when you have a moment to learn more about it: https://clients.jeffclick.com/progress#' + status_id,
                                to: '+1' + str_replace(" ", "", str_replace(")", "", str_replace("(", "", str_replace(".", "", str_replace("-", "", dd.mobile))))),
                                from: '+14058963837'
                              }).then(function (message) {
                                return true;
                              });
                            }

                            if (jeff_alerted !== true) {
                              twilio_client.messages.create({
                                body: dd.first_name + ', more progress at your new home! Drop in to your client feed when you have a moment to learn more about it: https://clients.jeffclick.com/progress#' + status_id,
                                to: '+14053158163',
                                from: '+14058963837'
                              }).then(function (message) {
                                return true;
                              });

                              jeff_alerted = true;
                            }

                          });

                        });
                      });

                    });
                  }
                }
              }
            });

          });

          if (data_task.branch_task_role == 'complete') {
            request.post({
              url: 'https://api.clickbuild.io/api/project/progress/task-complete',
              form: {
                task_id: data_task.branch_task_parent_id,
                complete: req.body.complete
              }
            }, function (error, response, body) {
            });
          }

        });
      });
    });
  });
});
