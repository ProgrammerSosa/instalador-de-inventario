const { error } = require('../utils/httpResponses');

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status === 500) {
    console.error(err);
  }
  error(res, err.message || 'Error interno', status);
}

module.exports = { errorHandler };
