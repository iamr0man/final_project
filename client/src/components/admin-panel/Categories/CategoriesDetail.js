import React, { Component } from 'react';
import PropTypes from 'prop-types';

import AdminFiltersAPI from '../../../services/AdminFiltersAPI';
import AdminCategoriesAPI from '../../../services/AdminCategoriesAPI';

import CategoriesDetailForm from './CategoriesDetailForm.js';

import SnackBars from '../../common/admin-panel/SnackBars';
import Preloader from '../../common/admin-panel/Preloader';

import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import Button from '@material-ui/core/Button';

import ArrowBackIcon from '@material-ui/icons/ArrowBack';

import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    padding: theme.spacing(2)
  }
});

class CategoriesDetail extends Component {
  state = {
    idRootCategory: '',
    rootCategoryError: false,
    rootCategory: '',
    childCategory: [],
    filtersData: [],
    typeForm: 'create',
    idUpdate: null,
    isOpenSnack: false,
    sendDataStatus: 'success',
    sendDataMessage: '',
    isLoading: false,
    listRemove: []
  };

  setIsLoading = state => {
    this.setState({ isLoading: state });
  };

  newObjChildCategory = () => ({
    id: new Date().getTime().toString(),
    idOwner: '',
    name: '',
    childCategoryError: false,
    filtersError: false,
    filters: []
  });

  onChangeValue = (name, val, idChildCategory) => {
    const { childCategory } = this.state;
    const error = !val.length;

    if (name === 'rootCategory') {
      this.setState({ rootCategory: val, rootCategoryError: error });
    } else if (name === 'childCategory') {
      this.setState({
        childCategory: childCategory.map(item => {
          if (item.id === idChildCategory) item.name = val;
          item.childCategoryError = error;
          return item;
        })
      });
    } else if (name === 'filters') {
      this.setState({
        childCategory: childCategory.map(item => {
          if (item.id === idChildCategory) item.filters = val;
          item.filtersError = error;
          return item;
        })
      });
    }
  };

  onAddChildCategory = () => {
    this.setState({
      childCategory: [...this.state.childCategory, this.newObjChildCategory()]
    });
  };

  onClickDelete = e => {
    e.stopPropagation();
    const { listRemove } = this.state;
    listRemove.push(e.currentTarget.getAttribute('datakey'));
    this.setState({ listRemove: listRemove });
    this.setState({
      childCategory: this.state.childCategory.filter(
        i => i.id !== e.currentTarget.getAttribute('datakey')
      )
    });
  };

  onSubmitForm = async () => {
    try {
      this.setIsLoading(true);

      const { idRootCategory, rootCategory, childCategory, typeForm, listRemove } = this.state;

      const sendData = {
        nameRootCatalog: rootCategory,
        childCatalogs: childCategory.map(child => {
          const childData = {
            nameChildCatalog: child.name,
            filters: child.filters.map(filter => filter.id)
          };

          if (child.idOwner) childData._id = child.idOwner;

          return childData;
        })
      };

      sendData.childCatalogs.push(
        ...listRemove.map(item => {
          return {
            _id: item,
            isRemove: true
          };
        })
      );

      if (typeForm === 'create') {
        await AdminCategoriesAPI.createCategories(sendData);
      }
      if (typeForm === 'update') {
        sendData._id = idRootCategory;
        const { data } = await AdminCategoriesAPI.updateCategories(sendData);

        this.setState({
          rootCategory: data.name,
          idRootCategory: data._id,
          childCategory: data.childCatalog.map(i => ({
            idOwner: i._id,
            id: i._id,
            childCategoryError: false,
            filtersError: false,
            name: i.name,
            filters: i.filters.map(k => ({
              id: k.filter._id,
              serviceName: k.filter.serviceName
            }))
          }))
        });
      }

      this.setIsLoading(false);

      this.setState({
        sendDataStatus: 'success',
        sendDataMessage: `${rootCategory} category has been ${typeForm}!`
      });
    } catch (err) {
      this.setIsLoading(false);

      this.setState({
        sendDataStatus: 'error',
        sendDataMessage: err.response.data.message || err.message
      });
    }
  };

  handleCloseSnackBars = (event, reason) => {
    if (reason === 'clickaway') return;

    this.setState({ sendDataMessage: '' });
  };

  async componentDidMount() {
    try {
      this.setIsLoading(true);

      const { data } = await AdminFiltersAPI.getFilters();
      this.setState({
        filtersData: data.map(i => ({ id: i._id, serviceName: i.serviceName }))
      });

      const { id } = this.props.match.params;
      if (id) {
        this.setState({ typeForm: 'update', idUpdate: id });

        const { data } = await AdminCategoriesAPI.getCategoriesById(id);

        this.setState({
          rootCategory: data.name,
          idRootCategory: data._id,
          childCategory: data.childCatalog.map(i => ({
            idOwner: i._id,
            id: i._id,
            childCategoryError: false,
            filtersError: false,
            name: i.name,
            filters: i.filters.map(k => ({
              id: k.filter._id,
              serviceName: k.filter.serviceName
            }))
          }))
        });
      } else {
        this.setState({ childCategory: [this.newObjChildCategory()] });
      }

      this.setIsLoading(false);
    } catch (err) {
      this.setIsLoading(false);

      this.setState({
        isOpenSnack: true,
        sendDataStatus: 'error',
        sendDataMessage: err.response.data.message || err.message
      });
    }
  }

  render() {
    const { classes } = this.props;
    const {
      rootCategory,
      rootCategoryError,
      childCategory,
      filtersData,
      sendDataStatus,
      sendDataMessage,
      isLoading
    } = this.state;

    return (
      <Container maxWidth="md">
        <Paper className={classes.root}>
          <Button
            onClick={() => this.props.history.goBack()}
            startIcon={<ArrowBackIcon color="action" />}
          >
            <Typography component="span">
              <Box fontWeight={500} component="span" fontFamily="Monospace" fontSize="h7.fontSize">
                Categories
              </Box>
            </Typography>
          </Button>
          <CategoriesDetailForm
            rootCategory={rootCategory}
            rootCategoryError={rootCategoryError}
            childCategory={childCategory}
            filtersData={filtersData}
            onChangeValue={this.onChangeValue}
            onAddChildCategory={this.onAddChildCategory}
            onClickDelete={this.onClickDelete}
            hasOnClickDelete={!!(childCategory.length > 1)}
            onSubmitForm={this.onSubmitForm}
            onSubmitFormDisabled={
              !!(childCategory.find(i => !i.name || !i.filters.length) || !rootCategory)
            }
          />

          <SnackBars
            handleClose={this.handleCloseSnackBars}
            variant={sendDataStatus}
            open={!!sendDataMessage}
            message={sendDataMessage}
          />

          <Preloader open={isLoading} />
        </Paper>
      </Container>
    );
  }
}

CategoriesDetail.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(CategoriesDetail);
