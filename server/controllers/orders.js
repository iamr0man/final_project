const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const Orders = require("../models/Order");
const _ = require("lodash");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const { generatorHTMLTableToOrder } = require("../common/generatorHTMLTableToOrder");

exports.placeOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { delivery, email, name, mobile } = req.body;
    const idCustomer = req.user._id;

    let response = {
      delivery: delivery,
      email: email,
      mobile: mobile,
      name: name,
      canceled: false,
      products: [],
      idCustomer: idCustomer
    };

    let cart = JSON.parse(
      JSON.stringify(
        await Cart.findOne({ customerId: idCustomer })
          .populate("customerId")
          .populate("products.idProduct")
      )
    );

    if (!cart) {
      return res.status(400).json({
        message: "Cart not found"
      });
    }

    cart.products.forEach((element, indexProd) => {
      let index = _.findIndex(element.idProduct.model, function(o) {
        return o.modelNo == element.modelNo;
      });
      cart.products[indexProd].modelNo = _.clone(cart.products[indexProd].idProduct.model[index]);
    });

    cart.products.forEach(element => {
      response.products.push({
        productId: element.idProduct._id,
        modelNo: element.modelNo.modelNo,
        currentPrice: element.modelNo.currentPrice,
        quantity: element.quantity
      });
    });
    response.totalSum = _.sumBy(response.products, function(o) {
      return o.currentPrice * o.quantity;
    });

    let isCart = await Cart.findOne({ customerId: idCustomer });
    isCart.products = [];
    isCart = await isCart.save();

    response = await new Orders(response).save();
    await generatorHTMLTableToOrder(response._id, email);
    res.status(200).json(response);
  } catch (e) {
    console.log(e);
    res.status(400).json({
      message: `Server error ${e.message}`
    });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    let { idOrder, products } = req.body;
    if (!mongoose.Types.ObjectId.isValid(idOrder)) {
      return res.status(400).json({
        message: `ID Order is not valid ${idOrder}`
      });
    }

    const data = _.cloneDeep(req.body);

    const isOrder = JSON.parse(
      JSON.stringify(await Orders.findById(idOrder).populate("products.productId"))
    );

    if (!isOrder) {
      return res.status(400).json({
        message: "Orders not found"
      });
    }

    if (_.isArray(products) && !_.isEqual(isOrder.products, products) && products.length > 0) {
      data.products = await Promise.all(
        products.map(async element => {
          const prod = await Product.findById(element.idProduct);
          let index = _.findIndex(prod.model, function(o) {
            return o.modelNo == element.modelNo;
          });

          return {
            productId: element.idProduct,
            modelNo: element.modelNo,
            currentPrice: prod.model[index].currentPrice,
            quantity: element.quantity
          };
        })
      );
    }

    data.totalSum = _.sumBy(data.products, function(o) {
      return o.currentPrice * o.quantity;
    });

    let order = await Orders.findByIdAndUpdate(idOrder, { $set: data }, { new: true });
    order = await order.save();
    res.status(200).json(order);
  } catch (e) {
    console.log(e);
    res.status(400).json({
      message: `Server error ${e.message}`
    });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    let { idOrder } = req.body;
    if (!mongoose.Types.ObjectId.isValid(idOrder)) {
      return res.status(400).json({
        message: `ID Order is not valid ${idOrder}`
      });
    }

    let isOrder = await Orders.findById(idOrder);

    if (!isOrder) {
      return res.status(400).json({
        message: "Orders not found"
      });
    }

    isOrder.canceled = true;
    isOrder = await isOrder.save();

    res.status(200).json(isOrder);
  } catch (e) {
    res.status(400).json({
      message: `Server error ${e.message}`
    });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const { idOrder } = req.params;
    if (!mongoose.Types.ObjectId.isValid(idOrder)) {
      return res.status(400).json({
        message: `ID is not valid ${idOrder}`
      });
    }
    const oldOrder = await Orders.findById(idOrder);
    if (!oldOrder) {
      return res.status(400).json({
        message: `Orders with an id "${idOrder}" is not found.`
      });
    }

    const info = await oldOrder.delete();

    res.status(200).json({
      message: `Orders with an id "${idOrder}" is successfully deleted from DB.`,
      deletedOrderInfo: info
    });
  } catch (e) {
    res.status(400).json({
      message: `Server error ${e.message}`
    });
  }
};

exports.getOrdersByCustomer = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const idCustomer = req.user._id;
    const { page, limit } = req.body;

    const orders = await Orders.paginate(
      { idCustomer: idCustomer },
      {
        page: _.isNumber(page) ? page : 1,
        limit: _.isNumber(limit) ? limit : 9
      }
    );

    res.status(200).json(orders);
  } catch (e) {
    res.status(400).json({
      message: `Server error ${e.message}`
    });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { idOrder } = req.params;

    if (!mongoose.Types.ObjectId.isValid(idOrder)) {
      return res.status(400).json({
        message: `ID is not valid ${idOrder}`
      });
    }
    let order = JSON.parse(
      JSON.stringify(
        await Orders.findById(idOrder)
          .populate("idCustomer")
          .populate({ path: "delivery.idShippingMethod", select: "-address" })
          .populate("delivery.storeAddress")
          .populate("products.productId")
      )
    );

    if (!order) {
      return res.status(400).json({
        message: `Orders with an id "${idOrder}" is not found.`
      });
    }

    order.products = order.products.map(element => {
      let indexModel = _.findIndex(element.productId.model, function(o) {
        return o.modelNo == element.modelNo;
      });
      element.modelNo = element.productId.model[indexModel];
      return element;
    });

    res.status(200).json(order);
  } catch (e) {
    res.status(400).json({
      message: `Server error ${e.message}`
    });
  }
};

exports.getOrders = async (req, res) => {
  try {
    let orders = JSON.parse(
      JSON.stringify(
        await Orders.find({})
          .populate("idCustomer")
          .populate({ path: "delivery.idShippingMethod", select: "-address" })
          .populate("delivery.storeAddress")
          .populate({
            path: "products.productId",
            populate: [
              {
                path: "_idChildCategory",
                select: "-filters",
                populate: {
                  path: "parentId"
                }
              },
              {
                path: "filters.filter",
                select: "enabled _id type serviceName"
              },
              {
                path: "filters.subFilter"
              },
              {
                path: "model.filters.filter",
                select: "enabled _id type serviceName"
              },
              {
                path: "model.filters.subFilter"
              },
              {
                path: "filterImg._idFilter",
                select: "_id enabled type serviceName"
              },
              {
                path: "filterImg._idSubFilters"
              }
            ]
          })
      )
    );

    orders = orders.map(order => {
      order.products = order.products.filter(item=>{
        return _.isObject(item.productId) && !_.isNull(item.productId)
      }).map(element => {
        let indexModel = _.findIndex(element.productId.model, function(o) {
          return o.modelNo == element.modelNo;
        });
        console.log(indexModel);
        console.log(element);
        element.modelNo = element.productId.model[indexModel];
        return element;
      });
      return order;
    });
    res.status(200).json(orders);
  } catch (e) {
    console.log(e);
    res.status(400).json({
      message: `Server error ${e.message}`
    });
  }
};
