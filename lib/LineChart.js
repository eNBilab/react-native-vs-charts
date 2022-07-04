/**
 * Copyright (c) 2015-present, Vivace Studio.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule LineChart
 */
'use strict';

import React, { Component } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';

import ensureScaleCoverRange from './ensureScaleCoverRange';

/**
 * Line component
 */
class Line extends Component {

  static defaultProps = {
    lineWidth: 2,
    lineColor: 'rgba(220,220,220,1)',
    pointMode: 'none',
    pointRadius: 5,
    pointBorderWidth: 2,
    pointColor: 'rgba(220,220,220,1)',
    pointBorderColor: 'rgba(0,0,0,.05)'
  };

  state = {
    layout: null
  };

  _onLayout = (e) => {
    this.setState({
      layout: e.nativeEvent.layout
    });
  };

  render() {
    if (!this.state.layout) {
      return (
        <View style={lineStyles.measure} onLayout={this._onLayout} />
      );
    }
    let lineStyle = null;
    let fromY = Math.floor(this.state.layout.height * this.props.fromRatio);
    let toY = null;
    if (this.props.toRatio != null) {
      // render line
      toY = Math.floor(this.state.layout.height * this.props.toRatio);
      let baseY = Math.min(fromY, toY);
      // calculate angle for line
      let center = baseY + Math.abs(fromY - toY) / 2;
      let sideA = Math.abs(fromY - toY) / 2;
      let sideB = this.state.layout.width / 2;
      let sideC = Math.sqrt(Math.pow(sideA, 2) + Math.pow(sideB, 2));
      let rotate = Math.asin(sideA / sideC) * (180 / Math.PI) * -1;
      // inverse rotation if fromY is larger than toY
      if (fromY > toY) {
        rotate *= -1;
      }
      let linePadding = this.props.pointMode !== 'none' ? this.props.pointRadius : 0;
      let lineWidth = sideC - linePadding;
      let scaleX = lineWidth / sideB;
      // styles
      // noinspection JSSuspiciousNameCombination
      lineStyle = {
        position: 'absolute',
        bottom: center - this.props.lineWidth / 2,
        width: this.state.layout.width,
        height: this.props.lineWidth,
        backgroundColor: this.props.lineColor,
        transform: [
          {rotate: Math.round(rotate) + "deg"},
          {scaleX}
        ]
      };
    }
    // points
    let pointStyle = {
      backgroundColor: this.props.pointColor,
      borderColor: this.props.pointBorderColor,
      borderWidth: this.props.pointBorderWidth,
      borderRadius: this.props.pointRadius,
      width: this.props.pointRadius * 2,
      height: this.props.pointRadius * 2
    };
    let points = [];
    // from point
    let drawFromPoint = this.props.pointMode === 'from' || this.props.pointMode === 'both';
    if (drawFromPoint) {
      let fromPointStyle = {
        ...pointStyle,
        bottom: fromY - this.props.pointRadius,
        left: -this.props.pointRadius,
        position: 'absolute'
      };
      let fromPoint = (
        <View key='from' style={fromPointStyle} />
      );
      points.push(fromPoint);
    }
    let drawToPoint = toY != null && (this.props.pointMode === 'to' || this.props.pointMode === 'both');
    if (drawToPoint) {
      let toPointStyle = {
        ...pointStyle,
        bottom: toY - this.props.pointRadius,
        right: -this.props.pointRadius,
        position: 'absolute'
      };
      let toPoint = (
        <View key='to' style={toPointStyle} />
      );
      points.push(toPoint);
    }
    return (
      <View style={lineStyles.container}>
        {lineStyle && <View style={lineStyle} />}
        {points}
      </View>
    );
  }
}

const lineStyles = StyleSheet.create({
  measure: {
    flex: 1
  },

  container: {
    flex: 1
  }
});

/**
 * Area component
 */
class Area extends Component {

  static defaultProps = {
    fillColor: 'rgba(0,0,0,.05)'
  };

  state = {
    layout: null
  };

  _onLayout = (e) => {
    this.setState({
      layout: e.nativeEvent.layout
    });
  };

  render() {
    if (!this.state.layout) {
      return (
        <View style={areaStyles.measure} onLayout={this._onLayout} />
      );
    }
    // render area
    // ratios
    let topRatio = Math.max(this.props.fromRatio, this.props.toRatio);
    let bottomRatio = Math.min(this.props.fromRatio, this.props.toRatio);
    let topHeight = Math.floor(this.state.layout.height * topRatio);
    let bottomHeight = Math.floor(this.state.layout.height * bottomRatio);
    // styles
    let bottomStyle = {
      width: this.state.layout.width,
      height: bottomHeight,
      backgroundColor: this.props.fillColor
    };
    let topStyle = {
      borderBottomWidth: topHeight - bottomHeight,
      borderBottomColor: this.props.fillColor,
      borderLeftWidth: this.state.layout.width,
      borderLeftColor: 'transparent'
    };
    // flip horizontal if fromRatio is larger then toRatio
    if (this.props.fromRatio > this.props.toRatio) {
      topStyle.transform = [
        {
          scaleX: -1
        }
      ];
    }
    return (
      <View style={areaStyles.container}>
        <View key='top' style={topStyle} />
        <View key='bottom' style={bottomStyle} />
      </View>
    );
  }
}

const areaStyles = StyleSheet.create({
  measure: {
    flex: 1
  },

  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-end'
  }
});

/**
 * LineChart component
 */
class LineChart extends Component {

  static defaultProps = {
    valueAxisMode: 'normal',
    categoryAxisMode: 'point',
    showArea: false,
    showPoints: true,
    lineWidth: 2,
    pointRadius: 5,
    pointBorderWidth: 2
  };

  _getRatio = (fromValue, toValue) => {
    let min = this.props.valueScale.min;
    let max = this.props.valueScale.max;
    let fromRatio = (fromValue - min) / (max - min);
    let toRatio = toValue == null ? null : (toValue - min) / (max - min);
    if (this.props.valueAxisMode === 'inverted') {
      fromRatio = 1 - fromRatio;
      if (toRatio != null) { toRatio = 1 - toRatio; }
    }
    return {
      from: fromRatio,
      to: toRatio
    };
  };

  _renderLine = (value, index, values, dataset) => {
    if ( value == null ) {
      return (<View key={'line-' + index} style={lineStyles.container} />);
    }
    let fromValue = value;
    let toValue = values[index + 1];
    if ( index > 0 && toValue == null ) {
      return null;
    }
    let ratio = this._getRatio(fromValue, toValue);
    let positionMode = values[index + 2] == null ? 'both' : 'from';
    let pointMode = this.props.showPoints ? positionMode : 'none';
    return (
      <Line key={'line-' + index}
            fromRatio={ratio.from}
            toRatio={ratio.to}
            lineStyle={this.props.lineStyle}
            lineWidth={this.props.lineWidth}
            lineColor={dataset.primaryColor}
            pointRadius={this.props.pointRadius}
            pointBorderWidth={this.props.pointBorderWidth}
            pointColor={dataset.secondaryColor}
            pointBorderColor={dataset.primaryColor}
            pointMode={pointMode} />
    );
  };

  _renderArea = (value, index, values, dataset) => {
    if ( value == null ) {
      return null;
    }
    let fromValue = value;
    let toValue = values[index + 1];
    if (toValue == null) {
      return null;
    }
    let ratio = this._getRatio(fromValue, toValue);
    return (
      <Area key={'area-' + index}
            fromRatio={ratio.from}
            toRatio={ratio.to}
            fillColor={dataset.secondaryColor} />
    );
  };

  _renderLineChart = (dataset, index) => {
    // render areas
    let areaContainer = null;
    if (this.props.showArea) {
      let areas = dataset.values.map((value, index, values) => this._renderArea(value, index, values, dataset));
      areaContainer = (
        <View key='area' style={styles.area}>
          {areas}
        </View>
      );
    }
    // render lines
    let lines = dataset.values.map((value, index, values) => this._renderLine(value, index, values, dataset));
    let lineContainer = (
      <View key='line' style={styles.line}>
        {lines}
      </View>
    );
    let chartFlex = {
      flex: dataset.values.length - 1
    };
    let margin = this.props.categoryAxisMode === 'range' && (
      <View style={styles.chartMargin} />
    );
    return (
      <View key={'lineChart-' + index} style={styles.chartContainer}>
        {margin}
        <View style={chartFlex}>
          {[areaContainer, lineContainer]}
        </View>
        {margin}
      </View>
    );
  };

  UNSAFE_componentWillMount() {
    let p = this.props;
    // don't ensureScaleCoverRange if datasets has no values
    p.datasets.some(d => d.values.some(v => v != null)) && ensureScaleCoverRange(p.valueScale, p.datasets, false);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    let p = nextProps;
    // don't ensureScaleCoverRange if datasets has no values
    p.datasets.some(d => d.values.some(v => v != null)) && ensureScaleCoverRange(p.valueScale, p.datasets, false);
  }

  render() {
    let lineCharts = this.props.datasets.map(this._renderLineChart);
    return (
      <View key='chart'
            style={this.props.style}>
        {lineCharts}
      </View>
    );
  }
}

// Common base styles
const styles = StyleSheet.create({
  chartContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    flexDirection: 'row'
  },
  // for categoryAxisMode == 'range'
  chartMargin: {
    flex: 0.5
  },

  chart: {
    flex: 1,
    flexDirection: 'row'
  },

  area: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    flexDirection: 'row'
  },

  line: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    flexDirection: 'row'
  }
});

export default LineChart;
