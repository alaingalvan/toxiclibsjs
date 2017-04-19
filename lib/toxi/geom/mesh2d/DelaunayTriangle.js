define(
  [
    'require',
    'exports',
    'module',
    './DelaunayVertex',
    '../../util/datatypes/ArraySet'
  ],
  function(require, exports, module) {
    const DelaunayVertex = require('./DelaunayVertex');
    const ArraySet = require('../../util/datatypes/ArraySet');

    /**
 * A DelaunayTriangle is an immutable Set of exactly three Pnts.
 * 
 * All Set operations are available. Individual vertices can be accessed via
 * iterator() and also via triangle.get(index).
 * 
 * Note that, even if two triangles have the same vertex set, they are
 * *different* triangles. Methods equals() and hashCode() are consistent with
 * this rule.
 * 
 * @author Paul Chew
 * 
 *         Created December 2007. Replaced general simplices with geometric
 *         triangle.
 * 
 */
    class DelaunayTriangle extends ArraySet {
      /**
     * @param collection
     *            a Collection holding the Simplex vertices
     * @throws IllegalArgumentException
     *             if there are not three distinct vertices
     */
      constructor(...args) {
        if (args.length === 1) super(args[0]);
        else super(args);

        this.idNumber = 0; // The id number
        this.circumcenter = null; // The triangle's circumcenter

        this.idGenerator = 0; // Used to create id numbers
        this.moreInfo = false; // True if more info in toString

        this.idNumber = this.idGenerator++;

        if (this.size != 3) {
          throw new Error('DelaunayTriangle must have 3 vertices');
        }
      }

      add(vertex) {
        throw new Error('UnsupportedOperationException');
      }

      equals(o) {
        return this == o;
      }

      /**
     * Report the facet opposite vertex.
     * 
     * @param vertex
     *            a vertex of this DelaunayTriangle
     * @return the facet opposite vertex
     * @throws IllegalArgumentException
     *             if the vertex is not in triangle
     */
      facetOpposite(vertex) {
        let facet = new ArraySet(this);
        if (!facet.delete(vertex)) {
          throw new Error('Vertex not in triangle');
        }
        return facet;
      }

      /**
     * @return the triangle's circumcenter
     */
      getCircumcenter() {
        if (circumcenter == null) {
          circumcenter = DelaunayVertex.circumcenter(
            this.toArray(new DelaunayVertex[0]())
          );
        }
        return circumcenter;
      }

      /**
     * Get arbitrary vertex of this triangle, but not any of the bad vertices.
     * 
     * @param badVertices
     *            one or more bad vertices
     * @return a vertex of this triangle, but not one of the bad vertices
     * @throws NoSuchElementException
     *             if no vertex found
     */
      getVertexButNot(...badVertices) {
        for (v of this) {
          if (!badVertices.contains(v)) {
            return v;
          }
        }
        throw new Error('No vertex found');
      }

      /* The following two methods ensure that a DelaunayTriangle is immutable */

      hashCode() {
        return idNumber ^ (idNumber >>> 32);
      }

      /**
     * True iff triangles are neighbors. Two triangles are neighbors if they
     * share a facet.
     * 
     * @param triangle
     *            the other DelaunayTriangle
     * @return true iff this DelaunayTriangle is a neighbor of triangle
     */
      isNeighbor(triangle) {
        let count = 0;
        for (vertex of this) {
          if (!triangle.contains(vertex)) {
            count++;
          }
        }
        return count == 1;
      }

      /* Useless Java */
      /* The following two methods ensure that all triangles are different. */
      /*    iterator() {
        return function*() {

            Iterator<DelaunayVertex> it = DelaunayTriangle.super.iterator();

            boolean hasNext() {
                return it.hasNext();
            }

            DelaunayVertex next() {
                return it.next();
            }

            void remove() {
                throw new UnsupportedOperationException();
            }
        };
    }*/

      toString() {
        if (!moreInfo) {
          return 'DelaunayTriangle' + this.idNumber;
        }
        return 'DelaunayTriangle' + this.idNumber + super.toString();
      }
    }
  }
);
