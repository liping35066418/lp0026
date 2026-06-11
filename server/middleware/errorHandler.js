const dayjs = require('dayjs');

function errorHandler(err, req, res, next) {
  const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
  
  console.error(`[${timestamp}] Error:`, err.message);
  console.error(err.stack);
  
  if (err.message.includes('not found') || err.message.includes('Not found')) {
    return res.error(err.message, 404);
  }
  
  if (err.message.includes('already exists') || err.message.includes('duplicate')) {
    return res.error(err.message, 409);
  }
  
  if (err.message.includes('cannot delete') || err.message.includes('Cannot delete')) {
    return res.error(err.message, 400);
  }
  
  if (err.message.includes('Insufficient') || err.message.includes('insufficient')) {
    return res.error(err.message, 400);
  }
  
  if (err.message.includes('already') && err.message.includes('red offset')) {
    return res.error(err.message, 400);
  }
  
  if (err.message.includes('already') && err.message.includes('adjusted')) {
    return res.error(err.message, 400);
  }
  
  if (err.message.includes('already') && err.message.includes('void')) {
    return res.error(err.message, 400);
  }
  
  if (err.message.includes('already') && err.message.includes('warehoused')) {
    return res.error(err.message, 400);
  }
  
  return res.error(err.message || 'Internal Server Error', 500);
}

function notFoundHandler(req, res, next) {
  res.error(`Route not found: ${req.method} ${req.url}`, 404);
}

module.exports = {
  errorHandler,
  notFoundHandler
};
