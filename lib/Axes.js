/**
 * Copyright (c) 2015-present, Vivace Studio.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Axes
 */
'use strict';

import invariant from 'invariant';

import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ViewPropTypes
} from 'react-native';
import PropTypes from 'prop-types';

import StyleSheetPropType from 'react-native/Libraries/StyleSheet/StyleSheetPropType';
import flattenStyle from 'react-native/Libraries/StyleSheet/flattenStyle';
import AxisStylePropTypes from './AxisStylePropTypes';
import ScalePropType from './ScalePropType';

// Helper function to determine decimal places
// http://stackoverflow.com/a/20334744
const findDecimalPlaces = function(){
 function isInt(n){
    return typeof n === 'number' &&
           parseFloat(n) == parseInt(n, 10) && !isNaN(n);
 }
 return function(n){
    let a = Math.abs(n);
    let c = a, count = 1;
    while(!isInt(c) && isFinite(c)){
       c = a * Math.pow(10,count++);
    }
    return count-1;
 };
}();

const DEFAULT_AXIS_LABEL_WIDTH = 40;

/**
  * Axes component plots axes, labels and gridlines for a chart
  */
class Axes extends Component {
  static propTypes = {
    // Category axis options
    showCategoryAxisLine: PropTypes.bool,
    showCategoryLabels: PropTypes.bool,
    showCategoryTicks: PropTypes.bool,
    showCategoryGridlines: PropTypes.bool,
    categoryAxisStyle: StyleSheetPropType(AxisStylePropTypes),
    categoryAxisMode: PropTypes.oneOf(['point', 'range']),
    categoryLabelStyle: Text.propTypes.style,
    categoryLabels: PropTypes.arrayOf(PropTypes.string),

    // Value axis options
    showValueAxisLine: PropTypes.bool,
    showValueLabels: PropTypes.bool,
    showValueTicks: PropTypes.bool,
    showValueGridlines: PropTypes.bool,
    valueAxisStyle: StyleSheetPropType(AxisStylePropTypes),
    valueAxisMode: PropTypes.oneOf(['normal', 'inverted']),
    valueScale: ScalePropType.isRequired,
    valueLabelStyle: Text.propTypes.style,
    valueLabels: PropTypes.arrayOf(PropTypes.string),
    valueLabelsFormatter: PropTypes.func,

    // Style
    orientation: PropTypes.oneOf(['vertical', 'horizontal']),
    style: ViewPropTypes.style
  };

  static defaultProps = {
    showCategoryAxisLine: true,
    showCategoryLabels: true,
    showCategoryGridlines: true,
    showCategoryTicks: true,
    categoryAxisMode: 'range',

    showValueAxisLine: true,
    showValueLabels: true,
    showValueGridlines: true,
    showValueTicks: true,
    valueAxisMode: 'normal',

    orientation: 'vertical'
  };

  _isVertical = () => {
    return this.props.orientation === 'vertical';
  };

  _getValues = (props) => {
    let scale = props.valueScale;
    let values = [];
    let valueCount = Math.floor((scale.max - scale.min) / scale.unit);
    for (let i = 0; i <= valueCount; i++) {
      let value = (scale.unit * i) + scale.min;
      values.push(value);
    }
    // add remaining value item
    let valueRemain = scale.max - ((valueCount * scale.unit) + scale.min);
    if (valueRemain > 0) {
      values.push(scale.max);
    }
    if (this.props.valueAxisMode === 'inverted') {
      values.reverse();
    }
    return values;
  };

  _getValueUnits = (props) => {
    let scale = props.valueScale;
    let units = [];
    let unitCount = Math.floor((scale.max - scale.min) / scale.unit);
    for (let i = 0; i < unitCount; i++) {
      let unit = scale.unit;
      units.push(unit);
    }
    // add remaining unit item
    let unitRemain = scale.max - ((unitCount * scale.unit) + scale.min);
    if (unitRemain) {
      units.push(unitRemain);
    }
    if (this.props.valueAxisMode === 'inverted') {
      units.reverse();
    }
    return units;
  };

  // distributed evenly
  _getCategoryUnits = (props) => {
    let unitCount = props.categoryLabels.length;
    let units = [];
    let base = props.categoryAxisMode === 'point' ? 1 : 0;
    for (let i = base; i < unitCount; i++) {
      units.push(1);
    }
    return units;
  };

  // Used to position labels and ticks
  _getXAxisLabelWidth = () => {
    return this.xAxisLabelStyle.width || DEFAULT_AXIS_LABEL_WIDTH;
  };

  // Used to position labels and ticks
  _getYAxisLabelWidth = () => {
    return this.yAxisLabelStyle.width || DEFAULT_AXIS_LABEL_WIDTH;
  };

  // Used to position labels and ticks
  _getYAxisLabelHeight = () => {
    return this.yAxisLabelStyle.fontSize;
  };

  _renderXAxisLabels = () => {
    if (!this.showXAxisLabels) {
      return null;
    }
    let containerLayout = {
      alignItems: this.xAxisMode === 'point' ? 'flex-start' : 'center',
      marginTop: this.xAxisStyle.labelOffset
    };
    let labelWidth = this.showXAxisLabels ? this._getXAxisLabelWidth() : 0;
    let textStyle = {
      width: labelWidth,
      textAlign: 'center'
    };

    let labels = [];
    for (let i = this.xAxisLabels.length - 1; i >= 0; i--) {
      let unit =  this.xAxisUnits[i];
      let flex = {
        flex: unit,
        width: unit ? null : labelWidth
      };
      let label = (
        <View  key={'label-' + i}
          style={[containerLayout, flex]}>
          <Text style={[this.xAxisLabelStyle, textStyle]}>
            {this.xAxisLabels[i]}
          </Text>
        </View>
      );
      labels.push(label);
    }
    let margin = this.xAxisMode === 'point' ? -(labelWidth / 2) : 0;
    let marginStyle = {
      marginHorizontal: margin
    };
    return (
      <View key='labels' style={[styles.xAxisLabels, marginStyle]}>
        {labels.reverse()}
      </View>
    );
  };

  _renderYAxisLabels = () => {
    if (!this.showYAxisLabels) {
      return null;
    }
    let labels = [];
    let containerLayout = {
      justifyContent: this.yAxisMode === 'point' ? 'flex-start' : 'center',
      alignItems: 'flex-end',
      marginRight: this.yAxisStyle.labelOffset
    };
    let labelWidth = this._getYAxisLabelWidth();
    let labelHeight = this._getYAxisLabelHeight();
    let textStyle = {
      textAlign: 'right'
    };

    for (let i = 0; i < this.yAxisLabels.length; i++) {
      let unit =  this.yAxisUnits[i];
      let layoutStyle = {
        flex: unit,
        width: labelWidth,
        height: unit ? null : labelHeight
      };
      let label = (
        <View key={'label-' + i}
          style={[containerLayout, layoutStyle]}>
          <Text style={[textStyle, this.yAxisLabelStyle]}>
            {this.yAxisLabels[i]}
          </Text>
        </View>
      );
      labels.push(label);
    }
    return (
      <View key='labels' style={[styles.yAxisLabels]}>
        {labels}
      </View>
    );
  };

  _renderXAxisTicks = () => {
    if (!this.showXAxisTicks) {
      return null;
    }
    // render
    let tickStyle = {
      borderRightWidth: this.xAxisStyle.gridlineWidth,
      borderColor: this.xAxisStyle.gridlineColor
    };
    let firstTickStyle = {
      borderLeftWidth: this.xAxisStyle.gridlineWidth
    };
    let ticks = [];
    for (let i = 0; i < this.xAxisUnits.length; i++) {
      let flex = {
        flex: this.xAxisUnits[i],
      };
      let tick = (
        <View key={'tick-' + i}
          style={[
            tickStyle,
            flex,
            (i === 0) && firstTickStyle]} />
      );
      ticks.push(tick);
    }
    let containerStyle = {
      flexDirection: 'row',
      height: this.xAxisStyle.tickLength
    };
    return (
      <View key='ticks' style={[containerStyle]}>
        {ticks}
      </View>
    );
  };

  _renderYAxisTicks = () => {
    if (!this.showYAxisTicks) {
      return null;
    }
    // render
    let tickStyle = {
      borderTopWidth: this.yAxisStyle.gridlineWidth,
      borderColor: this.yAxisStyle.gridlineColor
    };
    let lastTickStyle = {
      borderBottomWidth: this.xAxisStyle.gridlineWidth
    };
    let ticks = [];
    for (let i = 0; i < this.yAxisUnits.length; i++) {
      let flex = {
        flex: this.yAxisUnits[i],
      };
      let tick = (
        <View key={'tick-' + i}
          style={[
            tickStyle,
            flex,
            (i === this.yAxisUnits.length - 1) && lastTickStyle]} />
      );
      ticks.push(tick);
    }

    let labelHeight = this.showYAxisLabels ? this._getYAxisLabelHeight() : 0;
    let margin = this.yAxisMode === 'point' ? labelHeight / 2 : 0;
    let containerStyle = {
      width: this.yAxisStyle.tickLength,
      marginVertical: margin
    };
    return (
      <View key='ticks' style={[containerStyle]}>
        {ticks}
      </View>
    );
  };

  _renderGrids = () => {
    // style
    let columnStyle = {
      flexDirection: 'row',
      borderTopWidth: this.showYAxisGridlines ?  this.yAxisStyle.gridlineWidth : 0,
      borderTopColor: this.yAxisStyle.gridlineColor
    };
    let rowStyle = {
      borderRightWidth: this.showXAxisGridlines ?  this.xAxisStyle.gridlineWidth : 0,
      borderRightColor: this.xAxisStyle.gridlineColor
    };
    // render
    let columns = [];
    for (let i = 0; i < this.yAxisUnits.length; i++) {
      let rows = [];
      for (let j = 0; j < this.xAxisUnits.length; j++) {
        let rowFlex = {
          flex: this.xAxisUnits[j]
        };
        let row = (
          <View  key={'col-' + j}
            style={[rowStyle, rowFlex]} />
        );
        rows.push(row);
      }
      let columnFlex = {
        flex: this.yAxisUnits[i]
      };
      let column = (
        <View key={'col-' + i}
          style={[columnStyle, columnFlex]}>
          {rows}
        </View>
      );
      columns.push(column);
    }
    // transparent border for padding
    let borderStyle = {
      borderBottomWidth: this.showYAxisGridlines ?  this.yAxisStyle.gridlineWidth : 0,
      borderLeftWidth: this.showXAxisGridlines ? this.xAxisStyle.gridlineWidth : 0,
      borderColor: 'transparent'
    };
    return (
      <View key='grids' style={[styles.absolute, borderStyle]}>
        {columns}
      </View>
    );
  };

  _renderChildren = () => {
    // transparent border for padding
    let borderStyle = {
      borderBottomWidth: this.showYAxisGridlines ?  this.yAxisStyle.gridlineWidth : 0,
      borderLeftWidth: this.showXAxisGridlines ? this.xAxisStyle.gridlineWidth : 0,
      borderColor: 'transparent'
    };
    let children = React.Children.map(this.props.children, function(child, index) {
      return React.cloneElement(child, {
        ...child.props,
        key: 'child-' + index,
        style: [child.style, styles.absolute],
        orientation: this.props.orientation,
        valueScale: this.props.valueScale,
        valueAxisMode: this.props.valueAxisMode,
        categoryAxisMode: this.props.categoryAxisMode
      });
    }, this);
    return (
      <View key='children' style={[styles.absolute, borderStyle]}>
        {children}
      </View>
    );
  };

  _renderAxisLines = () => {
    let axisLineStyle = {
      borderLeftColor: this.yAxisStyle.axisLineColor,
      borderLeftWidth: this.showYAxisLine ? this.yAxisStyle.axisLineWidth : 0,
      borderBottomColor: this.xAxisStyle.axisLineColor,
      borderBottomWidth: this.showXAxisLine ? this.xAxisStyle.axisLineWidth : 0
    };
    return (
      <View key='axis_lines'
        pointerEvents='none'
        style={[styles.absolute, axisLineStyle]}/>
    );
  };

  _processProps = (props) => {
    // round the values to same decimal places as unit
    let values = this._getValues(props);
    let unitDecimalPlaces = findDecimalPlaces(props.valueScale.unit);
    let fixedValues = [];
    for (let i = 0; i < values.length; i++) {
      let value = values[i];
      let formattedValue = props.valueLabelsFormatter ? props.valueLabelsFormatter(value.toFixed(unitDecimalPlaces)) : value.toFixed(unitDecimalPlaces);
      fixedValues.push(formattedValue);
    }
    // convert vertical/horizontal orientation to x/y axis,
    // flatten style as well
    let vertical = (props.orientation === 'vertical');
    if (vertical) {
      this.showXAxisLine = props.showCategoryAxisLine;
      this.showYAxisLine = props.showValueAxisLine;
      this.showXAxisLabels = props.showCategoryLabels;
      this.showYAxisLabels = props.showValueLabels;
      this.showXAxisTicks = props.showCategoryTicks;
      this.showYAxisTicks = props.showValueTicks;
      this.showXAxisGridlines = props.showCategoryGridlines;
      this.showYAxisGridlines = props.showValueGridlines;
      this.xAxisStyle = flattenStyle([styles.categoryAxis, this.props.categoryAxisStyle]);
      this.yAxisStyle = flattenStyle([styles.valueAxis, this.props.valueAxisStyle]);
      this.xAxisLabelStyle = flattenStyle([styles.categoryLabel, this.props.categoryLabelStyle]);
      this.yAxisLabelStyle = flattenStyle([styles.valueLabel, this.props.valueLabelStyle]);
      this.xAxisMode = this.props.categoryAxisMode;
      this.yAxisMode = 'point';
      this.xAxisLabels = this.props.categoryLabels;
      this.yAxisLabels = this.props.valueLabels ? this.props.valueLabels.reverse() : fixedValues.reverse();
      this.xAxisUnits = this._getCategoryUnits(props);
      this.yAxisUnits = this._getValueUnits(props).reverse();
    } else {
      this.showYAxisLine = props.showCategoryAxisLine;
      this.showXAxisLine = props.showValueAxisLine;
      this.showYAxisLabels = props.showCategoryLabels;
      this.showXAxisLabels = props.showValueLabels;
      this.showYAxisTicks = props.showCategoryTicks;
      this.showXAxisTicks = props.showValueTicks;
      this.showYAxisGridlines = props.showCategoryGridlines;
      this.showXAxisGridlines = props.showValueGridlines;
      this.yAxisStyle = flattenStyle([styles.categoryAxis, this.props.categoryAxisStyle]);
      this.xAxisStyle = flattenStyle([styles.valueAxis, this.props.valueAxisStyle]);
      this.yAxisLabelStyle = flattenStyle([styles.categoryLabel, this.props.categoryLabelStyle]);
      this.xAxisLabelStyle = flattenStyle([styles.valueLabel, this.props.valueLabelStyle]);
      this.yAxisMode = this.props.categoryAxisMode;
      this.xAxisMode = 'point';
      this.yAxisLabels = this.props.categoryLabels;
      this.xAxisLabels = this.props.valueLabels || fixedValues;
      this.yAxisUnits = this._getCategoryUnits(props);
      this.xAxisUnits = this._getValueUnits(props);
    }
  };

  componentWillMount() {
    invariant(this.props.valueScale != null && this.props.categoryLabels != null, 'valueScale and categoryLabels property are required');
    this._processProps(this.props);
  }

  componentWillReceiveProps(nextProps) {
    invariant(this.props.valueScale != null && this.props.categoryLabels != null, 'valueScale and categoryLabels property are required');
    this._processProps(nextProps);
  }

  render() {
    // label sizes
    let yLabelWidth = this.showYAxisLabels ? this._getYAxisLabelWidth() + this.yAxisStyle.labelOffset : 0;
    let yLabelHeight = this.showYAxisLabels ? this._getYAxisLabelHeight() : 0;
    let yTickLength = this.showYAxisTicks ? this.yAxisStyle.tickLength : 0;
    let xLabelWidth = this.showXAxisLabels ? this._getXAxisLabelWidth() : 0;
    let yLabelTickWidth = yLabelWidth + yTickLength;
    let xLabelMargin = this.xAxisMode === 'point' ? xLabelWidth / 2 : 0;
    let yLabelMargin = this.yAxisMode === 'point' ? yLabelHeight / 2 : 0;
    // content margins for aligning with y axis
    let contentMarginStyle = {
      marginVertical: yLabelMargin,
      marginRight: xLabelMargin
    };
    // min width
    let yAxisMinWidth = Math.max(xLabelMargin, yLabelTickWidth);
    let yAxisMinWidthStyle = {
      width: yAxisMinWidth
    };
    // x axis margins for aligning with content
    let xAxisMarginStyle = {
      marginTop: -yLabelMargin,
      marginLeft: yAxisMinWidth,
      marginRight: xLabelMargin
    };
    return (
      <View key='container' style={[styles.container, this.props.style]}>
        <View key='top' style={[styles.top]}>
          <View key='y_axis' style={[styles.yAxis, yAxisMinWidthStyle]}>
            <View key='content' style={[styles.yAxisContent]}>
              { this._renderYAxisLabels() }
              { this._renderYAxisTicks() }
            </View>
          </View>
          <View key='content' style={[styles.chartContent, contentMarginStyle]}>
            { this._renderGrids() }
            { this._renderChildren() }
            { this._renderAxisLines() }
          </View>
        </View>
        <View key='bottom' style={[styles.bottom]}>
          <View key='x_axis' style={[styles.xAxis, xAxisMarginStyle]}>
            <View key='content' style={[styles.xAxisContent]}>
              { this._renderXAxisTicks() }
              { this._renderXAxisLabels() }
            </View>
          </View>
        </View>
      </View>
    );
  }
}

// Common base styles
const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    backgroundColor: 'transparent'
  },

  top: {
    flex: 1,
    flexDirection: 'row'
  },

  bottom: {
    flexDirection: 'column'
  },

  xAxis: {
    flexDirection: 'row'
  },

  yAxis: {
    flexDirection: 'column',
    alignItems: 'flex-end'
  },

  xAxisContent: {
    flex: 1,
    flexDirection: 'column'
  },

  yAxisContent: {
    flex: 1,
    flexDirection: 'row'
  },

  chartContent: {
    flex: 1,
    backgroundColor: 'transparent'
  },

  xAxisLabels: {
    flexDirection: 'row'
  },

  yAxisLabels: {
    flexDirection:'column',
    alignItems:'flex-end'
  },

  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0
  },

  valueAxis: {
    axisLineWidth: 1,
    axisLineColor: 'gray',
    tickLength: 6,
    labelOffset: 6,
    gridlineWidth: 1,
    gridlineColor: 'gray',
    gridlineStyle: 'solid'
  },

  categoryAxis: {
    axisLineWidth: 1,
    axisLineColor: 'gray',
    tickLength: 6,
    labelOffset: 6,
    gridlineWidth: 1,
    gridlineColor: 'gray',
    gridlineStyle: 'solid'
  },

  valueLabel: {
    width: DEFAULT_AXIS_LABEL_WIDTH,
    fontSize: 12,
    color: 'gray'
  },

  categoryLabel: {
    width: DEFAULT_AXIS_LABEL_WIDTH,
    fontSize: 12,
    color: 'gray'
  }
});

export default Axes;
