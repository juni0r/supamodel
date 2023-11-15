import { type ModelClass } from '.'

export default (model: ModelClass) =>
  class extends model {
    validate() {
      console.log('Yay! Validating! 🎉')
      return super.validate()
    }
  }
