import cv2
import os
import glob

import config
import face

import logging
from websocket_server import WebsocketServer

user_id = 1
POSITIVE_FILE_PREFIX = 'positive_'

# Called for every client connecting (after handshake)
def new_client(client, server):
    print("New client connected and was given id %d" % client['id'])

def message_received(client, server, message):
    if message == 'launch_recognition':
        facial_recognition(client, server)

def facial_recognition(client, server):

    # Check for the positive face and unlock if found.
    image = camera.read()
    # Convert image to grayscale.
    image = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    # Get coordinates of single face in captured image.
    result = face.detect_single(image)
    if result is None:
        print('Could not detect single face!  Check the image in capture.pgm'
              ' to see what was captured and try again with only one face visible.')
        result = 'no-face'
    else:
        x, y, w, h = result
        # Crop and resize image to face.
        crop = face.crop(image, x, y, w, h)
        resized = face.resize(crop)

        # Test face against model.
        label, confidence = model.predict(resized)
        print('Predicted {0} face with confidence {1} (lower is more confident).'.format(
            'POSITIVE' if label == config.POSITIVE_LABEL else 'NEGATIVE',
            confidence))
        if label == config.POSITIVE_LABEL and confidence < config.POSITIVE_THRESHOLD:
            print('Recognized face!')
            result = str(user_id)

            #Save for training
            files = sorted(glob.glob(os.path.join(config.POSITIVE_DIR,
                                                  POSITIVE_FILE_PREFIX + '[0-9][0-9][0-9].pgm')))
            count = 0
            if len(files) > 0:
                # Grab the count from the last filename.
                count = int(files[-1][-7:-4]) + 1

            filename = os.path.join(config.POSITIVE_DIR, POSITIVE_FILE_PREFIX + '%03d.pgm' % count)
            cv2.imwrite(filename, crop)

            print(filename)
        else:
            print('Did not recognize face!')
            result = 'not-recognized'

    #result = str(user_id)

    server.send_message(client, result)

if __name__ == '__main__':
    # Load training data into model
    print('Loading training data...')
    model = cv2.createEigenFaceRecognizer()
    model.load(config.TRAINING_FILE)
    print('Training data loaded!')
    # Initialize camera
    camera = config.get_camera()
    print('Running...')

    #Websocket server
    server = WebsocketServer(8000, host='169.254.132.122', loglevel=logging.INFO)
    server.set_fn_new_client(new_client)
    server.set_fn_message_received(message_received)
    server.run_forever()