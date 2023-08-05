
let socket;

function createRoom() {

    socket = io();
    socket.emit("createRoom", (r) => {
        console.log(r);
        window.location.href = 'http://localhost:8080/arena/' + r;
    });
}

function joinRoom() {
    let roomInput = prompt("enter room id: ")
    if (!roomInput) return
    socket = io();
    socket.emit("joinRoom", {roomId: roomInput}, (r) => {
        if (r.error) {
            alert(r.message)
        }
        else {
            window.location.href = 'http://localhost:8080/arena/' + roomInput;
        }
    })
    
}