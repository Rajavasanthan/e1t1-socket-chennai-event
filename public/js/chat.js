var socket = io();
$(document).ready(function () {
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
})