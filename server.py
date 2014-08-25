#!/usr/bin/python

import argparse
import base64
import fcntl
import json
import pty
import struct
import subprocess
import termios
import tornado.httpserver
import tornado.ioloop
import tornado.iostream
import tornado.web
import tornado.websocket
import uuid

parser = argparse.ArgumentParser(description='Browser-based terminal emulator')
parser.add_argument('-H', '--host', default='127.0.0.1', help='listener host for web server')
parser.add_argument('-P', '--port', default='8080', type=int, help='listener port for web server')
parser.add_argument('-s', '--size', default='80x24', help='size of emulated terminal')
parser.add_argument('command', nargs='+', help='command to run in the terminal emulator')

class TerminalHandler(tornado.websocket.WebSocketHandler):
    def initialize(self, command, secret, size):
        self.command = command
        self.secret = secret
        (self.width, self.height) = size

        self.process = None
        self.pipe = None

    def open(self):
        self.write_message(json.dumps({ \
            'type': 'size', \
            'width': self.width, \
            'height': self.height, \
        }))

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
        fcntl.ioctl(master, termios.TIOCSWINSZ, \
            struct.pack('HHHH', self.height, self.width, 100, 100))

        self.process = subprocess.Popen(self.command, \
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
    args = parser.parse_args()

    secret = str(uuid.uuid4())
    print 'Navigate your browser to <https://%s:%d/?%s> to use WSTerm' % \
        (args.host, args.port, secret)

    application = tornado.web.Application([
        (r'/()', tornado.web.StaticFileHandler, { 'path': './static/index.html' }),
        (r'/wsterm', TerminalHandler, { \
            'command': args.command, \
            'secret': secret, \
            'size': map(int, args.size.split('x')), \
        }),
    ], static_path='./static/')
    server = tornado.httpserver.HTTPServer(application, ssl_options={ \
        'keyfile': 'certificate.key',
        'certfile': 'certificate.crt',
    })
    server.listen(args.port, address=args.host)

    tornado.ioloop.IOLoop.instance().start()
