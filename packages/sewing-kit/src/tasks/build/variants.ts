type VariantTuples<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T];

type VariantTupleArrays<T> = {
  [K in keyof T]: [K, T[K][]];
}[keyof T];

export class Variant<T> {
  private readonly map: Map<keyof T, T[keyof T]>;

  constructor(tuples: VariantTuples<T>[]) {
    this.map = new Map(tuples);
  }

  get<K extends keyof T>(key: K): T[K] | false {
    return (this.map.get(key) || false) as any;
  }
}

export class VariantBuilder<T> {
  get all() {
    type Tuple = VariantTuples<T>;

    const {additive, multiplicative} = this;
    const tupleGroups: Tuple[][] =
      additive.length > 0 ? additive.map((add) => [add]) : [[]];

    return multiplicative
      .reduce((all, [name, values]) => {
        return values.flatMap((value) =>
          all.map((tupleGroup) => [...tupleGroup, [name, value]]),
        );
      }, tupleGroups)
      .map((tupleGroup) => new Variant(tupleGroup));
  }

  private readonly additive: VariantTuples<T>[] = [];
  private readonly multiplicative: VariantTupleArrays<T>[] = [];

  add<K extends keyof T>(
    ...args: T[K] extends boolean ? [K, T[K]?] : [K, T[K][]]
  ) {
    const [name, values = true] = args;

    if (typeof values === 'boolean') {
      this.additive.push([name, values] as any);
    } else {
      this.multiplicative.push([name, values]);
    }
  }
}
