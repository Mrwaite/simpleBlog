var express = require('express');
var router = express.Router();

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
    Post = require("../models/post.js");



module.exports = function(app){
    //检查是都为登陆状态的函数

    app.get('/', function (req, res) {
        Post.get(null, function(err, posts){
            if(err){
                post = [];
            }
            res.render('index', {
                title: '主页',
                user: req.session.user,
                posts: posts,
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
            post = new Post(currentUser.name, req.body.title, req.body.post);
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
