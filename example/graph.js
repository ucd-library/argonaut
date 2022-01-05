import goesrMsgDecorder from './goesr-message-decoder.js';

const BASE_API = env.AIRFLOW_BASE_API || 'http://airflow/api/v1/dags';
const GENERIC_PAYLOAD_APIDS = /^(301|302)$/;

function airflowFetchHelper(fetch, path, body) {
  console.log(
    [BASE_API, path].join('/'), 
    {
      method : 'POST',
      headers : {'content-type': 'application/json'}, 
      body : JSON.stringify(body)
    }
  );

  // return fetch(
  //   [BASE_API, path].join('/'),
  //   {
  //     method : 'POST',
  //     headers : {'content-type': 'application/json'}, 
  //     body : JSON.stringify(body)
  //   }
  // )
}

const dag = {

  'goesr-product' : {
    source : true,
    decoder : goesrMsgDecorder 
  },


  'block-composite-image' : {
    groupByKey : '{{scale}}-{{date}}-{{hour}}-{{minsec}}-{{band}}-{{apid}}-{{block}}',
    dependencies : ['goesr-product'],

    filter : data => ['image-fragment.jp2', 'fragment-metadata.json'].includes(data.path.filename),
    
    ready : msgs => {
      let fragments = msgs.filter(items => items.path.filename === 'image-fragment.jp2');
      let metadata = msgs.filter(items => items.path.filename === 'fragment-metadata.json');
      if( !metadata ) return false;
      return (metadata.metadata.fragmentsCount === fragments.length);
    },

    send : (key, msgs, fetch) => {
      let {scale, date, hour, minsec, band, apid, block, path} = msgs[0];

      return airflowFetchHelper(fetch, ['block-composite-images', 'dagRuns'].join('/'), {
        dag_run_id : key,
        logical_date : new Date().toISOString(),
        conf : {
          scale, date, hour, minsec, band, apid, block, path
        }
      })
    }
  },

  'full-composite-image' : {
    groupByKey : '{{scale}}-{{date}}-{{hour}}-{{minsec}}-{{band}}-{{apid}}-{{path.filename}}',
    dependencies : ['block-composite-images'],
    filter : data => ['image.png', 'web.png', 'web-scaled.png'].includes(data.path.filename),

    ready : msgs => {
      let scale = msgs[0].scale;

      // TODO: wish there was a better way
      if( scale === 'mesoscale' && msgs.length >= 4 ) return true;
      if( scale === 'conus' && msgs.length >= 36 ) return true;
      if( scale === 'fulldisk' && msgs.length >= 229 ) return true;

      return false;
    },

    send : (key, msgs, fetch) => {
      let {scale, date, hour, minsec, band, apid, block, path} = msgs[0];

      return airflowFetchHelper(fetch, ['full-composite-image', 'dagRuns'].join('/'), {
        dag_run_id : key,
        logical_date : new Date().toISOString(),
        conf : {
          scale, date, hour, minsec, band, apid, block, path
        }
      })
    },
  },

  'generic-payload-parser' : {
    groupByKey : '{{scale}}-{{date}}-{{hour}}-{{minsec}}-{{ms:_}}-{{band}}-{{apid}}-{{block}}',
    dependencies : ['goesr-product'],
    filter : data => (data.match(GENERIC_PAYLOAD_APIDS) ? true : false) && (data.path.filename === 'payload.bin'),
    ready : msgs => true,

    send : (key, msgs, fetch) => {
      let {scale, date, hour, minsec, ms, band, apid, block, path} = msgs[0];

      return airflowFetchHelper(fetch, ['generic-payload-parser', 'dagRuns'].join('/'), {
        dag_run_id : key,
        logical_date : new Date().toISOString(),
        conf : {
          scale, date, hour, minsec, ms, band, apid, block, path
        }
      })
    }
  },

  'lighting-grouped-stats' : {

  }


}

export default dag