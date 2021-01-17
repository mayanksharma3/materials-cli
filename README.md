# Materials CLI 

![npm](https://img.shields.io/npm/v/materials-cli)
![NPM](https://img.shields.io/npm/l/materials-cli)

CLI for Imperial's Department of Computing Materials Page.

Pulls all the latest resources from your course into your folder, pulling only the ones you haven't got in your folder.

![CLI demo](media/demo.gif)

## Installation

### Ubuntu Prerequisites

`sudo apt-get install libsecret-1-dev gnome-keyring`

### Package Installation

`npm install -g materials-cli`


## Usage

Type `materials` in the terminal to access the CLI.

Full options: 

```
usage: materials [-h] [-v] [-c] [shortcut]

Materials CLI Tool

positional arguments:
  shortcut       Shortcut to course

optional arguments:
  -h, --help     show this help message and exit
  -v, --version  show program's version number and exit
  -c, --clean

```

### Shortcuts

You can set shortcuts to courses by using the `shortcut` argument. If no shortcut is found, selecting the course will assign
the shortcut to the chosen course. The next time you run `materials` it will automatically fetch courses for the course chosen before.

### Credentials

Credentials are stored in the OS's keychain and retrieved on every call to `materials`.

The credentials are never sent to anywhere other than `https://materials.doc.ic.ac.uk` and `https://api-materials.doc.ic.ac.uk`.

The package [keytar](https://www.npmjs.com/package/keytar) is used for this. 

### Clear config

To clear configuration just type: `materials clean`

## TODO

Currently, this uses a mix of the current materials page (https://materials.doc.ic.ac.uk) and the new API (https://api-materials.doc.ic.ac.uk).

The new API is slow to fetch resources, and the `/file` endpoint doesn't seem to work so that's why the old version is used for file fetching.

When the new API is ready to serve files, the legacy method should be removed.

1. Remove old API method using session cookies
2. Add "favourite" courses to pull all latest content from all subscribed courses
3. Find way to schedule pulling of files in the mornings
4. Test on Linux and Windows
