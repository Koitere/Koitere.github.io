/*
 * OpenSimplex Noise in JavaScript.
 * originally by Kurt Spencer (v1.1), ported from Java to JavaScript 'Aug 21, 2021' by Liam King
 */

class OSimplex {
  perm;
  sources;
  static STRETCH_CONSTANT_2D = -0.211324865405187;    //(1/Math.sqrt(2+1)-1)/2;
  static SQUISH_CONSTANT_2D = 0.366025403784439;      //(Math.sqrt(2+1)-1)/2;
  static NORM_CONSTANT_2D = 1950;
  static gradients2D = new Uint8Array([5,2,2,5,-5,2,-2,5,5,-2,2,-5,-5,-2,-2,-5])
  constructor(seed) {
    seed = BigInt(seed);
    this.perm = new Int32Array(256);
    this.sources = new Int32Array(256);
		for (let i = 0; i < 256; i++)
			this.sources[i] = i;
		seed = seed * 6364136223846793005n + 1442695040888963407n;
		seed = seed * 6364136223846793005n + 1442695040888963407n;
		seed = seed * 6364136223846793005n + 1442695040888963407n;
		for (let i = 255; i >= 0; i--) {
			seed = seed * 6364136223846793005n + 1442695040888963407n;
			let r = ((seed + 31n) % (BigInt(i) + 1n));
			if (r < 0)
				r += (i + 1);
			this.perm[i] = this.sources[r];
			this.sources[r] = this.sources[i];
		}
  }


  eval(x,y) {

    		//Place input coordinates onto grid.
    		let stretchOffset = (x + y) * OSimplex.STRETCH_CONSTANT_2D;
    		let xs = x + stretchOffset;
    		let ys = y + stretchOffset;

    		//Floor to get grid coordinates of rhombus (stretched square) super-cell origin.
    		let xsb = this.fastFloor(xs);
    		let ysb = this.fastFloor(ys);

    		//Skew out to get actual coordinates of rhombus origin. We'll need these later.
    		let squishOffset = (xsb + ysb) * OSimplex.SQUISH_CONSTANT_2D;
    		let xb = xsb + squishOffset;
    		let yb = ysb + squishOffset;

    		//Compute grid coordinates relative to rhombus origin.
    		let xins = xs - xsb;
    		let yins = ys - ysb;

    		//Sum those together to get a value that determines which region we're in.
    		let inSum = xins + yins;

    		//Positions relative to origin point.
    		let dx0 = x - xb;
    		let dy0 = y - yb;

    		//We'll be defining these inside the next block and using them afterwards.
    		let dx_ext, dy_ext;
    		let xsv_ext, ysv_ext;
    		let value = 0;

    		//Contribution (1,0)
    		let dx1 = dx0 - 1 - OSimplex.SQUISH_CONSTANT_2D;
    		let dy1 = dy0 - 0 - OSimplex.SQUISH_CONSTANT_2D;
    		let attn1 = 2 - dx1 * dx1 - dy1 * dy1;

    		if (attn1 > 0) {
    			attn1 *= attn1;
    			value += attn1 * attn1 * this.extrapolate(xsb + 1, ysb + 0, dx1, dy1);
    		}

    		//Contribution (0,1)
    		let dx2 = dx0 - 0 - OSimplex.SQUISH_CONSTANT_2D;
    		let dy2 = dy0 - 1 - OSimplex.SQUISH_CONSTANT_2D;
    		let attn2 = 2 - dx2 * dx2 - dy2 * dy2;
    		if (attn2 > 0) {
    			attn2 *= attn2;
    			value += attn2 * attn2 * this.extrapolate(xsb + 0, ysb + 1, dx2, dy2);
    		}

    		if (inSum <= 1) { //We're inside the triangle (2-Simplex) at (0,0)
    			let zins = 1 - inSum;
    			if (zins > xins || zins > yins) { //(0,0) is one of the closest two triangular vertices
    				if (xins > yins) {
    					xsv_ext = xsb + 1;
    					ysv_ext = ysb - 1;
    					dx_ext = dx0 - 1;
    					dy_ext = dy0 + 1;
    				} else {
    					xsv_ext = xsb - 1;
    					ysv_ext = ysb + 1;
    					dx_ext = dx0 + 1;
    					dy_ext = dy0 - 1;
    				}
    			} else { //(1,0) and (0,1) are the closest two vertices.
    				xsv_ext = xsb + 1;
    				ysv_ext = ysb + 1;
    				dx_ext = dx0 - 1 - 2 * OSimplex.SQUISH_CONSTANT_2D;
    				dy_ext = dy0 - 1 - 2 * OSimplex.SQUISH_CONSTANT_2D;
    			}
    		} else { //We're inside the triangle (2-Simplex) at (1,1)
    			let zins = 2 - inSum;
    			if (zins < xins || zins < yins) { //(0,0) is one of the closest two triangular vertices
    				if (xins > yins) {
    					xsv_ext = xsb + 2;
    					ysv_ext = ysb + 0;
    					dx_ext = dx0 - 2 - 2 * OSimplex.SQUISH_CONSTANT_2D;
    					dy_ext = dy0 + 0 - 2 * OSimplex.SQUISH_CONSTANT_2D;
    				} else {
    					xsv_ext = xsb + 0;
    					ysv_ext = ysb + 2;
    					dx_ext = dx0 + 0 - 2 * OSimplex.SQUISH_CONSTANT_2D;
    					dy_ext = dy0 - 2 - 2 * OSimplex.SQUISH_CONSTANT_2D;
    				}
    			} else { //(1,0) and (0,1) are the closest two vertices.
    				dx_ext = dx0;
    				dy_ext = dy0;
    				xsv_ext = xsb;
    				ysv_ext = ysb;
    			}
    			xsb += 1;
    			ysb += 1;
    			dx0 = dx0 - 1 - 2 * OSimplex.SQUISH_CONSTANT_2D;
    			dy0 = dy0 - 1 - 2 * OSimplex.SQUISH_CONSTANT_2D;
    		}

    		//Contribution (0,0) or (1,1)
    		let attn0 = 2 - dx0 * dx0 - dy0 * dy0;
    		if (attn0 > 0) {
    			attn0 *= attn0;
    			value += attn0 * attn0 * this.extrapolate(xsb, ysb, dx0, dy0);
    		}

    		//Extra Vertex
    		let attn_ext = 2 - dx_ext * dx_ext - dy_ext * dy_ext;
    		if (attn_ext > 0) {
    			attn_ext *= attn_ext;
    			value += attn_ext * attn_ext * this.extrapolate(xsv_ext, ysv_ext, dx_ext, dy_ext);
    		}

    		return value / OSimplex.NORM_CONSTANT_2D;
  }
  extrapolate(xsb, ysb, dx, dy)
	{
		let index = this.perm[(this.perm[xsb & 0xFF] + ysb) & 0xFF] & 0x0E;
		return OSimplex.gradients2D[index] * dx
			+ OSimplex.gradients2D[index + 1] * dy;
	}
  fastFloor(x) {
    let xi = Math.floor(x);
    return x < xi ? xi - 1 : xi;
  }
}
