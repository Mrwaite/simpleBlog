var mongodb = require("./db");

function User(user){
    this.name = user.name;
    this.password = user.password;
    this.email = user.email;
};

module.exports = User;

//存储用户信息
//User是描述数据的对象
//User就是MVC架构里面的模型
//M  即模型是正真与数据打交道的工具，没有模型数据就是一个空壳
User.prototype = {
    save : function(callback) {
        //要存入数据库的用户信息
        var md5 = crypto.createHash('md5'),
            email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
            head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";
        var user = {
            name: this.name,
            password: this.password,
            email: this.email,
            head : head

        };
        //打开数据库
        mongodb.open(function (err, db) {
            if (err) {
                return callback(err);//错误，返回err信息
            }
            //读取users 集合
            db.collection('users', function (err, collection) {
                if (err) {
                    mongodb.close();
                    return callback(err);//错误， 返回err信息
                }
                //将用户信息插入用户集合
                collection.insert(user, {safe: true}, function (err, user) {
                    mongodb.close();
                    if (err) {
                        return callback(err);//错误，返回err信息
                    }
                    callback(null, user[0]);//成功！err为null , 返回存储后用户的文档
                });
            });
        });
    }
};

User.get = function(name, callback){
    //打开数据科
    mongodb.open(function(err, db){
        if(err){
            return callback(err);//错误返回错误信息
        }
        //读物users 集合
        db.collection('users', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);//错误，返回err信息
            }
            //查找用户名（name键）值为 name 一个文档
            collection.findOne({name : name}, function(err, user){
                mongodb.close();
                if(err){
                    return callback(err);//错误，返回err信息
                }
                callback(null , user);//成功!  返回查询的用户信息
            });
        });
    });
};