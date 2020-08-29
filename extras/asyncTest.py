import asyncio
import socketio
import json
import time
from random import choice, uniform
from concurrent.futures import ThreadPoolExecutor

# Async 
loop = asyncio.get_event_loop()
_executor = ThreadPoolExecutor(1)

# Create socket client
sio = socketio.AsyncClient()

# Global Variable
i = 0
j = 0

def arr_append(k):
    global j
    j += 1

    a = []
    print('loop',j,k)
    for i in range(100):
        a.append(i)
    print('loop complete',j,k)
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
    print(data['x'])
    global i
    i += 1
    i_local = i
    print(i_local,time.time())
    
    a = await loop.run_in_executor(_executor, arr_append, i)
    print(i_local, a[:5])
    
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

    await sio.emit('motorConditionRes', json.dumps(motorCond))

if __name__ == '__main__':
    loop.run_until_complete(start_server())
