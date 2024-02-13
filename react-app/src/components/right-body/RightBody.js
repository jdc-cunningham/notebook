import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

import './RightBody.scss'

import DeleteIcon from '../../assets/icons/recycle-bin-line-icon.svg';

import { prettyDate } from '../../utils';

const RightBody = (props) => {
  const { setShowAddClientModal, openClient, baseApiPath, setRefresh, sidebarCollapsed, socketPath } = props;
  const [updateTimeout, setUpdateTimeout] = useState(null);

  const clientNotesRef = useRef(null);
  const socket = useRef(null);
  const updateTimeoutRef = useRef(null);

  const deleteClientNote = (clientNoteId, clientId, el) => {
    if (window.confirm("Delete entry?") === true) {
      axios.post(
        `${baseApiPath}/delete-note-entry`,
        {
          note_entry_id: clientNoteId,
          note_id: clientId
        }
      )
      .then((res) => {
        if (res.status === 200) {
          el.remove();
          socket.current.send(JSON.stringify({
            from: process.env.REACT_APP_WHO,
            msg: 'refresh'
          }));
        } else {
          alert('Failed to delete note entry: ' + res.data.msg);
        }
      })
      .catch((err) => {
        alert(`Failed to delete note entry:\n${err.response.data?.msg}`);
        console.error(err);
      }); 
    }
  }

  // https://stackoverflow.com/a/36281449
  const getBase64 = (file, callback, id, client_id) => {
    const reader = new FileReader();
    
    reader.readAsDataURL(file);
    
    reader.onload = function () {
      callback({
        err: false,
        data: reader.result,
        id,
        client_id
      });
    };
    
    reader.onerror = function (error) {
      callback({
        err: true,
        msg: 'Failed to get image: ', error
      });
    };
  }
  
  const updateClientNote = (note_entry_id, note_id, note_content) => {
    axios.post(
      `${baseApiPath}/update-note-entry`,
      {
        note_entry_id,
        note_id,
        note_content
      }
    )
    .then((res) => {
      if (res.status === 200) {
        socket.current.send(JSON.stringify({
          from: process.env.REACT_APP_WHO,
          msg: 'refresh'
        }));
      } else {
        alert('Failed to update note entry: ' + res.data.msg);
      }
    })
    .catch((err) => {
      alert('Failed to update note entry');
      console.error(err);
    });
  }

  const imgDrop = (img) => {
    if (img?.data) {
      const imgNode = document.createElement("img");

      imgNode.setAttribute("width", "100%");
      
      imgNode.setAttribute("src", img.data);

      const parentEl = document.getElementById('replace-img').parentNode.parentNode;

      document.getElementById('replace-img').replaceWith(imgNode);

      updateClientNote(img.id, img.client_id, parentEl.innerHTML);
    }
  }

  // https://stackoverflow.com/a/6691294
  // the drop event provides the image via datatransfer, then caret is determined,
  // temporary node inserted, replaced by async image load base64 callback
  const renderClientNotes = (clientNotes) => {
    const noteMarkup = clientNotes?.reverse().map(clientNote => (
      // nasty duplicate data attributes
      `
      <div class="RightBody__client-note">
        <p><b>Created:</b> ${prettyDate(clientNote.created)}</p>
        <div class="RightBody__client-note-editable" contentEditable="true" data-id="${clientNote.id}" data-client-id="${clientNote.note_id}">
          ${clientNote.note || '<div>Type here</div>'}
        </div>
        <button type="button" class="RightBody__client-note-delete" title="delete note" data-id="${clientNote.id}" data-client-id="${clientNote.note_id}">
          <img src="${DeleteIcon}" width="100%" alt="delete icon"/>
        </button>
      </div>
      `  
    ));

    clientNotesRef.current.innerHTML = noteMarkup ? noteMarkup.join('') : '';

    // bind events
    document.querySelectorAll('.RightBody__client-note-editable').forEach(editable => {
      editable.addEventListener('keyup', (e) => {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = setTimeout(() => {
          const id = editable.getAttribute('data-id');
          const clientId = editable.getAttribute('data-client-id');
          updateClientNote(id, clientId, e.target.innerHTML);
        }, 500)
      });

      editable.addEventListener('drop', (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        // add marker to be replaced by async image callback
        const range = document.getSelection().getRangeAt(0);
        const tmpNode = document.createElement("div");

        tmpNode.setAttribute("id", "replace-img");

        range.surroundContents(tmpNode);

        const id = editable.getAttribute('data-id');
        const clientId = editable.getAttribute('data-client-id');

        getBase64(e.dataTransfer.files[0], imgDrop, id, clientId);
      });
    });

    document.querySelectorAll('.RightBody__client-note-delete').forEach(deleteIcon => {
      deleteIcon.addEventListener('click', (e) => {
        const id = deleteIcon.getAttribute('data-id');
        const clientId = deleteIcon.getAttribute('data-client-id');
        deleteClientNote(id, clientId, deleteIcon.parentNode);
      });
    });
  };

  const addClientNote = (note_id) => {
    axios.post(
      `${baseApiPath}/add-note-entry`,
      {
        note_id
      }
    )
    .then((res) => {
      if (res.status === 201) {
        socket.current.send(JSON.stringify({
          from: process.env.REACT_APP_WHO,
          msg: 'refresh'
        }));

        setRefresh(true);
      } else {
        alert('Failed to add note entry: ' + res.data.msg);
      }
    })
    .catch((err) => {
      alert(`Failed to add note entry:\n${err.response.data?.msg}`);
      console.error(err);
    });
  }

  const renderClient = () => (
    <div className="RightBody__client">
      <h1>{openClient.name}</h1>
      <p>{openClient.details}</p>
      <button type="button" className="RightBody__client-add-note" onClick={() => addClientNote(openClient.id)}>Add note entry</button>
      <div ref={clientNotesRef}></div>
    </div>
  );

  const socketPing = (ws) => {
    ws.send(JSON.stringify({
      from: process.env.REACT_APP_WHO
    }));
  }

  const socketPong = (ws) => {
    setTimeout(() => {
      socketPing(ws);
    }, 3000);
  }

  useEffect(() => {
    if (openClient) {
      renderClientNotes(openClient.noteEntries?.data);
    }
  }, [openClient]);

  const connectSocket = () => {
    const serverSocket = new WebSocket(socketPath);

    socket.current = serverSocket;

    serverSocket.onopen = (event) => {
      socketPing(serverSocket);
    };

    serverSocket.onmessage = (event) => {
      socketPong(serverSocket);

      const msgStr = event.data;

      if (msgStr) {
        const data = JSON.parse(msgStr);

        if (data.msg === 'refresh') {
          setRefresh(true);
        }
      }
    };

    serverSocket.onerror = (event) => {
      console.log('socket err:', event);
    };

    serverSocket.onclose = () => {
      setTimeout(() => {
        connectSocket();
      }, 1000);
    };
  }

  useEffect(() => {
    connectSocket();
  }, []);

  return (
    <div className={`RightBody ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {!openClient && <h1>Select or add a note</h1>}
      {!openClient && <button className="RightBody__add-client" type="button" onClick={() => setShowAddClientModal(true)}>Add</button>}
      {openClient && renderClient()}
      {openClient && <button className="RightBody__client-view-add-client" type="button" onClick={() => setShowAddClientModal(true)}>Add note</button>}
    </div>
  );
}

export default RightBody;