"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const commentController_1 = require("../controllers/commentController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)({ mergeParams: true }); // Important for accessing :postId from parent route
router.get('/', commentController_1.getComments);
router.post('/', auth_1.authenticateToken, commentController_1.createComment);
exports.default = router;
