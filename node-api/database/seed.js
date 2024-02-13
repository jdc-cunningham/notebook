require('dotenv').config({
  path: '.env'
});

const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASS
});

// connect to mysql, assumes above works eg. mysql is running/credentials exist
connection.connect((err) => {
  if (err) {
      console.error('error connecting: ' + err.stack);
      return;
  }
});

// check if database exists, if not create it
connection.query('CREATE DATABASE IF NOT EXISTS `notebook`', (error, results, fields) => {
  if (error) {
      console.log('error checking if notebook database exists:', error.sqlMessage);
      return;
  }
});

// use the database
connection.query('USE notebook', (error, results, fields) => {
  if (error) {
      console.log('an error occurred trying to use the notebook database', error);
      return;
  }
});

// build the various tables and their schemas

connection.query(
  'CREATE TABLE `notes` (' +
      '`id` int(11) NOT NULL AUTO_INCREMENT,' +
      '`name` varchar(255) NOT NULL,' +
      '`topics` varchar(255),' +
      '`details` longtext,' +
      '`created` datetime NOT NULL,' +
      '`last_updated` datetime NOT NULL,' +
      'PRIMARY KEY (`id`),' +
      'INDEX `name` (`name`)' + // important for speed
     ') ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci',
  (error, results, fields) => {
      if (error) {
          console.log('error creating table notes:', error.sqlMessage);
          return;
      }
  }
)

connection.query(
  'CREATE TABLE `note_entries` (' +
      '`id` int(11) NOT NULL AUTO_INCREMENT,' +
      '`note_id` int(11) NOT NULL,' +
      '`note` longtext,' +
      '`created` datetime NOT NULL,' +
      'PRIMARY KEY (`id`)' +
     ') ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci',
  (error, results, fields) => {
      if (error) {
          console.log('error creating table notes:', error.sqlMessage);
          return;
      }
  }
)

connection.query(
  'CREATE TABLE `last_opened_notes` (' +
      '`id` int(11) NOT NULL AUTO_INCREMENT,' +
      '`note_id` int(11) NOT NULL,' +
      '`name` varchar(255) NOT NULL,' +
      '`opened` datetime NOT NULL,' +
      'PRIMARY KEY (`id`)' +
     ') ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci',
  (error, results, fields) => {
      if (error) {
          console.log('error creating table last_opened_notes:', error.sqlMessage);
          return;
      }
  }
)

connection.end();