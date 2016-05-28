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
    User = require("../models/user.js");

module.exports = function(app){
  app.get('/',function(req,res){
    res.render('index', {
        title : '主页',
        user : req.session.user,
        success : req.flash('success').toString(),
        error : req.flash('error').toString()
    });
  });
    app.get('/reg',function(req,res){
       res.render('reg',{
           title: '注册',
           user : req.session.user,
           success : req.flash('success').toString(),
           error : req.flash('error').toString()
       });
    });
    app.post('/reg',function(req,res){
        //通过body-parser middleware 来读取传过来的json数据
        var name = req.body.name,
            password = req.body.password,
            password_re = req.body['password-repeat'],
            email = req.body.email;
        //检验用户两次输入的密码是否一直
        if(password_re !== password){
            req.flash('error', '，两次输入的密码不一致');
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
    app.get('/login',function(req,res){
        res.render('login',{title : '登陆'});
    });
    app.post('/login',function(req,res){

    });
   app.get('/post',function(req,res){
       res.render('post',{title: '发表'});
   });
    app.post('/post',function(req,res){

    });
    app.get('/loginout',function(req,res){

    });
};
