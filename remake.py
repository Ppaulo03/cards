from flask import Flask, render_template, request, redirect
from random import randint, shuffle
from operator import itemgetter
import simplejson


# Limit Flask logger to only errors
import logging
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)
# End of logger configuration


app = Flask(__name__)
rooms = dict()
# effects = ['inv', 'block', 'mais2']
effects = ['mais2']


@app.route('/')
def index():
    return render_template('index.html')


# Beggining Entering and Creating Rooms System
@app.route('/createRoom', methods=['POST'])
def create_room():
    data = simplejson.loads(request.data)

    while True:
        num_room = str(randint(0, 3000))
        if num_room not in rooms:
            break

    rooms[num_room] = {
        'connected': 1,
        'id': {'1': data['player']},
        'chat': []
    }
    reset_room(num_room)

    return num_room


@app.route('/enterRoom', methods=['POST'])
def enter_room():
    data = simplejson.loads(request.data)

    if data['room'] in rooms:

        if data['player'] in rooms[data['room']]['id'].values():
            for id_key, name_value in rooms[data['room']]['id'].items():
                if name_value == data['player']:
                    player_id = id_key
                    break
            return 'Reconnect:'+str(player_id)

        elif rooms[data['room']]['playing']:
            return 'In game'

        else:
            rooms[data['room']]['connected'] += 1
            player_id = rooms[data['room']]['connected']
            rooms[data['room']]['id'][str(player_id)] = data['player']
            return str(player_id)

    else:
        return 'Room not Found'


@app.route('/game')
def game_room():
    num_room = request.args.get('room')
    player_id = request.args.get('id')

    if num_room in rooms and player_id in rooms[num_room]['id']:
        return render_template('room.html', number=num_room, id=player_id)

    else:
        return redirect('/')
# Ending of Entering and Creating Rooms System


# Button Functions
@app.route('/chat', methods=['POST'])
def chat():
    data = simplejson.loads(request.data)

    sender = rooms[data['room']]['id'][data['value_id']]
    msg = sender + ": "+data['msg_txt']
    rooms[data['room']]['chat'].append(msg)

    if data['msg_txt'][0] == "/":
        codigo = data['msg_txt'].split(" ")

        if codigo[0] not in ["/kick", "/help"]:
            rooms[data['room']]['chat'].append("System: Command invalid")
            rooms[data['room']]['chat'].append(
                "System: Type /help to see the commands")

        elif codigo[0] == "/help":
            rooms[data['room']]['chat'].append("'''")

            rooms[data['room']]['chat'].append(
                "/kick <name>: kicks player from the room")

            rooms[data['room']]['chat'].append("'''")

        elif codigo[0] == "/kick":
            if len(codigo) > 1:
                rooms[data['room']]['chat'].append(
                    kick(data['room'], codigo[1]))
            else:
                rooms[data['room']]['chat'].append(
                    "System: No player selected")

    return "ok"


@app.route('/leave', methods=['POST'])
def leave():
    data = simplejson.loads(request.data)
    kick(data['room'], data['value_id'], id_ready=True)
    return "left"


@app.route('/play', methods=['POST'])
def play():
    data = simplejson.loads(request.data)

    if not rooms[data['room']]['playing']:

        if len(rooms[data['room']]['id'].keys()) == 1:
            return "Few Players"
        else:

            order = [[player, value_id, 0]
                     for value_id, player in rooms[data['room']]['id'].items()
                     ]
            shuffle(order)

            deck = create_deck()

            hands = {str(player[1]): [deck.pop(0) for n in range(7)]
                     for player in order}

            for key in hands.keys():
                hands[key].sort(key=itemgetter(2, 1))

            while True:
                mesa = deck.pop(0)
                rooms[data['room']]['mesa'].append(mesa)
                if mesa[1] not in effects:
                    break

            rooms[data['room']]['hands'] = hands
            rooms[data['room']]['monte'] = deck
            rooms[data['room']]['order'] = order
            rooms[data['room']]['turn'] = order[0]
            rooms[data['room']]['playing'] = True

    return "OK"
# End Button Functions


@app.route('/getRoom', methods=['POST'])  # Pool Function
def get_room():
    data = simplejson.loads(request.data)
    if data['room'] in rooms:
        return rooms[data['room']]
    else:
        return "NoRoom"


# Ingame Functions
@app.route('/playCard', methods=['POST'])
def play_card():
    data = simplejson.loads(request.data)

    card = rooms[data['room']]['hands'][data['value_id']].pop(
        int(data['pos_card']))
    rooms[data['room']]['mesa'].append(card)

    if len(rooms[data['room']]['hands'][data['value_id']]) == 0:
        rooms[data['room']]['winner'] = [True, data['value_id']]
        rooms[data['room']]['playing'] = False
        return 'EndGame'

    rooms[data['room']]['buying'] = True
    # if card[1] in effects:

    #     if rooms[data['room']]['stack'] is not None:
    #         rooms[data['room']]['stack'][1] += 1

    #     elif card[1] == 'mais2':
    #         rooms[data['room']]['stack'] = ['mais2', 1]
    #         rooms[data['room']]['buying'] = False
    # else:
    #     rooms[data['room']]['stack'] = None

    end_turn(data['room'], data['value_id'])
    return "OK"


@app.route('/pass', methods=['POST'])
def pass_turn():
    data = simplejson.loads(request.data)
    rooms[data['room']]['stack'] = None
    rooms[data['room']]['buying'] = True
    end_turn(data['room'], data['value_id'])
    return 'OK'


@ app.route('/buy', methods=['POST'])
def buy_card():
    data = simplejson.loads(request.data)
    card = rooms[data['room']]['monte'].pop()

    rooms[data['room']]['hands'][data['value_id']].append(card)
    rooms[data['room']]['buying'] = data['buying']

    if len(rooms[data['room']]['monte']) == 0:

        atual_mesa = rooms[data['room']]['mesa'].pop()
        old_mesa = rooms[data['room']]['mesa'][:]
        shuffle(old_mesa)
        rooms[data['room']]['monte'] = old_mesa

        rooms[data['room']]['mesa'] = []
        rooms[data['room']]['mesa'].append(atual_mesa)

    return "OK"


@ app.route('/reset', methods=['POST'])
def reset():
    data = simplejson.loads(request.data)
    reset_room(data['room'])
    return "OK"
# End of Ingame Functions


# Server Functions
def kick(room_num, name, id_ready=False):

    if id_ready:
        player_id = name

    elif name in rooms[room_num]['id'].values():
        for id_key, name_value in rooms[room_num]['id'].items():
            if name_value == name:
                player_id = id_key
                break
    else:
        return "System: Non existent Player"

    rooms[room_num]['connected'] -= 1
    if rooms[room_num]['connected'] == 0:
        rooms.pop(room_num, None)
        return "System: Player removed"

    elif rooms[room_num]["playing"]:
        if rooms[room_num]['connected'] == 1:

            for player in rooms[room_num]['id'].keys():
                if player != name_value:
                    rooms[room_num]['winner'] = [True, player]
                    rooms[room_num]['playing'] = False
                    break

        else:
            for x in range(len(rooms[room_num]['hands'][player_id])):
                rooms[room_num]['monte'].insert(
                    0, rooms[room_num]['hands'][player_id].pop())

            rooms[room_num]['hands'].pop(player_id, None)

            for indx, player_in in enumerate(rooms[room_num]['order']):
                if player_in[1] == player_id:
                    rooms[room_num]['order'].pop(indx)
                    break

            if len(rooms[room_num]['order']) > 0:
                rooms[room_num]['turn'] = rooms[room_num]['order'][0]

    rooms[room_num]["id"].pop(player_id, None)
    return "System: Player removed"


def create_deck():
    deck = list()
    for cor in ['azul', 'amarelo', 'rosa', 'verde']:
        # deck.append(['spc', '+4', 'neutral'])
        # deck.append(['spc', 'change', 'neutral'])
        for num in range(0, 10):
            card = ['norm', str(num), cor]
            deck.append(card)
            # if num != 1:
            #     deck.append(card)

        for special in effects:
            card = ['norm', special, cor]
            deck.append(card)
            deck.append(card)
            deck.append(card)
            deck.append(card)
            deck.append(card)
            deck.append(card)

    shuffle(deck)
    return deck


def end_turn(room_num, player_id):
    actual = rooms[room_num]['order'].pop(0)
    rooms[room_num]['order'].append(actual)

    if rooms[room_num]['order'][0] == actual:
        rooms[room_num]['order'][0][2] += 1

    rooms[room_num]['turn'] = rooms[room_num]['order'][0]
    rooms[room_num]['hands'][player_id].sort(key=itemgetter(2, 1))


def reset_room(room_num):
    rooms[room_num]['winner'] = [False, None]
    rooms[room_num]['buying'] = True
    rooms[room_num]['playing'] = False
    rooms[room_num]['stack'] = None
    rooms[room_num]['turn'] = None
    rooms[room_num]['hands'] = {}
    rooms[room_num]['monte'] = []
    rooms[room_num]['order'] = []
    rooms[room_num]['mesa'] = []
# End of  Server Functions


if __name__ == '__main__':
    app.env = "development"
    app.run(debug=True)
