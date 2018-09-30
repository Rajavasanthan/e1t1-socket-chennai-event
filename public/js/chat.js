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

    $("#search-filter").keyup($.debounce(500, function (e) {
        if ((e.which <= 90 && e.which >= 48) || e.which == 8 || e.which == 46) {
            $.ajax({
                method: "GET",
                url: "/search_friends/" + this.value
            })
                .done(function (friendSearchResults) {
                    var friendListGenerator = "";
                    if (friendListGenerator !== 0) {


                        friendSearchResults.forEach(function (friend) {
                            console.log(friend.status);
                            var status = friend.status;
                            friendListGenerator += `<li class='contact' style='cursor:auto' id='search-${friend._id}'>
                            <div class='wrap'>
                                <span class='contact-status ${status}'></span>
                                <img src='${friend.userImage}' alt='' />
                                <div class='meta'>
                                    <p class='name'>${friend.fullName}</p>
                                    <p class='preview'>Lets Chat</p>
                                </div>`
                            if (friend.requestSent == 0) {
                                friendListGenerator += `<button class='btn btn-xs btn-danger' id='accept-${friend._id}' style='margin-top : 5px;' data-toggle='modal' data-user='" + friend.fullName + "' data-id='" + friend._id + "' onclick='addFriend("${friend._id}","${friend.fullName}")'>Add Friend</button>
                            <a class='btn btn-xs btn-default' style='visibility:hidden;' id='sent-${friend._id}' style='margin-top : 5px;'>Request Sent</a>`
                            } else {
                                friendListGenerator += `<a class='btn btn-xs btn-default' id='accept-${friend._id}' style='margin-top : 5px;'>Request Sent</a>`
                            }
                            friendListGenerator += `</div></li>`;
                        }, this);
                    }
                    $("#friends-search").html(friendListGenerator);
                })
                .fail(function (err) {
                    console.log(err);
                });
        }

    }));

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

    app.get('/accept_friend/:friendId', (req, res) => {
        User.findByIdAndUpdate(req.user._id, {
            $pull: {
                friendRequest: req.params.friendId
            },
            $push: {
                friends: req.params.friendId
            }
        })

            .then((currentUserUpdated) => {

                return User.findByIdAndUpdate(req.params.friendId, {
                    $pull: {
                        sentRequest: req.user._id
                    },
                    $push: {
                        friends: req.user._id
                    }
                })

                    .then((friendUserUpdated) => {
                        return { currentUserUpdated, friendUserUpdated };
                    });
            })
            .then((updatedResult) => {
                return User.findById(req.user._id)
                    .populate('friends')
                    .populate('friendRequest')
                    .then((currentUser) => {
                        return currentUser
                    });
            }).then((currentUser) => {
                return User.findById(req.params.friendId)
                    .populate('friends')
                    .populate('friendRequest')
                    .then((friendUser) => {
                        return { currentUser, friendUser }
                    });
            })
            .then((updatedResult) => {
                console.log(updatedResult);
                io.to(updatedResult.currentUser.socketId).emit('userList', updatedResult.currentUser.friends);
                io.to(updatedResult.currentUser.socketId).emit('newFriendRequest', updatedResult.currentUser.friendRequest);

                io.to(updatedResult.friendUser.socketId).emit('userList', updatedResult.friendUser.friends);
                io.to(updatedResult.friendUser.socketId).emit('newFriendRequest', updatedResult.friendUser.friendRequest);
                res.json('Success');
            })
            .catch((err) => {
                console.log(err);
            });


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



function newMessage() {
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

function addFriend(friendId, friendName) {
    console.log(friendName);
    console.log(friendId);
    if (confirm('Do you want to send request')) {
        $.ajax({
            method: "GET",
            url: "/add_friend/" + friendId
        })
            .done(function (friendReqSentData) {
                $("#accept-" + friendId).css('display', 'none');
                $("#sent-" + friendId).css('visibility', 'visible');
                console.log(friendReqSentData);
            })
            .fail(function (err) {
                console.log(err);
            });
    }
}

function acceptFriend(friendId, friendName) {
    if (confirm('Do you want to Accept?')) {
        $.ajax({
            method: "GET",
            url: "/accept_friend/" + friendId
        })
            .done(function (friendAcceptData) {

                console.log(friendAcceptData);
            })
            .fail(function (err) {
                console.log(err);
            });
    }
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