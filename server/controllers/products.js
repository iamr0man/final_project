const Order = require("../models/Order");
const Cart = require('../models/Cart');
const Favourites = require('../models/Favourites');
const Slider = require('../models/Slider');

const customCloudinaryInstrument = require("../common/customCloudinaryInstrument");

const _ = require("lodash");
const {validationResult} = require("express-validator");
const mongoose = require("mongoose");


const commonProduct = require("../common/commonProduct ");
const Product = require("../models/Product");
const ChildCatalog = require("../models/ChildCatalog");
const uniqueRandom = require("unique-random");
const rand = uniqueRandom(100000, 999999);

exports.addProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({errors: errors.array()});
    }

    let itemNo = (rand()).toString();
    let {_idChildCategory} = req.body;
    let {productUrlImg, filterImg} = req.files;
    const folder = `final-project/products/catalog-${_idChildCategory}/${encodeURI(itemNo)}`;

    if (_.isArray(productUrlImg) && productUrlImg.length > 0) {
      let urlProductOnCloudinary = await customCloudinaryInstrument.uploadArrayImgToCloudinary(
        productUrlImg,
        folder
      );
      urlProductOnCloudinary.forEach(element => {
        _.set(req.body, element.field, element.url);
      });
    }

    if (_.isArray(filterImg) && filterImg.length > 0) {
      for (let i = 0; i < filterImg.length; i++) {
        if (_.isArray(filterImg[i].urlImg) && filterImg[i].urlImg.length > 0) {
          let urlProductOnCloudinary = await customCloudinaryInstrument.uploadArrayImgToCloudinary(
            filterImg[i].urlImg,
            folder
          );
          urlProductOnCloudinary.forEach(element => {
            if (element.field) {
              _.set(req.body, element.field, element.url);
            }
          });
        }
      }
    }

    let product = _.cloneDeepWith(req.body, value => {
      if (_.isString(value) || _.isBoolean(value) || _.isArray(value)) {
        return value;
      }
    });

    product.model = product.model.map(element => {
      element.modelNo = rand();
      return element;
    });

    const {enabled} = product;

    if (_.isBoolean(enabled) && enabled) {
      let filter = product.filters;
      product.model.forEach(element => {
        filter = _.concat(filter, element.filters);
      });

      filter = _.map(
        _.uniq(
          _.map(filter, function (obj) {
            return JSON.stringify(obj);
          })
        ), function (obj) {
          return JSON.parse(obj);
        }
      );

      let childCatalog = await ChildCatalog.findById(product._idChildCategory);
      //добавляем в каталог ранее не используемые под фильтры
      commonProduct.addNewSubFilterToCategory(filter, childCatalog);
      await childCatalog.save();
    }

    product.itemNo = itemNo;

    let newProduct = new Product(product);
    await newProduct.save();

    res.status(200).json(newProduct);
  } catch (e) {
    console.log(e);
    res.status(500).json({
      message: "Server Error!"
    });
  }
};

exports.addModelForProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({errors: errors.array()});
    }
    let model = _.cloneDeepWith(req.body, value => {
      if (_.isString(value) || _.isBoolean(value) || _.isArray(value)) {
        return value;
      }
    });

    const product = await Product.findById(model._idProduct);

    if (!product) {
      return res.status(400).json({
        message: `Product with id ${model._idProduct} is not found`
      });
    }

    const {enabled} = model
    if (_.isBoolean(enabled) && enabled) {


      let filter = model.filters;

      filter = _.map(
        _.uniq(
          _.map(filter, function (obj) {
            return JSON.stringify(obj);
          })
        ), function (obj) {
          return JSON.parse(obj);
        }
      );

      //добавляем в каталог ранее не используемые под фильтры
      let childCatalog = await ChildCatalog.findById(product._idChildCategory);
      commonProduct.addNewSubFilterToCategory(filter, childCatalog);
      await childCatalog.save();
    }
    model = _.omit(model, "_idProduct");
    model.modelNo = rand();

    product.model.push(model);
    await product.save();
    res.status(200).json(product);
  } catch (e) {
    res.status(500).json({
      message: "Server Error!"
    });
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({errors: errors.array()});
    }

    const {_idProduct, warning, enabled: enabledProduct, htmlPage, isBigImg, enabled, filters, description, nameProduct, _idChildCategory} = req.body;
    let {model} = req.body;

    const product = await Product.findById(_idProduct);

    if (!product) {
      res.status(400).json({
        message: "Product not found"
      });
    }

    const folder = `final-project/products/catalog-${_idChildCategory}/${encodeURI(product.itemNo)}`;
    let {productUrlImg, filterImg} = req.files;


    if (_.isArray(productUrlImg) && productUrlImg.length > 0) {
      let urlProductOnCloudinary = await customCloudinaryInstrument.uploadArrayImgToCloudinary(
        productUrlImg,
        folder
      );
      urlProductOnCloudinary.forEach(element => {
        _.set(req.body, element.field, element.url);
      });
    }

    if (_.isArray(filterImg) && filterImg.length > 0) {
      for (let i = 0; i < filterImg.length; i++) {
        if (_.isArray(filterImg[i].urlImg) && filterImg[i].urlImg.length > 0) {
          let urlProductOnCloudinary = await customCloudinaryInstrument.uploadArrayImgToCloudinary(
            filterImg[i].urlImg,
            folder
          );
          urlProductOnCloudinary.forEach(element => {
            if (element.field) {
              _.set(req.body, element.field, element.url);
            }
          });
        }
      }
    }

    let oldImgProduct = [];

    if (_.isArray(req.body.productUrlImg)) {
      if (req.body.productUrlImg.length > 0) {
        oldImgProduct = product.productUrlImg.filter(commonProduct.comparerImg(req.body.productUrlImg));
      } else {
        oldImgProduct.push(...product.productUrlImg);
      }
    }

    if (req.body.filterImg && _.isArray(req.body.filterImg)) {
      if (req.body.filterImg.length > 0) {
        product.filterImg.forEach(oldElement => {
          req.body.filterImg.forEach(newElement => {
            if (_.isObject(newElement) && (oldElement._idSubFilters.toString() === newElement._idSubFilters.toString())) {
              oldImgProduct.push(...oldElement.urlImg.filter(commonProduct.comparerImg(newElement.urlImg)));
            }
          });
        });
      } else {
        product.filterImg.forEach(oldElement => {
          oldImgProduct.push(...oldElement.urlImg);
        });
      }
    }

    //удаляем старые фотки, которые не используем
    if (_.isArray(oldImgProduct) && oldImgProduct.length > 0) {
      await customCloudinaryInstrument.removeImgFromCloudinaryUseArray(oldImgProduct);
    }


    if ((_.isArray(filters) || _.isArray(model))) {
      let newFilter = _.isArray(filters) ? filters : [];

      if (_.isArray(model)) {
        model.forEach(element => {
          newFilter = _.concat(newFilter, element.filters);
        });
      }

      newFilter = _.map(
        _.uniq(
          _.map(newFilter, function (obj) {
            return JSON.stringify(obj);
          })
        ), function (obj) {
          return JSON.parse(obj);
        }
      );

      let oldFilter = product.filters;

      product.model.forEach(element => {
        oldFilter = _.concat(oldFilter, element.filters);
      });

      oldFilter = oldFilter.map(element => {
        const {filter, subFilter} = element;
        return {filter, subFilter};
      });

      let onlyNewFilter = newFilter.filter(commonProduct.comparer(oldFilter));

      let onlyOldFilter = oldFilter.filter(commonProduct.comparer(newFilter));

      let childCatalog = await ChildCatalog.findById(product._idChildCategory);

      //добавляем в каталог ранее не используемые под фильтры
      if (_.isBoolean(enabledProduct) && enabledProduct) {
        commonProduct.addNewSubFilterToCategory(onlyNewFilter, childCatalog);
      }
      if (_.isArray) {
        model = model.map(element => {
          if (!element.modelNo) {
            element.modelNo = rand().toString();
          }
          return element;
        });
      }

      product.model = _.isArray(model) ? model : product.model;
      product.filters = _.isArray(filters) ? filters : product.filters;

      await product.save();
      if (_.isBoolean(enabledProduct) && enabledProduct) {
        await childCatalog.save();
      }

      //контроль не используемых подфильтров в категории при удалении
      if (_.isBoolean(enabledProduct) && enabledProduct) {
        await commonProduct.removeSubFilterFromChildCategoryCheckProduct(
          onlyOldFilter,
          product._idChildCategory,
          _idProduct
        );
      }
    }


    req.body.filterImg = req.body.filterImg.filter(element => {
      return _.isObject(element);
    });

    req.body.productUrlImg = req.body.productUrlImg.filter(element => {
      return _.isString(element) && element;
    });


    product.enabled = _.isBoolean(enabled) ? enabled : product.enabled;
    product.description = _.isString(description) ? description : product.description;
    product.nameProduct = _.isString(nameProduct) ? nameProduct : product.nameProduct;
    product.htmlPage = _.isString(htmlPage) ? htmlPage : product.htmlPage;
    product._idChildCategory = _.isString(_idChildCategory)
      ? _idChildCategory
      : product._idChildCategory;
    product.warning = _.isArray(warning) ? warning : product.warning;
    product.productUrlImg = _.isArray(req.body.productUrlImg)
      ? req.body.productUrlImg
      : product.productUrlImg;
    product.filterImg = _.isArray(req.body.filterImg) ? req.body.filterImg : product.filterImg;
    product.isBigImg = _.isBoolean(isBigImg) ? isBigImg : product.isBigImg;

    await product.save();
    res.status(200).json(product);
  } catch (e) {
    console.log(e);
    res.status(500).json({
      message: "Server Error!"
    });
  }
};

exports.updateModelForProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({errors: errors.array()});
    }

    const {_idProduct, modelNo, filters, modelUrlImg, enabled, quantity, currentPrice, previousPrice} = req.body;


    let product = await Product.findById(_idProduct);

    let indexModel = -1;
    product.model.forEach((element, index) => {
      if (element.modelNo === modelNo) {
        indexModel = index;
      }
    });

    if (indexModel < 0) {
      res.status(400).json({
        message: "Product or model not found"
      });
    }

    if (_.isArray(filters)) {
      let oldFilter = product.model[indexModel].filters;

      product.model.forEach(element => {
        oldFilter = _.concat(oldFilter, element.filters);
      });

      oldFilter = oldFilter.map(element => {
        const {filter, subFilter} = element;
        return {filter, subFilter};
      });


      let onlyNewFilter = filters.filter(commonProduct.comparer(oldFilter));
      let onlyOldFilter = oldFilter.filter(commonProduct.comparer(filters));

      let childCatalog = await ChildCatalog.findById(product._idChildCategory);

      if (_.isBoolean(enabled) && enabled) {
        //добавляем в каталог ранее не используемые под фильтры
        commonProduct.addNewSubFilterToCategory(onlyNewFilter, childCatalog);
      }

      product.model[indexModel].filters = _.isArray(filters)
        ? filters
        : product.model[indexModel].filters;

      await product.save();
      if (_.isBoolean(enabled) && enabled) {
        await childCatalog.save();
        //контроль не используемых подфильтров в категории при удалении
        await commonProduct.removeSubFilterFromChildCategoryCheckProduct(
          onlyOldFilter,
          product._idChildCategory,
          _idProduct
        );
      }
    }

    product.model[indexModel].modelUrlImg = _.isArray(modelUrlImg)
      ? modelUrlImg
      : product.model[indexModel].modelUrlImg;
    product.model[indexModel].enabled = _.isBoolean(enabled)
      ? enabled
      : product.model[indexModel].enabled;
    product.model[indexModel].quantity = _.isNumber(quantity)
      ? quantity
      : product.model[indexModel].quantity;
    product.model[indexModel].currentPrice = _.isNumber(currentPrice)
      ? currentPrice
      : product.model[indexModel].currentPrice;
    product.model[indexModel].previousPrice = _.isNumber(previousPrice)
      ? currentPrice
      : product.model[indexModel].previousPrice;

    await product.save();
    res.status(200).json(product);
  } catch (e) {
    res.status(500).json({
      message: "Server Error!"
    });
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const {id} = req.params;
    let product = await Product.findById(id);

    if (!product) {
      return res.status(400).json({
        message: `Product with id ${id} is not found`
      });
    }

    const orders = await Order.find({'products.productId': id});
    if (orders.length > 0) {
      return res.status(400).json({
        message: `Product with id ${id} use in order. You can deactivate product`
      });
    }
    const carts = await Order.find({'products.idProduct': id});
    if (carts.length > 0) {
      return res.status(400).json({
        message: `Product with id ${id} use in carts. You can deactivate product`
      });
    }

    const favourites = await Favourites.find({'idProduct': id});
    if (favourites.length > 0) {
      return res.status(400).json({
        message: `Product with id ${id} use in Favourites. You can deactivate product`
      });
    }
    const slider = await Slider.find({'product': id});
    if (slider.length > 0) {
      return res.status(400).json({
        message: `Product with id ${id} use in slider. You can deactivate product`
      });
    }

    let filter = product.filters;
    product.model.forEach(element => {
      filter = _.concat(filter, element.filters);
    });

    filter = filter.map(element => {
      const {filter, subFilter} = element;
      return {filter, subFilter};
    });

    filter = _.map(
      _.uniq(
        _.map(filter, function (obj) {
          return JSON.stringify(obj);
        })
      ), function (obj) {
        return JSON.parse(obj);
      }
    );

    //контроль не используемых подфильтров в категории
    await commonProduct.removeSubFilterFromChildCategoryCheckProduct(
      filter,
      product._idChildCategory,
      id
    );


    //удаляем фотки товара
    await customCloudinaryInstrument.removeImgFromCloudinaryUseArray(product.productUrlImg);


    for (let i = 0; i < product.filterImg.length; i++) {
      await customCloudinaryInstrument.removeImgFromCloudinaryUseArray(product.filterImg[i].urlImg);
    }

    await product.delete();
    res.status(200).json({msg: "Product deleted"});
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: `Error happened on server: "${err}" `
    });
  }
};

exports.deleteModelProduct = async (req, res) => {
  try {
    const {id, modelno} = req.params;
    let product = await Product.findById(id);

    if (!product) {
      return res.status(400).json({
        message: `Product's model with id ${id} is not found`
      });
    }

    const orders = await Order.find({'products.modelNo': modelno});
    if (orders.length > 0) {
      return res.status(400).json({
        message: `Model with id ${id} use in order. You can deactivate product`
      });
    }
    const carts = await Order.find({'products.modelNo': modelno});
    if (carts.length > 0) {
      return res.status(400).json({
        message: `Modelno with id ${id} use in carts. You can deactivate product`
      });
    }

    let filter = [];
    product.model.forEach((element, index) => {
      if (element.modelNo === modelno) {
        filter = product.model[index].filters;
        product.model.splice(index, index + 1);
      }
    });

    filter = filter.map(element => {
      const {filter, subFilter} = element;
      return {filter, subFilter};
    });

    filter = _.map(
      _.uniq(
        _.map(filter, function (obj) {
          return JSON.stringify(obj);
        })
      ), function (obj) {
        return JSON.parse(obj);
      }
    );

    //контроль не используемых подфильтров в категории
    await commonProduct.removeSubFilterFromChildCategoryCheckProduct(
      filter,
      product._idChildCategory,
      id
    );

    await product.save();
    res.status(200).json({msg: "Product's model deleted"});
  } catch (err) {
    res.status(500).json({
      message: `Error happened on server: "${err}" `
    });
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    let products = await Product.find()
      .populate({
        path: "_idChildCategory",
        select: "-filters",
        populate: {
          path: "parentId"
        }
      })
      .populate({
        path: "filters.filter",
        select: "enabled _id type serviceName"
      })
      .populate({
        path: "filters.subFilter"
      })
      .populate({
        path: "model.filters.filter",
        select: "enabled _id type serviceName"
      })
      .populate({
        path: "model.filters.subFilter"
      });

    res.status(200).json(products);
  } catch (e) {
    res.status(500).json({
      message: "Server Error!"
    });
  }
};

exports.getProductsActive = async (req, res, next) => {
  try {
    let products = await Product.find({enabled: true})
      .populate({
        path: "_idChildCategory",
        select: "-filters",
        populate: {
          path: "parentId"
        }
      })
      .populate({
        path: "filters.filter",
        select: "enabled _id type serviceName"
      })
      .populate({
        path: "filters.subFilter"
      })
      .populate({
        path: "model.filters.filter",
        select: "enabled _id type serviceName"
      })
      .populate({
        path: "model.filters.subFilter"
      });
    res.status(200).json(products);
  } catch (e) {
    res.status(500).json({
      message: "Server Error!"
    });
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const {id} = req.params;
    let product = await Product.findById(id)
      .populate({
        path: "_idChildCategory",
        select: "-filters",
        populate: {
          path: "parentId"
        }
      })
      .populate({
        path: "filters.filter",
        select: "enabled _id type serviceName"
      })
      .populate({
        path: "filters.subFilter"
      })
      .populate({
        path: "model.filters.filter",
        select: "enabled _id type serviceName"
      })
      .populate({
        path: "model.filters.subFilter"
      })
      .populate({
        path: 'filterImg._idFilter',
        select: '_id enabled type serviceName'
      })
      .populate('filterImg._idSubFilters')
      .populate({
        path: 'comments',
        populate: {
          path: "authorId",
          select: 'firstName lastName'
        }
      })


    if (!product) {
      return res.status(400).json({
        message: `Product with id ${id} is not found`
      });
    }

    product.comments = _.reverse(product.comments);

    res.status(200).json(product);
  } catch (e) {
    res.status(500).json({
      message: "Server Error!"
    });
  }
};

exports.searchProductsHeader = async (req, res, next) => {
  try {
    const {searchheader} = req.params;
    const products = await Product.find({$and: [{"nameProduct": {$regex: decodeURI(searchheader)}}, {enabled: true}]})
      .limit(5)
      .populate({
        path: "_idChildCategory",
        select: "-filters",
        populate: {
          path: "parentId"
        }
      })
      .populate({
        path: "filters.filter",
        select: "enabled _id type serviceName"
      })
      .populate({
        path: "filters.subFilter"
      })
      .populate({
        path: "model.filters.filter",
        select: "enabled _id type serviceName"
      })
      .populate({
        path: "model.filters.subFilter"
      })
      .populate({
        path: 'filterImg._idFilter',
        select: '_id enabled type serviceName'
      })
      .populate('filterImg._idSubFilters');
    res.status(200).json(products);
  } catch (e) {
    res.status(500).json({
      message: "Server Error!"
    });
  }
};

exports.searchProducts = async (req, res, next) => {
  try {
    const {search} = req.params;
    const products = await Product.find({$and: [{"nameProduct": {$regex: decodeURI(search)}}, {enabled: true}]})
      .populate({
        path: "_idChildCategory",
        select: "-filters",
        populate: {
          path: "parentId"
        }
      })
      .populate({
        path: "filters.filter",
        select: "enabled _id type serviceName"
      })
      .populate({
        path: "filters.subFilter"
      })
      .populate({
        path: "model.filters.filter",
        select: "enabled _id type serviceName"
      })
      .populate({
        path: "model.filters.subFilter"
      })
      .populate({
        path: 'filterImg._idFilter',
        select: '_id enabled type serviceName'
      })
      .populate('filterImg._idSubFilters');
    res.status(200).json(products);
  } catch (e) {
    res.status(500).json({
      message: "Server Error!"
    });
  }
};

exports.getProductsFilterParams = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({errors: errors.array()});
    }

    let {subfilters, idCatalog, page, limit, sort, price} = req.body;

    if (_.isArray(subfilters)) {
      subfilters = subfilters.filter(element => {
        return mongoose.Types.ObjectId(element);
      });
    }

    const query = {
      $and: [
        {
          "_idChildCategory": idCatalog
        },
        {
          "enabled": true
        }
      ]
    };

    if (_.isArray(price) && price.length === 2) {
      query.$and.push({
        'model.currentPrice': {$gt: +price[0]-2}
      }, {
        'model.currentPrice': {$lt: +price[1]+2}
      },)
    }
    if (_.isArray(subfilters) && subfilters.length > 0) {
      query.$and.push({
        $or: [
          {
            "filters.subFilter": {$in: subfilters}
          },
          {
            "model.filters.subFilter": {$in: subfilters}
          }
        ]
      })
    }


    const Products = await Product.paginate(query,
      {
        page: _.isNumber(page) ? page : 1,
        limit: _.isNumber(limit) ? limit : 9,
        sort: sort === 0 || !_.isNumber(sort) ?  {'date': -1} : {
          'model.currentPrice': +sort === 1 ? -1 : 1
        },
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
          }, {
            path: "model.filters.subFilter"
          }, {
            path: "filterImg._idFilter",
            select: "enabled _id type serviceName"
          },
          {
            path: "filterImg._idSubFilters",
          }
        ]
      })


    res.status(200).json(Products);
  } catch (e) {
    console.log(e);
    res.status(500).json({
      message: "Server Error!"
    });
  }
};

exports.activateOrDeactivateProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array()});
    }
    const {_idProduct, status} = req.body;

    if (!mongoose.Types.ObjectId.isValid(_idProduct)) {
      return res.status(400).json({
        message: `ID is not valid ${_idProduct}`
      });
    }

    let product = await Product.findById(_idProduct);

    if (!product) {
      return res.status(400).json({
        message: `Product with id ${_idProduct} is not found`
      });
    }

    const {enabled: enabledProd} = product;

    if (enabledProd === status) {
      return res.status(400).json({
        message: `Product with ID ${_idProduct} is already ${status ? 'active' : 'deactive'}`
      });
    }

    if (status) {
      let filter = product.filters.map(element => {
        const {filter, subFilter} = element;
        return {filter, subFilter};
      });
      product.model.filter(element => element.enabled).forEach(element => {
        filter = _.concat(filter, element.filters);
      });

      filter = _.map(
        _.uniq(
          _.map(filter, function (obj) {
            return JSON.stringify(obj);
          })
        ), function (obj) {
          return JSON.parse(obj);
        }
      );

      let childCatalog = await ChildCatalog.findById(product._idChildCategory);
      //добавляем в каталог ранее не используемые под фильтры
      await commonProduct.addNewSubFilterToCategory(filter, childCatalog);
      await childCatalog.save();
      product.enabled = status;
      product = await product.save();
    } else {
      let filter = product.filters.map(element => {
        const {filter, subFilter} = element;
        return {filter, subFilter};
      });
      product.model.forEach(element => {
        filter = _.concat(filter, element.filters);
      });

      filter = filter.map(element => {
        const {filter, subFilter} = element;
        return {filter, subFilter};
      });

      filter = _.map(
        _.uniq(
          _.map(filter, function (obj) {
            return JSON.stringify(obj);
          })
        ), function (obj) {
          return JSON.parse(obj);
        }
      );
      //контроль не используемых подфильтров в категории
      await commonProduct.removeSubFilterFromChildCategoryCheckProduct(
        filter,
        product._idChildCategory,
        _idProduct
      );
      product.enabled = status;
      product = await product.save();
    }
    res.status(200).json(product);
  } catch (e) {
    console.log(e);
    res.status(500).json({
      message: "Server Error!"
    });
  }
};

exports.activateOrDeactivateProductModel = async (req, res) => {
  try {
    const {_idProduct, status, modelNo} = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array()});
    }

    if (!mongoose.Types.ObjectId.isValid(_idProduct)) {
      return res.status(400).json({
        message: `ID is not valid ${_idProduct}`
      });
    }

    let product = await Product.findById(_idProduct);
    if (!product) {
      return res.status(400).json({
        message: `Product with id ${_idProduct} is not found`
      });
    }
    const {enabled: enabledProduct} = product;

    if (enabledProduct) {
      let indexModel = -1;
      product.model.forEach((element, index) => {
        if (element.modelNo === modelNo) {
          indexModel = index;
        }
      });

      if (indexModel < 0) {
        return res.status(400).json({
          message: `model with id ${product} is not found`
        });
      }


      if (status) {

        let filter = product.model[indexModel].filters;

        filter = _.map(
          _.uniq(
            _.map(filter, function (obj) {
              return JSON.stringify(obj);
            })
          ), function (obj) {
            return JSON.parse(obj);
          }
        );

        //добавляем в каталог ранее не используемые под фильтры
        let childCatalog = await ChildCatalog.findById(product._idChildCategory);
        commonProduct.addNewSubFilterToCategory(filter, childCatalog);
        await childCatalog.save();

      } else {

        let filter = [];
        product.model.forEach((element, index) => {
          if (element.modelNo === modelNo) {
            filter = product.model[index].filters;
            product.model.splice(index, index + 1);
          }
        });

        filter = filter.map(element => {
          const {filter, subFilter} = element;
          return {filter, subFilter};
        });

        filter = _.map(
          _.uniq(
            _.map(filter, function (obj) {
              return JSON.stringify(obj);
            })
          ), function (obj) {
            return JSON.parse(obj);
          }
        );

        //контроль не используемых подфильтров в категории
        await commonProduct.removeSubFilterFromChildCategoryCheckProduct(
          filter,
          product._idChildCategory,
          _idProduct
        );
      }
      product = await Product.findById(_idProduct);
      product.model[indexModel].enabled = status;
      product = await product.save();


    } else {
      return res.status(400).json({
        message: `Activate product`
      });
    }
    res.status(200).json(product);
  } catch (e) {
    console.log(e);
    res.status(500).json({
      message: "Server Error!"
    });
  }
};
