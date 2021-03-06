const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const CommentSchema = require("../models/Comment");
const CustomerSchema = require("../models/Customer");
const ProductSchema = require("../models/Product");
const _ = require("lodash");

exports.createNewComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const { _id : authorId } = req.user;
    const {  productID, score, text } = req.body;

    if (score > 5 || score < 0) {
      res.status(400).json({
        message: "Score must be greater than zero and less than 5"
      });
    }
    const product = await ProductSchema.findById(productID);

    if (_.isEmpty(product)) {
      res.status(400).json({
        message: `Not found a product with ID ${productID}`
      });
    }

    const customer = await CustomerSchema.findById(authorId);
    if (_.isEmpty(customer)) {
      res.status(400).json({
        message: `Not found a user with ID ${authorId}`
      });
    }


    let newComment = await CommentSchema({
      authorId: authorId,
      productID: productID,
      score: score,
      text: text
    });

    newComment = await newComment.save();
    product.comments.push(newComment._id);
    await product.save();
    const com = await CommentSchema.findById(newComment._id)
      .populate('authorId');
    res.status(200).json(com);
  } catch (e) {
    res.status(500).json({
      message: `Server error ${e.message}`
    });
  }
};

exports.editComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const { _id : authorId } = req.user;
    const { commentID, score, text } = req.body;

    let comment = await CommentSchema.findById(commentID);

    if (_.isEmpty(comment)) {
      res.status(400).json({
        message: `Not found a comment with ID ${commentID}`
      });
    }

    if (authorId.toString() !==comment.authorId.toString()){
      res.status(400).json({
        message: `You cannot edit comment other customer`
      });
    }

    comment.score = !_.isNumber(score) && (score > 5 || score < 0) ? comment.score : score;
    comment.text = _.isString(text) ? text : comment.text;

    comment = await comment.save();

    res.status(200).json(comment);
  } catch (e) {
    res.status(500).json({
      message: `Server error ${e.message}`
    });
  }
};

exports.removeComment = async (req, res) => {
  try {
    const { idComment } = req.params;

    if (!mongoose.Types.ObjectId.isValid(idComment)) {
      return res.status(400).json({
        message: `ID is not valid ${idComment}`
      });
    }
    const { _id : authorId } = req.user;
    let comment = await CommentSchema.findById(idComment);

    if (_.isEmpty(comment)) {
      return res.status(400).json({
        message: `Not found a comment with ID ${idComment}`
      });
    }

    if (authorId.toString() !==comment.authorId.toString()){
      res.status(400).json({
        message: `You cannot edit comment other customer`
      });
    }

    await comment.delete();

    res.status(200).json({ msg: "SubFilter deleted" });
  } catch (e) {
    return res.status(500).json({
      message: `Server error ${e.message}`
    });
  }
};

exports.getComments = async (req, res) => {
  try {
    const comments = await CommentSchema.find({});
    res.status(200).json(comments);
  } catch (e) {
    res.status(500).json({
      message: `Server error ${e.message}`
    });
  }
};

exports.getCommentById = async (req, res) => {
  try {
    const { commentID } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentID)) {
      return res.status(400).json({
        message: `ID is not valid ${commentID}`
      });
    }

    const comment = await CommentSchema.findById(commentID);

    if (!comment) {
      return res.status(400).json({
        message: `comment with id ${commentID} is not found`
      });
    }

    res.status(200).json(comment);
  } catch (e) {
    res.status(500).json({
      message: `Server error ${e.message}`
    });
  }
};

exports.getCommentsByUserId = async (req, res) => {
  try {
    const { userID } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userID)) {
      return res.status(400).json({
        message: `ID is not valid ${userID}`
      });
    }

    const customer = await CustomerSchema.findById(userID);
    if (_.isEmpty(customer)) {
      res.status(400).json({
        message: `Not found a user with ID ${userID}`
      });
    }

    const comments = await CommentSchema.find({ authorId: userID });
    res.status(200).json(comments);
  } catch (e) {
    res.status(500).json({
      message: `Server error ${e.message}`
    });
  }
};

exports.getCommentsByProductId = async (req, res) => {
  try {
    const { productID } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productID)) {
      return res.status(400).json({
        message: `ID is not valid ${productID}`
      });
    }

    const product = await ProductSchema.findById(productID);

    if (_.isEmpty(product)) {
      res.status(400).json({
        message: `Not found a product with ID ${productID}`
      });
    }

    const comments = await CommentSchema.find({ productID: productID }).populate({
      path: "authorId",
      select: "_id firstName lastName avatarUrl"
    });
    res.status(200).json(comments);
  } catch (e) {
    res.status(500).json({
      message: `Server error ${e.message}`
    });
  }
};

exports.getMeanRatingProductByProductId = async (req, res) => {
  try {
    const { productID } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productID)) {
      return res.status(400).json({
        message: `ID is not valid ${productID}`
      });
    }

    const product = await ProductSchema.findById(productID);

    if (_.isEmpty(product)) {
      res.status(400).json({
        message: `Not found a product with ID ${productID}`
      });
    }

    const comments = await CommentSchema.find({ productID: productID });

    let meanRating =
      _.sumBy(comments, function(o) {
        return o.score;
      }) / comments.length;

    res.status(200).json({
      rating: meanRating,
      comments: comments
    });
  } catch (e) {
    res.status(500).json({
      message: `Server error ${e.message}`
    });
  }
};
