import {apidUtils} from '@ucd-lib/goes-r-packet-decoder';
import fs from 'fs';
import path from 'path';

function decoder(msg, config) {
  let length = msg.readUInt32BE(0);

  let metadata = JSON.parse(
    msg.slice(4, length+4).toString('utf-8')
  );
  let payload = null;

  if( msg.length > length + 4 ) {
    payload = msg.slice(length + 4, msg.length);
  }

  if( metadata.type === 'image' ) {
    return handleImageMessage(metadata, payload, config)
  } else {
    return handleGenericMessage(metadata, payload, config);
  }
}

function handleGenericMessage(metadata, payload) {
  var date = new Date(946728000000 + metadata.headers.SECONDS_SINCE_EPOCH*1000);
  var [date, time] = date.toISOString().split('T');
  time = time.replace(/\..*/, '');

  let product = apidUtils.get(metadata.apid);
  let ms = false;
  if( metadata.spacePacketHeaders && metadata.spacePacketHeaders && 
    metadata.spacePacketHeaders.secondary ) {
    ms = metadata.spacePacketHeaders.secondary.MILLISECONDS_OF_THE_DAY+'';
  }
  let data;

  let productName = (product.imageScale || product.label || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-');

  let data = {
    satellite : SATELLITE,
    product: productName,
    date,
    hour: time.split(':')[0],
    'minsec': time.split(':').splice(1,2).join('-'),
    ms,
    apid : metadata.apid
  }
  let basePath = [data.satellite, data.product, data.date, data.hour, data.minsec]

  if( ms && !productName.match(/^(mesoscale|conus|fulldisk|solar-imagery-euv-data)$/) ) {
    data.ms = ms;
    basePath.push(ms);
  }
  basePath.push(apid);

  data.path = {
    base : config.fs.nfsRoot,
    directory : basePath.join('/')
  }

  let metadata = Object.assign({}, data);
  let payloadData = Object.assign({}, data);

  metadata.path.filename = 'metadata.json';
  payloadData.path.filename = 'payload.bin';

  fs.writeFileSync(
    path.join(metadata.path.base, metadata.path.directory, metadata.path.filename),
    JSON.stringify(metadata)
  );

  fs.writeFileSync(
    path.join(payloadData.path.base, payloadData.path.directory, payloadData.path.filename),
    payload
  );

  return [metadata, payloadData];
}

function handleImageMessage(metadata, payload) {
  let product = apidUtils.get(metadata.apid);
  if( !product.imageScale && !product.label ) return;

  var date = new Date(946728000000 + metadata.imagePayload.SECONDS_SINCE_EPOCH*1000);
  var [date, time] = date.toISOString().split('T');
  time = time.replace(/\..*/, '');

  let basePath = [
    SATELLITE,
    (product.imageScale || product.label || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    date,
    time.split(':')[0],
    time.split(':').splice(1,2).join('-'),
    product.band,
    metadata.apid,
    'blocks',
    metadata.imagePayload.UPPER_LOWER_LEFT_X_COORDINATE+'-'+metadata.imagePayload.UPPER_LOWER_LEFT_Y_COORDINATE
  ];

  let {satellite, product, date, hour, minsec, band, apid, blocks, block} = basePath;

  let data = {
    satellite, product, date, hour, minsec, band, apid, block,
    path : {
      base : config.fs.nfsRoot,
      directory : basePath.join('/')
    }
  }

  if( metadata.rootMetadata ) {
    data.path.filename = 'fragment-metadata.json';
    data.metadata = metadata;

    fs.writeFileSync(
      path.join(data.path.base, data.path.directory, data.path.filename),
      JSON.stringify(metadata)
    )

    return [data];
  } else {

    data.path.directory = path.join(data.path.directory, 'fragments', metadata.index);

    let metadata = Object.assign({}, data);
    let payloadData = Object.assign({}, data);
  
    metadata.path.filename = 'image-fragment-metadata.json';
    payloadData.path.filename = 'image-fragment.jp2';

    metadata.metadata = metadata

    fs.writeFileSync(
      path.join(metadata.path.base, metadata.path.directory, metadata.path.filename),
      JSON.stringify(metadata)
    );
  
    fs.writeFileSync(
      path.join(payloadData.path.base, payloadData.path.directory, payloadData.path.filename),
      payload
    );
  
    return [metadata, payloadData];
  }
}

export default decoder;