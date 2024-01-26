import React, { useState, useEffect } from 'react';

import './App.css';

import LeftSidebar from './components/left-sidebar/LeftSidebar';
import RightBody from './components/right-body/RightBody';
import AddClient from './components/modals/add-client/AddClient';

const isLocal = window.location.href.includes('localhost');

const baseApiPath = isLocal
  ? 'http://localhost:5135' : 'http://192.168.1.144:5135'; // developed for local API

const socketPath = isLocal
  ? 'ws://localhost:5136' : 'ws://192.168.1.144:5136';

function App() {
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [openClient, setOpenClient] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (openClient) {
      setRefresh(false);
    }
  }, [openClient]);

  return (
    <div className="App">
      <LeftSidebar
        baseApiPath={baseApiPath}
        openClient={openClient}
        setOpenClient={setOpenClient}
        refresh={refresh}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />
      <RightBody
        setShowAddClientModal={setShowAddClientModal}
        openClient={openClient}
        baseApiPath={baseApiPath}
        setRefresh={setRefresh}
        sidebarCollapsed={sidebarCollapsed}
        socketPath={socketPath}
      />
      {showAddClientModal && <AddClient
        baseApiPath={baseApiPath}
        setShowAddClientModal={setShowAddClientModal}
        setRefresh={setRefresh}
      />}
    </div>
  );
}

export default App;
