'use strict'

var _ = require('underscore');

// return array of block. block=array of lines belongs to 1 network device
function breakIntoBlocks(fullText) {
    var blocks = [];
    var lines = fullText.split('\n');
    var currentBlock = [];
    lines.forEach(function(line) {
        if (line.length > 0 && ['\t', ' '].indexOf(line[0]) === -1 && currentBlock.length > 0) { // start of a new block detected
            blocks.push(currentBlock);
            currentBlock = [];
        }
        if (line.trim()) {
            currentBlock.push(line);
        }
    });
    if (currentBlock.length > 0) {
       blocks.push(currentBlock); 
    }
    return blocks;
}

// input:
// eth0      Link encap:Ethernet  HWaddr 04:01:d3:db:fd:01  
//           inet addr:107.170.222.198  Bcast:107.170.223.255  Mask:255.255.240.0
//           inet6 addr: fe80::601:d3ff:fedb:fd01/64 Scope:Link
//           UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
//           RX packets:50028 errors:0 dropped:0 overruns:0 frame:0
//           TX packets:50147 errors:0 dropped:0 overruns:0 carrier:0
//           collisions:0 txqueuelen:1000 
//           RX bytes:13590446 (13.5 MB)  TX bytes:14465813 (14.4 MB)

// or 
// enp0s5: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
//         inet 10.0.1.26  netmask 255.255.255.0  broadcast 10.0.1.255
//         inet6 2601:600:947f:ac9f:f75d:49cc:171c:66c9  prefixlen 64  scopeid 0x0<global>
//         inet6 2601:600:947f:ac9f:491f:d0de:f736:aa8c  prefixlen 64  scopeid 0x0<global>
//         inet6 fe80::2bc6:2a2b:ceac:5936  prefixlen 64  scopeid 0x20<link>
//         ether 00:1c:42:83:b6:1d  txqueuelen 1000  (Ethernet)
//         RX packets 85464  bytes 39915446 (39.9 MB)
//         RX errors 0  dropped 0  overruns 0  frame 0
//         TX packets 26344  bytes 24665159 (24.6 MB)
//         TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
function parseSingleBlock(block) {
    var data = {};
    block.forEach(function(line) {
      console.log('line='+line);
        var match = null;
        if(match = line.match(/^(\S+)\s+Link/)) { // eth0      Link encap:Ethernet  HWaddr 04:01:d3:db:fd:01 
            data.device = match[1]; // eth0
            var link = {};
            match = line.match(/encap:(\S+)/);
            if (match) {
                link.encap = match[1];
            }
            match = line.match(/HWaddr\s+(\S+)/);
            if (match) {
                link.hwaddr = match[1];
            }
            data.link = link;
        } else if(match = line.match(/^\s+inet\s+/)) { // inet addr:107.170.222.198  Bcast:107.170.223.255  Mask:255.255.240.0
            var inet = {};
            if (match = line.match(/^\s+inet [addr\:]?(\S+)/)) {
                inet.addr = match[1];
            }
            if (match = line.match(/Bcast:(\S+)/)) {
                inet.bcast = match[1];
            }
            if (match = line.match(/Mask:(\S+)/)) {
                inet.mask = match[1];
            }
            data.inet = inet;
        } else if(match = line.match(/^\s+inet6\s+/)) { // inet6 fdb2:2c26:f4e4:1:ac21:8c13:fdad:b641  prefixlen 64 ...
            var inet6 = {};
            if (match = line.match(/inet6\s+(\S+)/)) {
                inet6.addr = match[1];
            }
            data.inet6 = inet6;
        } else if(match = line.match(/^\s+RX\s+packets/)) { // RX packets:50028 errors:0 dropped:0 overruns:0 frame:0
            var section = {};
            if (match = line.match(/packets[:\s]+(\S+)/)) {
                section.packets = parseInt(match[1]);
            }
            if (match = line.match(/bytes[:\s]+(\S+)/)) {
                section.bytes = parseInt(match[1]);
            }
            if (match = line.match(/errors[:\s]+(\S+)/)) {
                section.errors = parseInt(match[1]);
            }
            if (match = line.match(/dropped[:\s]+(\S+)/)) {
                section.dropped = parseInt(match[1]);
            }
            if (match = line.match(/overruns[:\s]+(\S+)/)) {
                section.overruns = parseInt(match[1]);
            }
            if (match = line.match(/frame[:\s]+(\S+)/)) {
                section.frame = parseInt(match[1]);
            }
            data.rx = section;
        } else if(match = line.match(/^\s+TX\s+packets/)) { // TX packets:50147 errors:0 dropped:0 overruns:0 carrier:0
            var section = {};
            if (match = line.match(/packets[:\s]+(\S+)/)) {
                section.packets = parseInt(match[1]);
            }
            if (match = line.match(/bytes[:\s]+(\S+)/)) {
                section.bytes = parseInt(match[1]);
            }
            if (match = line.match(/errors[:\s]+(\S+)/)) {
                section.errors = parseInt(match[1]);
            }
            if (match = line.match(/dropped[:\s]+(\S+)/)) {
                section.dropped = parseInt(match[1]);
            }
            if (match = line.match(/overruns[:\s]+(\S+)/)) {
                section.overruns = parseInt(match[1]);
            }
            if (match = line.match(/carrier[:\s]+(\S+)/)) {
                section.carrier = parseInt(match[1]);
            }
            data.tx = section;
          } else if(match = line.match(/^(\S+):\s+flags=/)) { // enp0s6: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500 
            data.device = match[1]; // enp0s6
          } else if(match = line.match(/^\s+ether\s/)) { // ether 00:1c:42:0d:e8:db  txqueuelen 1000  (Ethernet)
              match = line.match(/ether\s+(\S+)\s/);
              var link = {};
              if (match) {
                  link.hwaddr = match[1];
              }
              data.link = link;
          } else {
            var section = data.other || {};
            if (match = line.match(/collisions:(\S+)/)) {
                section.collisions = parseInt(match[1]);
            }
            if (match = line.match(/txqueuelen:(\S+)/)) {
                section.txqueuelen = parseInt(match[1]);
            }
            if (match = line.match(/RX bytes:(\S+)/)) {
                section.rxBytes = parseInt(match[1]);
            }
            if (match = line.match(/TX bytes:(\S+)/)) {
                section.txBytes = parseInt(match[1]);
            }
            data.other = section;
        }
    });
    return data;
}

// return a well-parsed object
function parser(fullText) {
  // console.log('fullText=' + fullText);
    var blocks = breakIntoBlocks(fullText);
    var map = {};
    _.map(blocks, function(block) {
      // console.log('block=' + block);
      var obj = parseSingleBlock(block);
      // console.log('obj=' + JSON.stringify(obj));
        map[obj.device] = obj;
    });

    return map;
}

module.exports = parser;