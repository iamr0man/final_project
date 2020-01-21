import React, { Component, Fragment } from 'react';
import { Link } from 'react-router-dom';

import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Image } from 'cloudinary-react';

import { updateQuantity } from '../../actions/authorizationAction';
import _ from 'lodash';
import './Cart.scss';

class Item extends Component {
  render() {
    const { updateQuantity } = this.props;
    const { cloudinary_cloud_name } = this.props.configuration;
    const {
      cart: { items }
    } = this.props.authorization;

    const amount = [];

    for (let i = 1; i < 10; i++) {
      amount.push(
        <option key={i} value={i}>
          {i}
        </option>
      );
    }
    console.log(items);
    return (
      <Fragment>
        <div className="bag-item">
          {_.isArray(items) &&
            items.map(v => {
              const { _id, filters: property, currentPrice, modelNo } = v.modelNo;

              const {
                _id: parentId,
                nameProduct,
                productUrlImg,
                _idChildCategory,
                filterImg
              } = v.idProduct;
              console.log(filterImg);
              let quantity = v.quantity;
              return (
                <div className="sneaker-item" key={_id}>
                  <Image
                    cloudName={cloudinary_cloud_name}
                    publicId={productUrlImg.length > 0 ? productUrlImg[0] : filterImg[0].urlImg[0]}
                    width="400"
                    crop="scale"
                  />
                  <div className="sneaker-item-info">
                    <Link to={`../product/${parentId}`} style={{ textDecoration: 'none' }}>
                      <h2 className="info-title">{nameProduct}</h2>
                    </Link>
                    <p>{_idChildCategory.name}</p>
                    <p>
                      Size{' '}
                      {property.map(v => {
                        if (
                          v.filter.type.toLowerCase() === 'sizes' ||
                          v.filter.type.toLowerCase() === 'size'
                        ) {
                          return v.subFilter.name;
                        }
                        return [];
                      })}
                    </p>
                    <label htmlFor="quantity">Quantity:</label>
                    <select
                      name="quantity"
                      onChange={e => {
                        updateQuantity(parentId, modelNo, e.target.value);
                      }}
                      value={quantity}
                    >
                      {amount}
                    </select>
                  </div>
                  <div>
                    <p className="about-item">${currentPrice * quantity}</p>
                  </div>
                  <div
                    className="close"
                    onClick={() => {
                      updateQuantity(parentId, modelNo, 0);
                    }}
                  />
                </div>
              );
            })}
        </div>
      </Fragment>
    );
  }
}

function mapStateToProps(state) {
  return {
    authorization: state.authorization,
    configuration: state.configuration
  };
}

function mapDispatchToProps(dispatch) {
  return {
    updateQuantity: bindActionCreators(updateQuantity, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Item);
