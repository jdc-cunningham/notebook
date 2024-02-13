const { pool } = require('./database/db_connect');
const { formatTimeStr, getDateTime } = require('./utils');

require('dotenv').config({
  path: './.env'
});

const _noteExists = async (noteName) => (
  new Promise ((resolve, reject) => {
    pool.query(
      `SELECT id FROM notes WHERE name = ?`,
      [noteName],
      (err, qres) => {
        if (err) {
          reject(new Error("failed to search note"));
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

const addNote = async (req, res) => {
  const { name, topics, details } = req.body;
  const now = formatTimeStr(getDateTime());

  let note = null;
  let noteSearchErr = false;

  try {
    note = await _noteExists(name);
  } catch (e) {
    console.error(e);
    noteSearchErr = true;
  }

  if (noteSearchErr) {
    res.status(400).send({
      err: true,
      msg: 'failed to check if note exists'
    });

    return;
  }

  if (note?.exists) {
    res.status(400).send({
      err: true,
      msg: 'note exists'
    });

    return;
  }

  pool.query(
    `INSERT INTO notes SET id = ?, name = ?, topics = ?, details = ?, created = ?, last_updated = ?`,
    [null, name, topics, details, now, now],
    (err, qres) => {
      if (err) {
        console.error('failed to insert note', err);

        res.status(400).send({
          err: true,
          msg: 'failed to add note'
        });
      } else {
        res.status(201).send({
          err: false,
        });
      }
    }
  );
};

const _getNoteEntries = (note_id) => (
  new Promise((resolve, reject) => {
    pool.query(
      `SELECT * FROM note_entries WHERE note_id = ? order by id ASC`,
      [note_id],
      (err, qres) => {
        if (err) {
          console.error('failed to get note entries', err);
  
          reject({
            err: true,
            msg: 'failed to get note entries'
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

const getNote = async (req, res) => {
  const { id } = req.body;

  pool.query(
    `SELECT * FROM notes WHERE id = ?`,
    [id],
    async (err, qres) => {
      if (err) {
        console.error('failed to get note', err);

        res.status(400).send({
          err: true,
          msg: 'failed to get note'
        });
      } else {
        try {
          const noteEntries = await _getNoteEntries(qres[0].id);

          res.status(200).send({
            err: false,
            client: {
              ...qres[0],
              noteEntries
            }
          });
        } catch (e) {
          console.error(e);

          res.status(400).send({
            err: true,
            msg: 'failed to get note entries'
          });
        }
      }
    }
  );
};

const searchNotes = async (req, res) => {
  const { partialName } = req.body;
  const partialNameWildcard = '%' + partialName + '%';

  pool.query(
    `SELECT * FROM notes WHERE name LIKE ?`,
    [partialNameWildcard],
    (err, qres) => {
      if (err) {
        console.error('failed to search notes', err);

        res.status(400).send({
          err: true,
          msg: 'failed to search notes'
        });
      } else {
        res.status(200).send({
          err: false,
          notes: qres
        });
      }
    }
  );
};

const deleteNote = async (req, res) => {
  const { id } = req.body;

  // technically bad pattern since it should be assured both steps complete

  pool.query(
    `DELETE FROM note_entries WHERE note_id = ?`,
    [id],
    (err, qres) => {
      if (err) {
        console.error('failed to delete note entries', err);

        res.status(400).send({
          err: true,
          msg: 'failed to delete note entries'
        });

        return;
      }
    }
  );

  pool.query(
    `DELETE FROM notes WHERE id = ?`,
    [id],
    (err, qres) => {
      if (err) {
        console.error('failed to delete note', err);

        res.status(400).send({
          err: true,
          msg: 'failed to delete note'
        });
      } else {
        res.status(200).send({
          err: false
        });
      }
    }
  );
};

const updateNote = async (req, res) => {};

const addNoteEntry = async (req, res) => {
  const { note_id } = req.body;
  const now = formatTimeStr(getDateTime());

  pool.query(
  `INSERT INTO note_entries SET id = ?, note_id = ?, note = ?, created = ?`,
    [null, note_id, null, now],
    (err, qres) => {
      if (err) {
        console.error('failed to add note entry', err);

        res.status(400).send({
          err: true,
          msg: 'failed to add note entry'
        });
      } else {
        res.status(201).send({
          err: false,
        });
      }
    }
  );
};

const updateNoteEntry = async (req, res) => {
  const { note_entry_id, note_id, note_content } = req.body;

  pool.query(
    `UPDATE note_entries set note = ? WHERE id = ? AND note_id = ?`,
    [note_content, note_entry_id, note_id],
    (err, qres) => {
      if (err) {
        console.error('failed to update note entry', err);

        res.status(400).send({
          err: true,
          msg: 'failed to update note entry'
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
const getLastOpenedNotes = async (req, res) => {
  pool.query(
    `SELECT * FROM last_opened_notes WHERE id > 0 ORDER BY opened DESC`,
    (err, qres) => {
      if (err) {
        console.error('failed to get last opened notes', err);

        res.status(400).send({
          err: true,
          msg: 'failed to get last opened notes'
        });
      } else {
        res.status(200).send({
          err: false,
          notes: qres
        });
      }
    }
  );
};

const addOpenedNote = async (req, res) => {
  const { note_id, name } = req.body;
  const now = formatTimeStr(getDateTime());

  pool.query(
    `INSERT INTO last_opened_notes SET id = ?, note_id = ?, name = ?, opened = ?`,
    [null, note_id, name, now],
    (err, qres) => {
      if (err) {
        console.error('failed to add opened note', err);

        res.status(400).send({
          err: true,
          msg: 'failed to add opened note'
        });
      } else {
        res.status(201).send({
          err: false,
        });
      }
    }
  );
};

const deleteLastOpenedNote = async (req, res) => {};

const updateOpenNote = async (req, res) => {
  const { note_id } = req.body;
  const now = formatTimeStr(getDateTime());

  pool.query(
  `UPDATE last_opened_notes SET opened = ? WHERE note_id = ?`,
    [now, note_id],
    (err, qres) => {
      if (err) {
        console.error('failed to update open note', err);

        res.status(400).send({
          err: true,
          msg: 'failed to update open note'
        });
      } else {
        res.status(200).send({
          err: false,
        });
      }
    }
  );
};

const deleteNoteEntry = async (req, res) => {
  const { note_entry_id, note_id } = req.body;

  pool.query(
  `DELETE FROM note_entries WHERE id = ? AND note_id = ?`,
    [note_entry_id, note_id],
    (err, qres) => {
      console.log(qres);
      if (err) {
        console.error('failed to delete note entry', err);

        res.status(400).send({
          err: true,
          msg: 'failed to delete note entry'
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
  addNote,
  getNote,
  searchNotes,
  deleteNote,
  updateNote,
  addNoteEntry,
  updateNoteEntry,
  getLastOpenedNotes,
  addOpenedNote,
  deleteLastOpenedNote,
  addNoteEntry,
  updateNoteEntry,
  updateOpenNote,
  deleteNoteEntry
}
