# simpleBlog

## 这是基于nodejs Express构建的简单的个人博客
### 包含下面一些功能：
+ 多人注册，登陆
+ 发表文章（markdown）
+ 上传文件
+ 文章的删除与编辑
+ 存档
+ 标签
+ 分页
+ 留言（markdown）
+ 用户个人主页
+ 文章的pv统计和留言统计
+ 头像
+ 标题关键字查询，模糊查询
+ 友链
+ 404页面
+ 转载功能（感觉复杂）
+ 日志功能

###  数据库： mongoDB
###  模板引擎：ejs
###  中间件： express-session，connect-mongo，connect-flash ，markdown， multer
###  模型： user模型，post模型， comment模型

### 如何操作

**设置blog为工作目录并启动数据库** ： 
`cd bin`
`./mongod  --dbpath ../blog/`

**启动当前项目**
`cd  ~/nodejsWorkSpace/nodejs/simpleBlog`
`node app.js`

**工具supervisor使用方法**
`cd  ~/nodejsWorkSpace/nodejs/simpleBlog`
`supervisor app.js`

**是用node调试工具node-inspector**

`node --debug app.js`
`node-inspector &`



