//创建与数据库的链接
var mongodb = require('./db'),
    markdown = require("markdown").markdown;//markdown模块

function Post(name, head, title, tags, post){
    this.name = name;
    this.title = title;
    this.post = post;
    this.tags = tags;
    this.head = head;
}

module.exports = Post;

//文章的存储
Post.prototype.save = function(callback){
    var date = new Date();
    //存储各种时间格式，方便以后拓展
    var time = {
        date: date,
        year : date.getFullYear(),
        month : date.getFullYear() + "-" + (date.getMonth() + 1),
        day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
        hours : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours(),
        minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    };

    //要存入数据库的文档
    var post ={
        name : this.name,
        time : time,
        title : this.title,
        post : this.post,
        comments : [],
        tags : this.tags,
        pv : 0,
        head : this.head,
        reprint_info : {}
    };
    //打开数据库
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }
        //读取数据库
        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //将文档插入posts集合
            collection.insert(post, {safe : true}, function(err){
                mongodb.close();
                if(err){
                    return callback(err);//失败返回err信息
                }
                callback(null);//成功，err信息为null
            });
        });
    });
};


//获取name 的所有文章，或者获取全部人的文章，参数为null
Post.getTen = function(name, page, callback){
    //打开数据库
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }
        //读取posts集合
        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            var query = {};
            if(name){
                query.name = name;
            }
            //根据query对面查询文章
            /*collection.find(query).sort({time : -1}).toArray(function(err, docs){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                //使用markdown模块，可以实现markdown写文章
                docs.forEach(function(doc){
                    doc.post = markdown.toHTML(doc.post);
                });
                callback(null, docs);//成功！以数组形式返回查询结果
            });*/
            //count返回查询到的文章的数量total
            collection.count(query, function(err, total){
               //根据query对象查询， 并跳过前面（page-1）*10 个结果，返回之后的10个结果
                collection.find(query, {
                    skip : (page - 1)*10,
                    limit : 10
                }).sort({
                    time : -1
                }).toArray(function(err, docs){
                    mongodb.close();
                    if(err){
                        return callback(err);
                    }
                    //解析markdown为html文档
                    docs.forEach(function(doc){
                        doc.post = markdown.toHTML(doc.post);
                    });
                    callback(null, docs, total);
                });
            });
        });
    });
};

//根据name。day，title来精准的获取一篇文章
Post.getOne = function(name, day, title, callback){
    //打开数据库
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }
        //读取post集合
        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //根据用户名，发表日期，文章名来查询
            collection.findOne({
                "name" : name,
                "time.day" : day,//这个是查询time对面下面的day
                "title" : title
            }, function(err, doc){

                if(err){
                    mongodb.close();
                    return callback(err);
                }
                //解析markdown为html
                //让留言也支持markdown语法
                if(doc){
                    //每访问一次， pv值就加一
                    collection.update({
                        "name" : name ,
                        "time.day" : day,
                        "title" : title
                    }, {
                        $inc : {"pv" : 1}
                    }, function (err) {
                        mongodb.close();
                        if(err) {
                            return callback(err);
                        }
                    });
                    doc.post = markdown.toHTML(doc.post);
                    doc.comments.forEach(function(comment){
                        comment.content = markdown.toHTML(comment.content);
                    });
                    callback(null, doc);
                }

            });
        });
    });
};

Post.edit = function(name, day, title, callback){
    //打开数据库
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }
        //读取posts集合
        db.collection('posts', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //根据name，day，title查找post
            collection.findOne({
                "name" : name,
                "time.day" : day,
                "title" : title
            }, function(err, doc){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                return callback(null, doc);//返回文章的markdown形式
            });
        });
    });
};

//文章的更新
Post.update = function(name, day, title, post, callback){
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }
        //读取post集合
        db.collection("posts", function (err, collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.update({
                "name" : name,
                "time.day" : day,
                "title" : title
            }, {
                $set : {post: post}
            }, function (err) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};

//删除一篇文章
Post.remove = function (name, day, title, callback){
    //打开数据库
    mongodb.open(function(err, db){
        if(err) {
            return callback(err);
        }
        //读取posts集合
        db.collection('posts', function (err, collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }
            //查找要删除的文档
            collection.findOne({
                "name" : name,
                "time.day" : day,
                "title" : title
            }, function (err, doc) {
                if(err) {
                    mongodb.close();
                    return callback(err);
                }
                //如果有 reprint_from 说明这是转载来的文章,先保存printf_from
                var reprint_from = "";
                if(doc.reprint_info.reprint_from){
                    reprint_from = doc.reprint_info.reprint_from;
                }
                //如果有之前有创建过reprint_from之后被删除了为""
                if(reprint_from != ""){
                    //更新原文章所在文档的reprint_to
                    collection.update({
                        "name" : reprint_from.name,
                        "time.day" : reprint_from.day,
                        "title" : reprint_from.title
                    },{
                        $pull : {
                            "reprint_info.reprint_to" : {
                                "name" : name,
                                "day" : day,
                                "title" : title
                            }
                        }
                    }, function (err) {
                        if(err) {
                            mongodb.close();
                            return callback(err);
                        }
                    });
                }
                //根据用户名，日期，标题来删除一篇文章
                collection.remove({
                    "name" : name,
                    "time.day"  : day,
                    "titile" : title
                }, {
                    w : 1
                }, function (err) {
                    mongodb.close();
                    if(err) {
                        return callback(err);
                    }
                    callback(null);
                });
            });
        });
    });
};

Post.getArchive = function(callback){
    //打开数据库
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }
        //读取post集合
        db.collection("posts", function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //返回只有name，time，title组成的集合
            collection.find({}, {
                "name" : 1,
                "time" : 1,
                "title" : 1
            }).sort({
                time: -1
            }).toArray(function(err, docs){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};


Post.getTags = function (callback) {
    mongodb.open(function (err, db) {
        if(err) {
            return callback(err);
        }
        //得到posts集合
        db.collection('posts', function (err, collecion) {
            if(err) {
                mongodb.close();
                return callback(err);
            }
            //用distinct来找出指定键的所有的值
            collecion.distinct('tags', function (err, docs) {
                mongodb.close();
                if(err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};

//返回有特定标签的所有文章
Post.getTag = function (tag, callback) {
    mongodb.open(function (err, db) {
        if(err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }
            collection.find({
                "tags" : tag
            }, {
                "name" : 1,
                "time" : 1,
                "title" : 1
            }).sort({
                time : -1
            }).toArray(function (err, docs) {
                mongodb.close();
                if(err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};


//返回通过标题关键字查询多有文章的信息

Post.search = function (keyword, callback) {
    mongodb.open(function (err, db) {
        if(err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }
            var pattern = new RegExp(keyword, "i");
            collection.find({
                "title" : pattern
            }, {
                "name" : 1,
                "time" : 1,
                "title" : 1
            }).sort({
                time : -1
            }).toArray(function(err, docs){
                mongodb.close();
                if(err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
}

//转载一篇文章，reprint_from是原文章的信息， reprint_to是现在在写 的文章的信息
Post.reprint = function (reprint_from, reprint_to, callback) {
    mongodb.open(function (err, db) {
        if(err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }
            //找到要被转载的文章的原文章
            collection.findOne({
                "name" : reprint_from.name,
                "time.day" : reprint_from.day,
                "title" : reprint_from.title
            }, function (errr, doc) {
                if(err) {
                    mongodb.close();
                    return callback(err);
                }

                var date = new Date();
                var time = {
                    date: date,
                    year : date.getFullYear(),
                    month : date.getFullYear() + "-" + (date.getMonth() + 1),
                    day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
                    minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
                };
                //这里删除原文章的id，是因为每个post的id都是mongodb内部给的
                delete doc._id;//注意要删掉原来的id
                //这里覆盖一系列原文章的信息的是现在的文章是在原来文章的基础上，留下一些原文章的信息，改变一些现在文章的信息
                doc.name = reprint_to.name;
                doc.head = reprint_to.head;
                doc.time = time;
                doc.title = (doc.title.search(/[转载]/) > -1) ? doc.title : "[转载]" + doc.title;//js 的search方法，如果被转载的文章本来就是转载的title就不加转载两个子，否则就加上转载两个子
                doc.comments = [];
                doc.reprint_info = {"reprint_from" : reprint_from};
                doc.pv  = 0;

                //更新被转载的原文档的reprint_info 内的reprint_to
                collection.update({
                    "namne" : reprint_from.name,
                    "time.day" : reprint_from.day,
                    "title" : reprint_from.title
                }, {
                    $push : {
                        "reprint_info.reprint_to" : {
                            "name" : doc.name,
                            "day" : time.day,
                            "title" : doc.title
                        }}
                }, function (err) {
                    if(err) {
                        mongodb.close();
                        return callback(err);
                    }
                });
                //将转载生成的副本修改后存入数据库， 并返回存储后的文档
                collection.insert(doc, {
                    safe : true
                }, function (err, post) {
                    mongodb.close();
                    if(err) {
                        return callback(err);
                    }
                    callback(err, post.ops[0]);
                });

            });
        });
    });
};