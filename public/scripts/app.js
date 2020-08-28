//socket.on event handler on the client. Client1 will receive the msg from the server jquery to get the list of msg then append msg to the chat box

$(function() {
  let socket = io();
  $('.msg-text').submit(function(e) {
    let timeNow = new Date().toLocaleString();
    e.preventDefault();
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

  // click event linking to message the seller
  $('.message-owner').click(function() {
    const owner_id = $(this).attr("id")
    const roomName = `room${owner_id}`
    window.location.replace("http://localhost:8080/message")
    socket.emit('room', { room: roomName });
  })
});

