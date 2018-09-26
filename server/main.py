# Distance sensor

import RPi.GPIO as GPIO
import time
import os

import logging
from websocket_server import WebsocketServer

GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)

sonicTrigger = 2
sonicEcho = 3

GPIO.setup(sonicTrigger, GPIO.OUT)
GPIO.setup(sonicEcho, GPIO.IN)

launched = False
mirrorAwake = False

def awake_mirror():
    global server
    server.send_message_to_all('start')

def shutdown_mirror():
    global server
    server.send_message_to_all('shutdown')

def new_client(client, server):
    global launched
    global mirrorAwake

    mirrorAwake = False
    print("New client connected and was given id %d" % client['id'])

    if not launched:
        launched = True
        try:
            while True:
                # Init
                GPIO.output(sonicTrigger, False)
                time.sleep(0.5)

                # Send 10us pulse to trigger
                GPIO.output(sonicTrigger, True)
                time.sleep(0.00001)
                GPIO.output(sonicTrigger, False)

                startTime = time.time()
                stopTime = 0

                while GPIO.input(sonicEcho) == 0:
                    startTime = time.time()

                while GPIO.input(sonicEcho) == 1:
                    stopTime = time.time()
                    if stopTime - startTime >= 0.04:
                        # print('Too close')
                        stopTime = startTime
                        break

                doubleTime = stopTime - startTime
                distance = doubleTime * 34326 / 2

                if 0 < distance < 10:
                    if mirrorAwake:
                        mirrorAwake = False
                        # black screen
                        print("extinction")
                        shutdown_mirror()
                    else:
                        mirrorAwake = True
                        # launch facial recognition and interface
                        print("allumage")
                        awake_mirror()

                    time.sleep(1)

                else:
                    print("trop loin")

                # print("Distance : %.1f cm" % distance)
        except KeyboardInterrupt:
            GPIO.cleanup()


def message_received(client, server, message):
    server.send_message_to_all('server received ' + message)

# Websocket server
server = WebsocketServer(7070, host='127.0.0.1', loglevel=logging.DEBUG)
server.set_fn_new_client(new_client)
server.set_fn_message_received(message_received)
server.run_forever()
