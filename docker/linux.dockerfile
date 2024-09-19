FROM ubuntu:latest

RUN apt-get update && apt-get install -y build-essential

# Copy both the source file and header file
COPY lib/opcut.c /opcut.c
COPY lib/opcut.h /opcut.h

# Compile the shared library
RUN gcc -shared -o /libopcut.so -fPIC -O2 /opcut.c
