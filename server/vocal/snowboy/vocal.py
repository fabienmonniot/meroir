import snowboydecoder

import sys
import signal

import logging
from websocket_server import WebsocketServer

def signal_handler(signal, frame):
    global interrupted
    interrupted = True

def interrupt_callback():
    global interrupted
    return interrupted

def detect_ajd():
    global server
    server.send_message(client, 'aujourd_hui')

def detect_fermer():
    global server
    server.send_message(client, 'fermer')

def detect_trafic():
    global server
    server.send_message(client, 'trafic')

def detect_jour_precedent():
    global server
    server.send_message(client, 'jour_precedent')

def detect_jour_suivant():
    global server
    server.send_message(client, 'jour_suivant')

def new_client(c, server):
    global client
    print("New client connected and was given id %d" % c['id'])
    client = c

def message_received(client, server, message):
    server.send_message_to_all('connection OK')
    if message == 'launch_recognition':
        voice_recognition()

def voice_recognition():
    global detector
    # main loop
    # make sure you have the same numbers of callbacks and models
    callbacks = [lambda: detect_fermer(),
             lambda: detect_trafic(),
             lambda: detect_trafic(),
             lambda: detect_jour_precedent(),
             lambda: detect_jour_suivant(),
             lambda: detect_ajd(),
             lambda: detect_fermer()]

    print('Listening... Press Ctrl+C to exit')

    detector.start(detected_callback=callbacks,
                   interrupt_check=interrupt_callback,
                   sleep_time=0.03)

    detector.terminate()

MODELS_FOLDER = "/home/pi/meroir/vocal/models/"

if __name__ == '__main__':
    interrupted = False
    client = 1
    models = [
        MODELS_FOLDER + "fermer.pmdl",
        MODELS_FOLDER + "trafic.pmdl",
        MODELS_FOLDER + "voir le trafic.pmdl",
        MODELS_FOLDER + "jour precedent.pmdl",
        MODELS_FOLDER + "jour suivant.pmdl",
        MODELS_FOLDER + "aujourd'hui.pmdl",
        MODELS_FOLDER + "quitter.pmdl"
    ]

    # capture SIGINT signal, e.g., Ctrl+C
    signal.signal(signal.SIGINT, signal_handler)

    #sensitivity = [0.6] * len(models)
    sensitivity = [0.5, 0.6, 0.4, 0.6, 0.5, 0.4, 0.5]
    detector = snowboydecoder.HotwordDetector(models,
                sensitivity=sensitivity,
                audio_gain=2)

    #Websocket server
    server = WebsocketServer(7000, host='127.0.0.1', loglevel=logging.DEBUG)
    #server = WebsocketServer(7000, host='192.168.1.70', loglevel=logging.DEBUG)
    server.set_fn_new_client(new_client)
    server.set_fn_message_received(message_received)
    server.run_forever()
