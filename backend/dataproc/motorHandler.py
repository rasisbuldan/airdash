import asyncio
import socketio
import json
import time
from random import choice, uniform, random
from concurrent.futures import ThreadPoolExecutor

_executor = ThreadPoolExecutor(1)

# Async
loop = asyncio.get_event_loop()

i = 0
j = 0

# Create socket client
sio = socketio.AsyncClient()

def arr_append(k):
    global j
    j += 1

    a = []
    for i in range(1000000):
        a.append(i)
    return a

async def start_server():
    await sio.connect('http://localhost:3002')
    await sio.wait()
    print('[motorHandler] Socket connected with SID: ', sio.sid)

@sio.event
async def message(data):
    print('Message received!')
    print(data)

@sio.on('motorConditionReq')
async def on_message(data):
    global i
    i += 1
    i_local = i

    a = await loop.run_in_executor(_executor, arr_append, i)

    # Process motor condition (random dummy)
    statusVal = [random()*100 for _ in range(4)]

    condValue = ['Normal', 'Abnormal']


    motorCond = {
        'mot1': {
            'status': 'Normal' if statusVal[0] < 60 else 'Abnormal',
            'statusVal': '{:.1f}'.format(statusVal[0]),
            'rul': '{:.1f}'.format(uniform(50,200))
        },
        'mot2': {
            'status': 'Normal' if statusVal[1] < 60 else 'Abnormal',
            'statusVal': '{:.1f}'.format(statusVal[1]),
            'rul': '{:.1f}'.format(uniform(50,200))
        },
        'mot3': {
            'status': 'Normal' if statusVal[2] < 60 else 'Abnormal',
            'statusVal': '{:.1f}'.format(statusVal[2]),
            'rul': '{:.1f}'.format(uniform(50,200))
        },
        'mot4': {
            'status': 'Normal' if statusVal[3] < 60 else 'Abnormal',
            'statusVal': '{:.1f}'.format(statusVal[3]),
            'rul': '{:.1f}'.format(uniform(50,200))
        }
    }

    await sio.emit('motorConditionRes', json.dumps(motorCond))

if __name__ == '__main__':
    loop.run_until_complete(start_server())
