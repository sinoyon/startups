var express = require('express');
var path = require('path');
const rendertron = require('rendertron-middleware');
var app = express();
const compression = require('compression');
app.use(compression());

const bots = [
    'baiduspider',
    'bingbot',
    'embedly',
    'facebookexternalhit',
    'linkedinbot',
    'outbrain',
    'pinterest',
    'quora link preview',
    'rogerbot',
    'showyoubot',
    'slackbot',
    'twitterbot',
    'vkShare',
    'W3C_Validator',
    'whatsapp',
    'googlebot'
  ];

app.use(rendertron.makeMiddleware({
    proxyUrl: 'https://startupswallet-290907.appspot.com/render',
    userAgentPattern: new RegExp(bots.join('|'), 'i')
}));
// app.get('*.js', (req, res, next) => {
//   console.log(req.url)
// 	req.url = req.url + '.gz';
// 	res.set('Content-Encoding', 'gzip');
// 	next();
// });

app.use(express.static(path.join(__dirname, 'dist')));
app.get('/check', (req, res) => {
  console.log('Health Check Request');
  res.status(200).end();
});

app.get("/:url(assets)/*", (req, res) => {
  res.sendFile(path.resolve("./") + decodeURI(req.url));
});

app.get("/*",(req, res) => {
  res.sendFile(path.resolve(`${__dirname + "/dist"}/index.html`));
});
app.use('*', express.static(path.join(__dirname, 'dist')));

module.exports = app;