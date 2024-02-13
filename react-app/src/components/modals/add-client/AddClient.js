import React, { useState, useEffect } from 'react';
import axios from 'axios';

import './AddClient.scss'

import CloseIcon from '../../../assets/icons/close-line-icon.svg';

const AddClient = (props) => {
  const { baseApiPath, setShowAddClientModal, setRefresh } = props;

  const [addingClient, setAddingClient] = useState(false);
  const [clientInfo, setClientInfo] = useState({
    name: "",
    topics: "",
    details: ""
  });

  const updateClientInfo = (field, value) => {
    setClientInfo(prevClientInfo => ({
      ...prevClientInfo,
      [field]: value,
    }));
  }

  const addClient = () => {
    setAddingClient(true);

    axios.post(
      `${baseApiPath}/add-note`,
      clientInfo
    )
    .then((res) => {
      if (res.status === 201) {
        alert('Note added');
        setShowAddClientModal(false);
        setRefresh(true);
      } else {
        alert('Failed to add note: ' + res.data.msg);
      }
    })
    .catch((err) => {
      alert(`Failed to add note:\n${err.response.data?.msg}`);
      console.error(err);
    })
    .finally(() => {
      setAddingClient(false);
    });
  }

  return (
    <div className="AddClient">
      <div className="AddClient__form">
        <h1>Note Info</h1>
        <input type="text" placeholder="name" value={clientInfo.name} onChange={(e) => updateClientInfo("name", e.target.value)}/>
        <input type="text" placeholder="topics" value={clientInfo.topics} onChange={(e) => updateClientInfo("topics", e.target.value)}/>
        <textarea placeholder="details" value={clientInfo.details} onChange={(e) => updateClientInfo("details", e.target.value)}/>
        <button type="button" className="AddClient__add" onClick={() => addClient()} disabled={addingClient}>Add</button>
        <button type="button" className="AddClient__form-close" onClick={() => setShowAddClientModal(false)}>
          <img src={CloseIcon} title="close modal" alt="close icon"/>
        </button>
      </div>
    </div>
  );
}

export default AddClient;