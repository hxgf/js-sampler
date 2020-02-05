import Ember from 'ember';
import AfterRender from 'clickbuild/mixins/after-render';

export default Ember.View.extend(AfterRender, {
  afterRenderEvent: function () {

    if ($(".branch-task-schedule").length) {
      $(".branch-task-schedule input").on('blur', function (e) {
        $(".branch-task-schedule-save").removeClass('dn');
      });
    }

    if ($(".datepicker").length > 0) {
      $(".datepicker").each(function () {
        new Kalendae.Input(this, {});
      }).promise().done(function () {
      });
    }

    var p1 = this.get('container').lookup('router:main').router.state.params.discussion.p1;
    var discussion_id = this.get('container').lookup('router:main').router.state.params.discussion.discussion_id;

    $('.tip').tipr({ 'mode': 'top' });

    if (p1 == 'latest') {
      if ($("#latest").length > 0) {
        $(window).scrollTop($('#latest').position().top);
      }
    }

    if (p1 == 'respond') {
      $(window).scrollTop($('#respond').position().top);
    }

    if (p1 == 'watch-list-add' || p1 == 'watch-list-remove') {
      if (p1 == 'watch-list-add') {
        var message = 'Added to watch list';
        var action = 'add';
        $("input[name='watch_list']").val('true');
        $("#watch-list-link").html('<i class="remove sign icon"></i>Remove from my watch list');
      } else {
        if (p1 == 'watch-list-remove') {
          var message = 'Removed from watch list';
          var action = 'remove';
          $("input[name='watch_list']").val('false');
          $("#watch-list-link").html('<i class="add sign icon"></i>Add to my watch list');
        }
      }
      utility.api_request({
        endpoint: 'discussion/watch-list',
        data: {
          id: discussion_id,
          action: action
        },
        callback: function (data) {
          smoke.alert(message);
        }
      });
    }

  
    $(".staff-recipients input[type='checkbox']").on('change', function (e) {
      if ($(this).parents('li').hasClass('jeff') && $(this).is(':checked')) {
        var ths = this;
        ths.checked = false;
        smoke.confirm("Are you sure it is necessary to include Jeff on this message?", function (e) {
          if (e) {
            ths.checked = true;
          }
        }, {
          reverseButtons: true
        });
      }
      if ($(this).parents('li').hasClass('super-inactive') && $(this).is(':checked')) {
        var name = $(this).data('firstname');
        var ths = this;
        ths.checked = false;
        smoke.confirm(name + "is not actively involved in this process. Are you sure it is necessary to include them on this message?", function (e) {
          if (e) {
            ths.checked = true;
          }
        }, {
          reverseButtons: true
        });
      }
    });


    $(".expander-link").on('click', function (e) {
      if ($(this).hasClass('active')) {
        $(this).removeClass('active');
        $(this).next('.recipient-list-container').removeClass('visible');
      } else {
        $(this).addClass('active');
        $(this).next('.recipient-list-container').addClass('visible');
      }
    });

    $(".check-unique input[type='checkbox']").on('change', function (e) {
      if ($(this).is(':checked')) {
        $("input[value='" + $(this).val() + "'][name='" + $(this).attr('name') + "']")[0].checked = true;
      } else {
        $("input[value='" + $(this).val() + "'][name='" + $(this).attr('name') + "']").attr("checked", false);
      }
    });

  }
});
