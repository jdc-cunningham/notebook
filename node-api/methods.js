const { pool } = require('./database/db_connect');
const { formatTimeStr, getDateTime } = require('./utils');

require('dotenv').config({
  path: './.env'
});

const _clientExists = async (clientName) => (
  new Promise ((resolve, reject) => {
    pool.query(
      `SELECT id FROM clients WHERE name = ?`,
      [clientName],
      (err, qres) => {
        if (err) {
          reject(new Error("failed to search client"));
        } else {
          resolve({
            err: false,
            exists: qres.length ? true : false
          });
        }
      }
    );
  })
);

const addClient = async (req, res) => {
  const { name, topics, rate, rate_type, details } = req.body;
  const now = formatTimeStr(getDateTime());

  let client = null;
  let clientSearchErr = false;

  try {
    client = await _clientExists(name);
  } catch (e) {
    console.error(e);
    clientSearchErr = true;
  }

  if (clientSearchErr) {
    res.status(400).send({
      err: true,
      msg: 'failed to check if client exists'
    });

    return;
  }

  if (client?.exists) {
    res.status(400).send({
      err: true,
      msg: 'client exists'
    });

    return;
  }

  pool.query(
    `INSERT INTO clients SET id = ?, name = ?, topics = ?, rate = ?, rate_type = ?, details = ?, created = ?, last_updated = ?`,
    [null, name, topics, rate, rate_type, details, now, now],
    (err, qres) => {
      if (err) {
        console.error('failed to insert client', err);

        res.status(400).send({
          err: true,
          msg: 'failed to add client'
        });
      } else {
        res.status(201).send({
          err: false,
        });
      }
    }
  );
};

const _getClientNotes = (client_id) => (
  new Promise((resolve, reject) => {
    pool.query(
      `SELECT * FROM client_notes WHERE client_id = ? order by id ASC`,
      [client_id],
      (err, qres) => {
        if (err) {
          console.error('failed to get client notes', err);
  
          reject({
            err: true,
            msg: 'failed to get client'
          });
        } else {
          resolve({
            err: false,
            data: qres
          });
        }
      }
    );
  })
);

const getClient = async (req, res) => {
  const { id } = req.body;

  pool.query(
    `SELECT * FROM clients WHERE id = ?`,
    [id],
    async (err, qres) => {
      if (err) {
        console.error('failed to get client', err);

        res.status(400).send({
          err: true,
          msg: 'failed to get client'
        });
      } else {
        try {
          const clientNotes = await _getClientNotes(qres[0].id);

          res.status(200).send({
            err: false,
            client: {
              ...qres[0],
              clientNotes
            }
          });
        } catch (e) {
          console.error(e);

          res.status(400).send({
            err: true,
            msg: 'failed to get client notes'
          });
        }
      }
    }
  );
};

const searchClients = async (req, res) => {
  const { partialName } = req.body;
  const partialNameWildcard = '%' + partialName + '%';

  pool.query(
    `SELECT * FROM clients WHERE name LIKE ?`,
    [partialNameWildcard],
    (err, qres) => {
      if (err) {
        console.error('failed to search clients', err);

        res.status(400).send({
          err: true,
          msg: 'failed to search clients'
        });
      } else {
        res.status(200).send({
          err: false,
          clients: qres
        });
      }
    }
  );
};

const deleteClient = async (req, res) => {
  const { id } = req.body;

  // technically bad pattern since it should be assured both steps complete

  pool.query(
    `DELETE FROM client_notes WHERE client_id = ?`,
    [id],
    (err, qres) => {
      if (err) {
        console.error('failed to delete client_notes', err);

        res.status(400).send({
          err: true,
          msg: 'failed to delete client notes'
        });

        return;
      }
    }
  );

  pool.query(
    `DELETE FROM clients WHERE id = ?`,
    [id],
    (err, qres) => {
      if (err) {
        console.error('failed to delete client', err);

        res.status(400).send({
          err: true,
          msg: 'failed to delete client'
        });
      } else {
        res.status(200).send({
          err: false
        });
      }
    }
  );
};

const updateClient = async (req, res) => {};

const addClientNote = async (req, res) => {
  const { client_id } = req.body;
  const now = formatTimeStr(getDateTime());

  pool.query(
  `INSERT INTO client_notes SET id = ?, client_id = ?, note = ?, created = ?`,
    [null, client_id, null, now],
    (err, qres) => {
      if (err) {
        console.error('failed to add client note', err);

        res.status(400).send({
          err: true,
          msg: 'failed to add client note'
        });
      } else {
        res.status(201).send({
          err: false,
        });
      }
    }
  );
};

const updateClientNote = async (req, res) => {
  const { note_id, client_id, note_content } = req.body;

  pool.query(
    `UPDATE client_notes set note = ? WHERE id = ? AND client_id = ?`,
    [note_content, note_id, client_id],
    (err, qres) => {
      if (err) {
        console.error('failed to update client note', err);

        res.status(400).send({
          err: true,
          msg: 'failed to update client note'
        });
      } else {
        res.status(200).send({
          err: false,
        });
      }
    }
  );
};

// used to populate app
const getLastOpenedClients = async (req, res) => {
  pool.query(
    `SELECT * FROM last_opened_clients WHERE id > 0 ORDER BY opened DESC`,
    (err, qres) => {
      if (err) {
        console.error('failed to get last opened clients', err);

        res.status(400).send({
          err: true,
          msg: 'failed to get last opened clients'
        });
      } else {
        res.status(200).send({
          err: false,
          clients: qres
        });
      }
    }
  );
};

const addOpenedClient = async (req, res) => {
  const { client_id, name } = req.body;
  const now = formatTimeStr(getDateTime());

  pool.query(
    `INSERT INTO last_opened_clients SET id = ?, client_id = ?, name = ?, opened = ?`,
    [null, client_id, name, now],
    (err, qres) => {
      if (err) {
        console.error('failed to add opened client', err);

        res.status(400).send({
          err: true,
          msg: 'failed to add opened client'
        });
      } else {
        res.status(201).send({
          err: false,
        });
      }
    }
  );
};

const deleteLastOpenedClient = async (req, res) => {};

const updateOpenClient = async (req, res) => {
  const { client_id } = req.body;
  const now = formatTimeStr(getDateTime());

  pool.query(
  `UPDATE last_opened_clients SET opened = ? WHERE client_id = ?`,
    [now, client_id],
    (err, qres) => {
      if (err) {
        console.error('failed to update open client', err);

        res.status(400).send({
          err: true,
          msg: 'failed to update open client'
        });
      } else {
        res.status(200).send({
          err: false,
        });
      }
    }
  );
};

const deleteClientNote = async (req, res) => {
  const { client_note_id, client_id } = req.body;

  console.log(client_note_id, client_id);

  pool.query(
  `DELETE FROM client_notes WHERE id = ? AND client_id = ?`,
    [client_note_id, client_id],
    (err, qres) => {
      console.log(qres);
      if (err) {
        console.error('failed to delete client note', err);

        res.status(400).send({
          err: true,
          msg: 'failed to delete client note'
        });
      } else {
        res.status(200).send({
          err: false,
        });
      }
    }
  );
}

module.exports = {
  addClient,
  getClient,
  searchClients,
  deleteClient,
  updateClient,
  addClientNote,
  updateClientNote,
  getLastOpenedClients,
  addOpenedClient,
  deleteLastOpenedClient,
  addClientNote,
  updateClientNote,
  updateOpenClient,
  deleteClientNote
}
