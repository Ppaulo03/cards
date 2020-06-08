// User Info - Room and Id
const room = document.getElementById("room-number").getAttribute("value");
const value_id = document.getElementById("id-player").getAttribute("value");

//console_chat
const consol_chat = document.getElementById('msg_console');

// Lobby elements
const chat = document.getElementById('msg');
const lista = document.getElementById('players');

// Ingame elements
const lista_ordem = document.getElementById('order');
const hand_cards = document.getElementById("Hand");
const monte = document.getElementById("monte");
const mesa = document.getElementById("mesa");
// Variables

var turn = false;
var buying = false;
var lobbying = true;
var buy_again = true;
var special = false;

var msg_index = 0;
var pos = 0;
var player_turn = [null, null];


document.addEventListener('keypress', function (e) {
    if (e.key == "Enter") {

        if (lobbying) {
            if (document.getElementById("message").value != "")
                sendMsg('chat');
        }

        else {
            if (document.getElementById("message_console").value == "")
                document.getElementById("Console").hidden = !document.getElementById("Console").hidden;
            else
                sendMsg('console');
        }
    }
}, false);


const poll = async ({ fn, interval, maxAttempts }) => {
    let attempts = 0;

    const executePoll = async (resolve, reject) => {
        const result = await fn();
        attempts++;
        if (maxAttempts && attempts === maxAttempts) {
            return reject(new Error('Exceeded max attempts'));
        } else {
            setTimeout(executePoll, interval, resolve, reject);
        }
    };
    return new Promise(executePoll);
};

function getInfo() {
    axios.post('http://127.0.0.1:5000/getRoom', { room }).then((r) => {

        if (r.data == 'NoRoom' || r.data.id[value_id] == undefined) {
            window.location.replace('http://127.0.0.1:5000/')
        }

        else {

            while (msg_index < r.data.chat.length) {
                var msg_tag = document.createElement('P');
                var msg_consol = document.createElement('P');

                msg_tag.innerHTML = r.data.chat[msg_index];
                msg_consol.innerHTML = r.data.chat[msg_index];

                chat.appendChild(msg_tag);
                consol_chat.append(msg_consol);

                consol_chat.scrollTop = consol_chat.scrollHeight;
                chat.scrollTop = chat.scrollHeight;

                msg_index += 1;
                msg_tag = null;
                msg_consol = null;
            }

            if (lobbying) {

                if (Object.keys(r.data.id).length != lista.children.length) {
                    lista.innerHTML = ""
                    Object.entries(r.data.id).forEach(element => {
                        var item_player = document.createElement('li');
                        item_player.setAttribute("id", "player" + element[0]);
                        item_player.innerHTML = element[1];
                        if (value_id == element[0]) {
                            item_player.style.fontWeight = 'bold';
                        }
                        lista.appendChild(item_player);
                        item_player = null;
                    });
                }

                if (r.data.playing) {
                    lobbying = false;
                    setTimeout(function () {

                        document.getElementById("Looby").hidden = true;
                        document.getElementById("InGame").hidden = false;

                    }, 900);
                    reorganize(r.data);
                    put_order(r.data);
                    refresh_monte(r.data);
                }
            }

            else if (r.data.winner[0]) {
                axios.post('http://127.0.0.1:5000/gameReset', { room })
                if (r.data.winner[1] == value_id) {
                    window.alert("Parabéns, você venceu!!");
                }
                else {
                    window.alert(r.data.id[r.data.winner[1]] + " venceu a partida!!")
                }
                document.getElementById("message_console").value = "";
                document.getElementById("Console").hidden = true;
                document.getElementById("Looby").hidden = false;
                document.getElementById("InGame").hidden = true;
                lobbying = true;
            }

            else {

                if (lista_ordem.children.length != r.data.order.length) put_order(r.data);
                if (monte.length != r.data.monte.length) refresh_monte(r.data);
                if (hand_cards.length != r.data.hands.length) reorganize(r.data);

                if (player_turn[1] != r.data.turn[1] || player_turn[2] != r.data.turn[2]) {

                    var new_mesa = r.data.mesa[r.data.mesa.length - 1];
                    mesa.src = './static/img/' + new_mesa[1] + new_mesa[2] + ".png";
                    mesa.alt = 'Carta ' + new_mesa[1] + " " + new_mesa[2];
                    mesa.name = new_mesa[1] + "," + new_mesa[2];
                    new_mesa = null;

                    if (r.data.turn[1] == value_id) {
                        turn = true;
                    }
                    player_turn = r.data.turn

                    Object.entries(r.data.order).forEach(element => {
                        var player_li = document.getElementById("player_ordem" + element[1][1]);
                        if (r.data.turn[1] == parseInt(element[1][1])) player_li.style.color = "#f00";
                        else player_li.style.color = "#fff";

                        var qtd_cards = document.getElementById("player_ordem_numcards" + element[1][1]);
                        qtd_cards.innerText = " X" + r.data.hands[parseInt(element[1][1])].length;
                        qtd_cards.style.fontSize = "1.2vw";
                    });

                    if (r.data.stack != null) {

                        var cont = 1;
                        Object.entries(lista_ordem.children).every(element => {
                            if (element[1].id == 'player_ordem' + player_turn[1]) {
                                return false;
                            }
                            cont += 1;
                            return true;
                        });
                        console.log(cont)
                        if (cont != value_id) {
                            if (r.data.stack[0] == 'mais2')
                                animationMais(r.data.stack[1] * 2, cont);
                        }
                        else {
                            if (r.data.stack[0] == 'mais2') {
                                special = true;
                                buyCard();
                                buyCard();
                                special = false;
                                axios.post('http://127.0.0.1:5000/pass', { room, value_id })
                            }
                        }

                        cont = null;
                    }

                }
            }
        }
    })
}

function animationMais(stacks, loc) {
    var chegou = false;
    var img = document.createElement('img');
    img.src = './static/img/verso.png';
    img.style.position = "absolute";
    img.style.top = "-9vw";
    img.style.left = "40vw";
    document.getElementById("subdiv_gaming").append(img);

    var cont = [-9, 80, 1]
    var left = -1;
    var top = 1;
    var scale = -0.05;
    var inter = setInterval(frame, 5);

    var time = 1;

    function frame() {
        if (chegou) {
            if (time == stacks) {
                img.remove();
                clearInterval(inter);
            }
            else {
                img.style.top = "-9vw";
                img.style.left = "40vw";
                img.style.transform = 'scale(1)';
                cont = [-9, 80, 1];
                time += 1;
                chegou = false;
            }
        } else {
            if (cont[2] > 0.2) {
                cont[2] = cont[2] + scale;
                img.style.transform = "scale(" + cont[2] + ')';
            }

            if (cont[0] < (-7.6 + (loc * 1.6))) {
                cont[0] = cont[0] + top;
                img.style.top = cont[0] + "vw";
            }
            if (cont[1] > 10) {
                cont[1] = parseFloat(cont[1]) + left;
                img.style.left = cont[1] + "vw";
            }
            else
                chegou = true;
        }

    }
}

function reorganize(data) {
    pos = 0;
    if (data.hands[value_id].length < 12) var som_hand = 3.5;
    else if (data.hands[value_id].length < 20) var som_hand = 2.5;
    else var som_hand = 1.5;
    hand_cards.innerHTML = "";
    Object.entries(data.hands[value_id]).forEach(element => {

        var card_hand = document.createElement('div');
        card_hand.id = "ordem_cards: " + element[0];
        card_hand.name = element[1][1] + "," + element[1][2];

        card_hand.classList.add("cards");
        card_hand.style.background = 'url(./static/img/' + element[1][1] + element[1][2] + ".png)";
        card_hand.style.backgroundSize = "100% 100%";
        card_hand.style.backgroundRepeat = "no - repeat";

        card_hand.style.left = pos + "vw";
        pos += som_hand;


        card_hand.onclick = selectCard;
        hand_cards.appendChild(card_hand);
        card_hand = null;
    })
    som_hand = null;
    buying = data.buying;
    if (!data.buying) {
        hand_cards.children[hand_cards.children.length - 1].setAttribute("data-bought", "bought");
        Object.entries(hand_cards.children).forEach(e => {
            if (e[1].getAttribute("data-bought") != "bought")
                e[1].style.background = "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7))," + e[1].style.background
        });
    }
}

function refresh_monte(data) {
    monte.innerHTML = "";
    var mont_pos = 0;
    Object.entries(data.monte).forEach(element => {
        var card_mont = document.createElement('img');
        card_mont.id = "ordem_mont: " + element[0];
        card_mont.name = element[1][1] + "," + element[1][2];
        card_mont.src = './static/img/verso.png';
        card_mont.style.position = 'absolute';
        card_mont.style.top = mont_pos + "vw";
        if (mont_pos < 2.5) {
            mont_pos += 0.5;
        }
        monte.appendChild(card_mont);
        card_mont = null;
    })
    mont_pos = null;

    Object.entries(data.order).forEach(element => {
        var player_li = document.getElementById("player_ordem" + element[1][1]);
        if (data.turn[1] == parseInt(element[1][1])) player_li.style.color = "#f00";
        else player_li.style.color = "#fff";

        var qtd_cards = document.getElementById("player_ordem_numcards" + element[1][1]);
        qtd_cards.innerText = " X" + data.hands[parseInt(element[1][1])].length;
        qtd_cards.style.fontSize = "1.2vw";
    });
}

function put_order(data) {
    lista_ordem.innerHTML = "";
    Object.entries(data.order).forEach(element => {
        var player_li = document.createElement('li');
        player_li.setAttribute("id", "player_ordem" + element[1][1]);
        player_li.innerHTML = element[1][0];

        if (data.turn[1] == parseInt(element[1][1])) player_li.style.color = "#f00";
        else player_li.style.color = "#fff";
        if (parseInt(element[1][1]) == value_id) player_li.style.fontWeight = "bold";

        var img_cardVerso = document.createElement('img');
        img_cardVerso.src = './static/img/verso.png';
        img_cardVerso.classList.add("conterCards");
        player_li.appendChild(img_cardVerso);
        img_cardVerso = null;

        var qtd_cards = document.createElement('span');
        qtd_cards.setAttribute("id", "player_ordem_numcards" + element[1][1]);
        qtd_cards.innerText = " X" + data.hands[parseInt(element[1][1])].length;
        qtd_cards.style.fontSize = "1.2vw";
        player_li.append(qtd_cards);

        lista_ordem.appendChild(player_li);
    })
}

function sendMsg(plat) {

    if (plat == 'chat') {
        var msg_txt = document.getElementById("message").value;
        if (msg_txt != "") {
            document.getElementById("message").value = "";
            axios.post('http://127.0.0.1:5000/chat', { room, value_id, msg_txt });
        }
    }
    else {
        var msg_txt = document.getElementById("message_console").value;
        if (msg_txt != "") {
            document.getElementById("message_console").value = "";
            axios.post('http://127.0.0.1:5000/chat', { room, value_id, msg_txt });
        }
    }
    msg_txt = null;
}

function beginGame() {
    axios.post('http://127.0.0.1:5000/play', { room }).then((r) => {

        if (r.data == "Few Players") {
            document.getElementById("fewPlayers").textContent = "Min. of 2 Players";
        } else {
            document.getElementById("fewPlayers").textContent = "";
        }

    })
}

function selectCard(ev) {
    if (turn) {
        console.log(buying, ev)
        if (buying || ev.target.getAttribute("data-bought") == "bought") {
            var card_name = ev.target.name.split(",")
            var card_mesa_name = mesa.name.split(",");
            if (card_name[0] == card_mesa_name[0] || card_name[1] == card_mesa_name[1]) {
                turn = false;
                var ordenacao = ev.target.id.split("ordem_cards: ").pop(0)
                axios.post('http://127.0.0.1:5000/putCard', { ordenacao, room, value_id });
                axios.post('http://127.0.0.1:5000/getRoom', { room }).then((r) => reorganize(r.data));
                ev.target.remove();
                ordenacao = null;
            }
            card_name = null;
            card_mesa_name = null;
        }
    }

}

function buyCard() {
    if (special) {
        buy_again = true;
    }
    if (turn && buying && buy_again) {
        buy_again = false;

        var comprada = monte.children;
        comprada = monte.children[comprada.length - 1];
        comprada_name = comprada.name.split(",")

        var new_card = document.createElement('div');
        new_card.id = "ordem_cards: " + hand_cards.children.length;
        new_card.name = comprada.name;

        new_card.classList.add("cards");
        new_card.style.background = 'url(./static/img/' + comprada_name[0] + comprada_name[1] + ".png)";
        new_card.style.backgroundSize = "100% 100%";
        new_card.style.backgroundRepeat = "no - repeat";

        new_card.style.left = pos + "vw";
        var posx_max = 79 - pos;

        if (hand_cards.children.length < 12) pos += 3.5;
        else if (hand_cards.children.length.length < 20) pos += 2.5;
        else pos += 1.5;


        if (!special) {
            var card_na_mesa = mesa.name.split(",");
            if (comprada_name[1] == 'neutral' || comprada_name[0] == card_na_mesa[0] || comprada_name[1] == card_na_mesa[1]) {
                buying = false;
                new_card.setAttribute("data-bought", "bought");
            }
            card_na_mesa = null;
        }


        new_card.onclick = selectCard;
        var posy = 0;
        var posx = 0;
        var scale = 1;
        var change_scale = 1;
        comprada.style.zIndex = 100;


        var id = setInterval(frame, 5);
        function frame() {
            if (posy == 32 && posx == - posx_max) {

                clearInterval(id);
                comprada.remove();
                comprada = null;
                comprada_name = null;
                if (!buying)
                    Object.entries(hand_cards.children).forEach(e => e[1].style.background = "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7))," + e[1].style.background);
                hand_cards.appendChild(new_card);
                new_card = null;
                buy_again = true;

            } else {

                if (posy != 32) {
                    posy += 0.5;
                    comprada.style.top = posy + "vw";
                }

                if (posx != - posx_max) {
                    posx -= 0.5;
                    comprada.style.left = posx + "vw";
                }

                if (scale != -1) {
                    scale -= 0.025 * change_scale;
                    scale.toFixed(2);
                    scale = parseFloat(scale).toPrecision(12);
                    if (scale <= 0) change_scale = -1;
                    comprada.style.transform = "scale(" + scale + ")";
                    if (scale == 0) {
                        comprada.src = "./static/img/" + comprada_name[0] + comprada_name[1] + ".png";
                    }
                }
            }

        }
        axios.post('http://127.0.0.1:5000/buyCard', { room, value_id, buying });
        if (monte.children.length == 0) {
            refresh_monte()
        }

    }
}

function goBack() {
    axios.post('http://127.0.0.1:5000/leave', { room, value_id })
    window.location.replace('http://127.0.0.1:5000/');
}

poll({
    fn: getInfo,
    interval: 1000,
});