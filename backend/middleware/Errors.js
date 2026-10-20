import ErrorHandler from "../utils/errorHandler.js";

/**
 * Turns anything that was thrown (ErrorHandler, mongoose, JWT, Fastify, multipart ...) into { statusCode, body }.
 * The same function backs Fastify's setErrorHandler AND the `next(err)` / tryCatch path used by controllers,
 * so every error looks the same: { success: false, message, error }.
 */
export const normalizeError = (input) => {
    let err = input instanceof Error ? input : new ErrorHandler(500, String(input?.message || input || 'Internal Server Error'));
    err.statusCode = err.statusCode || err.status || 500;
    err.message = err.message || 'Internal Server Error';

    // wrong mongodb id
    if (err.name === "CastError") err = new ErrorHandler(400, `Resource not found. Invalid : ${err.path}`);
    // Mongoose schema validation (required, min length, custom validators ...) -> 400 with every message
    else if (err.name === "ValidationError" && err.errors) err = new ErrorHandler(400, Object.values(err.errors).map((e) => e.message).join(', '));
    // Mongoose duplicate key
    else if (err.code === 11000) err = new ErrorHandler(400, `Dublicate ${Object.keys(err.keyValue || {})} Entered`);
    // JWT
    else if (err.name === "JsonWebTokenError") err = new ErrorHandler(401, `Json web token is invalid, try again `);
    else if (err.name === "TokenExpiredError") err = new ErrorHandler(401, `Json web token is Expired, try again `);
    // Fastify: JSON-schema validation of params / query / body
    else if (err.validation) err = new ErrorHandler(400, err.message);
    // Fastify / multipart codes
    else if (err.code === 'FST_REQ_FILE_TOO_LARGE') err = new ErrorHandler(413, 'Uploaded file is too large');
    else if (err.code === 'FST_ERR_CTP_BODY_TOO_LARGE') err = new ErrorHandler(413, 'Request body is too large');
    else if (err.code === 'FST_FILES_LIMIT' || err.code === 'FST_PARTS_LIMIT' || err.code === 'FST_FIELDS_LIMIT') err = new ErrorHandler(400, 'Too many files or fields in the request');
    else if (err.code === 'FST_ERR_CTP_INVALID_MEDIA_TYPE') err = new ErrorHandler(415, 'Unsupported content type');

    const statusCode = err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 500;
    // `err.data` = machine readable extras for the UI (e.g. { code: 'FEATURED_CONFLICT', current: {...} } to ask for confirmation)
    return { statusCode, error: err, body: { success: false, message: err.message, error: err.message, ...(err.data ? { data: err.data } : {}) } };
};

/** Sends the error response unless one was already sent (e.g. error after a background job started). */
export const sendError = (request, reply, input) => {
    const { statusCode, error, body } = normalizeError(input);
    if (statusCode >= 500) request.log.error({ err: error }, 'request failed');
    if (reply.sent) { request.log.warn({ err: error }, 'error after the response was already sent'); return reply; }
    return reply.status(statusCode).send(body);
};

/** app.setErrorHandler(...) */
const ErrorThrow = (error, request, reply) => sendError(request, reply, error);
export default ErrorThrow;
