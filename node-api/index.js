const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const WebSocket = require('ws');

const app = express();
const port = 5145;

app.use(cors());

const {
  addNote, getNote, searchNotes, deleteNote, getLastOpenedNotes,
  addOpenedNote, deleteLastOpenedNote, addNoteEntry, updateNoteEntry,
  deleteNoteEntry, updateOpenNote
} = require('./methods');

app.use(express.json({limit: '50mb'}));

app.use(
  bodyParser.json(),
  bodyParser.urlencoded({
    extended: true
  })
);

app.post('/add-note', addNote);
app.post('/get-note', getNote); // could use GET with /client-id/ pattern but eh...
app.post('/search-notes', searchNotes);
app.post('/delete-note', deleteNote); // not using REST methods eg. DELETE
app.get('/last-opened-notes', getLastOpenedNotes);
app.post('/add-opened-note', addOpenedNote);
app.post('/delete-last-opened-note', deleteLastOpenedNote);
app.post('/add-note-entry', addNoteEntry);
app.post('/update-note-entry', updateNoteEntry)
app.post('/update-open-note', updateOpenNote);
app.post('/delete-note-entry', deleteNoteEntry);

const wss = new WebSocket.Server({ port: 5146 });

let connections = {};

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(data, isBinary) {
    const msgStr = isBinary ? data : data.toString();
    const msg = JSON.parse(msgStr);
    
    if (msg?.from && !(msg.from in connections)) {
      connections[msg.from] = ws;
    }

    if (msg?.msg === "refresh" && Object.keys(connections).length > 1) {
      const lastMsgFrom = msg.from;

      Object.keys(connections).forEach(connection => {
        if (connection !== lastMsgFrom) {
          // this is the main purpose of this socket bridge, it's crude, does not consider in flight txs
          connections[connection].send(JSON.stringify({
            msg: 'refresh'
          }));
        }
      })
    }
  });

  ws.on('close', () => {
    const newObj = {};

    // https://stackoverflow.com/a/23369370
    Object.keys(connections).forEach(connection => {
      if (connections[connection].readyState === 1) {
        newObj[connection] = connections[connection];
      }
    });

    connections = newObj;
  });
});

app.listen(port, () => {
  console.log(`App running... on port ${port}`);
});
