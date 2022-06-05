const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

const feedController = require('../controllers/feed');

const isAuth = require('../middleware/is-auth');


// GET /feed/posts
router.get('/posts', isAuth, feedController.getPosts);

// POST /feed/post
router.post('/post',
    isAuth,
    [
        body('title')
            .trim()
            .isLength({ min: 5 }),
        body('content')
            .trim()
            .isLength({ min: 5 })
    ],
    feedController.postPost);

router.get('/post/:postId', feedController.getPost);

// Since we will be replacing a resource , we will use a PUT method. With normal browser forms we can't send a PUT request but will normal JS form we can however.

// Important thing about PUT request just like PATCH request is that they also have a request body. We can also have params.

router.put('/post/:postId',
    isAuth,
    [
        body('title')
            .trim()
            .isLength({ min: 5 }),
        body('content')
            .trim()
            .isLength({ min: 5 })
    ],
    feedController.updatePost);

// DELETE routes cannot have a body
router.delete('/post/:postId', isAuth, feedController.deletePost);

router.get('/status', isAuth, feedController.getStatus);

router.put('/update-status', isAuth,
    [
        body('status')
            .trim()
            .not()
            .isEmpty()
    ], feedController.updateStatus);

module.exports = router;