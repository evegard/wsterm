#!/usr/bin/python

import base64
import fcntl
import json
import pty
import struct
import subprocess
import termios
import tornado.ioloop
import tornado.iostream
import tornado.web
import tornado.websocket
import uuid

class TerminalHandler(tornado.websocket.WebSocketHandler):
    def initialize(self, secret):
        self.secret = secret
        self.process = None
        self.pipe = None

    def on_message(self, data):
        message = json.loads(data)
        if message['type'] == 'secret':
            if message['secret'] != self.secret:
                print 'Error: Wrong secret \'%s\', should be \'%s\'' % \
                    (message['secret'], self.secret)
                return
            if self.process is not None:
                print 'Error: Process already started'
                return
            self.start_process()
        elif message['type'] == 'input':
            if self.pipe is None:
                print 'Error: Process not started'
                return
            character = chr(int(message['key']))
            print message['key'], character
            self.pipe.write(character)

    def start_process(self):
        (master, slave) = pty.openpty()
        fcntl.ioctl(master, termios.TIOCSWINSZ, struct.pack('HHHH', 24, 80, 100, 100))

        self.process = subprocess.Popen([ 'vim' ], \
            stdin=slave, stdout=slave, stderr=slave)

        self.pipe = tornado.iostream.PipeIOStream(master)
        self.pipe.read_until_close(callback=self.send_string, \
            streaming_callback=self.send_string)

    def send_string(self, string):
        self.write_message(json.dumps({ \
            'type': 'output', \
            'output': base64.b64encode(string), \
        }))

if __name__ == '__main__':
    secret = str(uuid.uuid4())
    print 'Navigate your browser to <http://127.0.0.1:8080/?%s> to use WSTerm' % secret
    tornado.web.Application([
        (r'/()', tornado.web.StaticFileHandler, { 'path': './static/index.html' }),
        (r'/wsterm', TerminalHandler, { 'secret': secret }),
    ], static_path='./static/').listen(8080, address='127.0.0.1')
    tornado.ioloop.IOLoop.instance().start()
