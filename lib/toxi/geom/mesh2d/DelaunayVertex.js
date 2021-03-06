define(['require', 'exports', 'module', '../Vec2D'], function(
  require,
  exports,
  module
) {
  const Vec2D = require('../Vec2D');

  class DelaunayVertex {
    /**
     * Circumcenter of a simplex.
     * 
     * @param simplex
     *            the simplex (as an array of Pnts)
     * @return the circumcenter (a DelaunayVertex) of simplex
     */
    static circumcenter(simplex) {
      let dim = simplex[0].dimension();
      if (simplex.length - 1 != dim) {
        throw new IllegalArgumentException('Dimension mismatch');
      }
      let matrix = new DelaunayVertex()[dim];
      for (let i = 0; i < dim; i++) {
        matrix[i] = simplex[i].bisector(simplex[i + 1]);
      }
      // Center in homogeneous
      // coordinates
      let hCenter = cross(matrix);
      let last = hCenter.coordinates[dim];
      let result = new Array(dim);

      for (let i = 0; i < dim; i++) {
        result[i] = hCenter.coordinates[i] / last;
      }
      return new DelaunayVertex(result);
    }

    /**
     * Determine the signed content (i.e., area or volume, etc.) of a simplex.
     * 
     * @param simplex
     *            the simplex (as an array of Pnts)
     * @return the signed content of the simplex
     */
    static content(simplex) {
      let matrix = new DelaunayVertex[simplex.length]();
      for (let i = 0; i < matrix.length; i++) {
        matrix[i] = simplex[i].extend(1);
      }
      let fact = 1;
      for (let i = 1; i < matrix.length; i++) {
        fact = fact * i;
      }
      return determinant(matrix) / fact;
    }

    /**
     * Compute generalized cross-product of the rows of a matrix. The result is
     * a DelaunayVertex perpendicular (as a vector) to each row of the matrix.
     * This is not an efficient implementation, but should be adequate for low
     * dimension.
     * 
     * @param matrix
     *            the matrix of Pnts (one less row than the DelaunayVertex
     *            dimension)
     * @return a DelaunayVertex perpendicular to each row DelaunayVertex
     * @throws IllegalArgumentException
     *             if matrix is wrong shape
     */
    static cross(matrix) {
      let len = matrix.length + 1;
      if (len != matrix[0].dimension()) {
        throw new IllegalArgumentException('Dimension mismatch');
      }
      let columns = new boolean[len]();
      for (let i = 0; i < len; i++) {
        columns[i] = true;
      }
      let result = new double[len]();
      let sign = 1;
      try {
        for (let i = 0; i < len; i++) {
          columns[i] = false;
          result[i] = sign * determinant(matrix, 0, columns);
          columns[i] = true;
          sign = -sign;
        }
      } catch (e) {
        throw new IllegalArgumentException('Matrix is wrong shape');
      }
      return new DelaunayVertex(result);
    }

    /**
     * Compute the determinant of a matrix (array of Pnts). This is not an
     * efficient implementation, but should be adequate for low dimension.
     * 
     * @param matrix
     *            the matrix as an array of Pnts
     * @return the determinnant of the input matrix
     * @throws IllegalArgumentException
     *             if dimensions are wrong
     */
    static determinant(matrix) {
      if (matrix.length != matrix[0].dimension()) {
        throw new IllegalArgumentException('Matrix is not square');
      }
      let columns = new boolean[matrix.length]();
      for (let i = 0; i < matrix.length; i++) {
        columns[i] = true;
      }
      try {
        return determinant(matrix, 0, columns);
      } catch (e) {
        throw new IllegalArgumentException('Matrix is wrong shape');
      }
    }

    /**
     * Compute the determinant of a submatrix specified by starting row and by
     * "active" columns.
     * 
     * @param matrix
     *            the matrix as an array of Pnts
     * @param row
     *            the starting row
     * @param columns
     *            a boolean array indicating the "active" columns
     * @return the determinant of the specified submatrix
     * @throws ArrayIndexOutOfBoundsException
     *             if dimensions are wrong
     */
    static determinant(matrix, row, columns) {
      if (row == matrix.length) {
        return 1;
      }
      let sum = 0;
      let sign = 1;
      for (let col = 0; col < columns.length; col++) {
        if (!columns[col]) {
          continue;
        }
        columns[col] = false;
        sum +=
          sign *
          matrix[row].coordinates[col] *
          determinant(matrix, row + 1, columns);
        columns[col] = true;
        sign = -sign;
      }
      return sum;
    }

    /**
     * Create a String for a matrix.
     * 
     * @param matrix
     *            the matrix (an array of Pnts)
     * @return a String represenation of the matrix
     */
    static toString(matrix) {
      let buf = new StringBuilder('{');
      for (let row of matrix) {
        buf.append(' ' + row);
      }
      buf.append(' }');
      return buf.toString();
    }

    /**
     * Constructor.
     * 
     * @param coords
     *            the coordinates
     */
    DelaunayVertex(...coords) {
      // Copying is done here to ensure that DelaunayVertex's coords cannot be
      // altered.
      // This is necessary because the double... notation actually creates a
      // constructor with double[] as its argument.
      this.coordinates = new Array(coords.length);
      System.arraycopy(coords, 0, this.coordinates, 0, coords.length);
    }

    /**
     * Add.
     * 
     * @param p
     *            the other DelaunayVertex
     * @return a new DelaunayVertex = this + p
     */
    add(p) {
      let len = dimCheck(p);
      let coords = new Array(len);
      for (let i = 0; i < len; i++) {
        coords[i] = this.coordinates[i] + p.coordinates[i];
      }
      return new DelaunayVertex(coords);
    }

    /**
     * Angle (in radians) between two Pnts (treated as vectors).
     * 
     * @param p
     *            the other DelaunayVertex
     * @return the angle (in radians) between the two Pnts
     */
    angle(p) {
      return Math.acos(this.dot(p) / (this.magnitude() * p.magnitude()));
    }

    /**
     * Perpendicular bisector of two Pnts. Works in any dimension. The
     * coefficients are returned as a DelaunayVertex of one higher dimension
     * (e.g., (A,B,C,D) for an equation of the form Ax + By + Cz + D = 0).
     * 
     * @param point
     *            the other point
     * @return the coefficients of the perpendicular bisector
     */
    bisector(point) {
      dimCheck(point);
      let diff = this.subtract(point);
      let sum = this.add(point);
      let dot = diff.dot(sum);
      return diff.extend(-dot / 2);
    }

    /**
     * @return the specified coordinate of this DelaunayVertex
     * @throws ArrayIndexOutOfBoundsException
     *             for bad coordinate
     */
    coord(i) {
      return this.coordinates[i];
    }

    /**
     * Check that dimensions match.
     * 
     * @param p
     *            the DelaunayVertex to check (against this DelaunayVertex)
     * @return the dimension of the Pnts
     * @throws IllegalArgumentException
     *             if dimension fail to match
     */
    dimCheck(p) {
      let len = this.coordinates.length;
      if (len != p.coordinates.length) {
        throw new IllegalArgumentException('Dimension mismatch');
      }
      return len;
    }

    /**
     * @return this DelaunayVertex's dimension.
     */
    dimension() {
      return coordinates.length;
    }

    /* Pnts as matrices */

    /**
     * Dot product.
     * 
     * @param p
     *            the other DelaunayVertex
     * @return dot product of this DelaunayVertex and p
     */
    dot(p) {
      let len = dimCheck(p);
      let sum = 0;
      for (let i = 0; i < len; i++) {
        sum += this.coordinates[i] * p.coordinates[i];
      }
      return sum;
    }

    equals(other) {
      if (!(other instanceof DelaunayVertex)) {
        return false;
      }
      let p = other;
      if (this.coordinates.length != p.coordinates.length) {
        return false;
      }
      for (let i = 0; i < this.coordinates.length; i++) {
        if (this.coordinates[i] != p.coordinates[i]) {
          return false;
        }
      }
      return true;
    }

    /**
     * Create a new DelaunayVertex by adding additional coordinates to this
     * DelaunayVertex.
     * 
     * @param coords
     *            the new coordinates (added on the right end)
     * @return a new DelaunayVertex with the additional coordinates
     */
    extend(...coords) {
      let result = new double[coordinates.length + coords.length]();
      System.arraycopy(coordinates, 0, result, 0, coordinates.length);
      System.arraycopy(coords, 0, result, coordinates.length, coords.length);
      return new DelaunayVertex(result);
    }

    hashCode() {
      let hash = 0;
      for (let c of this.coordinates) {
        let bits = c; // Double.longbits
        hash = (31 * hash) ^ int(bits ^ (bits >> 32));
      }
      return hash;
    }

    /* Pnts as simplices */

    /**
     * Test if this DelaunayVertex is inside a simplex.
     * 
     * @param simplex
     *            the simplex (an arary of Pnts)
     * @return true iff this DelaunayVertex is inside simplex.
     */
    isInside(simplex) {
      let result = this.relation(simplex);
      for (let r of result) {
        if (r >= 0) {
          return false;
        }
      }
      return true;
    }

    /**
     * Test if this DelaunayVertex is on a simplex.
     * 
     * @param simplex
     *            the simplex (an array of Pnts)
     * @return the simplex DelaunayVertex that "witnesses" on-ness (or null if
     *         not on)
     */
    isOn(simplex) {
      let result = this.relation(simplex);
      let witness = null;
      for (let i = 0; i < result.length; i++) {
        if (result[i] == 0) {
          witness = simplex[i];
        } else if (result[i] > 0) {
          return null;
        }
      }
      return witness;
    }

    /**
     * Test if this DelaunayVertex is outside of simplex.
     * 
     * @param simplex
     *            the simplex (an array of Pnts)
     * @return simplex DelaunayVertex that "witnesses" outsideness (or null if
     *         not outside)
     */
    isOutside(simplex) {
      let result = this.relation(simplex);
      for (let i = 0; i < result.length; i++) {
        if (result[i] > 0) {
          return simplex[i];
        }
      }
      return null;
    }

    /**
     * Magnitude (as a vector).
     * 
     * @return the Euclidean length of this vector
     */
    magnitude() {
      return Math.sqrt(this.dot(this));
    }

    /**
     * Relation between this DelaunayVertex and a simplex (represented as an
     * array of Pnts). Result is an array of signs, one for each vertex of the
     * simplex, indicating the relation between the vertex, the vertex's
     * opposite facet, and this DelaunayVertex.
     * 
     * <pre>
     *   -1 means DelaunayVertex is on same side of facet
     *    0 means DelaunayVertex is on the facet
     *   +1 means DelaunayVertex is on opposite side of facet
     * </pre>
     * 
     * @param simplex
     *            an array of Pnts representing a simplex
     * @return an array of signs showing relation between this DelaunayVertex
     *         and simplex
     * @throws IllegalArgumentExcpetion
     *             if the simplex is degenerate
     */
    relation(simplex) {
      /*
         * In 2D, we compute the cross of this matrix: 1 1 1 1 p0 a0 b0 c0 p1 a1
         * b1 c1 where (a, b, c) is the simplex and p is this DelaunayVertex.
         * The result is a vector in which the first coordinate is the signed
         * area (all signed areas are off by the same constant factor) of the
         * simplex and the remaining coordinates are the *negated* signed areas
         * for the simplices in which p is substituted for each of the vertices.
         * Analogous results occur in higher dimensions.
         */
      let dim = simplex.length - 1;
      if (this.dimension() != dim) {
        throw new IllegalArgumentException('Dimension mismatch');
      }

      /* Create and load the matrix */
      let matrix = new DelaunayVertex[dim + 1]();
      /* First row */
      let coords = new double[dim + 2]();
      for (let j = 0; j < coords.length; j++) {
        coords[j] = 1;
      }
      matrix[0] = new DelaunayVertex(coords);
      /* Other rows */
      for (let i = 0; i < dim; i++) {
        coords[0] = this.coordinates[i];
        for (let j = 0; j < simplex.length; j++) {
          coords[j + 1] = simplex[j].coordinates[i];
        }
        matrix[i + 1] = new DelaunayVertex(coords);
      }

      /* Compute and analyze the vector of areas/volumes/contents */
      let vector = cross(matrix);
      let content = vector.coordinates[0];
      let result = new Array(dim + 1);
      for (let i = 0; i < result.length; i++) {
        let value = vector.coordinates[i + 1];
        if (Math.abs(value) <= 1.0e-6 * Math.abs(content)) {
          result[i] = 0;
        } else if (value < 0) {
          result[i] = -1;
        } else {
          result[i] = 1;
        }
      }
      if (content < 0) {
        for (let i = 0; i < result.length; i++) {
          result[i] = -result[i];
        }
      }
      if (content == 0) {
        for (let i = 0; i < result.length; i++) {
          result[i] = Math.abs(result[i]);
        }
      }
      return result;
    }

    /**
     * Subtract.
     * 
     * @param p
     *            the other DelaunayVertex
     * @return a new DelaunayVertex = this - p
     */
    subtract(p) {
      let len = dimCheck(p);
      let coords = new Array(len);
      for (let i = 0; i < len; i++) {
        coords[i] = this.coordinates[i] - p.coordinates[i];
      }
      return new DelaunayVertex(coords);
    }

    toString() {
      if (coordinates.length == 0) {
        return 'DelaunayVertex()';
      }
      let result = 'DelaunayVertex(' + coordinates[0];
      for (let i = 1; i < coordinates.length; i++) {
        result = result + ',' + coordinates[i];
      }
      result = result + ')';
      return result;
    }

    toVec2D() {
      return new Vec2D(coordinates[0], coordinates[1]);
    }

    /**
     * Test relation between this DelaunayVertex and circumcircle of a simplex.
     * 
     * @param simplex
     *            the simplex (as an array of Pnts)
     * @return -1, 0, or +1 for inside, on, or outside of circumcircle
     */
    vsCircumcircle(simplex) {
      let matrix = new Array(simplex.length + 1);
      for (let i = 0; i < simplex.length; i++) {
        matrix[i] = simplex[i].extend(1, simplex[i].dot(simplex[i]));
      }
      matrix[simplex.length] = this.extend(1, this.dot(this));
      let d = this.determinant(matrix);
      let result = d < 0 ? -1 : d > 0 ? +1 : 0;
      if (this.content(simplex) < 0) {
        result = -result;
      }
      return result;
    }
  }
});
