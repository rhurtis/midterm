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

//socket io stuff in here client side (catch side msgs coming from the sever, once its caught, then update the chatbox)


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

//socket io stuff in here client side (catch side msgs coming from the sever, once its caught, then update the chatbox)


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
    //author: would be going through the database for users email, will change when we have it so we can use template vars
    //if and else statement, if username = myusername addclass, if not, other msg and name first person differly than the second person
    //put users put it into the dom, use jquery to grab the username from where it is stored
    $('#msg').val('');
    return false;
  })
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
        </div>`);

  });

