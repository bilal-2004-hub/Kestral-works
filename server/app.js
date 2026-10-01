const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');

const { env, clientUrl } = require('./config/env');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimit');

const app = express();

// Correct client IPs behind a proxy/load balancer, which rate limiting depends on.
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: clientUrl.split(','), credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
// express-mongo-sanitize removed — no MongoDB in use.
app.use(hpp());             // collapses duplicated query params
app.use(compression());
if (env === 'development') app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '7d' }));
app.use(['/api', '/'], apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
