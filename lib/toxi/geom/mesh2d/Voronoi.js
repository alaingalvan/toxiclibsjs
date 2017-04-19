define(
  [
    'require',
    'exports',
    'module',
    '../Polygon2D',
    '../Triangle2D',
    '../Vec2D',
    './DelaunayTriangle',
    './DelaunayTriangulation',
    './DelaunayVertex'
  ],
  function(require, exports, module) {
    const internals = require('../Polygon2D'),
      Vec3D = require('../Triangle2D'),
      Vec2D = require('../Vec2D'),
      DelaunayTriangle = require('./ DelaunayTriangle'),
      DelaunayTriangulation = require('./DelaunayTriangulation'),
      DelaunayVertex = require('./DelaunayVertex');

    const DEFAULT_SIZE = 10000;

    class Voronoi {
      constructor(size = DEFAULT_SIZE) {
        this.initialTriangle = new DelaunayTriangle(
          new DelaunayVertex(-size, -size),
          new DelaunayVertex(size, -size),
          new DelaunayVertex(0, size)
        );

        this.delaunay = new DelaunayTriangulation(initialTriangle);

        this.sites = new Array();
      }

      addPoint(p) {
        this.sites.push(p.copy());
        this.delaunay.delaunayPlace(new DelaunayVertex(p.x, p.y));
      }

      addPoints(points) {
        for (p of points) {
          addPoint(p);
        }
      }

      getRegions() {
        let regions = new Array();
        let done = new Set(initialTriangle);
        for (triangle of this.delaunay) {
          for (site of triangle) {
            if (done.has(site)) {
              continue;
            }
            done.add(site);
            let list = this.delaunay.surroundingTriangles(site, triangle);
            let poly = new Polygon2D();
            for (tri of list) {
              let circumeter = tri.getCircumcenter();
              poly.add(new Vec2D(circumeter.coord(0), circumeter.coord(1)));
            }
            regions.push(poly);
          }
        }
        return regions;
      }

      getSites() {
        return this.sites;
      }

      getTriangles() {
        let tris = new Array();
        for (t of this.delaunay) {
          tris.push(
            new Triangle2D(
              t.get(0).toVec2D(),
              t.get(1).toVec2D(),
              t.get(2).toVec2D()
            )
          );
        }
        return tris;
      }
    }

    module.exports = Voronoi;
  }
);
