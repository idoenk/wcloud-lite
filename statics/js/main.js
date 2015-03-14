var PVT = PVT||{};
function _clog(x){console && console.log && console.log(x)}

$(function(){
  // scan for disabledbox
  var maxh = 0;
  $('.disabledbox').each(function(){
    var $me = $(this), mH = parseFloat($me.height());

    if( maxh===0 || (maxh < mH) )
      maxh = mH;

    $me.find('.btn').attr('href', 'javascript:;').click(function(e){ e.preventDefault() });
  });
  $('.disabledbox').css('min-height', maxh);

  // footer resizer
  var winH = $(window).height();
  if( $('body').height() < winH ){
    $('body').height(winH)
    $('.footer').addClass('fixed');
  }
  else{
    $('.footer').removeClass('fixed');
  }
  $('html').removeClass('no-js');
  $('a[href*=#]').each(function(){
    $(this).click(function(e){ e.preventDefault() })
  })
});
