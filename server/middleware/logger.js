const dayjs = require('dayjs');

function requestLogger(req, res, next) {
  const startTime = Date.now();
  const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
  
  console.log(`[${timestamp}] ${req.method} ${req.url} - Start`);
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const status = res.statusCode;
    const statusColor = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : '\x1b[32m';
    const resetColor = '\x1b[0m';
    
    console.log(`[${timestamp}] ${req.method} ${req.url} - ${statusColor}${status}${resetColor} - ${duration}ms`);
  });
  
  next();
}

module.exports = requestLogger;
