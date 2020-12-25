var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var booksRouter = require('./routes/books');
var app = express();

const db = require('./models');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/books', booksRouter);

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Connection has been established successfully.');
    await db.sequelize.sync();
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();

app.use((req, res, next) => {
  console.log('henlo');
  const err = new Error('not Found');
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  res.locals.error = err;
  console.log(err.status)
  res.status(err.status || 500);
  res.locals.message = err.message ? err.message: "Sorry! There was an unexpected error on the server.";
  if(err.status === 404) {
    res.render('page-not-found', err);
  } else {
    res.render('error', err);
  }
});

module.exports = app;
