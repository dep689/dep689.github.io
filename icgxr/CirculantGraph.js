function mod(n, modulo) {

  return ((n % modulo) + modulo) % modulo;

}

function gcd(a, b) {

  if (b == 0) return a;

  return gcd(b, mod(a, b));

}

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

export class IntegralCirculantGraph {
  constructor(order, divisorSet) {
    this.order = order;
    this.D = new Set(divisorSet.map(d => mod(d, order)));
  }

  isAdjacent(u, v) {
    return this.D.has(gcd(u - v, this.order));
  }
}
