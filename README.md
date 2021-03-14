# fritz-surf-timer

A quick and dirty program to automatically get information from a FRITZ!Box about when internet access will be disabled.

## Usage

Command line options:

| Arg  | Description                                                                              |
| ---- | ---------------------------------------------------------------------------------------- |
| None | Defaults to `-h`                                                                         |
| `-h` | Output internet access periods in a human readable format                                |
| `-c` | Output a crontab that notifies you, when the internet is about to be enabled or disabled |
| `-j` | Output all the collected data in JSON format                                             |

## Installation

- Install dependencies: `npm i` (you may also need `tsc`: `npm i -g typescript`)
- Compile sources to javascript: `tsc`
- Run: `node dist/index.js`