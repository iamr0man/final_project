import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import './Filter.scss';
import CircularProgress from '@material-ui/core/CircularProgress';
import Slider from '@material-ui/core/Slider';

class Filter extends Component {
  handleChangePrice = (event, newValue) => {
    const { changePrice } = this.props;
    changePrice(newValue);
    console.log(newValue);
  };

  render() {
    const { handleChangePrice } = this;
    const { filters, price, priceCurrentCatalog } = this.props;
    console.log(price);
    return (
      <div className="filters">
        {filters.length <= 0 ? (
          <CircularProgress />
        ) : (
          <div className="filters-container">
            {price.length > 0 && (
              <ExpansionPanel>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Price</Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                  <Slider
                    min={priceCurrentCatalog[0]}
                    max={priceCurrentCatalog[1]}
                    value={price}
                    onChange={handleChangePrice}
                    aria-labelledby="range-slider"
                    valueLabelDisplay="auto"
                  />
                </ExpansionPanelDetails>
              </ExpansionPanel>
            )}

            <ExpansionPanel>
              <ExpansionPanelSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1a-content"
                id="panel1a-header"
              >
                <Typography>Expansion Panel 1</Typography>
              </ExpansionPanelSummary>
              <ExpansionPanelDetails>
                <Typography>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse malesuada
                  lacus ex, sit amet blandit leo lobortis eget.
                </Typography>
              </ExpansionPanelDetails>
            </ExpansionPanel>
            <ExpansionPanel>
              <ExpansionPanelSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel2a-content"
                id="panel2a-header"
              >
                <Typography>Expansion Panel 2</Typography>
              </ExpansionPanelSummary>
              <ExpansionPanelDetails>
                <Typography>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse malesuada
                  lacus ex, sit amet blandit leo lobortis eget.
                </Typography>
              </ExpansionPanelDetails>
            </ExpansionPanel>
            <ExpansionPanel>
              <ExpansionPanelSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel3a-content"
                id="panel3a-header"
              >
                <Typography>Disabled Expansion Panel</Typography>
              </ExpansionPanelSummary>
              <ExpansionPanelDetails>
                <Typography>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse malesuada
                  lacus ex, sit amet blandit leo lobortis eget.
                </Typography>
              </ExpansionPanelDetails>
            </ExpansionPanel>
          </div>
        )}
      </div>
    );
  }
}

Filter.propTypes = {
  filters: PropTypes.array,
  price: PropTypes.array,
  changePrice: PropTypes.func
};

export default Filter;
