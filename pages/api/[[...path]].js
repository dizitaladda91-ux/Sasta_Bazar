import app from '../../server/index.js';

export const config = { api: { bodyParser: false } };

export default function apiHandler(req, res) {
  // Next adds the catch-all route segments to query; Express validators expect only URL query params.
  if (req.query && Object.prototype.hasOwnProperty.call(req.query, 'path')) {
    delete req.query.path;
  }
  return app(req, res);
}
