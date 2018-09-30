var socket = io();
$(document).ready(function () {

    $("#welcome-screen").css('display', 'block');
    $("#chat-screen").css('display', 'none');
    $("#chat-screen-loading").css('display', 'none');


    socket.on('connect', function () {
        console.log("Connected");
    });
    var name = "Person 1"
    // var a = "Hello " + name;

    // var a = `Hello ${name}`;

    socket.on('userList', function (friendList) {
        var friendListGenerator = "";
        friendList.forEach(function (friend) {
            var status = friend.status;
            friendListGenerator += `<li class='contact' id='user-${friend._id}' onclick='getMessages("${friend._id}","${friend.fullName}","${friend.userImage}")'>
                <div class='wrap'>
                    <span class='contact-status ${status}'></span>
                    <img src='${friend.userImage}' alt='' />
                    <div class='meta'>
                        <p class='name'>${friend.fullName}</p>
                        <p class='preview'>Lets Chat</p>
                    </div>
                </div>
                </li>`;
            $("#search-" + friend._id).remove();
        }, this);

        $("#friends-list").html(friendListGenerator);
    });


    socket.on('newFriendRequest', function (friendRequest) {
        console.log(friendRequest);
        var friendRequestListGenerator = "";
        if (friendRequest.length !== 0) {

            friendRequest.forEach(function (friend) {
                var status = friend.status;
                friendRequestListGenerator += `<li class='contact' style='cursor:auto' id='request-${friend._id}'>
            <div class='wrap'>
            <span class='contact-status ${status}'></span>
            <img src='${friend.userImage}' alt='' />
            <div class='meta'>
            <p class='name'>${friend.fullName}</p>
            </div>
            <button class='btn btn-xs btn-success' style='margin-top : 5px;' data-toggle='modal' data-user='${friend.fullName}' data-id='${friend._id}' onclick='acceptFriend("${friend._id}","${friend.fullName}")'>Accept</button>
            &nbsp;
            <button class='btn btn-xs btn-danger' style='margin-top : 5px;' data-toggle='modal' data-user='${friend.fullName}' data-id='${friend._id}' onclick='rejectFriend("${friend._id}","${friend.fullName}")'>Reject</button>
            </div>
            </li>`;

            }, this);
        }

        $("#friend-request").html(friendRequestListGenerator);

    });

    socket.on('newMessageRecived', function (message) {
        populateMessage(message);
    });

    socket.on('newMemberOnline', function (friend) {
        console.log("newMemberOnline");
        $("#user-" + friend._id + " > .wrap > span").removeClass('Offline');
        $("#user-" + friend._id + " > .wrap > span").addClass('Online');
    });

    socket.on("newMemberOffline", function (friend) {
        console.log("newMemberOnline")
        $("#user-" + friend._id + " > .wrap > span").removeClass('Online');
        $("#user-" + friend._id + " > .wrap > span").addClass('Offline');
    });

    $('.submit').click(function () {
        newMessage();
        return false;
    });
    
    $(window).on('keydown', function (e) {
        if (e.which == 13) {
            newMessage();
            return false;
        }
    });
})

function displayMessage(message) {
    if ($("#current-friend-id").val() == message.sentBy._id) {
        var msgType = "sent";
        var image = message.sentBy.userImage;
    } else {
        var msgType = "replies";
        var image = message.sentBy.userImage;
    }
    $('<li class="' + msgType + '"><img src="' + image + '" alt="" /><p>' + message.message + '</p></li>').appendTo($('.messages ul'));
    $('#message').val(null);
    $('.contact.active .preview').html('<span>You: </span>' + message);
    console.log($(document).height());
    $(".messages").animate({ scrollTop: 999999 }, "fast");
}

function populateMessage(messageData) {
    console.log(messageData);
    if (messageData.length == undefined) {
        displayMessage(messageData);
    } else {
        messageData.forEach(function (message) {
            displayMessage(message);
        }, this);

    }
}



function newMessage(){
    if ($.trim(message) == '') {
        return false;
    }

    socket.emit('newMessage', {
        to: $("#current-friend-id").val(),
        message: $("#message").val()
    }, function (confirmation) {
        populateMessage(confirmation);
    });
}

function getMessages(friendId, friendFullName, friendImage) {
    $("#chat-screen").css('display', 'none');
    $("#friend-image").attr('src', friendImage);
    $("#friend-name").html(friendFullName);
    $("#current-friend-id").val(friendId);

    $("#welcome-screen").css('display', 'none');
    $("#chat-screen-loading").css('display', 'block');

    $.ajax({
        method: "GET",
        url: "/get_msg_by_friendid/" + friendId
    })
        .done(function (messages) {
            $("#chat-screen").css('display', 'block');
            $("#chat-screen-loading").css('display', 'none');
            $('#message-list').empty();
            populateMessage(messages);
            console.log(messages);
        })
}