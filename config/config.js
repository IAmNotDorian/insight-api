'use strict';

var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var nconf = require('nconf');

var rootPath = path.normalize(__dirname + '/..'),
  env,
  db,
  port,
  b_port,
  p2p_port;

var packageStr = fs.readFileSync(rootPath + '/package.json');
var version = JSON.parse(packageStr).version;
nconf.use('file',{file:rootPath+'/config.json'});
nconf.load();

function getUserHome() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

var home = nconf.get('INSIGHT_DB') || (getUserHome() + '/.insight');

if (nconf.get('INSIGHT_NETWORK') === 'livenet') {
  env = 'livenet';
  db = home;
  port = '3000';
  b_port = '8332';
  p2p_port = '8333';
} else {
  env = 'testnet';
  db = home + '/testnet';
  port = '3001';
  b_port = '18332';
  p2p_port = '18333';
}
port = parseInt(nconf.get('INSIGHT_PORT')) || port;


switch (process.env.NODE_ENV) {
  case 'production':
    env += '';
    break;
  case 'test':
    env += ' - test environment';
    break;
  default:
    env += ' - development';
    break;
}

var network = nconf.get('INSIGHT_NETWORK') || 'testnet';

var dataDir = nconf.get('BITCOIND_DATADIR');
var isWin = /^win/.test(process.platform);
var isMac = /^darwin/.test(process.platform);
var isLinux = /^linux/.test(process.platform);
if (!dataDir) {
  if (isWin) dataDir = '%APPDATA%\\Bitcoin\\';
  if (isMac) dataDir = process.env.HOME + '/Library/Application Support/Bitcoin/';
  if (isLinux) dataDir = process.env.HOME + '/.bitcoin/';
}
dataDir += network === 'testnet' ? 'testnet3' : '';

var safeConfirmations = nconf.get('INSIGHT_SAFE_CONFIRMATIONS') || 6;
var ignoreCache = nconf.get('INSIGHT_IGNORE_CACHE') || 0;


var bitcoindConf = {
  protocol: process.env.BITCOIND_PROTO || 'http',
  user: nconf.get('BITCOIND_USER') || 'user',
  pass: nconf.get('BITCOIND_PASS') || 'pass',
  host: nconf.get('BITCOIND_HOST') || '127.0.0.1',
  port: nconf.get('BITCOIND_PORT') || b_port,
  p2pPort: nconf.get('BITCOIND_P2P_PORT') || p2p_port,
  p2pHost: nconf.get('BITCOIND_P2P_HOST') || nconf.get('BITCOIND_HOST') || '127.0.0.1',
  dataDir: dataDir,
  // DO NOT CHANGE THIS!
  disableAgent: true
};

var enableMonitor = nconf.get('ENABLE_MONITOR') === 'true';
var enableCleaner = nconf.get('ENABLE_CLEANER') === 'true';
var enableMailbox = nconf.get('ENABLE_MAILBOX') === 'true';
var enableRatelimiter = nconf.get('ENABLE_RATELIMITER') === 'true';
var enableCredentialstore = process.env.ENABLE_CREDSTORE === 'true';
var enableEmailstore = nconf.get('ENABLE_EMAILSTORE') === 'true';
var enablePublicInfo = process.env.ENABLE_PUBLICINFO === 'true';
var loggerLevel = nconf.get('LOGGER_LEVEL') || 'info';
var enableHTTPS = nconf.get('ENABLE_HTTPS') === 'true';
var enableCurrencyRates = nconf.get('ENABLE_CURRENCYRATES') === 'true';

if (!fs.existsSync(db)) {
  mkdirp.sync(db);
}

module.exports = {
  enableMonitor: enableMonitor,
  monitor: require('../plugins/config-monitor.js'),
  enableCleaner: enableCleaner,
  cleaner: require('../plugins/config-cleaner.js'),
  enableMailbox: enableMailbox,
  mailbox: require('../plugins/config-mailbox.js'),
  enableRatelimiter: enableRatelimiter,
  ratelimiter: require('../plugins/config-ratelimiter.js'),
  enableCredentialstore: enableCredentialstore,
  credentialstore: require('../plugins/config-credentialstore'),
  enableEmailstore: enableEmailstore,
  emailstore: require('../plugins/config-emailstore'),
  enableCurrencyRates: enableCurrencyRates,
  currencyrates: require('../plugins/config-currencyrates'),
  enablePublicInfo: enablePublicInfo,
  publicInfo: require('../plugins/publicInfo/config'),
  loggerLevel: loggerLevel,
  enableHTTPS: enableHTTPS,
  version: version,
  root: rootPath,
  publicPath: nconf.get('INSIGHT_PUBLIC_PATH') || false,
  appName: 'Insight ' + env,
  apiPrefix: '/api',
  port: port,
  leveldb: db,
  bitcoind: bitcoindConf,
  network: network,
  disableP2pSync: false,
  disableHistoricSync: false,
  poolMatchFile: rootPath + '/etc/minersPoolStrings.json',

  // Time to refresh the currency rate. In minutes
  currencyRefresh: 10,
  keys: {
    segmentio: process.env.INSIGHT_SEGMENTIO_KEY
  },
  safeConfirmations: safeConfirmations, // PLEASE NOTE THAT *FULL RESYNC* IS NEEDED TO CHANGE safeConfirmations
  ignoreCache: ignoreCache,
};
