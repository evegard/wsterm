WSTerm
======

A browser-based terminal emulator, using WebSockets to communicate with
a remote process hosted by a server-side Python script.

Installation
------------

Provide the TLS certificate to be used for HTTPS and WSS in
`certificate.crt` and the corresponding private key in
`certificate.key`. A suitable self-signed certificate can be created by
running:

`openssl req -x509 -newkey rsa:2048 -keyout certificate.key -out
certificate.crt -nodes -days 3650`

Make sure the Tornado framework is installed:

`sudo aptitude install python-tornado`

Usage
-----

Run `./server.py` and follow the instructions.
