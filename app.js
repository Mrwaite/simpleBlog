var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var settings = require('./setting');
var users = require('./routes/users');

var session = require('express-session');
var MongoStore = require('connect-mongo/es5')(session);

var flash = require("connect-flash");

var app = express();

app.set('port', process.env.PORT || 3000);
// view engine setup
//设置view文件夹为存放视图的目录，即存放模板的地方，__dirname为群居变量，存放当前正在执行脚本的所在的目录
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//use connect-flash middleware
app.use(flash());

/*session*/
app.use(session({
  secret: settings.cookieSecret,
  key: settings.db,//cookie name
  cookie: {maxAge: 1000 * 60 * 60 * 24 * 30},//30 days
  resave: true,
  saveUninitialized: true,
  store: new MongoStore({
    url: 'mongodb://localhost/blog'
  })
}));


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//加载日志中间件
app.use(logger('dev'));
//加载解析json的中间件
app.use(bodyParser.json());
//加载解析urlencoded请求体的中间件
app.use(bodyParser.urlencoded({ extended: true }));
//加载接线子cookie的中间件
app.use(cookieParser());
//设置public文件夹为存放静态文件的目录
app.use(express.static(path.join(__dirname, 'public')));
//路由控制器
//app.use('/', routes);
//app.use('/users', users);

routes(app);

app.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

// catch 404 and forward to error handler
//捕捉404错误 ，并转发到错问处理器
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
