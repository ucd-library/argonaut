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

    'test-step1' : {
      description : 'first step after input',
      dependsOn : [{
        name : 'test-input'
      }],
      cmd : {
        
      },
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