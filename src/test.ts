class BaseModel {
  static client: string
}

class Model extends BaseModel {
  declare static client: string
}

BaseModel.client = 'foo'

console.log(Model.client)
