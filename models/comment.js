var mongodb = require('./db');

//创建comment模型来存储新的留言到数据库
function Comment(name, day, title, comment){
    this.name = name;
    this.day = day ;
    this.title = title;
    this.comment = comment;
}

module.exports = Comment;

//存储一条留言信息
Comment.prototype.save = function (callback) {
    var name = this.name,
        day = this.day,
        title = this.title,
        comment = this.comment;
    //打开数据库
    mongodb.open(function(err, db){
       if(err) {
           return callback(err);
       }
        //获取数据库posts集合
        db.collection("posts", function (err, collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }
            //通过用户名，时间以及标题查找文档，并把留言信息添加到post对象comments 数组里面
            collection.update({
               "name" : name,
                "time.day" : day,
                "title" : title
            }, {
                $push : {"comments" : comment}
            }, function (err) {
                mongodb.close();
                if(err) {
                    return callback(err);
                }
                callback(null);
            });
        });
    });
} 