/**
 * Copyright (c) 2015-present, Vivace Studio.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ScalePropType
 */
'use strict';

/**
  * Common scale prop for charts with axes
  */
import React from 'react';
import PropTypes from 'prop-types';

const ScalePropType = PropTypes.shape({
  min: PropTypes.number,
  max: PropTypes.number,
  unit: PropTypes.number
});

export default ScalePropType;
