/**
 * Copyright (c) 2015-present, Vivace Studio.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule makeRange
 * @flow
 */
'use strict';

import resolveDatasets from './resolveDatasets';

type Dataset = {
   values: Array<number>;
 };

type Range = {
  min: number;
  max: number;
};

/**
 * Make range from datasets, optionally totalize the values of the same index
 * in different datasets for stacked bar chart
 */
function makeRange(datasets : Array<Dataset>, totalize: boolean): Range {
  let min = Number.MAX_VALUE;
  let max = Number.NEGATIVE_INFINITY;
  if (totalize) {
    let dataArray = resolveDatasets(datasets);
    dataArray.forEach(function(data, index) {
      // min
      data.forEach(function(datum, index) {
        if ( datum.value != null ) {
          min = Math.min(min, datum.value);
        }
      });
      // max
      let total = 0;
      data.forEach(function(datum, index) {
        if ( datum.value != null ) {
          total += datum.value;
        }
      });
      max = Math.max(max, total);
    });
  } else {
    datasets.forEach(function(dataset, index) {
      let filteredValues = dataset.values.filter(v => v != null);
      if ( filteredValues.length > 0 ) {
        min = Math.min(min, ...filteredValues);
        max = Math.max(max, ...filteredValues);
      }
    });
  }
  return { min, max };
}

export default makeRange;
