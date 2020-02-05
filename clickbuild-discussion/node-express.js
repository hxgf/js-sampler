

app.post('/api/discussion/save', function (req, res) {

  var form = [];
  parse_str(req.body.f, form);

  var discussion_id = req.body.id;
  var o = {
    success: true
  };
  var email_list = [];
  var mobile_list = [];


  function update_discussion() {
    models.discussion.findOne({ _id: discussion_id }).lean().exec(function (err, data_discussion) {
      models.task.findOne({ _id: data_discussion.task_id }).lean().exec(function (err, data_task) {
        models.events.findOne({ _id: data_discussion.event_id }).lean().exec(function (err, data_event) {
          var input_event = {
            date_scheduled: form.date_scheduled ? datetotime_js(form.date_scheduled) : null,
            time_scheduled: form.time_scheduled,
            time_specific: form.time_specific,
            description: form.description,
            discussion_id: discussion_id,
            title: data_task.title,
            project_id: req.body.project_id,
          };


          if ($._.isEmpty(data_event)) {
            var task_id = data_task._id;
            var new_event = true;
            input_event.date_created = Date.now();

            if (form.date_scheduled) {
              var nm = new models.events(input_event);
              nm.save(function (err) {
                if (err) return $.lexxi.handle_error(err);
              });
              var event_id = '' + nm._id;
              o.redirect = event_id;
              models.discussion.update({ _id: discussion_id }, {
                event_id: event_id,
              }).exec(function (err) {
                if (err) return $.lexxi.handle_error(err);
              });
              models.task.update({ _id: task_id }, {
                event_id: event_id,
                event_scheduled_string: schedule_time_string(form.time_scheduled, form.time_specific)
              }).exec(function (err) {
                if (err) return $.lexxi.handle_error(err);
              });
            }
          } else {
            var new_event = false;
            var event_id = data_event._id;

            if (form.jch_staff == 'staff') {
              if (form.date_scheduled) {
                if (
                  date('m/d/y', datetotime_js(form.date_scheduled)) != date('m/d/y', data_event.date_scheduled) ||
                  form.time_scheduled != data_event.time_scheduled ||
                  (form.time_specific != '' && form.time_specific != data_event.time_specific)
                ) {
                  models.events.update({ _id: event_id }, input_event).exec(function (err) {
                    if (err) return $.lexxi.handle_error(err);
                  });

                  request.post({
                    url: 'https://api.clickbuild.io/api/internal/updated-event-notify',
                    form: {
                      event_id: event_id,
                      user_id: req.body.user_id,
                      message_content: false,
                      schedule: {
                        date_scheduled: datetotime(form.date_scheduled),
                        time_scheduled: form.time_scheduled,
                        time_specific: form.time_specific,
                        description: form.description
                      },
                      discussion_id: discussion_id
                    }
                  }, function (error, response, body) {
                  });
                } else {
                }
              } else {
                models.events.find({ _id: event_id }).remove(function () {
                });
                models.task.update({ _id: data_task._id }, {
                  event_id: null,
                  event_scheduled_string: null
                }).exec(function (err) {
                  if (err) return $.lexxi.handle_error(err);
                });
              }
            }
          }

          var date_scheduled_previous = false;
          if (data_event) {
            if (data_event.date_scheduled) {
              date_scheduled_previous = true;
            }
          }
          if (form.date_scheduled && !date_scheduled_previous) {

            request.post({
              url: 'https://api.clickbuild.io/api/internal/project-feed-add',
              form: {
                type: 'event-scheduled',
                task_id: '' + task_id,
                project_id: req.body.project_id,
                user_id: req.body.user_id
              }
            }, function (error, response, body) {
            });

            request.post({
              url: 'https://api.clickbuild.io/api/internal/new-event-notify',
              form: {
                event_id: event_id,
                user_id: req.body.user_id,
                message_content: false,
                schedule: {
                  date_scheduled: datetotime(form.date_scheduled),
                  time_scheduled: form.time_scheduled,
                  time_specific: form.time_specific,
                  description: form.description
                },
                discussion_id: discussion_id
              }
            }, function (error, response, body) {
            });
          }

          if (form.body || !$._.isEmpty(form.filename) || !$._.isEmpty(form.attach_project_files)) {
            var input_communication = {
              body: form.body,
              user_id: req.body.user_id,
              discussion_id: discussion_id,
              source: 'web'
            };
            var nm = new models.discussions_communication(input_communication);
            nm.save(function (err) {
              if (err) return $.lexxi.handle_error(err);
            });
            var comment_id = '' + nm._id;
            var i = 0;

            if ($._.isObject(form.title)) {
              var titles = $._.values(form.title);
            } else {
              var titles = [];
            }

            if (!$._.isEmpty(form.filename)) {

              $._.forEach(form.filename, function (filename) {

                var _i = i;
                var ext = path.extname(filename);
                var _filename = filename.replace(/\.[^/.]+$/, "");
                var filename_new = 'c-' + comment_id + '-' + $.lexxi.url_title(_filename) + ext;
                var file_temp = $.__base + 'app/uploads/' + $.lexxi.url_title(_filename) + ext;
                file_temp = file_temp.toLowerCase();
                var file_size = getFilesizeInBytes(file_temp);
                models.file.findOne({ filename: filename_new, comment_id: comment_id, date_added: { $gte: Date.now() } }).lean().exec(function (err, data_file_current) {
                  if (!data_file_current) {

                    s3.putFile(
                      file_temp,
                      '/files/' + filename_new,
                      { 'x-amz-acl': 'public-read', 'Content-Type': mime.lookup(file_temp) },
                      function (err, res) {
                        if (err) return $.lexxi.handle_error(err);
                        fs.unlink(file_temp);
                      });

                    var _input = {
                      filename: filename_new,
                      title: titles[_i],
                      comment_id: comment_id,
                      user_id: req.body.user_id,
                      size: file_size,
                    };

                    if (form.add_to_project_files) {
                      _input.filename_raw = filename;
                      _input.project_id = req.body.project_id;
                      _input.category_id = form.add_to_project_files_category;
                      _input.client_visible = false;
                    }

                    var nm = new models.file(_input);
                    nm.save(function (err) {
                      if (err) return $.lexxi.handle_error(err);
                    });
                  }
                });
                i++;
              });
            }


            if (!$._.isEmpty(form.attach_project_files)) {
              models.file.find({ _id: { $in: $._.values(form.attach_project_files) } }).lean().exec(function (err, data_project_files) {

                var file = [];
                $._.forEach(data_project_files, function (dd) {
                  file[dd._id] = dd;
                });
                $._.forEach(form.attach_project_files, function (file_id) {

                  var nm = new models.file({
                    filename: file[file_id]['filename'],
                    title: file[file_id]['title'],
                    comment_id: comment_id,
                    user_id: req.body.user_id,
                    size: file[file_id]['size'],
                  });
                  nm.save(function (err) {
                    if (err) return $.lexxi.handle_error(err);
                  });

                });
              });
            }
            
            request.post({
              url: 'https://api.clickbuild.io/api/internal/discussion-notify',
              form: {
                discussion_id: discussion_id,
                user_id: req.body.user_id,
                snooze_flag: form.snooze_flag ? 'snooze' : false,
                message_id: comment_id
              }
            }, function (error, response, body) {
            });
          }
          res.json(o);
        });
      });
    });
  }


  if (req.body.user_id) {

    if (form.recipients) {
      models.math_discussions_notifications.find({ discussion_id: discussion_id }).remove(function () {
        models.math_discussions_associations.find({ discussion_id: discussion_id }).lean().exec(function (err, data_associations) {
          models.math_discussions_notifications_history.find({ discussion_id: discussion_id }).lean().exec(function (err, data_notifications_history) {
            models.user.find().lean().exec(function (err, data_users) {
              var associations = [];
              $._.forEach(data_associations, function (dd) {
                associations.push(dd.user_id);
              });
              var notifications_history = [];
              $._.forEach(data_notifications_history, function (dd) {
                notifications_history.push(dd.user_id);
              });
              var user_emails = [];
              var user_mobiles = [];
              $._.forEach(data_users, function (dd) {
                user_emails[dd._id] = dd.email;
                user_mobiles[dd._id] = dd.mobile;
              });

              var recipients_unique = array_unique_alt($._.values(form.recipients));

              $._.forEach(recipients_unique, function (user_id) {
                email_list.push(user_emails[user_id]);
                var nm = new models.math_discussions_notifications({
                  discussion_id: discussion_id,
                  user_id: user_id,
                  contact_method: 'email'
                });
                nm.save(function (err) {
                  if (err) return $.lexxi.handle_error(err);
                });
                if (!in_array(associations, user_id)) {
                  var nm = new models.math_discussions_associations({
                    discussion_id: discussion_id,
                    user_id: user_id,
                    contact_method: 'email'
                  });
                  nm.save(function (err) {
                    if (err) return $.lexxi.handle_error(err);
                  });
                }
                if (!in_array(notifications_history, user_id)) {
                  var nm = new models.math_discussions_notifications_history({
                    discussion_id: discussion_id,
                    user_id: user_id,
                    contact_method: 'email'
                  });
                  nm.save(function (err) {
                    if (err) return $.lexxi.handle_error(err);
                  });
                }
              });

              var recipients_unique_mobile = array_unique_alt($._.values(form.recipients_mobile));
              $._.forEach(recipients_unique_mobile, function (user_id) {
                mobile_list.push(user_mobiles[user_id]);
                var nm = new models.math_discussions_notifications({
                  discussion_id: discussion_id,
                  user_id: user_id,
                  contact_method: 'mobile'
                });
                nm.save(function (err) {
                  if (err) return $.lexxi.handle_error(err);
                });
                if (!in_array(associations, user_id)) {
                  var nm = new models.math_discussions_associations({
                    discussion_id: discussion_id,
                    user_id: user_id,
                    contact_method: 'mobile'
                  });
                  nm.save(function (err) {
                    if (err) return $.lexxi.handle_error(err);
                  });
                }
                if (!in_array(notifications_history, user_id)) {
                  var nm = new models.math_discussions_notifications_history({
                    discussion_id: discussion_id,
                    user_id: user_id,
                    contact_method: 'mobile'
                  });
                  nm.save(function (err) {
                    if (err) return $.lexxi.handle_error(err);
                  });
                }
              });

              update_discussion();

            });
          });
        });
      });
    } else {
      update_discussion();
    }

  } else {
    res.json({ success: false });
  }

});








































// show all the comments and files for a given discussion

app.post('/api/discussion/screen', function (req, res) {

  var discussion_query = { _id: req.body.discussion_id };
  var _discussion_id = req.body.discussion_id;
  if (_discussion_id.length < 7) {
    discussion_query = { legacy_id: _discussion_id };
  }

  models.discussion.findOne(discussion_query).lean().exec(function (err, data_discussion) {

    function data_fetch_async(callback) {
      var returnObject = {};

      var data_projects = models.project.find().sort({ title: 1 }).lean().exec().then(function (data) {
        returnObject.projects = data;
      });

      var data_users = models.user.find().lean().exec().then(function (data) {
        returnObject.users = data;
      });

      var data_discussion_comments = models.discussions_communication.find({ discussion_id: data_discussion._id, error: null }).sort({ date: -1 }).lean().exec().then(function (data) {
        returnObject.discussion_comments = data;
      });

      var data_math_watch_list = models.math_discussions_watch_list.find({ discussion_id: data_discussion._id, user_id: req.body.user_id }).lean().exec().then(function (data) {
        returnObject.math_watch_list = data;
      });

      var data_math_notifications = models.math_discussions_notifications.find({ discussion_id: data_discussion._id }).lean().exec().then(function (data) {
        returnObject.math_notifications = data;
      });

      var data_math_notifications_history = models.math_discussions_notifications_history.find({ discussion_id: data_discussion._id }).lean().exec().then(function (data) {
        returnObject.math_notifications_history = data;
      });

      var data_companies = models.company.find({ applicant: { $ne: true } }).lean().exec().then(function (data) {
        returnObject.companies = data;
      });

      var data_trades_categories = models.trades_category.find().lean().exec().then(function (data) {
        returnObject.trades_categories = data;
      });

      var data_task = models.task.find({ _id: data_discussion.task_id }).limit(1).lean().exec().then(function (data) {
        returnObject.task = data;
      });

      var data_event = models.events.find({ discussion_id: data_discussion._id }).limit(1).lean().exec().then(function (data) {
        returnObject.events = data;
      });

      return $.q.all([
        data_projects,
        data_users,
        data_discussion_comments,
        data_math_watch_list,
        data_math_notifications,
        data_math_notifications_history,
        data_companies,
        data_trades_categories,
        data_task,
        data_event
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
      var data_projects = data.projects;
      var data_users = data.users;
      var data_discussion_comments = data.discussion_comments;
      var data_math_watch_list = data.math_watch_list;
      var data_math_notifications = data.math_notifications;
      var data_math_notifications_history = data.math_notifications_history;
      var data_companies = data.companies;
      var data_trades_categories = data.trades_categories;

      var data_task = data.task[0];
      var data_event = data.events[0];


      models.phase.findOne({ template_phase_id: '55fb76e88c7a75b539474820', project_id: data_discussion.project_id }).lean().exec(function (err, data_phase_warranty) {

        var warranty_phase_id = null;
        if (data_phase_warranty) {
          warranty_phase_id = data_phase_warranty._id;
        }

        models.phase.find({ project_id: data_discussion.project_id, deadline_status: { $ne: 'complete' }, _id: { $ne: data_task ? data_task.phase_id : null } }).lean().exec(function (err, data_phases_move) {
          models.file.find({ project_id: data_discussion.project_id }).lean().exec(function (err, data_project_files) {
            models.files_category.find().lean().exec(function (err, data_files_categories) {

              models.math_trades_projects.find({ project_id: data_discussion.project_id }).lean().exec(function (err, data_math_projects) {

                var _comment_ids = [];
                $._.forEach(data_discussion_comments, function (dd) {
                  _comment_ids.push(dd._id);
                });


                var template_task_id = false;
                var branch_master = false;
                var branch_tasks_query = { _id: null };
                if (data_task) {
                  if (typeof (data_task.template_task_id) !== 'undefined') {
                    template_task_id = data_task.template_task_id;
                  }
                  if (data_task.branch_task_role == 'master') {
                    branch_tasks_query = { branch_task_parent_id: data_task._id };
                    branch_master = true;
                  }
                }


                models.log_message_read.find({ communication_id: { $in: _comment_ids } }).lean().exec(function (err, data_log_message_read) {

                  models.file.find({ comment_id: { $in: _comment_ids } }).lean().exec(function (err, data_files) {
                    models.task.find({ template_task_id: template_task_id, _id: { $ne: data_discussion.task_id }, date_completed: null }).lean().exec(function (err, data_wormhole_tasks) {
                      models.template_task.findOne({ _id: template_task_id }).lean().exec(function (err, data_template_task) {
                        models.math_trades_tasks.find({ template_task_id: template_task_id }).lean().exec(function (err, data_math_trades_tasks) {
                          models.math_users_tasks.find({ template_task_id: template_task_id }).lean().exec(function (err, data_math_users_tasks) {

                            models.task.find(branch_tasks_query).lean().exec(function (err, data_branch_tasks) {

                              models.project_feed.findOne({ task_id: data_discussion.task_id }).lean().sort({ date: -1 }).exec(function (err, data_feed_task) {

                                var feed_id = false;
                                if (data_feed_task) {
                                  feed_id = data_feed_task._id;
                                }

                                models.project_feed_comments.find({ feed_id: feed_id }).lean().exec(function (err, data_project_feed_comments) {
                                  models.project_feed_likes.find({ feed_id: feed_id }).lean().exec(function (err, data_project_feed_likes) {

                                    var projects = [];
                                    var wormhole_project_titles = [];
                                    var project_current = false;

                                    $._.forEach(data_projects, function (dd) {
                                      if (dd.status == 'active' || dd.status == 'warranty') {
                                        wormhole_project_titles[dd._id] = dd.title;
                                      }

                                      projects.push({
                                        title: dd.title,
                                        id: dd._id,
                                        checked: dd._id == data_discussion.project_id ? 'checked' : false
                                      });
                                      if (dd._id == data_discussion.project_id) {
                                        project_current = dd;
                                      }
                                    });

                                    var wormhole_list = [];
                                    $._.forEach(data_wormhole_tasks, function (dd) {
                                      if (wormhole_project_titles[dd.project_id]) {
                                        wormhole_list.push({
                                          'id': dd.discussion_id,
                                          'title': wormhole_project_titles[dd.project_id],
                                        });
                                      }
                                    });


                                    var recipients = [];
                                    var notifications_current = [];
                                    var notifications_history = [];

                                    var notifications_current = [];
                                    var notifications_current_mobile = [];
                                    $._.forEach(data_math_notifications, function (dd) {
                                      if (dd.contact_method == 'mobile') {
                                        notifications_current_mobile.push(dd.user_id);
                                      } else {
                                        notifications_current.push(dd.user_id);
                                      }
                                    });

                                    var notifications_history = [];
                                    var notifications_history_mobile = [];
                                    $._.forEach(data_math_notifications_history, function (dd) {
                                      if (dd.contact_method == 'mobile') {
                                        notifications_history_mobile.push(dd.user_id);
                                      } else {
                                        notifications_history.push(dd.user_id);
                                      }
                                    });



                                    var all_users = [];
                                    var users_firstname = [];
                                    var jch_staff = [];
                                    var company_users = [];
                                    var users_data = [];

                                    var companies = [];
                                    var companies_data = [];
                                    $._.forEach(data_companies, function (dd) {
                                      companies[dd._id] = dd.title;
                                      companies_data[dd._id] = dd;
                                    });


                                    $._.forEach(data_users, function (dd) {

                                      all_users[dd._id] = dd.first_name + ' ' + dd.last_name;
                                      users_firstname[dd._id] = dd.first_name;

                                      if (!$.lexxi.is_array(company_users[dd.company_id])) {
                                        company_users[dd.company_id] = [];
                                      }
                                      company_users[dd.company_id].push(dd);

                                      if (dd.company_id == '55fb76e68c7a75b5394747ce' && dd.first_name != 'Brodie' && dd.first_name != 'John') {
                                        jch_staff.push(dd);
                                      }


                                      var user_tooltip = '';

                                      if (dd.company_id) {
                                        company_id = dd.company_id;
                                      }

                                      if (companies_data[company_id]) {
                                        if (companies_data[company_id].phone) {
                                          user_tooltip += 'Office: ' + companies_data[company_id].phone + '<br />';
                                        }
                                      }
                                      if (dd.mobile) {
                                        user_tooltip += 'Mobile: ' + dd.mobile + '<br />';
                                      }
                                      if (dd.email) {
                                        user_tooltip += 'Email: <a href="mailto:' + dd.email + '">' + dd.email + '</a><br />';
                                      }

                                      dd.tooltip = user_tooltip;
                                      users_data[dd._id] = dd;

                                    });

                                    var math_trades_tasks = [];
                                    $._.forEach(data_math_trades_tasks, function (dd) {
                                      math_trades_tasks.push(dd.company_id);
                                    });
                                    var math_users_tasks = [];
                                    $._.forEach(data_math_users_tasks, function (dd) {
                                      math_users_tasks.push(dd.user_id);
                                    });

                                    var trades_categories = [];
                                    $._.forEach(data_trades_categories, function (dd) {
                                      trades_categories[dd._id] = dd.title;
                                    });

                                    var recipients_jch = [];
                                    $._.forEach(jch_staff, function (dd) {
                                      var checked_email = false;
                                      var checked_mobile = false;
                                      var super_active = false;
                                      var super_inactive = false;
                                      var jeff = false;
                                      var super_active_class = false;
                                      var super_inactive_class = false;
                                      var jeff_class = false;
                                      var weight = 2;

                                      if (in_array(notifications_current_mobile, dd._id)) {
                                        checked_mobile = 'checked';
                                      }

                                      if (in_array(notifications_current, dd._id)) {
                                        checked_email = 'checked';
                                      }

                                      if (dd._id == req.body.user_id) {
                                        if (dd.communication_email) {
                                          checked_email = 'checked';
                                        }
                                        if (dd.communication_text) {
                                          checked_mobile = 'checked';
                                        }
                                      }
                                      if (dd.first_name == 'Jeff' && dd.last_name == 'Click') {
                                        jeff = true;
                                        jeff_class = 'jeff';
                                        weight = 5;

                                      }

                                      if (dd.legacy_id == '7') {
                                        weight = 3;
                                      }
                                      if (dd.project_supervisor == '1') {
                                        if (project_current.supervisor_id == dd._id) {
                                          super_active = true;
                                          super_active_class = 'super-active';
                                          weight = 1;
                                        } else {
                                          super_inactive = true;
                                          super_inactive_class = 'super-inactive';
                                          weight = 4;
                                        }
                                      }
                                      recipients_jch.push({
                                        name: dd.first_name + ' ' + dd.last_name,
                                        first_name: dd.first_name,
                                        user_id: dd._id,
                                        user: users_data[dd._id],
                                        checked_email: checked_email,
                                        super_active: super_active,
                                        super_inactive: super_inactive,
                                        jeff: jeff,
                                        super_active_class: super_active_class,
                                        super_inactive_class: super_inactive_class,
                                        jeff_class: jeff_class,
                                        weight: weight,
                                        checked_mobile: checked_mobile,
                                        show_mobile: dd.mobile ? true : false
                                      });
                                    });
                                    recipients_jch = $._.sortBy(recipients_jch, 'weight');
                                    var in_list = [];
                                    var recipients_previous = [];
                                    var recipients_default = [];
                                    var recipients_companies = [];

                                    var company_ids = [];
                                    var company_processed = [];
                                    var company_categories = [];
                                    $._.forEach(data_math_projects, function (dd) {
                                      if (!in_array(company_ids, dd.company_id)) {
                                        if (!companies[dd.company_id].retired || (companies[dd.company_id].retired && dd.status == 'warranty')) {
                                          company_ids.push(dd.company_id);
                                          company_processed.push({
                                            _id: dd.company_id,
                                            title: companies[dd.company_id]
                                          });
                                        }
                                      }
                                      if (!$.lexxi.is_array(company_categories[dd.company_id])) {
                                        company_categories[dd.company_id] = [];
                                      }
                                      company_categories[dd.company_id].push(dd.category_id);
                                    });

                                    company_processed = $._.sortBy(company_processed, 'title');

                                    $._.forEach(company_processed, function (company) {
                                      var _recipients = [];
                                      // each employee of this company
                                      $._.forEach(company_users[company._id], function (user) {
                                        if (user) {
                                          if (!in_array(in_list, user._id)) {
                                            var checked_email = false;
                                            var checked_mobile = false;

                                            if (in_array(notifications_current_mobile, user._id)) {
                                              checked_mobile = 'checked';
                                            }

                                            in_list.push(user._id);

                                            if (user._id == req.body.user_id) {

                                              if (user.communication_email) {
                                                checked_email = 'checked';
                                              }
                                              if (user.communication_text) {
                                                checked_mobile = 'checked';
                                              }

                                              recipients_default.push({
                                                name: user.first_name + ' ' + user.last_name,
                                                company_name: company.title,
                                                company_id: company._id,
                                                category_name: trades_category_label(company_categories[company._id], trades_categories),
                                                user_id: user._id,
                                                user: users_data[user._id],
                                                checked_email: checked_email,
                                                checked_mobile: checked_mobile,
                                                show_mobile: user.mobile ? true : false
                                              });
                                            }
                                            if (
                                              in_array(math_users_tasks, user._id)
                                            ) {

                                              if (user.communication_email) {
                                                checked_email = 'checked';
                                              }
                                              if (user.communication_text) {
                                                checked_mobile = 'checked';
                                              }

                                              recipients_default.push({
                                                name: user.first_name + ' ' + user.last_name,
                                                company_name: company.title,
                                                company_id: company._id,
                                                category_name: trades_category_label(company_categories[company._id], trades_categories),
                                                user_id: user._id,
                                                user: users_data[user._id],
                                                checked_email: checked_email,
                                                checked_mobile: checked_mobile,
                                                jch_staff: req.body.group_id < 4 ? true : false,
                                                show_mobile: user.mobile ? true : false
                                              });
                                            } else {
                                              if (in_array(notifications_history, user._id)) {

                                                if (user.communication_email) {
                                                  checked_email = 'checked';
                                                }
                                                if (user.communication_text) {
                                                  checked_mobile = 'checked';
                                                }

                                                recipients_previous.push({
                                                  name: user.first_name + ' ' + user.last_name,
                                                  company_name: company.title,
                                                  company_id: company._id,
                                                  category_name: trades_category_label(company_categories[company._id], trades_categories),
                                                  user_id: user._id,
                                                  user: users_data[user._id],
                                                  checked_email: checked_email,
                                                  checked_mobile: checked_mobile,
                                                  jch_staff: req.body.group_id < 4 ? true : false,
                                                  show_mobile: user.mobile ? true : false
                                                });
                                              }
                                            }


                                            _recipients.push({
                                              name: user.first_name + ' ' + user.last_name,
                                              user_id: user._id,
                                              user: users_data[user._id],
                                              checked_email: checked_email,
                                              checked_mobile: checked_mobile,
                                              jch_staff: req.body.group_id < 4 ? true : false,
                                              show_mobile: user.mobile ? true : false
                                            });
                                          }
                                        }
                                      });
                                      recipients_companies.push({
                                        title: company.title,
                                        company_id: company._id,
                                        jch_staff: req.body.group_id < 4 ? true : false,
                                        category: trades_category_label(company_categories[company._id], trades_categories),
                                        staff: _recipients
                                      });
                                    });


                                    var date_scheduled_string = false;
                                    var date_scheduled_format = false;
                                    var checked_morning = false;
                                    var checked_afternoon = false;
                                    var checked_eob = false;
                                    var checked_specific = false;

                                    if (data_event) {
                                      if (data_event.date_scheduled) {
                                        date_scheduled_string = date('l M jS, Y', data_event.date_scheduled);
                                        date_scheduled_format = date("m/d/Y", data_event.date_scheduled);
                                        if (data_event.time_scheduled) {
                                          date_scheduled_string += ' (' + schedule_time_string(data_event.time_scheduled, data_event.time_specific) + ')';
                                          checked_morning = data_event.time_scheduled == 'morning' ? 'checked' : false;
                                          checked_afternoon = data_event.time_scheduled == 'afternoon' ? 'checked' : false;
                                          checked_eob = data_event.time_scheduled == 'eob' ? 'checked' : false;
                                          checked_specific = data_event.time_scheduled == 'specific' ? 'checked' : false;
                                        }
                                      }
                                    }

                                    var task_label = 'This task is not yet complete.';
                                    var task_class = 'incomplete';
                                    var task_status = false;

                                    if (data_task) {
                                      if (data_task.date_completed) {
                                        task_label = 'This task was marked as completed by ' + users_firstname[data_task.completed_uid] + ' on ' + date('M j, Y', data_task.date_completed) + ' at ' + date('g:ia', data_task.date_completed) + '.';
                                        task_class = 'complete';
                                        task_status = 'checked';
                                      }
                                    }

                                    var _files = [];
                                    $._.forEach(data_files, function (dd) {
                                      if (!$.lexxi.is_array(_files[dd.comment_id])) {
                                        _files[dd.comment_id] = [];
                                      }
                                      _files[dd.comment_id].push(dd);
                                    });

                                    var _log_message_read = [];
                                    $._.forEach(data_log_message_read, function (dd) {
                                      if (!$.lexxi.is_array(_log_message_read[dd.communication_id])) {
                                        _log_message_read[dd.communication_id] = [];
                                      }
                                      _log_message_read[dd.communication_id].push(dd);
                                    });

                                    var i = 0;
                                    var comments = [];
                                    var comment_latest = [];
                                    $._.forEach(data_discussion_comments, function (dd) {
                                      var files = [];
                                      $._.forEach(_files[dd._id], function (file) {

                                        var files_data = {
                                          file_id: file._id,
                                          file_url: 'https://s3.amazonaws.com/clickbuild/files/' + file.filename,
                                          title: file.title,
                                          filename: file.filename,
                                          owner: all_users[file.user_id],
                                          date: date("m/d/Y", file.date_added),
                                          can_view: req.body.group_id <= 2 ? true : false,
                                          time: date("h:ia", file.date_added)
                                        };

                                        var _filename = file.filename;
                                        var filename = _filename.toLowerCase();
                                        files_data.show_image = false;
                                        if (filename.indexOf('.jpg') > -1 || filename.indexOf('.gif') > -1 || filename.indexOf('.png') > -1 || filename.indexOf('.jpeg') > -1) {
                                          files_data.image_url = 'https://s3.amazonaws.com/clickbuild/files/' + file.filename;
                                          files_data.show_image = true;
                                        }

                                        files.push(files_data);
                                      });

                                      var seen_by = [];
                                      var ___i = 0;
                                      $._.forEach(_log_message_read[dd._id], function (_dd) {
                                        var _input = {
                                          name: all_users[_dd.user_id],
                                        };
                                        if (_dd.src == 'sms') {
                                          _input.icon = '<i class="ml1 fas fa-mobile-alt"></i>';
                                        }
                                        if (_dd.src == 'email') {
                                          _input.icon = '<i class="ml1 far fa-envelope"></i>';
                                        }
                                        if (___i == 0) {
                                          _input.first = true;
                                        }
                                        seen_by.push(_input);
                                        ___i++;
                                      });

                                      var comment_data = {
                                        files: files,
                                        body: linkifyHtml(dd.body, {
                                          target: {
                                            url: '_blank'
                                          }
                                        }),
                                        recipient_string: dd.recipient_string,
                                        date: date('M j Y - g:ia', dd.date),
                                        user: users_data[dd.user_id],
                                        user_href: '/profile/' + dd.user_id,
                                        seen_by: seen_by,
                                      };
                                      if (i == 0) {
                                        comment_latest.push(comment_data);
                                      } else {
                                        comments.push(comment_data);
                                      }
                                      i++;
                                    });

                                    var assigned_trade = false;
                                    var task_edit_href = false;
                                    var show_boilerplate_button = false;
                                    if (data_task) {
                                      if (data_task.trade_id) {
                                        assigned_trade = companies[data_task.trade_id];
                                      }
                                      if (data_task.template_task_id) {
                                        task_edit_href = '/task/edit/' + data_discussion.task_id + '/' + data_discussion.project_id;

                                        if (data_template_task.default_message && data_discussion_comments.length === 0) {
                                          show_boilerplate_button = true;
                                        }
                                      } else {
                                        task_edit_href = '/task/edit/' + data_discussion.task_id + '/' + data_discussion.project_id;
                                      }
                                    }

                                    var files_categories = [];
                                    $._.forEach(data_project_files, function (dd) {
                                      if (dd.category_id) {
                                        if (!$.lexxi.is_array(files_categories[dd.category_id])) {
                                          files_categories[dd.category_id] = [];
                                        }
                                        files_categories[dd.category_id].push(dd);
                                      }
                                    });

                                    var files_categories_final = [];
                                    $._.forEach(data_files_categories, function (category) {
                                      var project_files = [];
                                      $._.forEach(files_categories[category._id], function (file) {
                                        if (file) {
                                          project_files.push({
                                            file_id: file._id,
                                            title: file.title,
                                          });
                                        }
                                      });
                                      files_categories_final.push({
                                        title: category.title,
                                        category_id: category._id,
                                        project_files: project_files
                                      });

                                    });

                                    var project_url_warranty = false;
                                    if (project_current.status == 'warranty') {
                                      project_url_warranty = '/project/' + data_discussion.project_id + '/warranty';
                                    }

                                    var branch_task_schedule = false;
                                    var branch_task_start = false;
                                    var branch_task_complete = false;
                                    if (branch_master) {
                                      // console.log(data_branch_tasks);
                                      $._.forEach(data_branch_tasks, function (dd) {
                                        if (dd.date_completed) {
                                          dd.checked = 'checked';
                                          dd.label_class = 'o-50';
                                        }
                                        if (dd.branch_task_role == 'schedule') {
                                          branch_task_schedule = dd;
                                        }
                                        if (dd.branch_task_role == 'start') {
                                          if (dd.schedule_date) {
                                            dd.schedule_date_format = date("m/d/Y", dd.schedule_date);
                                          }
                                          branch_task_start = dd;
                                        }
                                        if (dd.branch_task_role == 'complete') {
                                          if (dd.schedule_date) {
                                            dd.schedule_date_format = date("m/d/Y", dd.schedule_date);
                                          }
                                          branch_task_complete = dd;
                                        }
                                      });
                                    }


                                    res.json({
                                      branch_master: branch_master,
                                      branch_task_schedule: branch_task_schedule,
                                      branch_task_start: branch_task_start,
                                      branch_task_complete: branch_task_complete,
                                      project_files_categories: files_categories_final,
                                      show_boilerplate_button: show_boilerplate_button,
                                      assigned_trade: assigned_trade,
                                      feed_id: feed_id,
                                      feed_likes_total: data_project_feed_likes.length,
                                      feed_comments_total: data_project_feed_comments.length,
                                      phase_move_list: data_phases_move,
                                      wormhole_list: wormhole_list,
                                      data: data_discussion,
                                      task: data_task,
                                      template_task: data_template_task,
                                      data_event: data_event,
                                      new: req.body.discussion_id == 'new' ? true : false,
                                      projects: projects,
                                      project_id: data_discussion.project_id,
                                      watch_list: data_math_watch_list.length > 0 ? true : false,
                                      task_id: data_discussion.task_id,
                                      task_label: task_label,
                                      task_class: task_class,
                                      task_status: task_status,
                                      task_edit_href: task_edit_href,
                                      can_view_edit: req.body.group_id <= 3 ? true : false,
                                      project_url: '/project/' + data_discussion.project_id,
                                      project_url_warranty: project_url_warranty,
                                      project_url_progress: '/project/' + data_discussion.project_id + '/progress',
                                      project_url_files: '/project/' + data_discussion.project_id + '/files',
                                      project_url_communication: '/project/' + data_discussion.project_id + '/communication',
                                      print_link_thread: data_discussion ? 'https://api.clickbuild.io/print-discussion/' + data_discussion._id : null,
                                      print_link_latest: data_discussion ? 'https://api.clickbuild.io/print-discussion/' + data_discussion._id + '/latest' : null,
                                      title: data_discussion.title ? data_discussion.title : "New Discussion",
                                      comments: comments,
                                      comment_latest: comment_latest[0],
                                      id: data_discussion._id,
                                      project_info: project_info_format(project_current),
                                      user_id: req.body.user_id,
                                      date_scheduled_string: date_scheduled_string,
                                      date_scheduled_format: date_scheduled_format,
                                      checked_morning: checked_morning,
                                      checked_afternoon: checked_afternoon,
                                      checked_eob: checked_eob,
                                      checked_specific: checked_specific,
                                      schedule_open: req.body.discussion_id == 'new' ? 'toggle' : false,
                                      recipients_previous: recipients_previous,
                                      recipients_default: recipients_default,
                                      recipients_companies: recipients_companies,
                                      recipients_jch: recipients_jch,
                                      service_order_url: data_discussion && data_task.phase_id == warranty_phase_id ? 'https://api.clickbuild.io/service-order/' + data_discussion.task_id : null,
                                      data_project: project_current,
                                      files_categories: data_files_categories
                                    });


                                    // if there are unread messages for this user, mark them as read
                                    models.math_discussions_inbox.find({ user_id: req.body.user_id, discussion_id: req.body.discussion_id, date_read: null }).lean().exec(function (err, data_discussions_inbox) {
                                      $._.forEach(data_discussions_inbox, function (dd) {
                                        models.math_discussions_inbox.update({ _id: dd._id }, {
                                          date_read: new Date,
                                        }).exec(function (err) {
                                          if (err) return $.lexxi.handle_error(err);
                                        });
                                      });
                                    });

                                  });
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });



          });



        });
      });
    });
  });
});





















// inbound webhook for processing email from mailgun
app.use('/api/discussion/mailgun-sync', function (req, res) {

  var incoming_message = req.body;

  var hash = incoming_message.recipient;
  hash = hash.replace('discussion-', '').replace('@notifications.clickbuild.io', '');

  var text = incoming_message['stripped-text'] ? email_reply_parse(incoming_message['stripped-text']) : '';

  if (text.fragments) {
    var body_rendered = text.fragments[0].content;
  } else {
    var body_rendered = '';
  }

  var email_alt = incoming_message['From'].split('<');
  var _email_alt = false;

  var sender_name = false;
  if (email_alt[1]) {
    if (typeof email_alt[1] !== 'undefined') {
      _email_alt = email_alt[1].replace('>', '');
      _sn = email_alt[0].split(' ');
      sender_name = {
        first: _sn[0].trim(),
        last: _sn[1].trim()
      };
    }
  }

  var email_primary = incoming_message.sender

  models.user.findOne({
    $or: [
      { email: email_primary.toLowerCase() },
      { email: _email_alt.toLowerCase() }
    ]
  }).lean().exec(function (err, data_user) {

    var user_id = false;
    if (data_user) {
      user_id = '' + data_user._id;
    } else {
      var nm = new models.user({
        email: _email_alt.toLowerCase(),
        first_name: sender_name.first,
        last_name: sender_name.last,
      });
      nm.save(function (err) {
        if (err) return $.lexxi.handle_error(err);
      });
      var user_id = '' + nm._id;
    }


    var regex_hash = new RegExp(hash, "i");

    models.discussion.findOne({ email_hash: regex_hash }).lean().exec(function (err, data_discussion) {

      if (!$._.isEmpty(data_discussion)) {

        if (body_rendered && body_rendered != '') {

          var input_communication = {
            body: body_rendered,
            body_raw: incoming_message['body-plain'],
            user_id: user_id,
            discussion_id: data_discussion._id,
            source: 'email',
            debug: JSON.stringify(incoming_message)
          };


          models.discussions_communication.findOne({ discussion_id: data_discussion._id, user_id: user_id, body: body_rendered }).lean().exec(function (err, data_discussion_communication) {
            if ($._.isEmpty(data_discussion_communication)) {
              var nm = new models.discussions_communication(input_communication);
              nm.save(function (err) {
                if (err) return $.lexxi.handle_error(err);
              });
              var comment_id = '' + nm._id;
              if (typeof incoming_message.attachments !== 'undefined') {

                $._.forEach(JSON.parse(incoming_message.attachments), function (file) {

                  var filename = file["name"];
                  var __filename = file["name"];
                  var ext = path.extname(filename);
                  var _filename = __filename.replace(/\.[^/.]+$/, "");
                  var filename_new = 'c-' + comment_id + '-' + $.lexxi.url_title(_filename) + ext;
                  var file_temp = $.__base + 'app/uploads/' + $.lexxi.url_title(_filename) + ext;
                  file_temp = file_temp.toLowerCase();
                  var file_size = file.size;

                  if (err) return $.lexxi.handle_error(err);
                  models.file.findOne({ filename: filename_new, comment_id: comment_id, date_added: { $gte: Date.now() } }).lean().exec(function (err, data_file_current) {

                    if ($._.isEmpty(data_file_current)) {

                      var _nm = new models.file({
                        filename: filename_new,
                        filename_raw: filename,
                        title: file["name"],
                        comment_id: comment_id,
                        user_id: user_id,
                        size: file_size,
                      });
                      _nm.save(function (err) {
                        if (err) return $.lexxi.handle_error(err);
                      });

                      var _file_url = file.url;
                      var file_url = str_replace("https://", "https://api:" + $.config.mailgun.key + "@", _file_url);

                      var _file = fs.createWriteStream(file_temp);
                      var _request = https.get(file_url, function (response) {
                        response.pipe(_file);
                        _file.on('finish', function () {
                          _file.close(function () {
                            s3.putFile(
                              file_temp,
                              '/files/' + filename_new,
                              { 'x-amz-acl': 'public-read', 'Content-Type': file["content-type"] },
                              function (err, res) {
                                if (err) return $.lexxi.handle_error(err);
                                fs.unlink(file_temp);
                              });
                          }); 

                        });
                      }).on('error', function (err) {
                        fs.unlink(file_temp);
                        if (err) return $.lexxi.handle_error(err);
                      });



                    }
                  });
                });

              }


              request.post({
                url: 'https://api.clickbuild.io/api/internal/discussion-notify',
                form: {
                  discussion_id: '' + data_discussion._id,
                  user_id: user_id,
                  message_content: body_rendered,
                  message_id: comment_id
                }
              }, function (error, response, body) {
              });
            }
          });

        } else {
          var input_communication = {
            body: body_rendered,
            body_raw: incoming_message['body-plain'],
            user_id: user_id,
            discussion_id: data_discussion._id,
            source: 'email',
            error: 'parse-error',
            debug: JSON.stringify(incoming_message)
          };

          var nm = new models.discussions_communication(input_communication);
          nm.save(function (err) {
            if (err) return $.lexxi.handle_error(err);
          });

        }
      } else {
        var input_communication = {
          body: body_rendered,
          body_raw: incoming_message['body-plain'],
          user_id: user_id,
          source: 'email',
          error: 'no-discussion',
          debug: JSON.stringify(incoming_message)
        };
        var nm = new models.discussions_communication(input_communication);
        nm.save(function (err) {
          if (err) return $.lexxi.handle_error(err);
        });

      }
    });
  });

  res.json({ success: true });

});

















// add or remove a discussion from a user's watch list

app.post('/api/discussion/watch-list', function (req, res) {

  var o = {
    success: true
  };

  res.json(o);

  if (req.body.action == 'add') {
    var nm = new models.math_discussions_watch_list({
      user_id: req.body.user_id,
      discussion_id: req.body.id
    });
    nm.save(function (err) {
      if (err) return $.lexxi.handle_error(err);
    });
  }

  if (req.body.action == 'remove') {
    models.math_discussions_watch_list.find({ discussion_id: req.body.id, user_id: req.body.user_id }).remove(function (err) {
      if (err) return $.lexxi.handle_error(err);
    });
  }

});










app.post('/api/discussion/confirm', function (req, res) {

  models.math_discussions_inbox.update({ message_id: req.body.message_id, user_id: req.body.user_id }, {
    date_confirmed: new Date,
  }).exec(function (err) {
    if (err) return $.lexxi.handle_error(err);
  });

  models.discussion.findOne({ _id: req.body.discussion_id }).lean().exec(function (err, data_discussion) {
    models.project.findOne({ _id: data_discussion.project_id }).lean().exec(function (err, data_project) {
      models.user.findOne({ _id: req.body.user_id }).lean().exec(function (err, data_user) {
        models.user.find().lean().exec(function (err, data_users) {

          var input_communication = {
            body: "* Message Confirmed",
            user_id: req.body.user_id,
            discussion_id: data_discussion._id,
            source: 'confirmation',
          };
          var nm = new models.discussions_communication(input_communication);
          nm.save(function (err) {
            if (err) return $.lexxi.handle_error(err);
          });

          var message = data_user.first_name + ' ' + data_user.last_name + ' has confirmed the latest message in <a href="https://clickbuild.io/discussion/' + req.body.discussion_id + '">' + data_discussion.title + '</a><br /><br />';

          message +=
            '<div style="border-top: 2px solid #ddd; padding: 15px 0;  color: #aaa; font-size: 110%;">' +
            'Project: <a style="color: #b72b24;" href="https://clickbuild.io/project/' + data_project._id + '">' + data_project.title + '</a> &nbsp;|&nbsp; Discussion: <a style="color: #b72b24;" href="https://clickbuild.io/discussion/' + req.body.discussion_id + '/latest">' + data_discussion.title + '</a>' +
            '</div>';

          models.math_discussions_notifications.find({ discussion_id: data_discussion._id, user_id: { $ne: req.body.user_id } }).lean().exec(function (err, data_notifications) {

            var to = [];

            to.push({
              email: 'jeff@clickbuild.io',
              name: 'Jeff Click',
              type: 'to'
            });

            email_send($, {
              to_object: to,
              from_email: 'cb@notifications.clickbuild.io',
              from_name: 'Clickbuild',
              subject: 'CB | Message Confirmed | ' + data_discussion.title,
              html: true,
              message: message,
            });

          });
        });
      });
    });
  });

  res.json({ success: true });

});









// move this task (and subsequently discussion) to this phase

app.post('/api/discussion/move', function (req, res) {

  models.task.update({ _id: req.body.task_id }, {
    phase_id: req.body.phase_id
  }).exec(function (err) {
    if (err) return $.lexxi.handle_error(err);
  });

  res.json({ success: true });

});































app.post('/api/discussion/confirm-log', function (req, res) {

  models.log_message_read.findOne({ communication_id: req.body.communication_id, user_id: req.body.user_id }).lean().exec(function (err, data_log) {
    if (!data_log) {
      var nm = new models.log_message_read({
        communication_id: req.body.communication_id,
        user_id: req.body.user_id,
        src: req.body.src
      });
      nm.save(function (err) {
        if (err) return $.lexxi.handle_error(err);
      });
    }
    res.json({

    });

  });
});




























