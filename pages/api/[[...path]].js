import app from '../../server/index.js';

export const config = { api: { bodyParser: false } };

export default function apiHandler(req, res) {
  return app(req, res);
}
