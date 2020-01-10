class HttpError extends Error {
  constructor(message, ErrorCode) {
    super(message); // Add a 'message' property
    this.code = ErrorCode
  }
}

module.exports = HttpError;
