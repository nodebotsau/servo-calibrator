# servo-calibrator

A simple servo calibrator to get your centre point right on a 360 degree servo

## Installation

Install using:

```
git clone https://github.com/nodebotsau/servo-calibrator.git && cd servo-calibrator
npm install
```

There aren't many dependencies.

### Windows users

This hasn't been tested on Windows with a terminal - it may work or not...

## Usage

Wire up a servo just like normal and connect your arduino to your computer.

You can run the terminal application with:

```
$ ./bin/calibrate
```

Once in the application select the board you wish to connect to (enter with no
board specified will do the usual Johnny Five thing and try and find something
sensible). Once the board is connected, attach a servo by specifying which
pin you've connected it to.

Now you can use < and > to move the centre point back and forwards until the
servo stops nicely. The status bar will tell you what values you have.

Pressing S will save the current value and pressing <space> will simulate a
test whereby the servo will spin for 3 seconds then attempt to stop.


