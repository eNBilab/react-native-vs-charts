/**
 * Copyright (c) 2015-present, Vivace Studio.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule DataPropType
 */
'use strict';

import React from 'react';
import PropTypes from 'prop-types';

/**
  * Common data prop used by different charts
  */
const DataPropType = PropTypes.shape({
  // Used for legend
  name: PropTypes.string,

  // Different charts interpret primary and secondary color differently,
  // e.g. a bar chart might take primary color as fill color and secondary
  // color as border color;
  primaryColor: PropTypes.string,
  secondaryColor: PropTypes.string,
  value: PropTypes.number.isRequired
});

export default DataPropType;
