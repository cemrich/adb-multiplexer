[![Dependency Status](https://gemnasium.com/cemrich/adb-multiplexer.svg)](https://gemnasium.com/cemrich/adb-multiplexer)

# ADB multiplexer 

## Prerequisites
1. [node.js](https://nodejs.org/) - test if nodejs is installed properly by executing ```node -v```
1. [adb](https://developer.android.com/sdk/installing/index.html?pkg=tools) - test if adb is installed properly by executing ```adb devices``

## Building
Run ```npm install``` to install dependencies.

## Usage
```
usage: adb-multiplexer.js [-h] [-v] [-t TIMEOUT] command

Executes ADB commands on all connected devices.

Positional arguments:
  command               ADB command to execute, for example "adb install
                        <path to apk>". Use quotation marks for multiword
                        commands. The "adb" prefix is optional.

Optional arguments:
  -h, --help            Show this help message and exit.
  -v, --version         Show program's version number and exit.
  -t TIMEOUT, --timeout TIMEOUT
                        Timeout in milliseconds after which a command will be
                        canceled. Defaults to 10000 (10 seconds). Set 0 for
                        no timeout.

Example usage: main.js -t 0 "adb install myApp.apk"
```
