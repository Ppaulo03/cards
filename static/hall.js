//server contact functions
function formCreate(e, ) {
    if (e.preventDefault) e.preventDefault();
    var player = document.getElementById("name_create").value;

    axios.post('/createRoom', { player }).then((r) => {
        window.location.replace('/game?room=' + r.data + "&id=1")
    });
    return false;
}

function formEnter(e) {
    if (e.preventDefault) e.preventDefault();
    var player = document.getElementById("name").value;
    var room = document.getElementById("room").value;

    axios.post('/enterRoom', { player, room }).then((r) => {

        r.data = r.data + "";
        console.log(r.data)
        if (r.data == "Room not Found") {
            document.getElementById("notFound").textContent = "Room not Found"
        }

        else if (r.data == "In game") {
            document.getElementById("notFound").textContent = "Room already in game"
        }

        else if (r.data.indexOf("Reconnect:") != -1) {
            if (confirm("Reconnect Existing Player?")) {
                var reconnect_id = r.data;
                reconnect_id = reconnect_id.replace("Reconnect:", "");
                window.location.replace('/game?room=' + room + "&id=" + reconnect_id)
            } else
                document.getElementById("notFound").textContent = "Name Unavailable"
        }
        else if (r.data == "Maxed") {
            document.getElementById("notFound").textContent = "Room already Full"
        }

        else {
            window.location.replace('/game?room=' + room + "&id=" + r.data)
        }

    });

    return false;
}


const form_create = document.getElementById('createRoom');
if (form_create.attachEvent) {
    form_create.attachEvent("submit", formCreate);
} else {
    form_create.addEventListener("submit", formCreate);
}

const form_enter = document.getElementById('enterRoom');
if (form_enter.attachEvent) {
    form_enter.attachEvent("submit", formEnter);
} else {
    form_enter.addEventListener("submit", formEnter);
}

//Page management functions
function goBack() {
    document.getElementById("b1").hidden = false;
    document.getElementById("b2").hidden = false;
    document.getElementById("enterRoom").hidden = true;
    document.getElementById("createRoom").hidden = true;
}

function enterRoom() {
    document.getElementById("b1").hidden = true;
    document.getElementById("b2").hidden = true;
    document.getElementById("createRoom").hidden = true;
    document.getElementById("enterRoom").hidden = false;

}

function createRoom() {
    document.getElementById("b1").hidden = true;
    document.getElementById("b2").hidden = true;
    document.getElementById("enterRoom").hidden = true;
    document.getElementById("createRoom").hidden = false;
}