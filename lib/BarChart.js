/**
 * Copyright (c) 2015-present, Vivace Studio.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule BarChart
 */
'use strict';

import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  ViewPropTypes,
} from 'react-native';
import PropTypes from 'prop-types';

import DataPropType from './DataPropType';
import DatasetPropType from './DatasetPropType';
import ScalePropType from './ScalePropType';

import resolveDatasets from './resolveDatasets';
import ensureScaleCoverRange from './ensureScaleCoverRange';

/**
  * AntiBar component
  */
class AntiBar extends Component {
  static propTypes = {
    ratio: PropTypes.number,
  };

  render() {
    const barStyle = {
      flex: this.props.ratio
    };
    // render bar
    return (
      <View style={[barStyle]} />
    );
  }
}

/**
  * Bar component
  */
class Bar extends Component {
  static propTypes = {
    orientation: PropTypes.oneOf(['vertical', 'horizontal']).isRequired,
    borderColor: PropTypes.string,
    fillColor: PropTypes.string,
    borderStyle: PropTypes.oneOf(['solid', 'dotted', 'dashed']),
    borderWidth: PropTypes.number,
    ratio: PropTypes.number.isRequired,
    // not used for rendering, reference only
    name: PropTypes.string,
    value: PropTypes.number.isRequired
  };

  static defaultProps = {
    borderStyle: 'solid',
    borderWidth: 1,
    fillColor: '#CBDDE6',
    borderColor: '#A2C3D2'
  };

  render() {
    const vertical = this.props.orientation !== 'horizontal';
    // use flex to draw the bar
    const valueFlex = this.props.ratio;
    // the outter bar ensures the ratio is not affected by
    // the border width so that the bar meets the scale precisely
    const outterBarStyle = {
      flex: valueFlex
    };
    const orientationStyle = vertical ? barStyles.vertical : barStyles.horizontal;
    const innerBarStyle = {
      flex: 1,
      backgroundColor: this.props.fillColor,
      borderColor: this.props.borderColor,
      borderWidth: this.props.ratio ? this.props.borderWidth : 0,
      borderStyle: this.props.borderStyle
    };

    // render bar
    return (
      <View style={[outterBarStyle]}>
        <View style={[innerBarStyle, orientationStyle]} />
      </View>
    );
  }
}

const barStyles = StyleSheet.create({
  vertical: {
    borderBottomWidth: 0
  },

  horizontal: {
    borderLeftWidth: 0
  }
});

/**
  * BarCluster component
  */
class BarCluster extends Component {
  static propTypes = {
    orientation: PropTypes.oneOf(['vertical', 'horizontal']).isRequired,
    minValue: PropTypes.number.isRequired,
    maxValue: PropTypes.number.isRequired,
    borderStyle: PropTypes.oneOf(['solid', 'dotted', 'dashed']),
    borderWidth: PropTypes.number,
    data: PropTypes.arrayOf(DataPropType).isRequired,
    margin: PropTypes.number,
    barSpacing: PropTypes.number
  };

  _renderBar = (datum, index, data) => {
    let barMargin = this.props.barSpacing / 2;
    let marginStart = (index > 0) ? barMargin : 0;
    let marginEnd = (index === data.length - 1) ? 0 : barMargin;
    // always use diff to avoid divid by zero and negative values
    //let ratio = (datum.value - this.props.minValue) / (this.props.maxValue - this.props.minValue);
    //let antiRatio = 1 - ratio
    //*
    let ratio, negRatio;
    if ( datum.value > 0 ) {
      negRatio = Math.abs((this.props.minValue - Math.max(0, this.props.minValue)) / (this.props.maxValue - this.props.minValue));
      ratio = ((datum.value - this.props.minValue) / (this.props.maxValue - this.props.minValue)) - negRatio;
    } else if ( datum.value === 0 ) {
      // special case
      negRatio = 0;
      ratio = 0;
    } else {
      // value and minValue are both negative
      negRatio = Math.abs((this.props.minValue - datum.value) / (this.props.maxValue - this.props.minValue));
      ratio = Math.abs((datum.value) / (this.props.maxValue - this.props.minValue));
    }
    let antiRatio = 1 - ratio - negRatio;
    let negBar = (
      <AntiBar key='negBar'
        ratio={negRatio}
      />
    );
    //*/
    let bar = (
      <Bar key='bar'
        orientation={this.props.orientation}
        fillColor={datum.primaryColor}
        borderColor={datum.secondaryColor}
        borderWidth={this.props.borderWidth}
        borderStyle={this.props.borderStyle}
        ratio={ratio}
        name={datum.name}
        value={datum.value} />
    );
    let antiBar = (
      <AntiBar key='antiBar'
        ratio={antiRatio} />
    );
    let vertical = this.props.orientation !== 'horizontal';
    let barContent = vertical ? [antiBar, bar, negBar] : [negBar, bar, antiBar];
    let marginStyle = {
      marginLeft: vertical ? marginStart : 0,
      marginRight: vertical ? marginEnd : 0,
      marginTop: vertical ? 0 : marginStart,
      marginBottom: vertical ? 0 : marginEnd
    };
    return (
      <View key={'bar-' + index}
        style={[barClusterStyles.barContainer, marginStyle]}>
        {barContent}
      </View>
    );
  };

  render() {
    let vertical = this.props.orientation !== 'horizontal';
    let marginStyle = {
      marginHorizontal: vertical ? this.props.margin : 0,
      marginVertical: vertical ? 0 : this.props.margin
    };
    return (
      <View style={[
          barClusterStyles.container,
          barClusterStyles[this.props.orientation],
          marginStyle
        ]}>
        { this.props.data.map(this._renderBar) }
      </View>
    );
  }
}

const barClusterStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between'
  },

  barContainer: {
    flex: 1
  },

  vertical: {
    flexDirection: 'row'
  },

  horizontal: {
    flexDirection: 'column'
  }
});

/**
  * BarStack component
  */
class BarStack extends Component {
  static propTypes = {
    orientation: PropTypes.oneOf(['vertical', 'horizontal']).isRequired,
    minValue: PropTypes.number.isRequired,
    maxValue: PropTypes.number.isRequired,
    borderStyle: PropTypes.oneOf(['solid', 'dotted', 'dashed']),
    borderWidth: PropTypes.number,
    data: PropTypes.arrayOf(DataPropType).isRequired,
    margin: PropTypes.number
  };

  _renderBar = (datum, index, data) => {
    // always use diff to avoid divid by zero and negative values
    let ratio = (datum.value - this.props.minValue) / (this.props.maxValue - this.props.minValue);
    return (
      <Bar key={'bar-' + index}
        orientation={this.props.orientation}
        fillColor={datum.primaryColor}
        borderColor={datum.secondaryColor}
        borderWidth={this.props.borderWidth}
        borderStyle={this.props.borderStyle}
        ratio={ratio}
        name={datum.name}
        value={datum.value} />
    );
  };

  render() {
    let vertical = this.props.orientation !== 'horizontal';
    let marginStyle = {
      marginHorizontal: vertical ? this.props.margin : 0,
      marginVertical: vertical ? 0 : this.props.margin
    };
    let totalValue = 0;
    this.props.data.forEach(function(datum, index) {
      totalValue += datum.value;
    });
    let totalRatio = (totalValue - this.props.minValue) / (this.props.maxValue - this.props.minValue);
    let antiBar = (
      <AntiBar key='antiBar'
        ratio={1 - totalRatio} />
    );
    let bars = this.props.data.map(this._renderBar).reverse();
    bars.unshift(antiBar);
    if (!vertical) {
      bars.reverse();
    }

    return (
      <View style={[
          barStackStyles.container,
          barStackStyles[this.props.orientation],
          marginStyle
        ]}>
        { bars }
      </View>
    );
  }
}

const barStackStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent'
  },

  barContainer: {
    flex: 1
  },

  vertical: {
    flexDirection: 'column'
  },

  horizontal: {
    flexDirection: 'row'
  }
});

/**
  * BarChart component
  */
class BarChart extends Component {
  static propTypes = {
    // Bar options
    // space between bars / bar clusters
    spacing: PropTypes.number,
    // space between bars in bar cluster
    clusterSpacing: PropTypes.number,
    // Border width of the bar, uses secondaryColor from dataset
    barBorderWidth: PropTypes.number,

    datasets: PropTypes.arrayOf(DatasetPropType).isRequired,

    // Scale of the chart
    valueScale: ScalePropType.isRequired,

    // Style
    orientation: PropTypes.oneOf(['vertical', 'horizontal']),
    displayMode: PropTypes.oneOf(['clustered', 'stacked']),
    style: ViewPropTypes.style
  };

  static defaultProps: {
    spacing: 10,
    clusterSpacing: 0,
    barBorderWidth: 2,
    displayMode: 'clustered',
    orientation: 'vertical'
  };

  _renderBarCluster = (data, index) => {
    return (
      <BarCluster key={'barCluster-' + index}
        orientation={this.props.orientation}
        minValue={this.props.valueScale.min}
        maxValue={this.props.valueScale.max}
        borderStyle={this.props.barBorderStyle}
        borderWidth={this.props.barBorderWidth}
        margin={this.props.spacing / 2}
        barSpacing={this.props.clusterSpacing}
        data={data} />
    );
  };

  _renderBarStack = (data, index) => {
    return (
      <BarStack key={'barStack-' + index}
        orientation={this.props.orientation}
        minValue={this.props.valueScale.min}
        maxValue={this.props.valueScale.max}
        borderStyle={this.props.barBorderStyle}
        borderWidth={this.props.barBorderWidth}
        margin={this.props.spacing / 2}
        data={data} />
    );
  };

  componentWillMount() {
    let { valueScale, datasets, displayMode } = this.props;
    ensureScaleCoverRange(valueScale, datasets, displayMode === 'stacked');
  }

  componentWillReceiveProps(nextProps) {
    let { valueScale, datasets, displayMode } = nextProps;
    ensureScaleCoverRange(valueScale, datasets, displayMode === 'stacked');
  }

  render() {
    let dataArray = resolveDatasets(this.props.datasets);
    let content = this.props.displayMode === 'stacked' ?
      dataArray.map(this._renderBarStack) :
      dataArray.map(this._renderBarCluster);
    return (
      <View key='chart'
        style={[
          styles.container,
          styles[this.props.orientation],
          this.props.style
        ]}>
        {content}
      </View>
    );
  }
}

// Common base styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent'
  },

  vertical: {
    flexDirection: 'row'
  },

  horizontal: {
    flexDirection: 'column'
  }
});

export default BarChart;
