import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

class EsmUtils {

  /**
   * @method moduleLocation
   * @description return __dirname and __filename for file provided
   * import.meta for the module.  Ex:
   * 
   * let {__filename, __dirname} = esmUtils.moduleLocation(import.meta)
   * 
   * @param {Object} meta import.meta object for module
   * 
   * @returns {Object}
   */
  moduleLocation(meta) {
    const __filename = fileURLToPath(meta.url);
    return {__filename, __dirname: path.dirname(__filename)};
  }

  /**
   * @method importJson
   * @description import json file
   * 
   * @param {String} filePath path to file
   * 
   * @return Object
   */
  importJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

}

export default new EsmUtils();