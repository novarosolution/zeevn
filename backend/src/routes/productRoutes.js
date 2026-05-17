const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getProducts,
  getProductById,
  getProductReviews,
  createOrUpdateProductReview,
  uploadReviewPhoto,
  voteProductReview,
} = require("../controllers/productController");

const router = express.Router();

router.get("/", getProducts);
router.get("/:id/reviews", getProductReviews);
router.get("/:id", getProductById);
router.post("/:id/reviews", protect, createOrUpdateProductReview);
router.post("/:id/reviews/photos", protect, uploadReviewPhoto);
router.post("/:id/reviews/:reviewId/vote", protect, voteProductReview);

module.exports = router;
