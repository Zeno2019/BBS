const express = require('express')
const open = require('open')
const cookieParser = require('cookie-parser')
const app = express()
const port = 8081

var users = [{
  id: 1,
  name: 'lily',
  password: '123123123',
  email: 'lily@qq.com',
  avatar: '/upload/avatars/32132.png',
}, {
  id: 2,
  name: 'jim',
  password: '123123123',
  email: 'jim@qq.com',
  avatar: '/upload/avatars/32132.png',
}, {
  id: 3,
  name: 'jom',
  password: '123123123',
  email: 'jom@qq.com',
  avatar: '/upload/avatars/32132.png',
}]

var posts = [{
  id: 452,
  title: 'A',
  content: 'This is content',
  createdAt: Date.now(),
  ownerId: 1,
  commentCount: 0,
}, {
  id: 2134,
  title: 'b',
  content: 'This is content',
  createdAt: Date.now(),
  ownerId: 2,
  commentCount: 0,
}, {
  id: 2321,
  title: 'c',
  content: 'This is content',
  createdAt: Date.now(),
  ownerId: 3,
  commentCount: 0,
}]

var nextPostId = 4
var nextUserId = 4
var nextCommentId = 4

var comments = [{
  id: 3,
  replyTo: 2321,
  ownerId: 2,
  content: 'test reply 001',
  createdAt: Date.now(),
}, {
  id: 2,
  replyTo: 2321,
  ownerId: 2,
  content: 'test reply 002',
  createdAt: Date.now(),
}, {
  id: 1,
  replyTo: 452,
  ownerId: 1,
  content: 'test reply 003',
  createdAt: Date.now(),
}, ]

app.locals.pretty = true

app.set('views', __dirname + '/views')

app.use((req, res, next) => {
  console.log(req.method, req.url)
  next()
})

app.use(express.static(__dirname + '/static'))
app.use(express.json())
app.use(express.urlencoded({
  extended: true
}))
app.use(cookieParser('lkjweoidskaljlkja12'))

// cookie
app.use((req, res, next) => {
  console.log(req.cookie, req.signedCookies)

  // 通过cookie中找出用户是否登录，将用户信息挂在req对象上
  // 供后续中间件处理
  if (req.signedCookies.user) {
    req.user = users.find(it => it.name == req.signedCookies.user)
  }
  next()

})

// 首页
app.get('/', (req, res, next) => {
  var postsInfo = posts.map(post => {
    return {
      ...post,
      user: users.find(user => post.ownerId == user.id)
    }
  })

  res.render('index.pug', {
    user: req.user, // 当前已经登录的用户
    posts: postsInfo,
  })
})

// 帖子详情
app.get('/post/:id', (req, res, next) => {

  // find the posts's id by url's params
  var post = posts.find(it => it.id == req.params.id)

  // get the comments's data
  var commentsData = comments.filter(comment => comment.replyTo == post.id)

  var data = {
    post: post,

    // patch the comments by found who reply this list
    comments: commentsData.map(it => {
      return {
        ...it,
        user: users.find(user => user.id == it.ownerId)
      }
    })
  }

  if (post) {
    res.render('post.pug', data)
  } else {
    res.render('404.pug')
  }
})

// 发帖
app.route('/post')
  // 发帖页面
  .get((req, res, next) => {
    res.render('add-post.pug')
  })
  // 提交发帖
  .post((req, res, next) => {
    console.log('收到发帖请求', req.body)

    if (!req.user) {
      res.end('当前为未登录状态')
      return
    }

    var post = req.body
    post.createdAt = Date.now()
    post.ownerId = req.user.id
    post.id = nextPostId++;
    post.commentCount = 0

    posts.push(post)

    res.redirect('/post/' + post.id)
  })

// 评论
app.post('/comment', (req, res, next) => {
  console.log('收到评论请求', req.body)
  if (req.user) {
    var comment = req.body
    comment.createdAt = Date.now()
    comment.ownerId = req.user.id
    comment.id = nextCommentId++;

    comments.push(comment)
    res.redirect('/post/' + comment.replyTo)
  } else {
    res.end('当前为未登录状态')
  }
})

// 注册
app.route('/register')
  .get((req, res, next) => {
    res.render('register.pug')
  })
  .post((req, res, next) => {
    console.log('收到注册请求', req.body)
    var user = req.body

    // 判断是否有重复id, 用户名或邮箱
    if (users.find(it => it.id == user.id)) {
      res.render('register-result.pug', {
        result: '注册失败，用户ID已经被占用',
        code: 0
      })
      return
    }
    if (users.find(it => it.name == user.name)) {
      res.render('register-result.pug', {
        result: '注册失败，用户名已经被占用',
        code: 0
      })
      return
    }
    if (users.find(it => it.email == user.email)) {
      res.render('register-result.pug', {
        result: '注册失败，用户邮箱已经被占用',
        code: 0
      })
      return
    }

    user.id = nextUserId++;
    user.avatar = '/upload/avatars/32132.png'
    users.push(user)

    res.render('register-result.pug', {
      result: '注册成功',
      code: 1
    })
  })

// /username-conflict-check?name=
// 用户名检测接口
app.get('/username-conflict-check', (req, res, next) => {
  if (users.some(user => user.name == req.query.name)) {
    // AJAX
    res.json({
      code: 0,
      msg: '用户名已经被占用'
    })
  } else {
    res.json({
      code: 1,
      msg: '用户名可以使用'
    })
  }
})

// 登录
app.route('/login')
  .get((req, res, next) => {
    res.render('login.pug')
  })
  .post((req, res, next) => {
    console.log('收到登录请求', req.body)
    var loginInfo = req.body
    var user = users.find(it => it.name == loginInfo.name && it.password == loginInfo.password)

    // 设置 cookie
    if (user) {
      res.cookie('user', user.name, {
        maxAge: 86400000,
        signed: true
      })

      res.cookie('username', user.name, {
        maxAge: 86400000,
      })

      res.json({
        code: 1,
        msg: '登录成功'
      })
    } else {
      res.json({
        code: 0,
        msg: '登录失败, 用户名或密码错误'
      })
    }
  })

// 退出
app.get('/logout', (req, res, next) => {
  res.clearCookie('user')
  res.redirect('/')
})

app.listen(port, '127.0.0.1', () => {
  console.log('Server listening on port', port)
  // open('http://localhost:' + port)
})
