import asyncio
import socketio
import json
import time
from random import random, choice, uniform
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
    #print(data['x'])
    #global i
    #i += 1
    #i_local = i
    #print(i_local,time.time())
    
    #a = await loop.run_in_executor(_executor, arr_append, i)
    #print(i_local, a[:5])
    
    # Process motor condition (random dummy)
    statusPercentage = [random() for _ in range(4)]
    status = [('Normal' if sp < 0.6 else 'Abnormal') for sp in statusPercentage]
    rul = [(200 - sp*100) for sp in statusPercentage]


    motorCond = {
        'mot1': {
            'status': status[0],
            'statusPercentage': '{:.1f}'.format(statusPercentage[0]*100),
            'rul': '{:.1f}'.format(rul[0])
        },
        'mot2': {
            'status': status[1],
            'statusPercentage': '{:.1f}'.format(statusPercentage[1]*100),
            'rul': '{:.1f}'.format(rul[1])
        },
        'mot3': {
            'status': status[2],
            'statusPercentage': '{:.1f}'.format(statusPercentage[2]*100),
            'rul': '{:.1f}'.format(rul[2])
        },
        'mot4': {
            'status': status[3],
            'statusPercentage': '{:.1f}'.format(statusPercentage[3]*100),
            'rul': '{:.1f}'.format(rul[3])
        }
    }

    await sio.emit('motorConditionRes', json.dumps(motorCond))

if __name__ == '__main__':
    loop.run_until_complete(start_server())