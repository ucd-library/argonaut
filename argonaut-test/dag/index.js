module.exports = {
  name : 'test-argo-dag',

  enableQueue : true,

  images : {
    node : 'node:14',
    'image-utils' : 'ucdlib/casita-image-utils'
  },

  config : {
    fs : {
      nfsRoot : '/storage/nfs'
    }
  },

  steps : {
    'test-input' : {
      description : 'Add new product to system',
      input : true
    },

    'test-input' : {
      description : 'Add new product to system',
      output : {
        details : {
          from : 'stdout',
          type : 'json',
          schema : "https://argonaut.library.ucdavis.edu/geosr-product.schema.json"
        }
      }
    },


  }



}