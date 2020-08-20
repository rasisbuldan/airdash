import socketio
import json
from random import choice, uniform

# Create socket client
sio = socketio.Client()

@sio.event
def message(data):
    print('Message received!')
    print(data)

@sio.on('motorConditionReq')
def on_message(data):
    # Process motor condition (random dummy)
    condValue = ['Normal', 'Abnormal']

    motorCond = {
        'mot1': {
            'status': choice(condValue),
            'rul': '{:.1f}'.format(uniform(50,200))
        },
        'mot2': {
            'status': choice(condValue),
            'rul': '{:.1f}'.format(uniform(50,200))
        },
        'mot3': {
            'status': choice(condValue),
            'rul': '{:.1f}'.format(uniform(50,200))
        },
        'mot4': {
            'status': choice(condValue),
            'rul': '{:.1f}'.format(uniform(50,200))
        }
    }

    sio.emit('motorConditionRes', json.dumps(motorCond))

# Connect to local API
sio.connect('http://localhost:3002')
print('[motorHandler] Socket connected with SID: ', sio.sid)