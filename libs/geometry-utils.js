const GeometryUtils = {
  /**
   * Common
   */
  clone (object) {
    return JSON.parse(JSON.stringify(object))
  },

  unique (array) {
    return Array.from(
      new Set(
        array.map(arrayItem => JSON.stringify(arrayItem))
      )
    ).map(arrayItem => JSON.parse(arrayItem))
  },

  /* Only handle simple data types */
  isObjectsEqual (...objects) {
    const target = objects[0]
    const otherObjects = objects.slice(1)
    if (Array.isArray(target)) {
      return target.every((item, index) => {
        return this.isObjectsEqual(
          item,
          ...otherObjects.map(object => object[index])
        )
      }) && otherObjects.every(object => {
        return object.length === target.length
      })
    } else if (typeof target === 'object') {
      return Object.keys(target).every(key => {
        return this.isObjectsEqual(
          target[key],
          ...otherObjects.map(object => object[key])
        )
      }) && otherObjects.every(object => {
        return (
          Object.keys(object).length ===
          Object.keys(target).length
        )
      })
    } else {
      return otherObjects.every(object => object === target)
    }
  },

  includes (array, item) {
    return array.some(arrayItem => {
      return this.isObjectsEqual(arrayItem, item)
    })
  },

  isBetween (limitA, limitB, x) {
    return (x - limitA) * (x - limitB) <= 0
  },

  isBetweenByOdd (limits, x) {
    let smallerCount = 0
    let biggerCount = 0
    limits.forEach(limit => {
      if (x >= limit) smallerCount++
      if (x <= limit) biggerCount++
    })
    return (
      !!smallerCount &&
      !!biggerCount &&
      (
        smallerCount % 2 === 1 ||
        biggerCount % 2 === 1
      )
    )
  },

  clamp (min, max, x) {
    return Math.min(Math.max(x, min), max)
  },

  mix (a, b, ratio) {
    return a * (1 - ratio) + b * ratio
  },

  changeByPercent (current, target, percent) {
    return this.mix(current, target, percent)
  },

  map (a, b, x) {
    return x / a * b
  },

  formatRadian (radian) {
    while (Math.abs(radian) > Math.PI) {
      radian += (
        Math.PI * 2 * (radian / Math.abs(radian)) * -1
      )
    }
    return radian
  },

  linearChange (
    initial, target, duration,
    callback, precision = 0
  ) {
    const startTimestamp = +new Date()
    const intervalID = setInterval(_ => {
      const timestamp = +new Date()
      const timePassed = timestamp - startTimestamp
      if (timePassed > duration) {
        clearInterval(intervalID)
        return
      }
      const current = (
        initial +
        (target - initial) * (timePassed / duration)
      )
      callback(current)
    }, precision)
    return intervalID
  },

  debounce (fun, interval) {
    let timeoutHandler
    return function () {
      const _this = this
      const _args = arguments
      clearTimeout(timeoutHandler)
      timeoutHandler = setTimeout(function () {
        fun.apply(_this, _args)
      }, interval)
    }
  },

  throttle (fun, interval) {
    let lastTime, timeoutHandler
    return function () {
      const _this = this
      const _args = arguments
      let now = +new Date()
      if (lastTime && now < lastTime + interval) {
        clearTimeout(timeoutHandler)
        timeoutHandler = setTimeout(function () {
          lastTime = now
          fun.apply(_this, _args)
        }, interval)
      }else {
        lastTime = now
        fun.apply(_this,_args)
      }
    }
  },

  setTimeoutCustom (callback, delay, precision = 0) {
    const startTimestamp = +new Date()
    const intervalID = setInterval(_ => {
      const timestamp = +new Date()
      if (timestamp - startTimestamp >= delay) {
        clearInterval(intervalID)
        callback()
      }
    }, precision)
    return intervalID
  },

  setIntervalCustom (callback, delay, precision = 0) {
    let startTimestamp = +new Date()
    return setInterval(_ => {
      const timestamp = +new Date()
      if (timestamp - startTimestamp >= delay) {
        startTimestamp = timestamp
        callback()
      }
    }, precision)
  },

  chain (data, ...args) {
    args.forEach(arg => {
      if (Array.isArray(arg)) {
        const [fun, ...funArgs] = arg
        data = fun(data, ...funArgs)
      } else {
        const fun = arg
        data = fun(data)
      }
    })
    return data
  },

  repeatedlyCall (fun, times, data, ...args) {
    for (let i = 0; i < times; i++) {
      data = fun(data, ...args)
    }
    return data
  },

  /**
   * Basic
   */
  getDistanceBetweenPoints (pointA, pointB) {
    return (
      (pointA[0] - pointB[0]) ** 2 +
      (pointA[1] - pointB[1]) ** 2
    ) ** .5
  },

  getPointByOffset (point, offset = {}) {
    return [
      point[0] + (offset.x || 0),
      point[1] + (offset.y || 0)
    ]
  },

  getMidPointBetweenPoints (pointA, pointB, ratio = .5) {
    return [
      this.mix(pointA[0], pointB[0], ratio),
      this.mix(pointA[1], pointB[1], ratio)
    ]
  },

  getPointBetweenPointsByX (pointA, pointB, x) {
    if (!this.isBetween(pointA[0], pointB[0], x)) {
      return null
    } else if (pointA[0] == pointB[0]) {
      return null
    } else {
      const ratio = (x - pointA[0]) / (pointB[0] - pointA[0])
      const y = pointA[1] + (pointB[1] - pointA[1]) * ratio
      return [x, y]
    }
  },

  getPointBetweenPointsByY (pointA, pointB, y) {
    if (!this.isBetween(pointA[1], pointB[1], y)) {
      return null
    } else if (pointA[1] == pointB[1]) {
      return null
    } else {
      const ratio = (y - pointA[1]) / (pointB[1] - pointA[1])
      const x = pointA[0] + (pointB[0] - pointA[0]) * ratio
      return [x, y]
    }
  },

  getPointByPointDirectionDistance (point, direction, distance) {
    if (distance < 0) {
      direction = [direction[0] * -1, direction[1] * -1]
    }
    const x = (
      distance ** 2 /
      (direction[0] ** 2 + direction[1] ** 2)
    ) ** .5
    return [
      point[0] + direction[0] * x,
      point[1] + direction[1] * x
    ]
  },

  getPointByPointRadianDistance (point, radian, distance) {
    radian = this.formatRadian(radian)
    let direction = []
    if (Math.abs(radian) === Math.PI / 2) {
      direction = [0, radian / Math.abs(radian)]
    } else {
      const quadrant = this.getImpreciseQuadrantFromRadian(radian)
      switch (quadrant) {
        case 0:
        case 3:
          direction[0] = 1
          break
        case 1:
        case 2:
          direction[0] = -1
          break
      }
      direction[1] = direction[0] * Math.tan(radian)
    }
    return this.getPointByPointDirectionDistance(
      point, direction, distance
    )
  },

  getCurvePointBetweenPoints (pointA, pointB, curvature) {
    const midPoint = this.getMidPointBetweenPoints(pointA, pointB)
    const direction = this.getDirection(pointA, pointB)
    const verticalDirection = this.getVerticalDirection(direction)
    const distance = this.getDistanceBetweenPoints(pointA, pointB)
    const curveDistance = distance * .5 * curvature
    return this.getPointByPointDirectionDistance(
      midPoint, verticalDirection, curveDistance
    )
  },

  getDirection (pointA, pointB) {
    return [pointB[0] - pointA[0], pointB[1] - pointA[1]]
  },

  getVerticalDirection (direction, clockwise = 1) {
    const quadrant = this.getImpreciseQuadrant(direction)
    const verticalDirection = [
      Math.abs(direction[1]),
      Math.abs(direction[0])
    ]
    let verticalDirectionQuadrant = (
      quadrant + (clockwise ? -1 : 1)
    )
    switch (verticalDirectionQuadrant) {
      case 0: // 1st quadrant
      case 4:
        break
      case 1: // 2nd quadrant
        verticalDirection[0] *= -1
        break
      case 2: // 3rd quadrant
        verticalDirection[0] *= -1
        verticalDirection[1] *= -1
        break
      case -1:
      case 3: // 4th quadrant
        verticalDirection[1] *= -1
        break
    }
    return verticalDirection
  },

  isSameDirection (directionA, directionB) {
    return (
      (
        directionA[0] / directionB[0] ===
        directionA[1] / directionB[1]
      ) &&
      directionA[0] * directionB[0] >= 0 &&
      directionA[1] * directionB[1] >= 0
    )
  },

  isOppositeDirection (directionA, directionB) {
    return (
      (
        directionA[0] / directionB[0] ===
        directionA[1] / directionB[1]
      ) &&
      directionA[0] * directionB[0] <= 0 &&
      directionA[1] * directionB[1] <= 0
    )
  },

  getVector (pointA, pointB) {
    return this.getDirection(pointA, pointB)
  },

  mergeVectors (...vectors) {
    const finalPoint = [0, 0]
    vectors.forEach(vector => {
      const point = this.getPointByPointRadianDistance(
        [0, 0], vector[0], vector[1]
      )
      finalPoint[0] += point[0]
      finalPoint[1] += point[1]
    })
    return [
      this.getRadian([0, 0], [1, 0], finalPoint),
      this.getDistanceBetweenPoints([0, 0], finalPoint)
    ]
  },

  getImpreciseQuadrant (pointOrDirection) {
    let quadrant
    if (pointOrDirection[0] > 0) {
      if (pointOrDirection[1] > 0) {
        quadrant = 0 // 1st quadrant
      } else {
        quadrant = 3 // 4th quadrant
      }
    } else {
      if (pointOrDirection[1] > 0) {
        quadrant = 1 // 2nd quadrant
      } else {
        quadrant = 2 // 3rd quadrant
      }
    }
    return quadrant
  },

  getImpreciseQuadrantFromRadian (radian) {
    radian = this.formatRadian(radian)
    let quadrant
    if (radian > 0) {
      if (radian < Math.PI * .5) {
        quadrant = 0 // 1st quadrant
      } else {
        quadrant = 1 // 2nd quadrant
      }
    } else {
      if (radian < Math.PI * .5 * -1) {
        quadrant = 2 // 3rd quadrant
      } else {
        quadrant = 3 // 4th quadrant
      }
    }
    return quadrant
  },

  getRadian (vertex, pointA, pointB) {
    const checkYPositive = direction => {
      let reversed = 0
      if (direction[1] < 0) {
        reversed = 1
        direction = direction.map(x => x * -1)
      }
      return [direction, reversed]
    }
    const [
      directionAX, directionAXReversed
    ] = checkYPositive(
      [pointA[0] - vertex[0], pointA[1] - vertex[1]]
    )
    const radianAX = (
      Math.atan2(directionAX[1], directionAX[0]) +
      Math.PI * directionAXReversed
    )
    const [
      directionBX, directionBXReversed
    ] = checkYPositive(
      [pointB[0] - vertex[0], pointB[1] - vertex[1]]
    )
    const radianBX = (
      Math.atan2(directionBX[1], directionBX[0]) +
      Math.PI * directionBXReversed
    )
    const radian = this.formatRadian(radianBX - radianAX)
    return radian
  },

  getRadianFromXAxis (point) {
    return this.getRadian([0, 0], [1, 0], point)
  },

  transformPointByRadian (point, radian) {
    const distance = this.getDistanceBetweenPoints(point, [0, 0])
    const pointRadian = this.getRadianFromXAxis(point)
    const distRadian = this.formatRadian(pointRadian + radian)
    const distPoint = []
    distPoint[0] = (
      distance ** 2 /
      (1 + Math.tan(distRadian) ** 2)
    ) ** .5
    if (
      distRadian > Math.PI * .5 ||
      distRadian < Math.PI * .5 * -1
    ) {
      distPoint[0] *= -1
    }
    distPoint[1] = (
      Math.abs(distRadian) === Math.PI * .5 ?
      distance * (distRadian / Math.abs(distRadian)) :
      distPoint[0] * Math.tan(distRadian)
    )
    return distPoint
  },

  /**
   * Judge point being in polygon (By intersection)
   */
  isPointInPolygonByIntersection (vertices, point) {
    const horizontalPointsX = []
    const verticalPointsY = []
    for (let i = 0; i < vertices.length; i++) {
      const thisVertex = vertices[i]
      const nextVertex = (
        i === vertices.length - 1 ?
        vertices[0] :
        vertices[i + 1]
      )
      const horizontalPoint = this.getPointBetweenPointsByY(
        thisVertex, nextVertex, point[1]
      )
      if (horizontalPoint) {
        horizontalPointsX.push(horizontalPoint[0])
      }
      const verticalPoint = this.getPointBetweenPointsByX(
        thisVertex, nextVertex, point[0]
      )
      if (verticalPoint) {
        verticalPointsY.push(verticalPoint[1])
      }
    }
    return (
      this.isBetweenByOdd(horizontalPointsX, point[0]) &&
      this.isBetweenByOdd(verticalPointsY, point[1])
    )
  },

  /**
   * Judge point being in polygon (By radian)
   */
  isPointInPolygonByRadian (vertices, point) {
    if (this.includes(vertices, point)) return true
    let totalRadian = 0
    for (let i = 0; i < vertices.length; i++) {
      const thisVertex = vertices[i]
      const nextVertex = (
        i === vertices.length - 1 ?
        vertices[0] :
        vertices[i + 1]
      )
      totalRadian += this.getRadian(
        point, thisVertex, nextVertex
      )
    }
    return (
      Math.abs(totalRadian) > Math.PI * 2 - .01 &&
      Math.abs(totalRadian) < Math.PI * 2 + .01
    )
  },

  getCrossPointBetweenLines (lineA, lineB) {
    const [pointA1, pointA2] = lineA
    const [pointB1, pointB2] = lineB
    const slopeA =
      (pointA2[1] - pointA1[1]) /
      (pointA2[0] - pointA1[0])
    const slopeB =
      (pointB2[1] - pointB1[1]) /
      (pointB2[0] - pointB1[0])
    const isLineAVertical = pointA1[0] === pointA2[0]
    const isLineAHorizontal = pointA1[1] === pointA2[1]
    const isLineBVertical = pointB1[0] === pointB2[0]
    const isLineBHorizontal = pointB1[1] === pointB2[1]

    function getCrossPointInVerticalSituation (
      firstPoint, secondPoint, thirdPoint
    ) {
      const crossPoint = []
      crossPoint[0] = firstPoint[0]
      crossPoint[1] =
        (crossPoint[0] - secondPoint[0]) *
        (secondPoint[1] - thirdPoint[1]) /
        (secondPoint[0] - thirdPoint[0]) +
        secondPoint[1]
      return crossPoint
    }
    function getCrossPointInHorizontalSituation (
      firstPoint, secondPoint, thirdPoint
    ) {
      const crossPoint = []
      crossPoint[1] = firstPoint[1]
      crossPoint[0] =
        (crossPoint[1] - secondPoint[1]) *
        (secondPoint[0] - thirdPoint[0]) /
        (secondPoint[1] - thirdPoint[1]) +
        secondPoint[0]
      return crossPoint
    }

    let crossPoint = []
    if (slopeA === slopeB) {
      crossPoint = null
    } else if (isLineAVertical && isLineBHorizontal) {
      crossPoint = [pointA1[0], pointB1[1]]
    } else if (isLineAHorizontal && isLineBVertical) {
      crossPoint = [pointB1[0], pointA1[1]]
    } else if (isLineAVertical) {
      crossPoint = getCrossPointInVerticalSituation(
        pointA1, pointB1, pointB2
      )
    } else if (isLineAHorizontal) {
      crossPoint = getCrossPointInHorizontalSituation(
        pointA1, pointB1, pointB2
      )
    } else if (isLineBVertical) {
      crossPoint = getCrossPointInVerticalSituation(
        pointB1, pointA1, pointA2
      )
    } else if (isLineBHorizontal) {
      crossPoint = getCrossPointInHorizontalSituation(
        pointB1, pointA1, pointA2
      )
    } else {
      crossPoint[0] = (
        slopeA * pointA1[0] -
        slopeB * pointB1[0] -
        pointA1[1] +
        pointB1[1]
      ) / (slopeA - slopeB)
      crossPoint[1] =
        slopeA * (crossPoint[0] - pointA1[0]) +
        pointA1[1]
    }
    return crossPoint
  },

  getCrossPointBetweenLineSegments (
    lineSegmentA, lineSegmentB
  ) {
    let crossPointBetweenLineSegments = null
    const crossPointBetweenLines =
      this.getCrossPointBetweenLines(lineSegmentA, lineSegmentB)
    if (crossPointBetweenLines) {
      const isPointOnLineSegmentA =
        this.isBetween(
          lineSegmentA[0][0], lineSegmentA[1][0], crossPointBetweenLines[0]
        ) &&
        this.isBetween(
          lineSegmentA[0][1], lineSegmentA[1][1], crossPointBetweenLines[1]
        )
      const isPointOnLineSegmentB =
        this.isBetween(
          lineSegmentB[0][0], lineSegmentB[1][0], crossPointBetweenLines[0]
        ) &&
        this.isBetween(
          lineSegmentB[0][1], lineSegmentB[1][1], crossPointBetweenLines[1]
        )
      if (
        isPointOnLineSegmentA &&
        isPointOnLineSegmentB
      ) {
        crossPointBetweenLineSegments = crossPointBetweenLines
      }
    }
    return crossPointBetweenLineSegments
  },

  getVerticalCrossPointFromPointToLine (
    vertexA, vertexB, point
  ) {
    const crossPoint = []
    if (vertexA[0] === vertexB[0]) {
      crossPoint[0] = vertexA[0]
      crossPoint[1] = point[1]
    } else if (vertexA[1] === vertexB[1]) {
      crossPoint[0] = point[0]
      crossPoint[1] = vertexA[1]
    } else {
      const a = (
        (vertexA[1] - vertexB[1]) /
        (vertexA[0] - vertexB[0])
      )
      const b = vertexA[1] - a * vertexA[0]
      const c = -1 / a
      const d = point[1] - c * point[0]
      crossPoint[0] = (d - b) / (a - c)
      crossPoint[1] = a * crossPoint[0] + b
    }
    return crossPoint
  },

  getDistanceFromPointToLine (
    vertexA, vertexB, point
  ) {
    let distance
    if (vertexA[0] === vertexB[0]) {
      distance = Math.abs(point[0] - vertexA[0])
    } else if (vertexA[1] === vertexB[1]) {
      distance = Math.abs(point[1] - vertexA[1])
    } else {
      const crossPoint = this.getVerticalCrossPointFromPointToLine(
        vertexA, vertexB, point
      )
      distance = this.getDistanceBetweenPoints(
        point, crossPoint
      )
    }
    return distance
  },

  getDistanceFromPointToLineSegment (
    vertexA, vertexB, point
  ) {
    const distanceToVertexA = this.getDistanceBetweenPoints(
      point, vertexA
    )
    const distanceToVertexB = this.getDistanceBetweenPoints(
      point, vertexB
    )
    let distance
    if (vertexA[0] === vertexB[0]) {
      distance = (
        this.isBetween(
          vertexA[1], vertexB[1], point[1]
        ) ?
        Math.abs(point[0] - vertexA[0]) :
        Math.min(
          distanceToVertexA,
          distanceToVertexB
        )
      )
    } else if (vertexA[1] === vertexB[1]) {
      distance = (
        this.isBetween(
          vertexA[0], vertexB[0], point[0]
        ) ?
        Math.abs(point[1] - vertexA[1]) :
        Math.min(
          distanceToVertexA,
          distanceToVertexB
        )
      )
    } else {
      const crossPoint = this.getVerticalCrossPointFromPointToLine(
        vertexA, vertexB, point
      )
      distance = (
        this.isBetween(
          vertexA[0], vertexB[0], crossPoint[0]
        ) ?
        this.getDistanceBetweenPoints(
          point, crossPoint
        ) :
        Math.min(
          distanceToVertexA,
          distanceToVertexB
        )
      )
    }
    return distance
  },

  getDistanceFromPointToLineSegmentV1 (
    vertexA, vertexB, point
  ) {
    const translatedVertexB = this.getVector(
      vertexA, vertexB
    )
    const translatedPoint = this.getVector(
      vertexA, point
    )
    const transformedVertexB = [
      this.getDistanceBetweenPoints(
        translatedVertexB, [0, 0]
      ), 0
    ]
    const radian = this.getRadian(
      [0, 0],
      translatedVertexB,
      transformedVertexB
    )
    const transformedPoint = this.transformPointByRadian(
      translatedPoint, radian
    )
    let distance
    if (this.isBetween(
      0,
      transformedVertexB[0],
      transformedPoint[0]
    )) {
      distance = Math.abs(transformedPoint[1])
    } else {
      distance = Math.min(
        this.getDistanceBetweenPoints(
          transformedPoint, [0, 0]
        ),
        this.getDistanceBetweenPoints(
          transformedPoint, transformedVertexB
        )
      )
    }
    return distance
  },

  /**
   * Get distance whether a point is in polygon or not
   */
  getDistanceFromPointToPolygon (vertices, point) {
    const distances = []
    for (let i = 0; i < vertices.length; i++) {
      const thisVertex = vertices[i]
      const nextVertex = (
        i === vertices.length - 1 ?
        vertices[0] :
        vertices[i + 1]
      )
      const distance = this.getDistanceFromPointToLineSegment(
        thisVertex, nextVertex, point
      )
      distances.push(distance)
    }
    return Math.min(...distances)
  },

  /**
   * Judge point being in circle
   */
  isPointInCircle (center, radius, point) {
    const distance = this.getDistanceBetweenPoints(
      center, point
    )
    return distance <= radius
  },

  /**
   * Get distance whether a point is in circle or not
   */
  getDistanceFromPointToCircle (center, radius, point) {
    const distance = this.getDistanceBetweenPoints(
      center, point
    )
    return Math.abs(distance - radius)
  }
}

if (typeof module !== 'undefined') {
  module.exports = GeometryUtils
}
