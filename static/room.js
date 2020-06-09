// User Info - Room and Id
const room = document.getElementById("room-number").getAttribute("value");
const value_id = document.getElementById("id-player").getAttribute("value");

//console_chat
const console_chat = document.getElementById('msg_console');

// Lobby elements
const chat = document.getElementById('msg');
const lista = document.getElementById('players');

// Ingame elements
const lista_ordem = document.getElementById('order');
const hand_cards = document.getElementById("Hand");
const monte = document.getElementById("monte");
const mesa = document.getElementById("mesa");

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

var waiting = false;
var isTurn = false;;
var buying = true
var lobbying = true;
var spc = false;
var msg_index = 0;
var pos = 0;
function getRoom() {
    axios.post('/getRoom', { room }).then((r) => {

        if (r.data == 'NoRoom' || r.data.id[value_id] == undefined) {
            window.location.replace('/')
        }

        else if (!waiting) {
            msg_handler(r.data.chat);
            if (lobbying) {

                if (Object.keys(r.data.id).length != lista.children.length)
                    list_looby_handler(r.data.id);

                if (r.data.playing) {
                    lobbying = false;
                    list_ingame_actualiser(r.data.order, r.data.turn, r.data.hands);
                    monte_handler(r.data.monte);
                    hand_handler(r.data.hands, r.data.buying, r.data.stack);
                    mesa_handler(r.data.mesa);
                    if (r.data.turn[1] == value_id) {
                        isTurn = true;
                    }
                    player_turn = r.data.turn
                    document.getElementById("Looby").hidden = true;
                    document.getElementById("InGame").hidden = false;
                }

            }

            else if (r.data.winner[0]) {
                mesa_handler(r.data.mesa);
                list_ingame_handler(r.data.order, r.data.turn, r.data.hands)
                if (r.data.winner[1] == value_id) {
                    document.getElementById('won').style.display = 'block';
                }
                else {
                    document.getElementById('winnerName').textContent = r.data.id[r.data.winner[1]];
                    document.getElementById('loose').style.display = 'block';
                }
                waiting = true;
            }

            else {
                if (monte.length != r.data.monte.length) {
                    monte_handler(r.data.monte);
                    list_ingame_handler(r.data.order, r.data.turn, r.data.hands);
                }
                if (lista_ordem.children.length != r.data.order.length) {
                    list_ingame_actualiser(r.data.order, r.data.turn, r.data.hands);
                }

                if ((isTurn || hand_cards.children.length != r.data.hands[value_id].length) && !spc) {
                    hand_handler(r.data.hands, r.data.buying, r.data.stack);
                }

                if (player_turn[1] != r.data.turn[1] || player_turn[2] != r.data.turn[2]) {
                    mesa_handler(r.data.mesa);
                    if (r.data.turn[1] == value_id) {
                        isTurn = true;
                    } else {
                        isTurn = false;
                    }
                    player_turn = r.data.turn
                    list_ingame_handler(r.data.order, r.data.turn, r.data.hands)

                    if (r.data.stack != null) {
                        var cont = 1;
                        Object.entries(lista_ordem.children).every(element => {
                            if (element[1].id == 'player_ordem' + player_turn[1]) {
                                return false;
                            }
                            cont += 1;
                            return true;
                        });

                        if (player_turn[1] != value_id) {
                            if (r.data.stack[0] == 'mais2')
                                animationMais(r.data.stack[1] * 2, cont);
                            if (r.data.stack[0] == '+4')
                                animationMais(r.data.stack[1] * 4, cont);
                        }
                        else {
                            if (r.data.stack[0] == 'mais2') {
                                buyCard(r.data.stack[1] * 2, false)
                            }
                            if (r.data.stack[0] == '+4') {
                                buyCard(r.data.stack[1] * 4, false)
                            }
                        }

                        cont = null;

                    }
                }
            }
        }
    });
}

// lobby and message handlers
function msg_handler(msg) {
    while (msg_index < msg.length) {
        var msg_tag = document.createElement('P');
        var msg_consol = document.createElement('P');

        msg_tag.innerHTML = msg[msg_index];
        msg_consol.innerHTML = msg[msg_index];

        chat.appendChild(msg_tag);
        console_chat.append(msg_consol);

        console_chat.scrollTop = console_chat.scrollHeight;
        chat.scrollTop = chat.scrollHeight;

        msg_index += 1;
        msg_tag = null;
        msg_consol = null;
    }
}
function list_looby_handler(players_id) {
    lista.innerHTML = "";
    Object.entries(players_id).forEach(element => {
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

//Game handlers
function list_ingame_actualiser(player_order, turn, hands) {

    lista_ordem.innerHTML = "";
    Object.entries(player_order).forEach(player => {
        var player_li = document.createElement('li');
        player_li.setAttribute("id", "player_ordem" + player[1][1]);
        player_li.innerHTML = player[1][0];

        if (turn[1] == parseInt(player[1][1])) player_li.style.color = "#f00";
        else player_li.style.color = "#fff";
        if (parseInt(player[1][1]) == value_id) player_li.style.fontWeight = "bold";

        var img_cardVerso = document.createElement('img');
        img_cardVerso.src = './static/img/verso.png';
        img_cardVerso.classList.add("conterCards");
        player_li.appendChild(img_cardVerso);
        img_cardVerso = null;

        var qtd_cards = document.createElement('span');
        qtd_cards.setAttribute("id", "player_ordem_numcards" + player[1][1]);
        qtd_cards.innerText = " X" + hands[parseInt(player[1][1])].length;
        qtd_cards.style.fontSize = "1.2vw";
        player_li.append(qtd_cards);

        lista_ordem.appendChild(player_li);
        qtd_cards = null;
        player_li = null;
    });
}
function list_ingame_handler(player_order, turn, hands) {
    Object.entries(player_order).forEach(player => {
        var player_li = document.getElementById("player_ordem" + player[1][1]);
        if (turn[1] == parseInt(player[1][1])) player_li.style.color = "#f00";
        else player_li.style.color = "#fff";

        var qtd_cards = document.getElementById("player_ordem_numcards" + player[1][1]);
        qtd_cards.innerText = " X" + hands[parseInt(player[1][1])].length;
        qtd_cards.style.fontSize = "1.2vw";

        player_li = null;
        qtd_cards = null;
    });
}
function monte_handler(cards_monte) {

    monte.innerHTML = "";
    var mont_pos = 0;
    Object.entries(cards_monte).forEach(card => {

        var card_img = document.createElement('img');
        card_img.id = "ordem_mont: " + card[0];
        card_img.name = card[1][1] + "," + card[1][2];
        card_img.src = './static/img/verso.png';
        card_img.style.position = 'absolute';
        card_img.style.top = mont_pos + "vw";
        if (mont_pos < 2.5) {
            mont_pos += 0.5;
        }
        monte.appendChild(card_img);
        card_img = null;
    })

    mont_pos = null;
}
function hand_handler(hands, isbuying, stacking) {

    pos = 0;
    if (hands[value_id].length < 12) var som_hand = 3.5;
    else if (hands[value_id].length < 20) var som_hand = 2.5;
    else var som_hand = 1.5;

    hand_cards.innerHTML = "";
    Object.entries(hands[value_id]).forEach(card => {

        var card_hand = document.createElement('div');
        card_hand.id = "ordem_cards: " + card[0];
        card_hand.name = card[1][1] + "," + card[1][2];

        card_hand.classList.add("cards");
        card_hand.style.background = 'url(./static/img/' + card[1][1] + card[1][2] + ".png)";
        card_hand.style.backgroundSize = "100% 100%";
        card_hand.style.backgroundRepeat = "no - repeat";

        card_hand.style.left = pos + "vw";
        pos += som_hand;


        card_hand.onclick = playCard;
        hand_cards.appendChild(card_hand);
        card_hand = null;
    })
    som_hand = null;

    buying = isbuying;
    if (isTurn && !buying && stacking == null) {
        hand_cards.children[hand_cards.children.length - 1].setAttribute("data-bought", "bought");
        Object.entries(hand_cards.children).forEach(card => {
            if (card[1].getAttribute("data-bought") != "bought")
                card[1].style.background = "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7))," + card[1].style.background
        });
    }
}
function mesa_handler(mesa_info) {

    var new_mesa = mesa_info[mesa_info.length - 1];
    mesa.src = './static/img/' + new_mesa[1] + new_mesa[2] + ".png";
    mesa.alt = 'Carta ' + new_mesa[1] + " " + new_mesa[2];
    mesa.name = new_mesa[1] + "," + new_mesa[2];
    new_mesa = null;

}

//Animations
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


//buttons onClick functions:
function play() {
    axios.post('/play', { room }).then((r) => {

        if (r.data == "Few Players") {
            document.getElementById("fewPlayers").textContent = "Min. of 2 Players";
        } else {
            document.getElementById("fewPlayers").textContent = "";
        }

    })
}
function sendMsg(plataform) {

    if (plataform == 'chat') {
        var msg_plataform = document.getElementById("message");
    }

    else {
        var msg_plataform = document.getElementById("message_console");
    }

    msg_txt = msg_plataform.value;
    if (msg_txt != "") {
        axios.post('/chat', { room, value_id, msg_txt });
    }

    msg_plataform.value = "";
    msg_plataform = null;
    msg_txt = null;

}
function back() {
    axios.post('/leave', { room, value_id })
    window.location.replace('./');
}
function fechar() {
    document.getElementById('won').style.display = 'none';
    document.getElementById('loose').style.display = 'none';
    document.getElementById("message_console").value = "";
    document.getElementById("Console").hidden = true;
    document.getElementById("Looby").hidden = false;
    document.getElementById("InGame").hidden = true;
    lobbying = true;
    waiting = false;
}

//games onClick functions:
function playCard(ev) {
    if (isTurn) {
        if (buying || ev.target.getAttribute("data-bought") == "bought") {
            var card_name = ev.target.name.split(",")
            var card_mesa_name = mesa.name.split(",");

            if (card_name[1] == "zeutral") {
                isTurn = false;
                document.getElementById("choose_color").setAttribute("data-info", ev.target.id)
                document.getElementById("choose_color").style.display = 'block';
            }

            else if (card_name[0] == card_mesa_name[0] || card_name[1] == card_mesa_name[1]) {
                isTurn = false;
                var pos_card = ev.target.id.split("ordem_cards: ").pop(0)
                axios.post('/playCard', { pos_card, room, value_id });
                ev.target.remove();
                pos_card = null;
            }

            card_name = null;
            card_mesa_name = null;
            axios.post('/getRoom', { room, value_id }).then((r) => {
                hand_handler(r.data.hands, r.data.buying, r.data.stack);
            });
        }
    }
}

function chooseColor(color) {
    target = document.getElementById(document.getElementById("choose_color").getAttribute("data-info"));
    document.getElementById('choose_color').style.display = 'none';
    var card_name = target.name.split(",")
    var card_mesa_name = mesa.name.split(",");

    var pos_card = target.id.split("ordem_cards: ").pop(0)
    axios.post('/playCard', { pos_card, room, value_id, color });
    target.remove();
    pos_card = null;

    card_name = null;
    card_mesa_name = null;
    axios.post('/getRoom', { room, value_id }).then((r) => {
        hand_handler(r.data.hands, r.data.buying, r.data.stack);
    });
}

var buying_anim = false;
function buyCard(num, grayed) {
    if (isTurn) {
        if (buying || !grayed) {
            if (!buying_anim) {
                buying_anim = true;
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


                if (grayed) {
                    var card_na_mesa = mesa.name.split(",");
                    if (comprada_name[1] == 'neutral' || comprada_name[0] == card_na_mesa[0] || comprada_name[1] == card_na_mesa[1]) {
                        buying = false;
                        new_card.setAttribute("data-bought", "bought");
                    }
                }

                card_na_mesa = null;
                new_card.onclick = playCard;

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

                        if (!buying && grayed)
                            Object.entries(hand_cards.children).forEach(e => e[1].style.background = "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7))," + e[1].style.background);
                        hand_cards.appendChild(new_card);

                        new_card = null;
                        buying_anim = false;

                        if (num > 1) {
                            buyCard(num - 1, grayed);
                        }
                        else if (!grayed)
                            axios.post('/pass', { room, value_id })

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

                axios.post('/buy', { room, value_id, buying });
                if (monte.children.length == 0) {
                    axios.post('/getRoom', { room, value_id }).then((r) => {
                        monte_handler(r.data.monte)
                    });
                }
            }
        }
    }
}

poll({
    fn: getRoom,
    interval: 500,
});