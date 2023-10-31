function mod(n, modulo) {

  return ((n % modulo) + modulo) % modulo;

}

function gcd(a, b) {

  if (b == 0) return a;

  return gcd(b, mod(a, b));

}

// 巡回群上の Cayley graph を circulant graph という．
// CiculantGraph(n, S) = Cay(Z_n, S)
// https://en.wikipedia.org/wiki/Circulant_graph
export class CirculantGraph {
  constructor(order, S) {
    this.order = order;
    this.S = new Set(S.concat(S.map(s => -s)).map(s => mod(s, order)));
  }

  isAdjacent(u, v) {
    return this.S.has(Math.abs(u - v));
  }
}

// circulant graph のうち、隣接行列の固有値がすべて整数であるものを
// integral circulant graph (ICG) という．
//
// 頂点数 n の integral circulant graph はすべて次の作り方で得られることが分かっている
// (Wasin So, 2006, https://doi.org/10.1016/j.disc.2005.11.006) .
//
// 作り方：
// 1) n の正の約数をいくつか好きに選んだ集合を D とする．
// 2) 頂点の集合を V={0,1,...,n-1} とする．
// 3) 1~n-1 の整数のうち n との最大公約数が D に含まれるもの全体の集合を S とする．
// 4) 各 s∈S, v∈V について，二つの頂点 v, (v+s)%n を辺で結ぶ．（完成）
//
// 例えば n=12, D={1,2,3} のとき，V={0,1,...,11}, S={1,2,3,5,7,9,10,11}．
// 頂点 0 に隣接する頂点は 1,2,3,5,7,9,10,11
// 頂点 1 に隣接する頂点は 2,3,4,6,8,10,11,0
// 等々...

export class IntegralCirculantGraph {
  constructor(order, divisorSet) {
    this.order = order;
    this.D = new Set(divisorSet.map(d => mod(d, order)));
  }

  isAdjacent(u, v) {
    return this.D.has(gcd(u - v, this.order));
  }
}
