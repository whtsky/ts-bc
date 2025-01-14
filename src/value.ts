export enum ObjectType {
  Number,
  String,
  Boolean,
  Object,
  Value,
  Function,
  Array,
  Undefined,
  Null
}

export abstract class VObject {
  protected abstract get type(): ObjectType
  public abstract debugValue(): any

  isNumber(): this is JSNumber {
    return this.type === ObjectType.Number
  }

  isString(): this is JSString {
    return this.type === ObjectType.String
  }

  isBoolean(): this is JSBoolean {
    return this.type === ObjectType.Boolean
  }

  isNull(): this is JSNull {
    return false
  }

  isUndefined(): this is JSUndefined {
    return false
  }

  isPrimitive(): this is JSPrimitive {
    return this.isNumber() || this.isBoolean() || this.isString()
  }

  isValue(): this is JSValue {
    return false
  }

  isObject(): this is JSObject {
    return false
  }

  asNumber() {
    if (this.isNumber()) {
      return this
    }
    throw new Error('invalid cast')
  }

  asString() {
    if (this.isString()) {
      return this
    }
    throw new Error('invalid cast')
  }

  asBoolean(): JSBoolean {
    throw new Error('invalid cast')
  }
}

export abstract class JSPrimitive extends VObject {
  protected abstract get value(): any

  public debugValue() {
    return this.value
  }
}

export class JSObject extends VObject {
  private rc: number = 0

  constructor(
    public properties: Map<string | number, VObject> = new Map(),
    public prototype: JSObject | JSNull = JSNull.instance
  ) {
    super()
  }

  get type() {
    return ObjectType.Object
  }

  debugValue(): any {
    return this
  }

  isObject(): this is JSObject {
    return true
  }

  isArray(): this is JSArray {
    return this.type === ObjectType.Array
  }

  isFunction(): this is JSFunction {
    return this.type === ObjectType.Function
  }

  asArray(): JSArray {
    throw new Error('invalid cast')
  }

  get(key: JSString | JSNumber): VObject | JSUndefined {
    if (this.properties.has(key.value)) {
      return this.properties.get(key.value)!
    }
    if (!this.prototype.isNull()) {
      return this.prototype.get(key)
    }
    return JSUndefined.instance
  }

  set(key: JSString | JSNumber, value: VObject) {
    this.properties.set(key.value, value)
    return value
  }
}

export class JSValue extends VObject {
  constructor(private ref: JSObject) {
    super()
  }

  debugValue() {
    return this.ref.debugValue()
  }

  get type() {
    return ObjectType.Value
  }
}

export class JSNumber extends JSPrimitive {
  constructor(public value: number) {
    super()
  }

  get type() {
    return ObjectType.Number
  }

  asBoolean() {
    return new JSBoolean(!!this.value)
  }
}

export class JSString extends JSPrimitive {
  constructor(public value: string) {
    super()
  }

  get type() {
    return ObjectType.String
  }
}

export class JSBoolean extends JSPrimitive {
  constructor(public value: boolean) {
    super()
  }

  get type() {
    return ObjectType.Boolean
  }

  asBoolean() {
    return this
  }
}

export class JSUndefined extends JSPrimitive {
  value: undefined = undefined

  get type() {
    return ObjectType.Undefined
  }

  isUndefined(): this is JSUndefined {
    return true
  }

  asBoolean() {
    return new JSBoolean(false)
  }

  static instance = new JSUndefined()
}

export class JSNull extends JSPrimitive {
  value: null = null

  get type() {
    return ObjectType.Null
  }

  isNull(): this is JSNull {
    return true
  }

  asBoolean() {
    return new JSBoolean(false)
  }

  static instance = new JSNull()
}

export class JSFunction extends JSObject {
  constructor(
    public name: JSString,
    public pos: number,
    public upvalue: Map<string, VObject>
  ) {
    super()
  }

  isNative(): this is JSNativeFunction {
    return false
  }

  get type() {
    return ObjectType.Function
  }
}

export class JSNativeFunction extends JSFunction {
  constructor(
    public name: JSString,
    public func: (...args: VObject[]) => VObject
  ) {
    super(name, 0, new Map())
  }

  isNative(): this is JSNativeFunction {
    return true
  }

  apply(args: VObject[]) {
    return this.func.apply(null, args)
  }
}

export class JSArray extends JSObject {
  get type() {
    return ObjectType.Array
  }

  constructor(private items: VObject[]) {
    super()
  }

  get(idx: JSNumber) {
    if (idx.value < 0 || idx.value >= this.items.length) {
      return JSUndefined.instance
    }
    return this.items[idx.value]
  }

  asArray() {
    return this
  }

  debugValue() {
    return this.items.map(x => x.debugValue())
  }
}
