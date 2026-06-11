function successResponse(data = null, message = 'Success') {
  return {
    code: 200,
    message,
    data,
    timestamp: Date.now()
  };
}

function errorResponse(message = 'Internal Server Error', code = 500, data = null) {
  return {
    code,
    message,
    data,
    timestamp: Date.now()
  };
}

function responseFormatter(req, res, next) {
  res.success = (data, message) => {
    res.json(successResponse(data, message));
  };
  
  res.error = (message, code, data) => {
    res.status(code >= 400 && code < 600 ? code : 500)
       .json(errorResponse(message, code, data));
  };
  
  next();
}

module.exports = {
  responseFormatter,
  successResponse,
  errorResponse
};
