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
class DelaunayTriangle extends Set {



    /**
     * @param collection
     *            a Collection holding the Simplex vertices
     * @throws IllegalArgumentException
     *             if there are not three distinct vertices
     */
    constructor(collection) {
        super(collection);

    this.idNumber = 0; // The id number
    this.circumcenter = null; // The triangle's circumcenter

    this.idGenerator = 0; // Used to create id numbers
    this.moreInfo = false; // True if more info in toString

        idNumber = idGenerator++;
        if (this.size() != 3) {
            throw new IllegalArgumentException(
                    "DelaunayTriangle must have 3 vertices");
        }
    }

    /**
     * @param vertices
     *            the vertices of the DelaunayTriangle.
     * @throws IllegalArgumentException
     *             if there are not three distinct vertices
     */
    DelaunayTriangle(...vertices) {
        this(Arrays.asList(vertices));
    }

    
    add(vertex) {
        throw new UnsupportedOperationException();
    }

    
    equals(o) {
        return (this == o);
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
        let facet = new Set(this);
        if (!facet.remove(vertex)) {
            throw new IllegalArgumentException("Vertex not in triangle");
        }
        return facet;
    }

    /**
     * @return the triangle's circumcenter
     */
    getCircumcenter() {
        if (circumcenter == null) {
            circumcenter = DelaunayVertex.circumcenter(this
                    .toArray(new DelaunayVertex[0]));
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
        let bad = Arrays.asList(badVertices);
        for (v of this) {
            if (!bad.contains(v)) {
                return v;
            }
        }
        throw new Exception("No vertex found");
    }

    /* The following two methods ensure that a DelaunayTriangle is immutable */

    
    hashCode() {
        return (idNumber ^ (idNumber >>> 32));
    }

    /**
     * True iff triangles are neighbors. Two triangles are neighbors if they
     * share a facet.
     * 
     * @param triangle
     *            the other DelaunayTriangle
     * @return true iff this DelaunayTriangle is a neighbor of triangle
     */
    isNeighbor(DelaunayTriangle triangle) {
        int count = 0;
        for (DelaunayVertex vertex : this) {
            if (!triangle.contains(vertex)) {
                count++;
            }
        }
        return count == 1;
    }

    /* The following two methods ensure that all triangles are different. */
    iterator() {
        return new Iterator<DelaunayVertex>() {

            Iterator<DelaunayVertex> it = DelaunayTriangle.super
                    .iterator();

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
    }

    toString() {
        if (!moreInfo) {
            return "DelaunayTriangle" + idNumber;
        }
        return "DelaunayTriangle" + idNumber + super.toString();
    }

}