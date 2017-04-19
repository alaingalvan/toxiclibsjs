define(
  [
    'require',
    'exports',
    'module',
    './DelaunayVertex',
    '../../util/datatypes/UndirectedGraph'
  ],
  function(require, exports, module) {
    const DelaunayVertex = require('./DelaunayVertex');
    const UndirectedGraph = require('../../util/datatypes/UndirectedGraph');

    /**
 * A 2D Delaunay DelaunayTriangulation (DT) with incremental site insertion.
 * 
 * This is not the fastest way to build a DT, but it's a reasonable way to build
 * a DT incrementally and it makes a nice interactive display. There are several
 * O(n log n) methods, but they require that the sites are all known initially.
 * 
 * A DelaunayTriangulation is a Set of Triangles. A DelaunayTriangulation is
 * unmodifiable as a Set; the only way to change it is to add sites (via
 * delaunayPlace).
 * 
 * @author Paul Chew
 * 
 *         Created July 2005. Derived from an earlier, messier version.
 * 
 *         Modified November 2007. Rewrote to use AbstractSet as parent class
 *         and to use the UndirectedGraph class internally. Tried to make the DT
 *         algorithm clearer by explicitly creating a cavity. Added code needed
 *         to find a Voronoi cell.
 * 
 * @author Karsten Schmidt
 * 
 *         Ported to use toxiclibs classes (June 2010).
 */
    class DelaunayTriangulation extends Set {
      /**
     * All sites must fall within the initial triangle.
     * 
     * @param triangle
     *            the initial triangle
     */
      constructor(triangle) {
        this.triGraph = new UndirectedGraph();
        this.triGraph.add(triangle);
        this.mostRecent = triangle;
      }

      /**
     * True iff triangle is a member of this triangulation. This method isn't
     * required by AbstractSet, but it improves efficiency.
     * 
     * @param triangle
     *            the object to check for membership
     */
      contains(triangle) {
        return this.triGraph.getNodes().contains(triangle);
      }

      /**
     * Place a new site into the DT. Nothing happens if the site matches an
     * existing DT vertex.
     * 
     * @param site
     *            the new DelaunayVertex
     * @throws IllegalArgumentException
     *             if site does not lie in any triangle
     */
      delaunayPlace(site) {
        // Uses straightforward scheme rather than best asymptotic time
        // Locate containing triangle
        let triangle = this.locate(site);
        // Give up if no containing triangle or if site is already in DT
        if (triangle == null) {
          throw new Error('IllegalArgumentException: No containing triangle');
        }
        if (triangle.contains(site)) {
          return;
        }
        // Determine the cavity and update the triangulation
        let cavity = this.getCavity(site, triangle);
        this.mostRecent = this.update(site, cavity);
      }

      /**
     * Determine the cavity caused by site.
     * 
     * @param site
     *            the site causing the cavity
     * @param triangle
     *            the triangle containing site
     * @return set of all triangles that have site in their circumcircle
     */
      getCavity(site, triangle) {
        let encroached = new Set();
        let toBeChecked = new Array();
        let marked = new Set();
        toBeChecked.add(triangle);
        marked.add(triangle);
        while (!toBeChecked.isEmpty()) {
          triangle = toBeChecked.remove();
          if (
            site.vsCircumcircle(triangle.toArray(new DelaunayVertex[0]())) == 1
          ) {
            // Site outside triangle => triangle not in cavity
            continue;
          }
          encroached.add(triangle);
          // Check the neighbors
          for (let neighbor of triGraph.getConnectedNodesFor(triangle)) {
            if (marked.contains(neighbor)) {
              continue;
            }
            marked.add(neighbor);
            toBeChecked.add(neighbor);
          }
        }
        return encroached;
      }

      iterator() {
        return triGraph.getNodes().iterator();
      }

      /**
     * Locate the triangle with point inside it or on its boundary.
     * 
     * @param point
     *            the point to locate
     * @return the triangle that holds point; null if no such triangle
     */
      locate(point) {
        let triangle = this.mostRecent;
        if (!this.contains(triangle)) {
          triangle = null;
        }

        // Try a directed walk (this works fine in 2D, but can fail in 3D)
        let visited = new Set();
        while (triangle != null) {
          if (visited.contains(triangle)) {
            // This should never happen
            System.out.println('Warning: Caught in a locate loop');
            break;
          }
          visited.add(triangle);
          // Corner opposite point
          let corner = point.isOutside(
            triangle.toArray(new DelaunayVertex[0]())
          );
          if (corner == null) {
            return triangle;
          }
          triangle = this.neighborOpposite(corner, triangle);
        }
        // No luck; try brute force
        console.log('Warning: Checking all triangles for ' + point);
        for (let tri of this) {
          if (point.isOutside(tri.toArray(new DelaunayVertex[0]())) == null) {
            return tri;
          }
        }
        // No such triangle
        console.log('Warning: No triangle holds ' + point);
        return null;
      }

      /**
     * Report neighbor opposite the given vertex of triangle.
     * 
     * @param site
     *            a vertex of triangle
     * @param triangle
     *            we want the neighbor of this triangle
     * @return the neighbor opposite site in triangle; null if none
     * @throws IllegalArgumentException
     *             if site is not in this triangle
     */
      neighborOpposite(site, triangle) {
        if (!triangle.contains(site)) {
          throw new Error(
            'IllegalArgumentException: Bad vertex; not in triangle'
          );
        }
        for (let neighbor of triGraph.getConnectedNodesFor(triangle)) {
          if (!neighbor.contains(site)) {
            return neighbor;
          }
        }
        return null;
      }

      /**
     * Return the set of triangles adjacent to triangle.
     * 
     * @param triangle
     *            the triangle to check
     * @return the neighbors of triangle
     */
      neighbors(triangle) {
        return triGraph.getConnectedNodesFor(triangle);
      }

      size() {
        return triGraph.getNodes().size();
      }

      /**
     * Report triangles surrounding site in order (cw or ccw).
     * 
     * @param site
     *            we want the surrounding triangles for this site
     * @param triangle
     *            a "starting" triangle that has site as a vertex
     * @return all triangles surrounding site in order (cw or ccw)
     * @throws IllegalArgumentException
     *             if site is not in triangle
     */
      surroundingTriangles(site, triangle) {
        if (!triangle.contains(site)) {
          throw new Error('IllegalArgumentException: Site not in triangle');
        }
        let list = new Array();
        let start = triangle;
        let guide = triangle.getVertexButNot(site); // Affects cw or
        // ccw
        while (true) {
          list.add(triangle);
          let previous = triangle;
          triangle = this.neighborOpposite(guide, triangle); // Next triangle
          guide = previous.getVertexButNot(site, guide); // Update guide
          if (triangle == start) {
            break;
          }
        }
        return list;
      }

      toString() {
        return 'DelaunayTriangulation with ' + size() + ' triangles';
      }

      /**
     * Update the triangulation by removing the cavity triangles and then
     * filling the cavity with new triangles.
     * 
     * @param site
     *            the site that created the cavity
     * @param cavity
     *            the triangles with site in their circumcircle
     * @return one of the new triangles
     */
      update(site, cavity) {
        let boundary = new Set();
        let theTriangles = new Set();

        // Find boundary facets and adjacent triangles
        for (let triangle of cavity) {
          theTriangles.addAll(neighbors(triangle));
          for (let vertex of triangle) {
            let facet = triangle.facetOpposite(vertex);
            if (boundary.contains(facet)) {
              boundary.remove(facet);
            } else {
              boundary.add(facet);
            }
          }
        }
        theTriangles.removeAll(cavity); // Adj triangles only

        // Remove the cavity triangles from the triangulation
        for (let triangle of cavity) {
          triGraph.remove(triangle);
        }

        // Build each new triangle and add it to the triangulation
        let newTriangles = new Set();
        for (let vertices of boundary) {
          vertices.add(site);
          let tri = new DelaunayTriangle(vertices);
          triGraph.add(tri);
          newTriangles.add(tri);
        }

        // Update the graph links for each new triangle
        theTriangles.addAll(newTriangles); // Adj triangle + new triangles
        for (let triangle of newTriangles) {
          for (let other of theTriangles) {
            if (triangle.isNeighbor(other)) {
              triGraph.connect(triangle, other);
            }
          }
        }

        // Return one of the new triangles
        return newTriangles.iterator().next();
      }
    }
  }
);
