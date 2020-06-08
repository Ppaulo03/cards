from flask import Flask, render_template, request, jsonify, make_response
from flask import redirect
from flask_cors import CORS, cross_origin
import simplejson
import random
import operator
import logging

log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

room = dict()
effects = ['inv', 'block', 'mais2']


@app.route('/')  # Index
def index():
    return render_template('index.html')


@app.route('/getRoom', methods=['POST'])
def getRoom():
    data = simplejson.loads(request.data)
    if data['room'] in room:
        return room[data['room']]
    else:
        return "NoRoom"


@app.route('/enterRoom', methods=['POST'])
def enter_room():
    data = simplejson.loads(request.data)
    if data['room'] in room:

        if data['nam'] in room[data['room']]['id'].values():
            for k, v in room[data['room']]['id'].items():
                if v == data['nam']:
                    id = k
                    break
            return 'Reconnect:' + str(id)

        elif room[data['room']]['playing']:
            return 'In game'

        else:
            data = simplejson.loads(request.data)
            room[data['room']]['connected'] += 1
            id = str(room[data['room']]['connected'])
            room[data['room']]['id'][id] = data['nam']
            return str(id)

    else:
        return 'Room not Found'


@app.route('/createRoom', methods=['POST'])
def create_room():
    data = simplejson.loads(request.data)
    while True:
        num = str(random.randint(0, 3000))

        if num not in room:
            room[num] = {
                'connected': 1,
                'id': {'1': data['nam']},
                'chat': [],
                'playing': False,
                'winner': [False, None]
            }
            id = 1
            break
        else:
            continue

    return num


@app.route('/room.html')
def inroom():
    num = request.args.get('room')
    id = request.args.get('id')
    name = request.args.get('name')
    if num in room:

        if id not in room[num]["id"]:
            room[num]['connected'] += 1
            room[num]['id'][id] = name

        return render_template('room.html', room=room[num],
                               numb=num, id=id)
    else:
        return redirect('/')


@app.route('/chat', methods=['POST'])
def chat():
    data = simplejson.loads(request.data)
    sender = room[data['room']]['id'][data['value_id']]
    msg = sender + ": "+data['msg_txt']
    room[data['room']]['chat'].append(msg)

    if data['msg_txt'][0] == "/":
        codigo = data['msg_txt'].split(" ")
        if codigo[0] == "/kick":
            if len(codigo) > 1:
                room[data['room']]['chat'].append(
                    kick(data['room'], codigo[1]))
            else:
                room[data['room']]['chat'].append("System: No player selected")

    return "ok"


@ app.route('/leave', methods=['POST'])
def leave():
    data = simplejson.loads(request.data)
    kick(data['room'], data['value_id'], id_ready=True)
    return data


def kick(room_num, name, id_ready=False):

    if id_ready:
        id = name

    elif name in room[room_num]['id'].values():
        for k, v in room[room_num]['id'].items():
            if v == name:
                id = k
                break
    else:
        return "System: Player inexistente"

    room[room_num]['connected'] -= 1
    if room[room_num]['connected'] == 0:
        room.pop(room_num, None)
        return "System: Player removed"

    elif room[room_num]["playing"]:
        if room[room_num]['connected'] == 1:
            for winner in room[room_num]['id'].keys():
                if winner != id:
                    room[room_num]['winner'] = [True, winner]
                    room[room_num]['playing'] = False
                    break
        else:
            for x in range(len(room[room_num]['hands'][id])):
                room[room_num]['monte'].insert(
                    0, room[room_num]['hands'][id].pop())

            room[room_num]['hands'].pop(id, None)

            for indx, player_in in enumerate(room[room_num]['order']):
                if player_in[1] == id:
                    room[room_num]['order'].pop(indx)
                    break

            if len(room[room_num]['order']) > 0:
                room[room_num]['turn'] = room[room_num]['order'][0]

    room[room_num]["id"].pop(id, None)
    return "System: Player removed"


@ app.route('/play', methods=['POST'])
def play():
    data = simplejson.loads(request.data)
    if not room[data['room']]['playing']:
        order = [[player, value_id, 0]
                 for value_id, player in room[data['room']]['id'].items()
                 ]
        # if len(order) == 1:
        #     return "Few Players"
        # else:
        random.shuffle(order)

        deck = list()
        for cor in ['azul', 'amarelo', 'rosa', 'verde']:
            # deck.append(['spc', '+4', 'neutral'])
            # deck.append(['spc', 'change', 'neutral'])
            for n in range(0, 10):
                card = ['nor', str(n), cor]
                deck.append(card)
                # if n != 1:
                #     deck.append(card)
            for special in effects:
                card = ['nor', special, cor]
                deck.append(card)
                deck.append(card)

        random.shuffle(deck)

        hands = {str(player[1]): [deck.pop(0) for n in range(7)]
                 for player in order}
        for key in hands.keys():
            hands[key].sort(key=operator.itemgetter(2, 1))

        room[data['room']]['mesa'] = [deck.pop(0)]
        room[data['room']]['hands'] = hands
        room[data['room']]['monte'] = deck
        room[data['room']]['order'] = order
        room[data['room']]['turn'] = order[0]
        room[data['room']]['playing'] = True
        room[data['room']]['winner'] = [False, None]
        room[data['room']]['buying'] = True
        room[data['room']]['stack'] = None

    return "ok"


@ app.route('/putCard', methods=['POST'])
def put_Card():

    data = simplejson.loads(request.data)
    room_num = data['room']
    id = data['value_id']

    room[data['room']]['buying'] = True

    card = room[room_num]['hands'][id].pop(
        int(data['ordenacao']))

    if card[1] in effects:
        if card[1] == 'mais2':
            if room[room_num]['stack'] is not None:
                room[room_num]['stack'][1] += 1
            else:
                room[room_num]['stack'] = ['mais2', 1]
    else:
        room[room_num]['stack'] = None

    if card[0] == 'nor':
        room[room_num]['mesa'].append(card)
        actual = room[room_num]['order'].pop(0)
        room[room_num]['order'].append(actual)

        if room[room_num]['order'][0] == actual:
            room[room_num]['order'][0][2] += 1

        room[room_num]['turn'] = room[room_num]['order'][0]

    if len(room[room_num]['hands'][id]) == 0:
        room[room_num]['winner'] = [True, id]
        room[room_num]['playing'] = False

    room[room_num]['hands'][id].sort(key=operator.itemgetter(2, 1))
    return "ok"


@app.route('/pass', methods=['POST'])
def pass_turn():

    data = simplejson.loads(request.data)
    actual = room[data['room']]['order'].pop(0)
    room[data['room']]['order'].append(actual)

    if room[data['room']]['order'][0] == actual:
        room[data['room']]['order'][0][2] += 1

    room[data['room']]['turn'] = room[data['room']]['order'][0]
    room[data['room']]['stack'] = None

    room[room_num]['hands'][id].sort(key=operator.itemgetter(2, 1))
    return "ok"


@ app.route('/buyCard', methods=['POST'])
def buy_card():
    data = simplejson.loads(request.data)
    card = room[data['room']]['monte'].pop()
    room[data['room']]['hands'][data['value_id']].append(card)
    room[data['room']]['buying'] = data['buying']

    if len(room[data['room']]['monte']) == 0:
        atual_monte = room[data['room']]['mesa'].pop()
        rest = room[data['room']]['mesa'][:]
        room[data['room']]['mesa'] = []
        random.shuffle(rest)
        room[data['room']]['monte'] = rest
        room[data['room']]['mesa'].append(atual_monte)

    return "ok"


@ app.route('/gameReset', methods=['POST'])
def reset():
    data = simplejson.loads(request.data)
    room[data['room']]['winner'] = [False, None]
    return "ok"


if __name__ == '__main__':
    app.env = "development"
    app.run(debug=True)
