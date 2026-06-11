const path = require('path');

module.exports = {
  dbPath: path.join(__dirname, '../../data/retail.db'),
  options: {
    verbose: null,
    fileMustExist: false
  },
  port: 8646,
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100
  }
};
