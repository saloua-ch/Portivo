// Express 4 doesn't await async route handlers, so a rejected promise
// inside one becomes an unhandled rejection and the request just hangs.
// Wrapping every handler in this forwards the rejection to next(err).
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
