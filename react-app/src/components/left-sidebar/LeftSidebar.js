import React, { useState, useEffect } from 'react';
import axios from 'axios';

import './LeftSidebar.scss'

import ChevronCircleLeft from '../../assets/icons/angle-circle-left-icon.svg';

const LeftSidebar = (props) => {
  const { baseApiPath, setOpenClient, refresh, sidebarCollapsed, setSidebarCollapsed } = props;

  const [searchTerm, setSearchTerm] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [openedClients, setOpenedClients] = useState([]);

  const renderClientTabs = () => (
    searchResults.map((searchResult, index) => (
      <div key={index} className="LeftSidebar__search-result" title="open" onClick={() => {updateOpenedClients(searchResult)}}>
        <h2>{searchResult.name}</h2>
      </div>
    ))
  );

  const openSelectedClient = (client_id) => {
    axios.post(
      `${baseApiPath}/update-open-client`,
      { client_id }
    )
    .then((res) => {
      if (res.status === 200) {
        getLastOpenedClients();
      } else {
        alert('Failed to open client: ' + res.data.msg);
      }
    })
    .catch((err) => {
      alert(`Failed to get opened client:\n${err.response.data?.msg}`);
      console.error(err);
    });
  };

  const renderOpenedClientTabs = () => (
    openedClients.map((openedClient, index) => (
      <div key={index} className="LeftSidebar__client" onClick={() => openSelectedClient(openedClient.client_id)}>
        <h2>{openedClient.name}</h2>
      </div>
    ))
  );

  const getOpenClient = (clientId) => {
    axios.post(
      `${baseApiPath}/get-client`,
      { id: clientId }
    )
    .then((res) => {
      if (res.status === 200) {
        setOpenClient(res.data.client);
      } else {
        alert('Failed to get opened client: ' + res.data.msg);
      }
    })
    .catch((err) => {
      alert(`Failed to get opened client:\n${err.response.data?.msg}`);
      console.error(err);
    });
  }

  const getLastOpenedClients = () => {
    axios.get(
      `${baseApiPath}/last-opened-clients`,
    )
    .then((res) => {
      if (res.status === 200) {
        if (res.data.clients.length) {
          setOpenedClients(res.data.clients);
          getOpenClient(res.data.clients[0].client_id);
        }
      } else {
        alert('Failed to get last opened clients: ' + res.data.msg);
      }
    })
    .catch((err) => {
      alert('Failed to get last opened clients');
      console.error(err);
    });
  }

  const updateOpenedClients = (openedClient) => {
    setOpenedClients(prevOpenedClients => ([
      prevOpenedClients,
      openedClient
    ]));

    axios.post(
      `${baseApiPath}/add-opened-client`,
      {
        client_id: openedClient.id,
        name: openedClient.name
      }
    )
    .then((res) => {
      if (res.status === 201) {
        setOpenClient(openedClient);
        setSearchTerm('');
        setSearchResults([]);
        getLastOpenedClients();
      } else {
        alert('Failed to add opened client: ' + res.data.msg);
      }
    })
    .catch((err) => {
      alert(`Failed to search clients:\n${err.response.data?.msg}`);
      console.error(err);
    });
  }

  useEffect(() => {
    if (refresh) {
      getLastOpenedClients();
    }
  }, [refresh]);

  useEffect(() => {
    if (searchTerm) {
      clearTimeout(searchTimeout);
      setSearchTimeout(setTimeout(() => {
        axios.post(
          `${baseApiPath}/search-clients`,
          { partialName: searchTerm }
        )
        .then((res) => {
          if (res.status === 200) {
            setSearchResults(res.data.clients);
          } else {
            alert('Failed to search clients: ' + res.data.msg);
          }
        })
        .catch((err) => {
          alert(`Failed to search clients:\n${err.response.data?.msg}`);
          console.error(err);
        });
      }, 250));
    }
  }, [searchTerm]);

  useState(() => {
    getLastOpenedClients();
  }, []);

  return (
    <div className={`LeftSidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      {!sidebarCollapsed && <input
        className="LeftSidebar__search-bar"
        type="text" placeholder="search name, topic"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />}
      {!sidebarCollapsed && searchTerm && !searchResults.length && <h2 className="LeftSidebar__no-clients-found">No clients found</h2>}
      {!sidebarCollapsed && searchTerm && searchResults.length > 0 && renderClientTabs()}
      {!sidebarCollapsed && !searchTerm && openedClients.length > 0 && <h3>Last viewed clients</h3>}
      {!sidebarCollapsed && !searchTerm && openedClients.length > 0 && renderOpenedClientTabs()}
      <button
        type="button"
        className={`LeftSidebar__collapse-icon ${sidebarCollapsed ? 'collapsed' : ''}`}
        title={sidebarCollapsed ? 'expand' : 'collapse'}
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
      >
        <img src={ChevronCircleLeft} alt="collapse sidebar" />
      </button>
    </div>
  );
}

export default LeftSidebar;