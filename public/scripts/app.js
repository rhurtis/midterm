
// $(() => {
//   // $.ajax({
//   //   method: "GET",
//   //   url: "/api/users"
//   // }).done((users) => {
//   //   for (user of users) {
//   //     $("<div>").text(user.name).appendTo($("body"));
//   //   }
//   // });;
// });

//socket.on event handler on the client, receive th msg from the server jquery to get the list of msg then append msg to the chat box

$(function() {
  let socket = io();
  $('form').submit(function(e) {
    let timeNow = new Date().toLocaleString();
    e.preventDefault();
    // console.log("window.author", window.author)
    socket.emit('chat message', { msg: $('#msg').val(), author: window.author });
    $('.message').append(`<div class="message-row you-message">
              <div class="message-title">
                🚙 <span>${window.author}</span>
              </div>
              <div class="message-text">
                ${$('#msg').val()}
              </div>
              <div class="message-time">
                ${timeNow}
              </div>`)
    $('#msg').val('');
    return false;
  })

  socket.on('new message', function(msg) {
    console.log("msg", msg)
    let timeNow = new Date().toLocaleString();
    $('.message').append(`<div class="message-row other-message">
          <div class="message-title">
            🚗 <span> ${msg.author} </span>
          </div>
          <div class="message-text">
            ${msg.msg}
              </div>
          <div class="message-time">
            ${timeNow}
              </div>
        </div>`)
    return false;
  });
});
