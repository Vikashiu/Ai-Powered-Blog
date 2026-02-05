"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const postController_1 = require("../controllers/postController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes
router.get('/', postController_1.getPosts);
router.get('/:id', postController_1.getPost);
// Protected routes
router.post('/', auth_1.authenticateToken, postController_1.createPost);
router.put('/:id', auth_1.authenticateToken, postController_1.updatePost);
router.delete('/:id', auth_1.authenticateToken, postController_1.deletePost);
exports.default = router;
