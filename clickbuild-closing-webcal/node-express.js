
app.get('/calendar/closing-completion', function (req, res) {

  var events_list = '';
  var date_init = mutate_date(strtotime(date('M') + ' 1, ' + date('Y')));
  models.project.find({
    status: 'active',
    $or: [
      { date_closing: { $gte: date_init } },
      { date_closing: null, status: { $ne: 'complete' } },
      { date_walk: { $gte: date_init } }
    ]
  }).sort({ date_walk: 1, date_closing: 1 }).exec(function (err, data_projects) {

    $._.forEach(data_projects, function (dd) {

      var url = 'https://clickbuild.io/project/' + dd._id;

      if (dd.date_closing) {
        var title = 'Closing: ' + dd.title;
        var description = dd.closing_notes;
        var date_day = date("m/d/Y", dd.date_closing);
        if (dd.time_closing) {
          var dates = '\rDTSTART:' + get_ical_date(strtotime(date_day + ' ' + time_24hr(dd.time_closing)));
        } else {
          title += ' (time TBA)';
          var dates = '\rDTSTART:' + get_ical_date(moment(dd.date_closing).hour(9).minute(0).unix()) + '\rDTEND:' + get_ical_date(moment(dd.date_closing).hour(17).minute(0).unix());
        }
        events_list += 'BEGIN:VEVENT\rUID:' + uniqid() +
          '\rDTSTAMP:' + date_to_cal(strtotime(date('M') + ' ' + date('d') + ', ' + date('Y'))) + '\rDESCRIPTION:' + escape_string(description) +
          '\rURL;VALUE=URI:' + escape_string(url) + '\rSUMMARY:' + escape_string(title) + dates +
          '\rEND:VEVENT\r';
      }

      if (dd.date_walk) {
        var title = 'Complete: ' + dd.title;
        var description = dd.closing_notes;
        var date_day = date("m/d/Y", dd.date_walk);
        if (dd.time_walk) {
          var dates = '\rDTSTART:' + get_ical_date(strtotime(date_day + ' ' + time_24hr(dd.time_walk)));
        } else {
          title += ' (time TBA)';
          var dates = '\rDTSTART:' + get_ical_date(moment(dd.date_walk).hour(9).minute(0).unix()) +
            '\rDTEND:' + get_ical_date(moment(dd.date_walk).hour(17).minute(0).unix());
        }
        events_list += 'BEGIN:VEVENT\rUID:' + uniqid() +
          '\rDTSTAMP:' + date_to_cal(strtotime(date('M') + ' ' + date('d') + ', ' + date('Y'))) + '\rDESCRIPTION:' + escape_string(description) +
          '\rURL;VALUE=URI:' + escape_string(url) + '\rSUMMARY:' + escape_string(title) + dates +
          '\rEND:VEVENT\r';
      }
    });

    res.header('Content-Type', 'text/calendar; charset=utf-8');
    res.header('Content-Disposition', 'attachment; filename=jch-closing-completion');
    res.render('static/calendar', {
      layout: false,
      events_list: events_list
    });

  });
});










function date_to_cal(time) {
  var o = date('Ymd', time) + 'T' + date('His', time) + 'Z';
  return o;
}

function get_ical_date(time) {
  var o = date('Ymd', time) + 'T' + date('His', time);
  return o;
}

function escape_string(string) {
  if (string == null || string == 'undefined') {
    return '';
  } else {
    return string.replace('/([\,;])/', '\\\$1');
  }
}

function mutate_date(date) {
  if (date) {
    var o = new Date(date * 1000);
    return o;
  } else {
    return null;
  }
}

function time_24hr(time) {
  var hours = parseInt(time.substr(0, 2));
  if (time.indexOf('am') != -1 && hours == 12) {
    time = time.replace('12', '0');
  }
  if (time.indexOf('pm') != -1 && hours < 12) {
    time = time.replace(hours, (hours + 12));
  }
  return time.replace(/(am|pm)/, '');
}