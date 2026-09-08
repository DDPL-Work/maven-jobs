const express = require("express");
const { protectAdmin } = require("../middleware/admin.middleware");
const { uploadCover, uploadInline } = require("../middleware/blog-image-upload.middleware");
const blogController = require("../controllers/blog.controller");
const { cacheRoute, invalidateCache } = require("../middleware/cache.middleware");

const router = express.Router();

router.get("/categories", cacheRoute({ key: "cache:blog:categories", ttl: 600 }), blogController.getBlogCategories);
router.get("/published", cacheRoute({ key: "cache:blog:published", ttl: 600 }), blogController.getPublishedBlogs);
router.get("/:slug", cacheRoute({
  key: (req) => `cache:blog:slug:${req.params.slug}`,
  ttl: 600,
}), blogController.getBlogBySlug);

router.use(protectAdmin);

router.get("/", blogController.getBlogs);
router.get("/id/:id", blogController.getBlogById);
router.post("/", uploadCover, invalidateCache(["cache:blog:published", "cache:blog:categories"]), blogController.createBlog);
router.put("/:id", uploadCover, invalidateCache(["cache:blog:published", "cache:blog:categories", (req) => `cache:blog:slug:*`]), blogController.updateBlog);
router.delete("/:id", invalidateCache(["cache:blog:published", "cache:blog:categories", (req) => `cache:blog:slug:*`]), blogController.deleteBlog);
router.patch("/:id/toggle-status", invalidateCache(["cache:blog:published", "cache:blog:categories", (req) => `cache:blog:slug:*`]), blogController.toggleBlogStatus);
router.post("/upload-inline", uploadInline, blogController.uploadInlineImage);

module.exports = router;
