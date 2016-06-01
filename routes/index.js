var express = require('express');
var router = express.Router();
var multer = require("multer");

/* GET home page. */


/*
/  首页
/login 用户登录
/reg 用户注册
/post 发表文章
/logout 登出
*/

//导入crypto模块，user.js用户模型文件，crypto用来生成散列值来加密密码
var crypto = require("crypto"),
    User = require("../models/user.js"),
    Post = require("../models/post.js"),
    Comment = require('../models/comment.js');

var storage = multer.diskStorage({
    //destination是上传文件所在的目录
    destination : function(req, file, cb){
        cb(null, './public/images');
    },
    //filename修改上传文件重命名，originalname
    filename : function(req, file, cb){
        cb(null, file.originalname);
    }
});

var upload = multer({
    storage : storage
});

module.exports = function(app){
    //检查是都为登陆状态的函数

    app.get('/', function (req, res) {
        //判断是否是第一条，并把请求的页数转化成number类型、
        var page = parseInt(req.query.p) || 1;
        //查询返回第page页的10篇文章
        Post.getTen(null, page, function(err, posts, total){
            if(err){
                post = [];
            }
            res.render('index', {
                title: '主页',
                user: req.session.user,
                posts: posts,
                page : page,
                isFirstPage: (page - 1) == 0,
                isLastPage: ((page - 1)*10 + posts.length) == total,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    app.get('/reg', checkNotLogin);
    app.get('/reg', function (req, res) {
        res.render('reg', {
            title: '注册',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/reg', checkNotLogin);
    app.post('/reg',function(req,res){
        //通过body-parser middleware 来读取传过来的json数据
        var name = req.body.name,
            password = req.body.password,
            password_re = req.body['password-repeat'],
            email = req.body.email;
        //检验用户两次输入的密码是否一直
        if(password_re !== password){
            req.flash('error', '两次输入的密码不一致');
            return res.redirect('/reg');
        }
        //生成密码的MD5值
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');
        var newUser = new User({
            name : name,
            password : password,
            email : email
        });
        //检查用户名是否存在
        User.get(newUser.name, function(err, user){
            if(err){
                req.flash('error', err);
                return res.redirect('/');
            }
            if(user){
                req.flash('error', '用户已存在');
                return res.redirect('/reg');//如果用户名不存在，返回注册页面
            }
            //把用户信息存储到session里，以后就可以通过req.session.user读取用户信息
            newUser.save(function(err, user){
                if(err){
                    req.flash('err', err);
                    return res.redirect('reg');//注册失败返回注册页
                }
                req.session.user = newUser;
                req.flash('success', '注册成功');
                //redirect重定向功能
                res.redirect('/');
            });

        });
    });
    app.get('/login', checkNotLogin);
    app.get('/login',function(req,res){
        res.render('login',{
            title : '登陆',
            user : req.session.user,
            success : req.flash('success').toString(),
            error : req.flash('error').toString()
        });
    });
    app.post('/login', checkNotLogin);
    app.post('/login',function(req,res){
        //生成密码的md5值
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');
        //检查用户是否存在
        User.get(req.body.name, function(err, user){
            if(!user){
                req.flash('error','用户名不存在');
                return res.redirect('/login');//用户不存在跳转到登陆页面
            }
            //检查密码是否一致
            if(user.password !== password ){
                req.flash('error', '密码错误！');
                return res.redirect('/login');//密码错误跳转到登陆界面
            }
            //用户名和密码都匹配后，将用户信息存入session
            req.session.user = user;
            req.flash('success','登陆成功');
            res.redirect('/');
        });
    });
    app.get('/post', checkLogin);
   app.get('/post',function(req,res){
       res.render('post',{
           title: '发表',
           user : req.session.user,
           success : req.flash('success').toString(),
           error : req.flash('error').toString()
       });
   });
    app.post('/post', checkLogin);
    app.post('/post',function(req,res){
        var currentUser = req.session.user,
            tags = [req.body.tag1, req.body.tag2, req.body.tag3];
            post = new Post(currentUser.name, req.body.title, tags, req.body.post);
        post.save(function(err){
            if(err){
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('seccess', '发布成功');
            res.redirect('/');//发布成功跳转到主页
        });
    });
    app.get('/logout', checkLogin);
    app.get('/logout',function(req,res){
        req.session.user = null;
        req.flash('success' ,'登出成功');
        res.redirect('/');//登出之后跳转到主界面
    });

    app.get('/uplaod',checkLogin);
    app.get('/upload', function(req, res){
        res.render('upload', {
            title : '文件上传',
            user : req.session.user,
            success : req.flash('success').toString(),
            error : req.flash('error').toString()
        });
    });

    app.post('/upload', checkLogin);
    app.post('/upload', upload.array('field1', 5), function(req, res){
            req.flash('success', '文件上传成功');
            res.redirect('/upload');
    });
    //用户界面路由
    app.get('/u/:name', function(req, res){
        var page = parseInt(req.query.p) || 1;
        //检查用户是否存在
        User.get(req.params.name, function(err, user){
            if(!user) {
                req.flash('error', '用户不存在');
                return res.redirect('/');
            }
            //查询返回该用户的所有文章
            Post.getTen(user.name, page, function(err, posts, total){
                if(err){
                    req.flash('error', err);
                    return res.redirect('/');
                }
                res.render('user', {
                    title : user.name,//这个点击的楼主的name
                    posts : posts,//点击的人的所有文章
                    page: page,
                    isFirstPage : (page - 1) == 0,
                    isLastPage : ((page - 1)*10 + posts.length) == total,
                    user : req.session.name,//这个是当前登陆的用户的name
                    success : req.flash('success').toString(),
                    error : req.flash('error').toString()
                });
            });
        });
    });

    //归档界面
    app.get('/archive', function(req, res){
        Post.getArchive(function(err, posts){
            if(err){
                req.flash('error', err);
                res.redirect('/');
            }
            res.render("archive",{
                title : '存档',
                posts : posts,
                user : req.session.user,
                success : req.flash('success').toString(),
                error : req.flash('error').toString()
            });
        });
    });


    //文章界面路由
    app.get('/u/:name/:day/:title', function(req, res){
        Post.getOne(req.params.name, req.params.day, req.params.title, function(err ,doc){
            if(err){
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('article', {
                title : req.params.title,
                post : doc,
                user : req.session.user,
                success : req.flash('success').toString(),
                error : req.flash('error').toString()
            });
        });
    });

    //添加文章留言的路由
    app.post('/u/:name/:day/:title', function (req, res) {
       var  date = new Date(),
           time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
        var comment = {
            name : req.body.name,
            email : req.body.email,
            website : req.body.website,
            time : time,
            content : req.body.content
        };
        //这里传入作者的name，day，title，当前留言comment
         var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
        newComment.save(function(err){
            if(err) {
                req.flash('err', err);
                return res.redirect('back');
            }
            req.flash('success', '留言成功');
            res.redirect('back');
        });
    });

    //编辑文章路由
    app.get('/edit/:name/:day/:title', function(req, res){
        var currentUser = req.session.user;
        //这里使用currentUser.name不用req.params.name,防止不是作者本人的修改，这样的话不是本人的修改，就查不到这篇文章
        Post.edit(currentUser.name, req.params.day, req.params.title, function(err, doc){
            if(err){
                req.flash('error', err);
                return res.redirect('back');
            }
            res.render('edit', {
                title : "编辑",
                post : doc,
                user : req.session.user,
                success : req.flash('success').toString(),
                error : req.flash('error').toString()
            });
        });
    });

    app.post('/edit/:name/:day/:title', checkLogin);
    app.post('/edit/:name/:day/:title', function (req, res) {
        var currentUser = req.session.user;
        Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function (err) {
            var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
            if(err){
                req.flash('error', err);
                return res.redirect(url);//失败返回回 文章页面
            }
            req.flash('success', '修改成功');
            res.redirect(url);//成功返回到文章页面
        });
    });


    //删除一片一篇文章的路由
    app.get('/remove/:name/:day/:ttile', checkLogin);
    app.get('/remove/:name/:day/:title', function (req, res) {
        var currentUser = req.session.user;
        Post.remove(currentUser.name, req.params.day, req.params.title, function (err) {
            if(err){
                req.flash('error', err);
                return res.redirect('back');
            }
            req.flash('success', '删除成功');
            res.redirect('/');
        })
    })
    function checkLogin (req, res, next){
        if (!req.session.user) {
            req.flash('error', '未登录');
            res.redirect('/login');
        }
        next();

    }
    //检查是否为未登录转台的函数
    function checkNotLogin(req, res, next){

        if(req.session.user){
            req.flash('error','已登陆');
            res.redirect('back');
        }
        next();
    }
};
