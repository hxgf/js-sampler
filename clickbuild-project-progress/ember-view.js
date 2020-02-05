import Ember from 'ember';
import AfterRender from 'clickbuild/mixins/after-render';

export default Ember.View.extend(AfterRender, {

  afterRenderEvent: function () {

    if ($(".datepicker").length > 0) {
      $(".datepicker").each(function () {
        new Kalendae.Input(this, {});
      }).promise().done(function () {
      });
    }

    var ths = this;
    $("input[name='k']").on('keyup', function (e) {
      if (e.keyCode == 13) {
        window.location.href = window.location.href = '/project/' + $("#project_id").val() + '/search-communication/' + encodeURIComponent($("input[name='k']").val());
      }
    });

    $(document).bind('DOMNodeInserted', function (event) {
      if ($(event.target).hasClass('smoke-datepicker')) {
        $($(".smoke-datepicker input")).kalendae();
      }
    });

    $('.tip').tipr({ 'mode': 'left' });

  }
});
